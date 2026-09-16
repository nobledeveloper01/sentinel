using Microsoft.EntityFrameworkCore;
using Sentinel.Domain;

namespace Sentinel.Infrastructure;

/// <summary>An account: a phone-number hash and the device's public key. Never a name.</summary>
public sealed class AccountRow
{
    public string Id { get; set; } = "";
    public string PhoneHash { get; set; } = "";
    public string PublicKey { get; set; } = "";
    public long CreatedMinutes { get; set; }
    /// <summary>The independence signals reach counts on (FR-4.3). The trace is a coarse cell of where the account last reported from.</summary>
    public string Device { get; set; } = "";
    public string InstallLineage { get; set; } = "";
    public string LocationTrace { get; set; } = "";
    /// <summary>The coarse cells this account has reported or corroborated from, newest last, so the trace is a history and not a point.</summary>
    public string TraceCells { get; set; } = "";
    public bool Organisation { get; set; }
}

/// <summary>A report: an event at a place, from the closed list, with text only if the screen let it through.</summary>
public sealed class ReportRow
{
    public string Id { get; set; } = "";
    public string Reporter { get; set; } = "";
    public string Category { get; set; } = "";
    public long AtMinutes { get; set; }
    public double X { get; set; }
    public double Y { get; set; }
    public string? Text { get; set; }
    public bool Withdrawn { get; set; }
}

public sealed class CorroborationRow
{
    public long Id { get; set; }
    public string Report { get; set; } = "";
    public string By { get; set; } = "";
    public long AtMinutes { get; set; }
    public double X { get; set; }
    public double Y { get; set; }
}

public sealed class DisputeRow
{
    public long Id { get; set; }
    public string Report { get; set; } = "";
    public string By { get; set; } = "";
    public long AtMinutes { get; set; }
    public string Reason { get; set; } = "";
}

/// <summary>Who a report was shown to, so a correction reaches exactly that audience (FR-4.4).</summary>
public sealed class ShownRow
{
    public long Id { get; set; }
    public string Report { get; set; } = "";
    public string Account { get; set; } = "";
}

/// <summary>Mutual consent: invited, then accepted in a language; removed by either side.</summary>
public sealed class CircleRow
{
    public long Id { get; set; }
    public string Owner { get; set; } = "";
    public string WithPhoneHash { get; set; } = "";
    public bool Accepted { get; set; }
    public string Language { get; set; } = "en";
}

/// <summary>The server's copy of a journey: when to escalate and whom to tell. No destination.</summary>
public sealed class JourneyRow
{
    public string Id { get; set; } = "";
    public string Account { get; set; } = "";
    public long ExpectedMinutes { get; set; }
    public int GraceMinutes { get; set; }
    public string NotifyCsv { get; set; } = "";
    public bool Confirmed { get; set; }
    public bool Cancelled { get; set; }
    public long? EscalatedAtMinutes { get; set; }
}

/// <summary>An alert as the server holds it: the envelopes it cannot open, and the record of what it did with them.</summary>
public sealed class AlertRow
{
    public string Id { get; set; } = "";
    public string From { get; set; } = "";
    public long AtMinutes { get; set; }
    public bool Cancelled { get; set; }
    public bool CancelledUnderDuress { get; set; }
    /// <summary>The phone was opened with the duress PIN while this alert ran; the circle is told and the screen was not.</summary>
    public bool OpenedUnderDuress { get; set; }
}

public sealed class EnvelopeRow
{
    public long Id { get; set; }
    public string Alert { get; set; } = "";
    public string ToPhoneHash { get; set; } = "";
    /// <summary>The sender's public key, so the member can derive the same key. Public; opens nothing on its own.</summary>
    public byte[] FromKey { get; set; } = [];
    public byte[] Nonce { get; set; } = [];
    public byte[] Ciphertext { get; set; } = [];
}

/// <summary>What the server did: channel, recipient, outcome, when. Never the text.</summary>
public sealed class AttemptRow
{
    public long Id { get; set; }
    public string Alert { get; set; } = "";
    public string Channel { get; set; } = "";
    public string ToPhoneHash { get; set; } = "";
    public string Outcome { get; set; } = "";
    public long AtMinutes { get; set; }
}

public sealed class AcknowledgementRow
{
    public long Id { get; set; }
    public string Alert { get; set; } = "";
    public string ByPhoneHash { get; set; } = "";
    public long AtMinutes { get; set; }
}

