using Microsoft.EntityFrameworkCore;
using Sentinel.Api;
using Sentinel.Domain;
using Sentinel.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Postgres when configured; in memory otherwise — a laptop, a test, a demo.
var pg = builder.Configuration["DATABASE_URL"] ?? Environment.GetEnvironmentVariable("DATABASE_URL");
builder.Services.AddDbContext<SentinelDbContext>(o =>
{
    if (string.IsNullOrEmpty(pg)) o.UseInMemoryDatabase("sentinel");
    else o.UseNpgsql(pg);
});
builder.Services.AddSingleton<ISmsGateway, CountingSmsGateway>();
builder.Services.AddScoped<Store>();
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();

var app = builder.Build();
app.MapOpenApi();
app.UseExceptionHandler();

app.MapGet("/health", () => Results.Ok(new { ok = true, note = Messages.Healthy }));

// Accounts: a phone-number hash and a device public key. Never a name.
app.MapPost("/accounts", async (RegisterAccount req, SentinelDbContext db, CancellationToken ct) =>
{
    var row = new AccountRow { Id = req.Id, PhoneHash = req.PhoneHash, PublicKey = req.PublicKey, CreatedMinutes = req.NowMinutes };
    db.Accounts.Add(row);
    await db.SaveChangesAsync(ct);
    return Results.Ok(new { id = row.Id });
});

// A member's public key, by phone hash, so a phone can seal to it. The
// server hands out public halves and holds nothing that opens them.
app.MapGet("/keys/{phoneHash}", async (string phoneHash, SentinelDbContext db, CancellationToken ct) =>
{
    var row = await db.Accounts.FirstOrDefaultAsync(a => a.PhoneHash == phoneHash, ct);
    return row is null ? Results.NotFound() : Results.Ok(new { publicKey = row.PublicKey });
});

// The circle: invited, then accepted in a language; either side removes it now.
app.MapPost("/circle/invite", async (Invite req, SentinelDbContext db, CancellationToken ct) =>
{
    if (await db.Circles.AnyAsync(c => c.Owner == req.Owner && c.WithPhoneHash == req.WithPhoneHash, ct)) return Results.Ok();
    db.Circles.Add(new CircleRow { Owner = req.Owner, WithPhoneHash = req.WithPhoneHash });
    await db.SaveChangesAsync(ct);
    return Results.Ok();
});
app.MapPost("/circle/accept", async (Accept req, SentinelDbContext db, CancellationToken ct) =>
{
    var row = await db.Circles.FirstOrDefaultAsync(c => c.Owner == req.Owner && c.WithPhoneHash == req.WithPhoneHash, ct);
    if (row is null) return Results.NotFound();
    row.Accepted = true;
    row.Language = req.Language;
    await db.SaveChangesAsync(ct);
    return Results.Ok();
});
app.MapDelete("/circle/{owner}/{with}", async (string owner, string with, SentinelDbContext db, CancellationToken ct) =>
{
    var rows = await db.Circles.Where(c => (c.Owner == owner && c.WithPhoneHash == with) || (c.Owner == with && c.WithPhoneHash == owner)).ToListAsync(ct);
    db.Circles.RemoveRange(rows);
    await db.SaveChangesAsync(ct);
    return Results.Ok();
});
app.MapGet("/circle/{owner}", async (string owner, SentinelDbContext db, CancellationToken ct) =>
    Results.Ok(await db.Circles.Where(c => c.Owner == owner).Select(c => new { c.WithPhoneHash, c.Accepted, c.Language }).ToListAsync(ct)));

// Journeys: the server's copy is the escalation minute and whom to tell.
app.MapPost("/journeys", async (RegisterJourney req, Store store, CancellationToken ct) =>
{
    var row = await store.RegisterJourneyAsync(req.Id, req.Account, req.ExpectedMinutes, req.GraceMinutes, req.Notify, ct);
    return Results.Ok(new { row.Id, escalateAtMinutes = Escalation.EscalateAt(row.ExpectedMinutes, row.GraceMinutes) });
});
app.MapPost("/journeys/{id}/confirm", async (string id, SentinelDbContext db, CancellationToken ct) =>
{
    var j = await db.Journeys.FindAsync([id], ct);
    if (j is null) return Results.NotFound();
    j.Confirmed = true;
    await db.SaveChangesAsync(ct);
    return Results.Ok();
});
app.MapPost("/journeys/{id}/cancel", async (string id, SentinelDbContext db, CancellationToken ct) =>
{
    var j = await db.Journeys.FindAsync([id], ct);
    if (j is null) return Results.NotFound();
    j.Cancelled = true;
    await db.SaveChangesAsync(ct);
    return Results.Ok();
});
// The sweep a scheduler calls every minute: the phone that died still escalates.
app.MapPost("/journeys/sweep", async (long nowMinutes, Store store, CancellationToken ct) =>
    Results.Ok(new { escalated = await store.SweepAsync(nowMinutes, ct) }));
