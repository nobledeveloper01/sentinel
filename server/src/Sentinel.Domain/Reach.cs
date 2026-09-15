namespace Sentinel.Domain;

/// <summary>
/// Reach is earned (ADR-0002), mirrored from `packages/domain/src/public/reach.ts`
/// and held to it by `fixtures/reach.json`, which the TypeScript writes and the
/// test here reads. The server runs this with authority; the client never does.
/// </summary>
public enum Stage { None, Reported, Corroborated, Confirmed, Verified }

public sealed record Account(string Id, long CreatedMinutes, string Device, string InstallLineage, IReadOnlyList<string> Circle, string LocationTrace, bool Organisation);
public sealed record Report(string Id, string Reporter, long AtMinutes, double X, double Y);
public sealed record Corroboration(string By, string Report, long AtMinutes, double X, double Y);
public sealed record Dispute(string By, string Report, long AtMinutes, string Reason);

public sealed record Evidence(
    IReadOnlyDictionary<string, Account> Accounts,
    Report Report,
    IReadOnlyList<Corroboration> Corroborations,
    IReadOnlyList<Dispute> Disputes,
    int NearbyReportsInWindow,
    int BaselineForWindow,
    bool OfficialSource,
    long NowMinutes);

public static class Reach
{
    public const long MayReportAfterMinutes = 48 * 60;
    public const long MayCorroborateAfterMinutes = 14L * 24 * 60;
    public const long CorroborationWindowMinutes = 30;
    public const double CorroborationWithinM = 1_000;
    public const int VelocityMultiple = 4;
    public const int VelocityFloor = 6;
    public const double DisputeRatio = 0.5;

    public static double RadiusOf(Stage s) => s switch
    {
        Stage.None => 0,
        Stage.Reported => 500,
        Stage.Corroborated => 2_000,
        Stage.Confirmed => 5_000,
        _ => double.PositiveInfinity,
    };

    public static bool Independent(Account a, Account b)
    {
        if (a.Id == b.Id) return false;
        if (a.Device == b.Device) return false;
        if (a.InstallLineage == b.InstallLineage) return false;
        if (a.Circle.Contains(b.Id) || b.Circle.Contains(a.Id)) return false;
        if (a.LocationTrace == b.LocationTrace) return false;
        return true;
    }

    /// <summary>Accounts sharing any signal, directly or by chain, count as one.</summary>
    public static IReadOnlyList<Account> Collapse(IReadOnlyList<Account> accounts)
    {
        var groups = new List<List<Account>>();
        foreach (var a in accounts)
        {
            var joined = groups.Where(g => g.Any(m => !Independent(a, m))).ToList();
            if (joined.Count == 0) { groups.Add([a]); continue; }
            var merged = joined.SelectMany(g => g).Append(a).ToList();
            foreach (var g in joined) groups.Remove(g);
            groups.Add(merged);
        }
        return groups.Select(g => g[0]).ToList();
    }

    private static double Distance(double ax, double ay, double bx, double by) => Math.Sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by));

    public static IReadOnlyList<Account> IndependentCorroborators(Evidence e)
    {
        e.Accounts.TryGetValue(e.Report.Reporter, out var reporter);
        var candidates = new List<Account>();
        foreach (var c in e.Corroborations)
        {
            if (c.Report != e.Report.Id) continue;
            if (!e.Accounts.TryGetValue(c.By, out var a)) continue;
            if (c.AtMinutes - a.CreatedMinutes < MayCorroborateAfterMinutes) continue;
            if (c.AtMinutes < e.Report.AtMinutes) continue;
            if (c.AtMinutes - e.Report.AtMinutes > CorroborationWindowMinutes) continue;
            if (Distance(c.X, c.Y, e.Report.X, e.Report.Y) > CorroborationWithinM) continue;
            if (reporter is not null && !Independent(a, reporter)) continue;
            if (candidates.Any(x => x.Id == a.Id)) continue;
            candidates.Add(a);
        }
        return Collapse(candidates);
    }

    public static bool Surge(Evidence e) => e.NearbyReportsInWindow >= VelocityFloor && e.NearbyReportsInWindow >= e.BaselineForWindow * VelocityMultiple;

    public static IReadOnlyList<Account> IndependentDisputers(Evidence e)
    {
        var seen = new List<Account>();
        foreach (var d in e.Disputes)
        {
            if (d.Report != e.Report.Id) continue;
            if (!e.Accounts.TryGetValue(d.By, out var a)) continue;
            if (d.AtMinutes - a.CreatedMinutes < MayCorroborateAfterMinutes) continue;
            if (seen.Any(x => x.Id == a.Id)) continue;
            seen.Add(a);
        }
        return Collapse(seen);
    }

    public static Stage StageOf(Evidence e)
    {
        if (!e.Accounts.TryGetValue(e.Report.Reporter, out var reporter)) return Stage.None;
        if (e.Report.AtMinutes - reporter.CreatedMinutes < MayReportAfterMinutes && !reporter.Organisation) return Stage.None;
        if (Surge(e)) return Stage.Reported;
        var corroborators = IndependentCorroborators(e);
        var disputers = IndependentDisputers(e);
        var votes = corroborators.Count + disputers.Count;
        if (votes > 0 && (double)disputers.Count / votes >= DisputeRatio) return Stage.Reported;
        var orgs = corroborators.Count(a => a.Organisation) + (reporter.Organisation ? 1 : 0);
        var n = corroborators.Count;
        if (e.OfficialSource || (orgs >= 1 && n >= 4)) return Stage.Verified;
        if (n >= 4 || orgs >= 1) return Stage.Confirmed;
        if (n >= 2) return Stage.Corroborated;
        return Stage.Reported;
    }
}
