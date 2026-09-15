using System.Text.Json;
using Sentinel.Domain;

namespace Sentinel.Domain.Tests;

/// <summary>
/// The C# reach engine is held to the TypeScript by the fixture the domain
/// writes: two hundred generated worlds and the stage each was given. A
/// mismatch is a rule that drifted on one side.
/// </summary>
public class ReachParityTests
{
    private sealed record World(int Seed, List<AccountJson> Accounts, Report Report, List<Corroboration> Corroborations, List<Dispute> Disputes, int NearbyReportsInWindow, int BaselineForWindow, bool OfficialSource, long NowMinutes, string Stage);
    private sealed record AccountJson(string Id, long CreatedMinutes, string Device, string InstallLineage, List<string> Circle, string LocationTrace, bool Organisation);
    private sealed record Fixture(Dictionary<string, int> Counts, List<World> Worlds);

    private static readonly JsonSerializerOptions Json = new() { PropertyNameCaseInsensitive = true };

    [Fact]
    public void EveryGeneratedWorldGetsTheStageTheTypeScriptGaveIt()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "fixtures", "reach.json");
        var fixture = JsonSerializer.Deserialize<Fixture>(File.ReadAllText(path), Json)!;
        Assert.Equal(200, fixture.Worlds.Count);
        foreach (var stage in new[] { "none", "reported", "corroborated", "confirmed", "verified" })
        {
            Assert.True(fixture.Counts.TryGetValue(stage, out var n) && n > 0, $"the fixture has no {stage} world, so this test proves less than it looks");
        }
        foreach (var w in fixture.Worlds)
        {
            var accounts = w.Accounts.ToDictionary(a => a.Id, a => new Account(a.Id, a.CreatedMinutes, a.Device, a.InstallLineage, a.Circle, a.LocationTrace, a.Organisation));
            var e = new Evidence(accounts, w.Report, w.Corroborations, w.Disputes, w.NearbyReportsInWindow, w.BaselineForWindow, w.OfficialSource, w.NowMinutes);
            var expected = Enum.Parse<Stage>(w.Stage, ignoreCase: true);
            Assert.True(expected == Reach.StageOf(e), $"seed {w.Seed}: TypeScript says {w.Stage}, C# says {Reach.StageOf(e)}");
        }
    }

    [Fact]
    public void ASingleAccountNeverLeavesFiveHundredMetres()
    {
        var a = new Account("a", 0, "d", "l", [], "t", false);
        var accounts = new Dictionary<string, Account> { ["a"] = a };
        var report = new Report("r", "a", 100_000, 0, 0);
        var cs = Enumerable.Range(0, 10).Select(i => new Corroboration("a", "r", 100_000 + i, i, i)).ToList();
        var e = new Evidence(accounts, report, cs, [], 1, 1, false, 100_100);
        Assert.Equal(Stage.Reported, Reach.StageOf(e));
        Assert.Equal(500, Reach.RadiusOf(Stage.Reported));
    }

    [Fact]
    public void TheEscalationIsDueOnlyWhenNothingWasSaid()
    {
        Assert.False(Escalation.Due(60, 15, false, false, 74));
        Assert.True(Escalation.Due(60, 15, false, false, 75));
        Assert.False(Escalation.Due(60, 15, true, false, 75));
        Assert.False(Escalation.Due(60, 15, false, true, 75));
    }
}
