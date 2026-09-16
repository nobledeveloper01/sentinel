using System.Text.Json;
using Sentinel.Domain;

namespace Sentinel.Domain.Tests;

/// <summary>The closed list in C# is the TypeScript's, category for category and hour for hour.</summary>
public class CategoriesParityTests
{
    private sealed record Fixture(Dictionary<string, int> ExpiryHours, List<string> HumanReviewAlways);
    private static readonly JsonSerializerOptions Json = new() { PropertyNameCaseInsensitive = true };

    [Fact]
    public void TheListAndTheHoursAreTheTypeScripts()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "fixtures", "categories.json");
        var f = JsonSerializer.Deserialize<Fixture>(File.ReadAllText(path), Json)!;
        Assert.Equal(f.ExpiryHours.OrderBy(k => k.Key), Categories.ExpiryHours.OrderBy(k => k.Key));
        Assert.Equal(f.HumanReviewAlways.Order(), Categories.HumanReviewAlways.Order());
        Assert.False(Categories.IsCategory("suspicious_person"));
    }
}
