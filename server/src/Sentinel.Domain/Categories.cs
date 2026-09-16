namespace Sentinel.Domain;

/// <summary>
/// The closed list (ADR-0003): events at places, nothing about a person, and
/// the hours before each leaves the feed. Held to the TypeScript by
/// <c>fixtures/categories.json</c>.
/// </summary>
public static class Categories
{
    public static readonly IReadOnlyDictionary<string, int> ExpiryHours = new Dictionary<string, int>
    {
        ["robbery"] = 24,
        ["burglary"] = 24,
        ["road_blocked"] = 6,
        ["accident"] = 6,
        ["fire"] = 12,
        ["flooding"] = 48,
        ["gunfire_heard"] = 6,
        ["unrest_or_protest"] = 12,
        ["building_collapse"] = 48,
        ["power_line_down"] = 24,
        ["missing_person_appeal"] = 72,
    };

    /// <summary>The one category that involves a person: a verified organisation only, and never without a human's review.</summary>
    public static readonly IReadOnlySet<string> HumanReviewAlways = new HashSet<string> { "missing_person_appeal" };

    public static bool IsCategory(string s) => ExpiryHours.ContainsKey(s);

    public static bool Expired(string category, long reportedMinutes, long nowMinutes) =>
        nowMinutes - reportedMinutes >= ExpiryHours[category] * 60L;

    /// <summary>Per account: three per day and one per half hour (FR-4.6).</summary>
    public static bool MayReportAgain(IEnumerable<long> previousReportMinutes, long nowMinutes)
    {
        var previous = previousReportMinutes.ToList();
        var day = previous.Count(m => nowMinutes - m < 24 * 60);
        var halfHour = previous.Any(m => nowMinutes - m < 30);
        return day < 3 && !halfHour;
    }

    public static readonly IReadOnlyList<string> DisputeReasons = ["didnt_happen", "wrong_place", "already_over", "duplicate"];
}
