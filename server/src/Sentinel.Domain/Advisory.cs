namespace Sentinel.Domain;

/// <summary>
/// Route advisory (ADR-0012), the C# mirror of <c>advisory.ts</c>: a place
/// and hours from expired reports, above thresholds, never a count and
/// never a category. Held to the TypeScript by <c>fixtures/advisory.json</c>.
/// </summary>
public static class Advisory
{
    public const int CellM = 1000;
    public const long WindowMinutes = 90L * 24 * 60;
    public const int MinReports = 6;
    public const int MinAccounts = 4;
    public const double BandShare = 0.6;

    public sealed record ExpiredReport(string Account, double X, double Y, long AtMinutes);
    public sealed record Result(int CellX, int CellY, int FromHour, int ToHour);

    public static (int CellX, int CellY) CellOf(double x, double y) => ((int)Math.Floor(x / CellM), (int)Math.Floor(y / CellM));

    private static int HourOf(long atMinutes) => (int)(((atMinutes % 1440) + 1440) % 1440 / 60);

    /// <summary>The shortest band holding at least the share, wrapping midnight if it must; ties to the earlier start.</summary>
    public static (int FromHour, int ToHour) Band(IReadOnlyList<int> byHour)
    {
        var total = byHour.Sum();
        for (var length = 1; length <= 24; length++)
        {
            (int from, int to)? best = null;
            for (var start = 0; start < 24; start++)
            {
                var sum = 0;
                for (var i = 0; i < length; i++) sum += byHour[(start + i) % 24];
                if (sum >= total * BandShare && best is null) best = (start, (start + length) % 24);
            }
            if (best is not null) return best.Value;
        }
        return (0, 0);
    }

    public static Result? For(IEnumerable<ExpiredReport> reports, int cellX, int cellY, long nowMinutes)
    {
        var inCell = reports.Where(r =>
        {
            var c = CellOf(r.X, r.Y);
            return c.CellX == cellX && c.CellY == cellY && nowMinutes - r.AtMinutes <= WindowMinutes && r.AtMinutes <= nowMinutes;
        }).ToList();
        if (inCell.Count < MinReports) return null;
        if (inCell.Select(r => r.Account).Distinct().Count() < MinAccounts) return null;
        var byHour = new int[24];
        foreach (var r in inCell) byHour[HourOf(r.AtMinutes)]++;
        var (from, to) = Band(byHour);
        return new Result(cellX, cellY, from, to);
    }

    public static Result? At(IEnumerable<ExpiredReport> reports, double x, double y, long nowMinutes)
    {
        var (cx, cy) = CellOf(x, y);
        return For(reports, cx, cy, nowMinutes);
    }
}