public sealed class SentinelDbContext(DbContextOptions<SentinelDbContext> options) : DbContext(options)
{
    public DbSet<AccountRow> Accounts => Set<AccountRow>();
    public DbSet<CircleRow> Circles => Set<CircleRow>();
    public DbSet<JourneyRow> Journeys => Set<JourneyRow>();
    public DbSet<AlertRow> Alerts => Set<AlertRow>();
    public DbSet<EnvelopeRow> Envelopes => Set<EnvelopeRow>();
    public DbSet<AttemptRow> Attempts => Set<AttemptRow>();
    public DbSet<AcknowledgementRow> Acknowledgements => Set<AcknowledgementRow>();
    public DbSet<ReportRow> Reports => Set<ReportRow>();
    public DbSet<CorroborationRow> Corroborations => Set<CorroborationRow>();
    public DbSet<DisputeRow> Disputes => Set<DisputeRow>();
    public DbSet<ShownRow> Shown => Set<ShownRow>();
}

/// <summary>Where an SMS goes. The server keeps that one was sent and to whom, never what it said (ADR-0004).</summary>
public interface ISmsGateway
{
    Task<bool> SendAsync(string toPhoneHash, string text, CancellationToken ct);
}

/// <summary>The gateway for a laptop and a test: it counts, it does not keep the text.</summary>
public sealed class CountingSmsGateway : ISmsGateway
{
    public int Sent { get; private set; }
    public Task<bool> SendAsync(string toPhoneHash, string text, CancellationToken ct)
    {
        Sent++;
        return Task.FromResult(true);
    }
}

public sealed class Store(SentinelDbContext db, ISmsGateway sms)
{
    public async Task<JourneyRow> RegisterJourneyAsync(string id, string account, long expected, int grace, IEnumerable<string> notify, CancellationToken ct)
    {
        var row = new JourneyRow { Id = id, Account = account, ExpectedMinutes = expected, GraceMinutes = grace, NotifyCsv = string.Join(',', notify) };
        db.Journeys.Add(row);
        await db.SaveChangesAsync(ct);
        return row;
    }

    /// <summary>The independent escalation (Phase 3): every due journey the phone has said nothing about is escalated by SMS, once.</summary>
    public async Task<int> SweepAsync(long nowMinutes, CancellationToken ct)
    {
        var due = await db.Journeys.Where(j => !j.Confirmed && !j.Cancelled && j.EscalatedAtMinutes == null).ToListAsync(ct);
        var n = 0;
        foreach (var j in due)
        {
            if (!Escalation.Due(j.ExpectedMinutes, j.GraceMinutes, j.Confirmed, j.Cancelled, nowMinutes)) continue;
            foreach (var to in j.NotifyCsv.Split(',', StringSplitOptions.RemoveEmptyEntries))
            {
                // The text is built at send time and not kept; the phone's own
                // escalation, when the phone is alive, carries the position.
                await sms.SendAsync(to, "journey not confirmed", ct);
                db.Attempts.Add(new AttemptRow { Alert = "journey:" + j.Id, Channel = "serverSms", ToPhoneHash = to, Outcome = "delivered", AtMinutes = nowMinutes });
            }
            j.EscalatedAtMinutes = nowMinutes;
            n++;
        }
        await db.SaveChangesAsync(ct);
        return n;
    }

    /// <summary>An alert arrives as envelopes; the server relays them and records each attempt.</summary>
    public async Task<AlertRow> RelayAlertAsync(string id, string from, long atMinutes, IEnumerable<(string to, byte[] fromKey, byte[] nonce, byte[] ciphertext)> envelopes, IEnumerable<(string to, string text)> smsFallback, CancellationToken ct)
    {
        var row = new AlertRow { Id = id, From = from, AtMinutes = atMinutes };
        db.Alerts.Add(row);
        foreach (var (to, fromKey, nonce, ciphertext) in envelopes)
        {
            db.Envelopes.Add(new EnvelopeRow { Alert = id, ToPhoneHash = to, FromKey = fromKey, Nonce = nonce, Ciphertext = ciphertext });
            // Push is a device's registration away; here it is recorded as attempted.
            db.Attempts.Add(new AttemptRow { Alert = id, Channel = "push", ToPhoneHash = to, Outcome = "unknown", AtMinutes = atMinutes });
        }
        foreach (var (to, text) in smsFallback)
        {
            var ok = await sms.SendAsync(to, text, ct);
            db.Attempts.Add(new AttemptRow { Alert = id, Channel = "serverSms", ToPhoneHash = to, Outcome = ok ? "delivered" : "failed", AtMinutes = atMinutes });
        }
        await db.SaveChangesAsync(ct);
        return row;
    }
}
