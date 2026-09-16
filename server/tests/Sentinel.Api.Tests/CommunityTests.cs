using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Sentinel.Api.Tests;

/// <summary>
/// ADR-0002 on the running server: a report reaches 500 m and no further on
/// one account's word; two accounts on one device are one account; a name
/// in the text is refused with the reason; a withdrawal names everyone shown.
/// </summary>
public class CommunityTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    public CommunityTests(WebApplicationFactory<Program> f) => _client = f.CreateClient();

    private const long Old = 60L * 24 * 60; // an account sixty days old
    private const long Now = 100L * 24 * 60;

    private async Task Account(string id, string device = "", long created = Old - Old)
    {
        var r = await _client.PostAsJsonAsync("/accounts", new { id, phoneHash = $"h-{id}", publicKey = "pk", nowMinutes = created, device = device == "" ? $"dev-{id}" : device, installLineage = $"lin-{id}" });
        r.EnsureSuccessStatusCode();
    }

    private async Task<string> Report(string account, double x = 0, double y = 0, string? text = null, string category = "fire")
    {
        var r = await _client.PostAsJsonAsync("/reports", new { account, category, x, y, text, nowMinutes = Now });
        r.EnsureSuccessStatusCode();
        return (await r.Content.ReadFromJsonAsync<IdReply>())!.Id;
    }

    private async Task<List<NearbyReply>> Nearby(string account, double x, double y) =>
        (await _client.GetFromJsonAsync<List<NearbyReply>>($"/reports/nearby?account={account}&x={x}&y={y}&nowMinutes={Now + 1}"))!;

    [Fact]
    public async Task OneAccountsReportReaches500mAndNoFurther()
    {
        await Account("c-a");
        await Account("c-reader");
        var id = await Report("c-a");
        Assert.Contains(await Nearby("c-reader", 400, 0), n => n.Id == id);
        Assert.DoesNotContain(await Nearby("c-reader", 600, 0), n => n.Id == id);
    }

    [Fact]
    public async Task TwoAccountsOnOneDeviceCannotWidenIt_ButTwoIndependentOnesCan()
    {
        await Account("d-a");
        await Account("d-twin1", device: "shared");
        await Account("d-twin2", device: "shared");
        await Account("d-reader");
        var id = await Report("d-a", 10_000, 0);
        foreach (var twin in new[] { "d-twin1", "d-twin2" })
            (await _client.PostAsJsonAsync($"/reports/{id}/corroborate", new { account = twin, x = 10_000, y = 0, nowMinutes = Now })).EnsureSuccessStatusCode();
        Assert.DoesNotContain(await Nearby("d-reader", 10_800, 0), n => n.Id == id);
        await Account("d-b");
        await Account("d-c");
        foreach (var w in new[] { "d-b", "d-c" })
            (await _client.PostAsJsonAsync($"/reports/{id}/corroborate", new { account = w, x = 10_000, y = 0, nowMinutes = Now })).EnsureSuccessStatusCode();
        var seen = await Nearby("d-reader", 10_800, 0);
        Assert.Contains(seen, n => n.Id == id && n.Stage == "corroborated");
    }

    [Fact]
    public async Task ANameIsRefusedWithTheReason_AndTheCategoryStillStands()
    {
        await Account("e-a");
        var bad = await _client.PostAsJsonAsync("/reports", new { account = "e-a", category = "robbery", x = 20_000, y = 0, text = "It was Mr Adebayo", nowMinutes = Now });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, bad.StatusCode);
        var refusal = await bad.Content.ReadFromJsonAsync<RefusalReply>();
        Assert.Equal("about a person", refusal!.Reason);
        Assert.Contains("a name", refusal.Details);
        var ok = await _client.PostAsJsonAsync("/reports", new { account = "e-a", category = "robbery", x = 20_000, y = 0, text = (string?)null, nowMinutes = Now });
        ok.EnsureSuccessStatusCode();
        var offList = await _client.PostAsJsonAsync("/reports", new { account = "e-a", category = "suspicious_person", x = 20_000, y = 0, text = (string?)null, nowMinutes = Now + 60 });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, offList.StatusCode);
    }

    [Fact]
    public async Task AWithdrawalNamesEveryoneItWasShownTo()
    {
        await Account("f-a");
        await Account("f-r1");
        await Account("f-r2");
        var id = await Report("f-a", 30_000, 0);
        await Nearby("f-r1", 30_100, 0);
        await Nearby("f-r2", 30_100, 0);
        await Nearby("f-r2", 30_100, 0);
        var w = await _client.PostAsJsonAsync($"/reports/{id}/withdraw", new { account = "f-a" });
        Assert.Equal(2, (await w.Content.ReadFromJsonAsync<ToldReply>())!.Told);
        Assert.Contains(id, (await _client.GetFromJsonAsync<List<string>>("/reports/corrections?account=f-r1"))!);
        Assert.DoesNotContain(await Nearby("f-r1", 30_100, 0), n => n.Id == id);
    }

    [Fact]
    public async Task ANewAccountsReportReachesNobody_AndTheRateLimitHolds()
    {
        await Account("g-new", created: Now - 60);
        await Account("g-reader");
        var id = await Report("g-new", 40_000, 0);
        Assert.DoesNotContain(await Nearby("g-reader", 40_000, 0), n => n.Id == id);
        var again = await _client.PostAsJsonAsync("/reports", new { account = "g-new", category = "fire", x = 40_000, y = 0, text = (string?)null, nowMinutes = Now + 5 });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, again.StatusCode);
    }

    [Fact]
    public async Task TwoAccountsThatAlwaysMoveTogetherBecomeOne_ButOneSharedPlaceDoesNot()
    {
        // Five reporters, each with a report; h-x and h-y corroborate every one from the same cells.
        await Account("h-x");
        await Account("h-y");
        await Account("h-reader");
        var ids = new List<string>();
        for (var i = 0; i < 5; i++)
        {
            await Account($"h-rep{i}");
            var id = await Report($"h-rep{i}", 50_000 + i * 3_000, 0);
            ids.Add(id);
            foreach (var w in new[] { "h-x", "h-y" })
                (await _client.PostAsJsonAsync($"/reports/{id}/corroborate", new { account = w, x = 50_000 + i * 3_000, y = 0, nowMinutes = Now })).EnsureSuccessStatusCode();
        }
        // Five shared cells each, identical histories: one voice, and every report they touched stays at 500 m —
        // the earlier ones too, because reach is computed from what is known now, not what was known then.
        foreach (var (id, i) in ids.Select((id, i) => (id, i)))
            Assert.DoesNotContain(await Nearby("h-reader", 50_000 + i * 3_000 + 800, 0), n => n.Id == id);
        // Two strangers who corroborate one event from one place are neighbours, not one person.
        await Account("h-p");
        await Account("h-q");
        await Account("h-rep9");
        var one = await Report("h-rep9", 70_000, 0);
        foreach (var w in new[] { "h-p", "h-q" })
            (await _client.PostAsJsonAsync($"/reports/{one}/corroborate", new { account = w, x = 70_000, y = 0, nowMinutes = Now })).EnsureSuccessStatusCode();
        Assert.Contains(await Nearby("h-reader", 70_800, 0), n => n.Id == one && n.Stage == "corroborated");
    }

    private sealed record IdReply(string Id);
    private sealed record ToldReply(int Told);
    private sealed record RefusalReply(string Reason, List<string> Details);
    private sealed record NearbyReply(string Id, string Category, long AtMinutes, double X, double Y, string? Text, string Stage, double DistanceM);
}
