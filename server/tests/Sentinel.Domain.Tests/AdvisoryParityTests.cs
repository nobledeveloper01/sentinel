using System.Text.Json;
using Sentinel.Domain;

namespace Sentinel.Domain.Tests;

/// <summary>
/// The C# advisory is held to the TypeScript by generated cells: the same
/// reports, the same sentence or the same silence (ADR-0012). The server
/// cannot say more than the phone would.
/// </summary>
public class AdvisoryParityTests
{
    private sealed record ReportJson(string Account, double X, double Y, long AtMinutes);
    private sealed record ResultJson(int CellX, int CellY, int FromHour, int ToHour);
    private sealed record World(int Seed, List<ReportJson> Reports, long NowMinutes, ResultJson? Result);
    private sealed record Fixture(int Spoke, int Silent, List<World> Worlds);

    private static readonly JsonSerializerOptions Json = new() { PropertyNameCaseInsensitive = true };

    [Fact]
    public void EveryGeneratedCellSaysWhatTheTypeScriptSaidOrNothing()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "fixtures", "advisory.json");
        var fixture = JsonSerializer.Deserialize<Fixture>(File.ReadAllText(path), Json)!;
        Assert.True(fixture.Spoke > 0 && fixture.Silent > 0, "the fixture has to hold both silence and a sentence");
        foreach (var w in fixture.Worlds)
        {
            var reports = w.Reports.Select(r => new Advisory.ExpiredReport(r.Account, r.X, r.Y, r.AtMinutes));
            var got = Advisory.At(reports, 500, 500, w.NowMinutes);
            if (w.Result is null) Assert.True(got is null, $"seed {w.Seed}: TypeScript is silent, C# says {got}");
            else
            {
                Assert.NotNull(got);
                Assert.True(w.Result.CellX == got.CellX && w.Result.CellY == got.CellY && w.Result.FromHour == got.FromHour && w.Result.ToHour == got.ToHour,
                    $"seed {w.Seed}: TypeScript says {w.Result}, C# says {got}");
            }
        }
    }

    [Fact]
    public void BelowTheThresholdsThereIsNothing()
    {
        var five = Enumerable.Range(0, 5).Select(i => new Advisory.ExpiredReport($"a{i}", 500, 500, 1000L * 1440 + 22 * 60));
        Assert.Null(Advisory.At(five, 500, 500, 1010L * 1440));
        var threeVoices = Enumerable.Range(0, 12).Select(i => new Advisory.ExpiredReport($"a{i % 3}", 500, 500, 1000L * 1440 + 22 * 60));
        Assert.Null(Advisory.At(threeVoices, 500, 500, 1010L * 1440));
    }
}
