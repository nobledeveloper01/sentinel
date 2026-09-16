using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Hosting;

namespace Sentinel.Api.Tests;

/// <summary>
/// The one category about a person: an organisation only, and distributed
/// only after a named person approved it. The console refuses everybody
/// without the token, and a decision without a name.
/// </summary>
public class ConsoleTests : IClassFixture<ConsoleTests.Factory>
{
    public class Factory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder b) => b.UseSetting("SENTINEL_ADMIN_TOKEN", "test-admin-token-long-enough");
    }

    private readonly HttpClient _client;
    public ConsoleTests(Factory f) => _client = f.CreateClient();

    private const long Now = 100L * 24 * 60;

    private HttpRequestMessage Admin(HttpMethod m, string path, object? body = null)
    {
        var r = new HttpRequestMessage(m, path) { Content = body is null ? null : JsonContent.Create(body) };
        r.Headers.Add("X-Admin-Token", "test-admin-token-long-enough");
        return r;
    }

    [Fact]
    public async Task AnAppealIsHeldUntilANamedReviewerApprovesIt_AndTheConsoleRefusesWithoutTheToken()
    {
        (await _client.PostAsJsonAsync("/accounts", new { id = "k-org", phoneHash = "h-k-org", publicKey = "pk", nowMinutes = 0L })).EnsureSuccessStatusCode();
        (await _client.PostAsJsonAsync("/accounts", new { id = "k-reader", phoneHash = "h-k-reader", publicKey = "pk", nowMinutes = 0L })).EnsureSuccessStatusCode();
        // Not an organisation yet: refused.
        var early = await _client.PostAsJsonAsync("/reports", new { account = "k-org", category = "missing_person_appeal", x = 90_000, y = 0, text = (string?)null, nowMinutes = Now });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, early.StatusCode);
        // No token, no console.
        Assert.Equal(HttpStatusCode.Unauthorized, (await _client.PostAsJsonAsync("/organisations", new { account = "k-org", name = "Ikeja Estate Security" })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await _client.GetAsync("/review")).StatusCode);
        (await _client.SendAsync(Admin(HttpMethod.Post, "/organisations", new { account = "k-org", name = "Ikeja Estate Security" }))).EnsureSuccessStatusCode();
        var posted = await _client.PostAsJsonAsync("/reports", new { account = "k-org", category = "missing_person_appeal", x = 90_000, y = 0, text = (string?)null, nowMinutes = Now });
        posted.EnsureSuccessStatusCode();
        var id = (await posted.Content.ReadFromJsonAsync<IdReply>())!.Id;
        // Not distributed until reviewed, even to somebody standing on it.
        Assert.DoesNotContain(await Nearby("k-reader", 90_000, 0), n => n.Id == id);
        var queue = await (await _client.SendAsync(Admin(HttpMethod.Get, "/review"))).Content.ReadFromJsonAsync<List<QueueReply>>();
        Assert.Contains(queue!, q => q.Id == id);
        // A decision needs a name.
        var anon = await _client.SendAsync(Admin(HttpMethod.Post, $"/reports/{id}/review", new { reviewer = "", approve = true }));
        Assert.Equal(HttpStatusCode.UnprocessableEntity, anon.StatusCode);
        (await _client.SendAsync(Admin(HttpMethod.Post, $"/reports/{id}/review", new { reviewer = "Ngozi", approve = true }))).EnsureSuccessStatusCode();
        // An organisation's own word is `confirmed` under the reach rules (one verified organisation), and 5 km.
        Assert.Contains(await Nearby("k-reader", 90_000, 0), n => n.Id == id && n.Stage == "confirmed");
        Assert.Contains(await Nearby("k-reader", 94_000, 0), n => n.Id == id);
        Assert.DoesNotContain(await (await _client.SendAsync(Admin(HttpMethod.Get, "/review"))).Content.ReadFromJsonAsync<List<QueueReply>>() ?? [], q => q.Id == id);
    }

    private async Task<List<NearbyReply>> Nearby(string account, double x, double y) =>
        (await _client.GetFromJsonAsync<List<NearbyReply>>($"/reports/nearby?account={account}&x={x}&y={y}&nowMinutes={Now + 1}"))!;

    private sealed record IdReply(string Id);
    private sealed record QueueReply(string Id, string Category, long AtMinutes, string? Text);
    private sealed record NearbyReply(string Id, string Category, long AtMinutes, double X, double Y, string? Text, string Stage, double DistanceM);
}
