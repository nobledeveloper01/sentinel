using System.Text.Json;
using Sentinel.Domain;

namespace Sentinel.Domain.Tests;

/// <summary>The C# screen gives every text in the fixture the verdict and the reasons the TypeScript gave it.</summary>
public class ScreenParityTests
{
    private sealed record Screened(string Text, bool Ok, List<string> Reasons);
    private sealed record Fixture(int Ok, int Blocked, List<Screened> Texts);

    private static readonly JsonSerializerOptions Json = new() { PropertyNameCaseInsensitive = true };

    [Fact]
    public void EveryTextGetsTheVerdictAndTheReasonsTheTypeScriptGaveIt()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "fixtures", "screen.json");
        var fixture = JsonSerializer.Deserialize<Fixture>(File.ReadAllText(path), Json)!;
        Assert.True(fixture.Ok > 0 && fixture.Blocked > 0, "the fixture has to hold both verdicts, or this proves less than it looks");
        foreach (var s in fixture.Texts)
        {
            var (ok, reasons) = Screen.Text(s.Text);
            Assert.True(ok == s.Ok, $"'{s.Text}': C# says {(ok ? "ok" : "blocked")}, TypeScript said {(s.Ok ? "ok" : "blocked")}");
            Assert.Equal(s.Reasons, reasons);
        }
    }

    [Fact]
    public void TheServerRefusesWhatThePhoneWouldHave()
    {
        Assert.False(Screen.Text("A tall man in a black shirt broke into the shop").Ok);
        Assert.True(Screen.Text("Robbery at the junction by the filling station").Ok);
    }
}