app.MapGet("/journeys/{id}", async (string id, SentinelDbContext db, CancellationToken ct) =>
{
    var j = await db.Journeys.FindAsync([id], ct);
    return j is null ? Results.NotFound() : Results.Ok(new { j.Id, j.Confirmed, j.Cancelled, j.EscalatedAtMinutes });
});

// Alerts: envelopes in, envelopes out, and a record of every attempt.
app.MapPost("/alerts", async (RelayAlert req, Store store, CancellationToken ct) =>
{
    var envelopes = req.Envelopes.Select(e => (e.To, Convert.FromBase64String(e.From ?? ""), Convert.FromBase64String(e.Nonce), Convert.FromBase64String(e.Ciphertext)));
    var sms = (req.SmsFallback ?? []).Select(s => (s.To, s.Text));
    var row = await store.RelayAlertAsync(req.Id, req.From, req.AtMinutes, envelopes, sms, ct);
    return Results.Ok(new { row.Id });
});
app.MapGet("/alerts/{id}", async (string id, SentinelDbContext db, CancellationToken ct) =>
{
    var a = await db.Alerts.FindAsync([id], ct);
    if (a is null) return Results.NotFound();
    var envelopes = await db.Envelopes.Where(e => e.Alert == id).Select(e => new { e.ToPhoneHash, From = Convert.ToBase64String(e.FromKey), Nonce = Convert.ToBase64String(e.Nonce), Ciphertext = Convert.ToBase64String(e.Ciphertext) }).ToListAsync(ct);
    var attempts = await db.Attempts.Where(t => t.Alert == id).Select(t => new { t.Channel, t.ToPhoneHash, t.Outcome, t.AtMinutes }).ToListAsync(ct);
    var acks = await db.Acknowledgements.Where(k => k.Alert == id).Select(k => new { k.ByPhoneHash, k.AtMinutes }).ToListAsync(ct);
    return Results.Ok(new { a.Id, a.From, a.AtMinutes, a.Cancelled, a.CancelledUnderDuress, a.OpenedUnderDuress, envelopes, attempts, acknowledgements = acks });
});
app.MapPost("/alerts/{id}/ack", async (string id, Acknowledge req, SentinelDbContext db, CancellationToken ct) =>
{
    db.Acknowledgements.Add(new AcknowledgementRow { Alert = id, ByPhoneHash = req.By, AtMinutes = req.AtMinutes });
    await db.SaveChangesAsync(ct);
    return Results.Ok();
});
app.MapPost("/alerts/{id}/duress", async (string id, SentinelDbContext db, CancellationToken ct) =>
{
    var a = await db.Alerts.FindAsync([id], ct);
    if (a is null) return Results.NotFound();
    a.OpenedUnderDuress = true;
    await db.SaveChangesAsync(ct);
    return Results.Ok();
});
app.MapPost("/alerts/{id}/cancel", async (string id, Cancel req, SentinelDbContext db, CancellationToken ct) =>
{
    var a = await db.Alerts.FindAsync([id], ct);
    if (a is null) return Results.NotFound();
    a.Cancelled = true;
    a.CancelledUnderDuress = req.UnderDuress;
    await db.SaveChangesAsync(ct);
    return Results.Ok();
});

app.Run();

public sealed record RegisterAccount(string Id, string PhoneHash, string PublicKey, long NowMinutes);
public sealed record Invite(string Owner, string WithPhoneHash);
public sealed record Accept(string Owner, string WithPhoneHash, string Language);
public sealed record RegisterJourney(string Id, string Account, long ExpectedMinutes, int GraceMinutes, List<string> Notify);
public sealed record Envelope(string To, string Nonce, string Ciphertext, string? From = null);
public sealed record SmsFallback(string To, string Text);
public sealed record RelayAlert(string Id, string From, long AtMinutes, List<Envelope> Envelopes, List<SmsFallback>? SmsFallback);
public sealed record Acknowledge(string By, long AtMinutes);
public sealed record Cancel(bool UnderDuress);

public partial class Program { }
