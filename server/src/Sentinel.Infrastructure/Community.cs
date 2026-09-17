using Microsoft.EntityFrameworkCore;
using Sentinel.Domain;

namespace Sentinel.Infrastructure;

/// <summary>
/// The community layer (ADR-0002, ADR-0003): a report is an event at a place
/// from the closed list; it reaches only as far as the reach engine says; a
/// correction reaches everyone it was shown to. Every refusal is a value with
/// a reason a screen can print.
/// </summary>
public sealed class Community(SentinelDbContext db)
{
    public sealed record Refusal(string Reason, IReadOnlyList<string> Details);
    public sealed record Nearby(string Id, string Category, long AtMinutes, double X, double Y, string? Text, string Stage, double DistanceM);

    private static double Distance(double x1, double y1, double x2, double y2) => Math.Sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));

    private static Account ToAccount(AccountRow a, IEnumerable<string> circle) =>
        new(a.Id, a.CreatedMinutes, a.Device, a.InstallLineage, circle.ToList(), a.LocationTrace, a.Organisation);

    /// <summary>
    /// The location trace is a history, not a point: two accounts that
    /// corroborate one event from one place are neighbours, not one person.
    /// The trace becomes a fingerprint — the sorted set of coarse cells —
    /// only after five events, and until then it is unique to the account,
    /// so an unknown history never collapses two strangers.
    /// </summary>
    private const int TraceEvents = 5;
    private static void Touch(AccountRow a, double x, double y)
    {
        var cell = $"{Math.Floor(x / 1000)},{Math.Floor(y / 1000)}";
        var cells = a.TraceCells.Split(';', StringSplitOptions.RemoveEmptyEntries).Append(cell).TakeLast(20).ToList();
        a.TraceCells = string.Join(';', cells);
        a.LocationTrace = cells.Count >= TraceEvents ? string.Join(';', cells.Distinct().OrderBy(c => c)) : $"unknown:{a.Id}";
    }

    public async Task<(ReportRow? Report, Refusal? Refused)> ReportAsync(string account, string category, double x, double y, string? text, long nowMinutes, CancellationToken ct)
    {
        var reporter = await db.Accounts.FindAsync([account], ct);
        if (reporter is null) return (null, new Refusal("no account", []));
        if (!Categories.IsCategory(category)) return (null, new Refusal("not on the list", []));
        if (Categories.HumanReviewAlways.Contains(category) && !reporter.Organisation) return (null, new Refusal("organisation only", []));
        var previous = await db.Reports.Where(r => r.Reporter == account).Select(r => r.AtMinutes).ToListAsync(ct);
        if (!Categories.MayReportAgain(previous, nowMinutes)) return (null, new Refusal("too many", []));
        string? kept = null;
        if (!string.IsNullOrWhiteSpace(text))
        {
            var (ok, reasons) = Screen.Text(text);
            if (!ok) return (null, new Refusal("about a person", reasons));
            kept = text.Trim();
        }
        var row = new ReportRow { Id = $"{account}-{nowMinutes}-{previous.Count}", Reporter = account, Category = category, AtMinutes = nowMinutes, X = x, Y = y, Text = kept };
        db.Reports.Add(row);
        Touch(reporter, x, y);
        await db.SaveChangesAsync(ct);
        return (row, null);
    }

    public async Task<Refusal?> CorroborateAsync(string reportId, string account, double x, double y, long nowMinutes, CancellationToken ct)
    {
        var report = await db.Reports.FindAsync([reportId], ct);
        var by = await db.Accounts.FindAsync([account], ct);
        if (report is null || by is null) return new Refusal("no such report", []);
        if (report.Reporter == account) return new Refusal("your own report", []);
        if (nowMinutes - by.CreatedMinutes < Reach.MayCorroborateAfterMinutes && !by.Organisation) return new Refusal("account too new", []);
        if (await db.Corroborations.AnyAsync(c => c.Report == reportId && c.By == account, ct)) return null;
        db.Corroborations.Add(new CorroborationRow { Report = reportId, By = account, AtMinutes = nowMinutes, X = x, Y = y });
        Touch(by, x, y);
        await db.SaveChangesAsync(ct);
        return null;
    }

    public async Task<Refusal?> DisputeAsync(string reportId, string account, string reason, long nowMinutes, CancellationToken ct)
    {
        if (!Categories.DisputeReasons.Contains(reason)) return new Refusal("not a reason on the list", []);
        var report = await db.Reports.FindAsync([reportId], ct);
        var by = await db.Accounts.FindAsync([account], ct);
        if (report is null || by is null) return new Refusal("no such report", []);
        if (await db.Disputes.AnyAsync(d => d.Report == reportId && d.By == account, ct)) return null;
        db.Disputes.Add(new DisputeRow { Report = reportId, By = account, AtMinutes = nowMinutes, Reason = reason });
        await db.SaveChangesAsync(ct);
        return null;
    }

    /// <summary>The reporter takes it back; everyone it was shown to is told (FR-4.4).</summary>
    public async Task<(IReadOnlyList<string> Audience, Refusal? Refused)> WithdrawAsync(string reportId, string account, CancellationToken ct)
    {
        var report = await db.Reports.FindAsync([reportId], ct);
        if (report is null || report.Reporter != account) return ([], new Refusal("not yours", []));
        report.Withdrawn = true;
        await db.SaveChangesAsync(ct);
        var audience = await db.Shown.Where(s => s.Report == reportId).Select(s => s.Account).Distinct().ToListAsync(ct);
        return (audience, null);
    }

    /// <summary>The stage the reach engine gives a report, from everything the server holds about it.</summary>
    public async Task<Stage> StageAsync(ReportRow report, long nowMinutes, CancellationToken ct)
    {
        var corroborations = await db.Corroborations.Where(c => c.Report == report.Id).ToListAsync(ct);
        var disputes = await db.Disputes.Where(d => d.Report == report.Id).ToListAsync(ct);
        var ids = corroborations.Select(c => c.By).Concat(disputes.Select(d => d.By)).Append(report.Reporter).Distinct().ToList();
        var rows = await db.Accounts.Where(a => ids.Contains(a.Id)).ToListAsync(ct);
        var circles = await db.Circles.Where(c => ids.Contains(c.Owner) && c.Accepted).ToListAsync(ct);
        var byHash = await db.Accounts.Where(a => circles.Select(c => c.WithPhoneHash).Contains(a.PhoneHash)).Select(a => new { a.Id, a.PhoneHash }).ToListAsync(ct);
        var accounts = rows.ToDictionary(a => a.Id, a => ToAccount(a, circles.Where(c => c.Owner == a.Id).Select(c => byHash.FirstOrDefault(h => h.PhoneHash == c.WithPhoneHash)?.Id).Where(id => id is not null)!));
        var nearby = await db.Reports.CountAsync(r => !r.Withdrawn && r.Id != report.Id && nowMinutes - r.AtMinutes <= Reach.CorroborationWindowMinutes
            && (r.X - report.X) * (r.X - report.X) + (r.Y - report.Y) * (r.Y - report.Y) <= Reach.CorroborationWithinM * Reach.CorroborationWithinM, ct);
        var evidence = new Evidence(
            accounts,
            new Report(report.Id, report.Reporter, report.AtMinutes, report.X, report.Y),
            corroborations.Select(c => new Corroboration(c.By, c.Report, c.AtMinutes, c.X, c.Y)).ToList(),
            disputes.Select(d => new Dispute(d.By, d.Report, d.AtMinutes, d.Reason)).ToList(),
            nearby,
            // No history yet: a baseline of one, so a surge is the floor alone.
            1,
            false,
            nowMinutes);
        return Reach.StageOf(evidence);
    }

    /// <summary>An administrator with the token vouches for an organisation: an accountable administrator behind an account.</summary>
    /// <summary>Vouched for by the administrator; the organisation's own console token is minted here and handed back once (ADR-0009).</summary>
    public async Task<string?> VerifyOrganisationAsync(string account, string name, CancellationToken ct)
    {
        var a = await db.Accounts.FindAsync([account], ct);
        if (a is null) return null;
        a.Organisation = true;
        a.OrganisationName = name;
        a.OrganisationToken ??= Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(24)).ToLowerInvariant();
        await db.SaveChangesAsync(ct);
        return a.OrganisationToken;
    }

    /// <summary>The verified organisations, by name and the hash a phone seals to. Never a person.</summary>
    public Task<List<(string PhoneHash, string Name)>> OrganisationsAsync(CancellationToken ct) =>
        db.Accounts.Where(a => a.Organisation && a.OrganisationName != null).OrderBy(a => a.OrganisationName)
            .Select(a => new ValueTuple<string, string>(a.PhoneHash, a.OrganisationName!)).ToListAsync(ct);

    public Task<AccountRow?> OrganisationByTokenAsync(string token, CancellationToken ct) =>
        string.IsNullOrEmpty(token) ? Task.FromResult<AccountRow?>(null) : db.Accounts.FirstOrDefaultAsync(a => a.Organisation && a.OrganisationToken == token, ct);

    /// <summary>
    /// The advisory for a place (ADR-0012), from reports past their reach
    /// window — the expired ones — pooled across categories.
    /// </summary>
    public async Task<Advisory.Result?> AdvisoryAsync(double x, double y, long nowMinutes, CancellationToken ct)
    {
        var (cx, cy) = Advisory.CellOf(x, y);
        var rows = await db.Reports.Where(r => !r.Withdrawn).ToListAsync(ct);
        var expired = rows
            .Where(r => Categories.Expired(r.Category, r.AtMinutes, nowMinutes))
            .Select(r => new Advisory.ExpiredReport(r.Reporter, r.X, r.Y, r.AtMinutes));
        return Advisory.For(expired, cx, cy, nowMinutes);
    }

    /// <summary>The review queue: reports in a human-review category that nobody has decided yet.</summary>
    public Task<List<ReportRow>> QueueAsync(CancellationToken ct) =>
        db.Reports.Where(r => !r.Withdrawn && r.ReviewedBy == null && Categories.HumanReviewAlways.Contains(r.Category)).OrderBy(r => r.AtMinutes).ToListAsync(ct);

    /// <summary>A named reviewer decides; a decision without a name is refused.</summary>
    public async Task<Refusal?> ReviewAsync(string reportId, string reviewer, bool approve, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(reviewer)) return new Refusal("a reviewer has a name", []);
        var r = await db.Reports.FindAsync([reportId], ct);
        if (r is null) return new Refusal("no such report", []);
        if (r.ReviewedBy is not null) return new Refusal("already decided", []);
        r.ReviewedBy = reviewer;
        r.Approved = approve;
        await db.SaveChangesAsync(ct);
        return null;
    }

    /// <summary>What an account at a position may see: every unexpired report whose reach covers it. Each one shown is remembered.</summary>
    public async Task<IReadOnlyList<Nearby>> NearbyAsync(string account, double x, double y, long nowMinutes, CancellationToken ct)
    {
        var candidates = await db.Reports.Where(r => !r.Withdrawn).ToListAsync(ct);
        var result = new List<Nearby>();
        foreach (var r in candidates)
        {
            if (Categories.Expired(r.Category, r.AtMinutes, nowMinutes)) continue;
            // The one category about a person distributes only after a named person approved it.
            if (Categories.HumanReviewAlways.Contains(r.Category) && r.Approved != true) continue;
            var stage = await StageAsync(r, nowMinutes, ct);
            if (stage == Stage.None) continue;
            var d = Distance(x, y, r.X, r.Y);
            if (d > Reach.RadiusOf(stage)) continue;
            result.Add(new Nearby(r.Id, r.Category, r.AtMinutes, r.X, r.Y, r.Text, stage.ToString().ToLowerInvariant(), Math.Round(d)));
            if (!await db.Shown.AnyAsync(s => s.Report == r.Id && s.Account == account, ct)) db.Shown.Add(new ShownRow { Report = r.Id, Account = account });
        }
        await db.SaveChangesAsync(ct);
        return result.OrderByDescending(n => n.AtMinutes).ToList();
    }

    /// <summary>Withdrawn reports this account was shown: the corrections it is owed.</summary>
    public async Task<IReadOnlyList<string>> CorrectionsAsync(string account, CancellationToken ct)
    {
        var shown = await db.Shown.Where(s => s.Account == account).Select(s => s.Report).ToListAsync(ct);
        return await db.Reports.Where(r => shown.Contains(r.Id) && r.Withdrawn).Select(r => r.Id).ToListAsync(ct);
    }
}
