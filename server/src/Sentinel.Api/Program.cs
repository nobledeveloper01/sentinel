using Microsoft.EntityFrameworkCore;
using Sentinel.Api;
using Sentinel.Domain;
using Sentinel.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Postgres when configured; in memory otherwise — a laptop, a test, a demo.
var pg = builder.Configuration["DATABASE_URL"] ?? Environment.GetEnvironmentVariable("DATABASE_URL");
builder.Services.AddDbContext<SentinelDbContext>(o =>
{
    if (string.IsNullOrEmpty(pg)) o.UseInMemoryDatabase(builder.Configuration["SENTINEL_DB_NAME"] ?? "sentinel");
    else o.UseNpgsql(pg);
});
builder.Services.AddSingleton<ISmsGateway, CountingSmsGateway>();
builder.Services.AddScoped<Store>();
builder.Services.AddScoped<Community>();
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();

var app = builder.Build();
app.MapOpenApi();
app.UseExceptionHandler();

app.MapGet("/health", () => Results.Ok(new { ok = true, note = Messages.Healthy }));

// Accounts: a phone-number hash and a device public key. Never a name.
app.MapPost("/accounts", async (RegisterAccount req, SentinelDbContext db, CancellationToken ct) =>
{
    var row = new AccountRow { Id = req.Id, PhoneHash = req.PhoneHash, PublicKey = req.PublicKey, CreatedMinutes = req.NowMinutes, Device = req.Device ?? $"unknown:{req.Id}", InstallLineage = req.InstallLineage ?? $"unknown:{req.Id}", LocationTrace = $"unknown:{req.Id}" };
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
    var row = await store.RegisterJourneyAsync(req.Id, req.Account, req.ExpectedMinutes, req.GraceMinutes, req.Notify, ct, req.Watch ?? false);
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
// A watch's positions (ADR-0011): envelopes in, sealed to the one watcher; envelopes out, to her and nobody else.
app.MapPost("/journeys/{id}/positions", async (string id, WatchPosition req, SentinelDbContext db, CancellationToken ct) =>
{
    var j = await db.Journeys.FindAsync([id], ct);
    if (j is null || !j.Watch) return Results.NotFound();
    if (!j.NotifyCsv.Split(',').Contains(req.To)) return Results.UnprocessableEntity(new { reason = "not the watcher" });
    db.JourneyPositions.Add(new JourneyPositionRow { Journey = id, ToPhoneHash = req.To, AtMinutes = req.AtMinutes, FromKey = Convert.FromBase64String(req.From), Nonce = Convert.FromBase64String(req.Nonce), Ciphertext = Convert.FromBase64String(req.Ciphertext) });
    await db.SaveChangesAsync(ct);
    return Results.Ok();
});
app.MapGet("/journeys/{id}/positions", async (string id, string to, SentinelDbContext db, CancellationToken ct) =>
    Results.Ok(await db.JourneyPositions.Where(p => p.Journey == id && p.ToPhoneHash == to).OrderBy(p => p.AtMinutes)
        .Select(p => new { p.AtMinutes, From = Convert.ToBase64String(p.FromKey), Nonce = Convert.ToBase64String(p.Nonce), Ciphertext = Convert.ToBase64String(p.Ciphertext) }).ToListAsync(ct)));
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
// The organisation console: an administrator with the token vouches for an
// organisation and a named reviewer decides the one category about a person.
var adminToken = builder.Configuration["SENTINEL_ADMIN_TOKEN"];
bool Admin(HttpRequest r) => !string.IsNullOrEmpty(adminToken) && r.Headers["X-Admin-Token"] == adminToken;
app.MapPost("/organisations", async (HttpRequest http, VerifyOrganisation req, Community community, CancellationToken ct) =>
{
    if (!Admin(http)) return Results.Unauthorized();
    var token = await community.VerifyOrganisationAsync(req.Account, req.Name, ct);
    // The organisation's own console token, handed to the administrator once, to hand on.
    return token is null ? Results.NotFound() : Results.Ok(new { organisationToken = token });
});
// The verified organisations a person may opt into (ADR-0009): names of places, and the hash a phone seals to.
app.MapGet("/organisations", async (Community community, CancellationToken ct) =>
    Results.Ok((await community.OrganisationsAsync(ct)).Select(o => new { phoneHash = o.PhoneHash, name = o.Name })));

// The organisation's console (ADR-0009, ADR-0012): with its own token, the
// opt-ins waiting, the alerts sealed to it and whether it acknowledged, and
// its patrols. Never a position, never the person's other members, never a feed.
async Task<AccountRow?> Org(HttpRequest r, Community community, CancellationToken ct) =>
    await community.OrganisationByTokenAsync(r.Headers["X-Organisation-Token"].ToString(), ct);
app.MapGet("/organisations/me/optins", async (HttpRequest http, Community community, SentinelDbContext db, CancellationToken ct) =>
{
    var org = await Org(http, community, ct);
    if (org is null) return Results.Unauthorized();
    return Results.Ok(await db.Circles.Where(c => c.WithPhoneHash == org.PhoneHash).Select(c => new { c.Owner, c.Accepted }).ToListAsync(ct));
});
app.MapPost("/organisations/me/accept", async (HttpRequest http, AcceptOptIn req, Community community, SentinelDbContext db, CancellationToken ct) =>
{
    var org = await Org(http, community, ct);
    if (org is null) return Results.Unauthorized();
    var row = await db.Circles.FirstOrDefaultAsync(c => c.Owner == req.Owner && c.WithPhoneHash == org.PhoneHash, ct);
    if (row is null) return Results.NotFound();
    row.Accepted = true;
    row.Language = "en";
    await db.SaveChangesAsync(ct);
    return Results.Ok();
});
app.MapGet("/organisations/me/alerts", async (HttpRequest http, Community community, SentinelDbContext db, CancellationToken ct) =>
{
    var org = await Org(http, community, ct);
    if (org is null) return Results.Unauthorized();
    var ids = await db.Envelopes.Where(e => e.ToPhoneHash == org.PhoneHash).Select(e => e.Alert).Distinct().ToListAsync(ct);
    var alerts = await db.Alerts.Where(a => ids.Contains(a.Id)).OrderByDescending(a => a.AtMinutes).ToListAsync(ct);
    var acked = await db.Acknowledgements.Where(k => k.ByPhoneHash == org.PhoneHash && ids.Contains(k.Alert)).ToListAsync(ct);
    // Acknowledgement and nothing else: no position (it is in an envelope the console cannot open), no other members.
    return Results.Ok(alerts.Select(a => new { a.Id, a.AtMinutes, a.Cancelled, acknowledgedAtMinutes = acked.FirstOrDefault(k => k.Alert == a.Id)?.AtMinutes }));
});
app.MapPost("/organisations/me/alerts/{id}/ack", async (HttpRequest http, string id, AckFromConsole req, Community community, SentinelDbContext db, CancellationToken ct) =>
{
    var org = await Org(http, community, ct);
    if (org is null) return Results.Unauthorized();
    if (!await db.Envelopes.AnyAsync(e => e.Alert == id && e.ToPhoneHash == org.PhoneHash, ct)) return Results.NotFound();
    db.Acknowledgements.Add(new AcknowledgementRow { Alert = id, ByPhoneHash = org.PhoneHash, AtMinutes = req.AtMinutes });
    await db.SaveChangesAsync(ct);
    return Results.Ok();
});
app.MapPost("/organisations/me/patrols", async (HttpRequest http, LogPatrol req, Community community, SentinelDbContext db, CancellationToken ct) =>
{
    var org = await Org(http, community, ct);
    if (org is null) return Results.Unauthorized();
    var (cx, cy) = Advisory.CellOf(req.X, req.Y);
    db.Patrols.Add(new PatrolRow { Organisation = org.Id, CellX = cx, CellY = cy, AtMinutes = req.AtMinutes });
    await db.SaveChangesAsync(ct);
    return Results.Ok(new { cellX = cx, cellY = cy });
});
app.MapGet("/organisations/me/patrols", async (HttpRequest http, Community community, SentinelDbContext db, CancellationToken ct) =>
{
    var org = await Org(http, community, ct);
    if (org is null) return Results.Unauthorized();
    return Results.Ok(await db.Patrols.Where(p => p.Organisation == org.Id).OrderByDescending(p => p.AtMinutes).Select(p => new { p.CellX, p.CellY, p.AtMinutes }).ToListAsync(ct));
});

// Advisory (ADR-0012): a place and hours, or nothing at all.
app.MapGet("/advisory", async (double x, double y, long nowMinutes, Community community, CancellationToken ct) =>
{
    var a = await community.AdvisoryAsync(x, y, nowMinutes, ct);
    return a is null ? Results.NoContent() : Results.Ok(new { a.CellX, a.CellY, a.FromHour, a.ToHour });
});
app.MapGet("/review", async (HttpRequest http, Community community, CancellationToken ct) =>
{
    if (!Admin(http)) return Results.Unauthorized();
    var q = await community.QueueAsync(ct);
    return Results.Ok(q.Select(r => new { r.Id, r.Category, r.AtMinutes, r.Text }));
});
app.MapPost("/reports/{id}/review", async (HttpRequest http, string id, Review req, Community community, CancellationToken ct) =>
{
    if (!Admin(http)) return Results.Unauthorized();
    var refused = await community.ReviewAsync(id, req.Reviewer, req.Approve, ct);
    return refused is not null ? Results.UnprocessableEntity(new { refused.Reason, refused.Details }) : Results.Ok();
});

// The community layer (ADR-0002, ADR-0003): events at places, reaching only
// as far as the reach engine says, with every refusal a reason a screen can print.
app.MapPost("/reports", async (NewReport req, Community community, CancellationToken ct) =>
{
    var (row, refused) = await community.ReportAsync(req.Account, req.Category, req.X, req.Y, req.Text, req.NowMinutes, ct);
    return refused is not null ? Results.UnprocessableEntity(new { refused.Reason, refused.Details }) : Results.Ok(new { row!.Id });
});
app.MapPost("/reports/{id}/corroborate", async (string id, Corroborate req, Community community, CancellationToken ct) =>
{
    var refused = await community.CorroborateAsync(id, req.Account, req.X, req.Y, req.NowMinutes, ct);
    return refused is not null ? Results.UnprocessableEntity(new { refused.Reason, refused.Details }) : Results.Ok();
});
app.MapPost("/reports/{id}/dispute", async (string id, DisputeReport req, Community community, CancellationToken ct) =>
{
    var refused = await community.DisputeAsync(id, req.Account, req.Reason, req.NowMinutes, ct);
    return refused is not null ? Results.UnprocessableEntity(new { refused.Reason, refused.Details }) : Results.Ok();
});
app.MapPost("/reports/{id}/withdraw", async (string id, Withdraw req, Community community, CancellationToken ct) =>
{
    var (audience, refused) = await community.WithdrawAsync(id, req.Account, ct);
    return refused is not null ? Results.UnprocessableEntity(new { refused.Reason, refused.Details }) : Results.Ok(new { told = audience.Count });
});
app.MapGet("/reports/nearby", async (string account, double x, double y, long nowMinutes, Community community, CancellationToken ct) =>
    Results.Ok(await community.NearbyAsync(account, x, y, nowMinutes, ct)));
app.MapGet("/reports/corrections", async (string account, Community community, CancellationToken ct) =>
    Results.Ok(await community.CorrectionsAsync(account, ct)));

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

public sealed record RegisterAccount(string Id, string PhoneHash, string PublicKey, long NowMinutes, string? Device = null, string? InstallLineage = null);
public sealed record NewReport(string Account, string Category, double X, double Y, string? Text, long NowMinutes);
public sealed record Corroborate(string Account, double X, double Y, long NowMinutes);
public sealed record DisputeReport(string Account, string Reason, long NowMinutes);
public sealed record Withdraw(string Account);
public sealed record VerifyOrganisation(string Account, string Name);
public sealed record Review(string Reviewer, bool Approve);
public sealed record Invite(string Owner, string WithPhoneHash);
public sealed record Accept(string Owner, string WithPhoneHash, string Language);
public sealed record RegisterJourney(string Id, string Account, long ExpectedMinutes, int GraceMinutes, List<string> Notify, bool? Watch = null);
public sealed record WatchPosition(string To, long AtMinutes, string From, string Nonce, string Ciphertext);
public sealed record AcceptOptIn(string Owner);
public sealed record AckFromConsole(long AtMinutes);
public sealed record LogPatrol(double X, double Y, long AtMinutes);
public sealed record Envelope(string To, string Nonce, string Ciphertext, string? From = null);
public sealed record SmsFallback(string To, string Text);
public sealed record RelayAlert(string Id, string From, long AtMinutes, List<Envelope> Envelopes, List<SmsFallback>? SmsFallback);
public sealed record Acknowledge(string By, long AtMinutes);
public sealed record Cancel(bool UnderDuress);

public partial class Program { }
