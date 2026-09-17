using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Sentinel.Api.Tests;

/// <summary>
/// The second rung (ADR-0009): an organisation is opted into, accepts from
/// its own console, is sealed to like a member, and its console shows
/// acknowledgement and nothing else. The watch (ADR-0011) relays sealed
/// positions to one watcher and is never escalated. Advisory (ADR-0012)
/// says nothing until it can say a place and hours. Patrols are the
/// organisation's own lines.
/// </summary>
public class LadderTests : IClassFixture<LadderTests.Factory>
{
    public class Factory : WebApplicationFactory<Program>
    {
        // Its own store: the watch test sweeps far into the future, which would escalate another test's journey.
        protected override void ConfigureWebHost(IWebHostBuilder b) => b.UseSetting("SENTINEL_ADMIN_TOKEN", "test-admin-token-long-enough").UseSetting("SENTINEL_DB_NAME", "sentinel-ladder");
    }

    private readonly HttpClient _client;
    public LadderTests(Factory f) => _client = f.CreateClient();

    private const long Now = 200L * 24 * 60;
    private static readonly string B64 = Convert.ToBase64String(new byte[] { 1, 2, 3, 4 });

    private static HttpRequestMessage With(string header, string token, HttpMethod m, string path, object? body = null)
    {
        var r = new HttpRequestMessage(m, path) { Content = body is null ? null : JsonContent.Create(body) };
        r.Headers.Add(header, token);
        return r;
    }

    private async Task<string> VouchAsync(string account, string hash, string name)
    {
        (await _client.PostAsJsonAsync("/accounts", new { id = account, phoneHash = hash, publicKey = "pk-org", nowMinutes = 0L })).EnsureSuccessStatusCode();
        var vouched = await _client.SendAsync(With("X-Admin-Token", "test-admin-token-long-enough", HttpMethod.Post, "/organisations", new { account, name }));
        vouched.EnsureSuccessStatusCode();
        return (await vouched.Content.ReadFromJsonAsync<TokenReply>())!.OrganisationToken;
    }

    [Fact]
    public async Task AnOrganisationIsOptedInto_AcceptsFromItsConsole_IsSealedTo_AndSeesAcknowledgementAndNothingElse()
    {
        var token = await VouchAsync("l-estate", "h-l-estate", "Ikeja Estate Security");
        (await _client.PostAsJsonAsync("/accounts", new { id = "l-ada", phoneHash = "h-l-ada", publicKey = "pk-ada", nowMinutes = 0L })).EnsureSuccessStatusCode();

        // The list a person opts in from: names of places, and the hash a phone seals to.
        var list = await _client.GetFromJsonAsync<List<OrgReply>>("/organisations");
        Assert.Contains(list!, o => o.Name == "Ikeja Estate Security" && o.PhoneHash == "h-l-estate");

        // Opting in is an invitation; nothing is shared until the organisation accepts.
        (await _client.PostAsJsonAsync("/circle/invite", new { owner = "l-ada", withPhoneHash = "h-l-estate" })).EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.Unauthorized, (await _client.GetAsync("/organisations/me/optins")).StatusCode);
        var optins = await (await _client.SendAsync(With("X-Organisation-Token", token, HttpMethod.Get, "/organisations/me/optins"))).Content.ReadFromJsonAsync<List<OptInReply>>();
        Assert.Contains(optins!, o => o.Owner == "l-ada" && !o.Accepted);
        (await _client.SendAsync(With("X-Organisation-Token", token, HttpMethod.Post, "/organisations/me/accept", new { owner = "l-ada" }))).EnsureSuccessStatusCode();
        var circle = await _client.GetFromJsonAsync<List<CircleReply>>("/circle/l-ada");
        Assert.Contains(circle!, c => c.WithPhoneHash == "h-l-estate" && c.Accepted);

        // The alert is sealed to it like any member's key; the console sees the alert and whether it acknowledged.
        (await _client.PostAsJsonAsync("/alerts", new { id = "al-1", from = "l-ada", atMinutes = Now, envelopes = new[] { new { to = "h-l-estate", nonce = B64, ciphertext = B64, from = B64 } }, smsFallback = Array.Empty<object>() })).EnsureSuccessStatusCode();
        var alerts = await (await _client.SendAsync(With("X-Organisation-Token", token, HttpMethod.Get, "/organisations/me/alerts"))).Content.ReadFromJsonAsync<List<ConsoleAlert>>();
        var mine = Assert.Single(alerts!, a => a.Id == "al-1");
        Assert.Null(mine.AcknowledgedAtMinutes);
        (await _client.SendAsync(With("X-Organisation-Token", token, HttpMethod.Post, "/organisations/me/alerts/al-1/ack", new { atMinutes = Now + 2 }))).EnsureSuccessStatusCode();
        alerts = await (await _client.SendAsync(With("X-Organisation-Token", token, HttpMethod.Get, "/organisations/me/alerts"))).Content.ReadFromJsonAsync<List<ConsoleAlert>>();
        Assert.Equal(Now + 2, Assert.Single(alerts!, a => a.Id == "al-1").AcknowledgedAtMinutes);
        // And the person's phone sees the acknowledgement the same way it sees any member's.
        var record = await _client.GetFromJsonAsync<AlertReply>("/alerts/al-1");
        Assert.Contains(record!.Acknowledgements, k => k.ByPhoneHash == "h-l-estate");

        // Nothing else: the console's alert carries no position and no member — the wire shape is the assertion.
        var raw = await (await _client.SendAsync(With("X-Organisation-Token", token, HttpMethod.Get, "/organisations/me/alerts"))).Content.ReadAsStringAsync();
        Assert.DoesNotContain("ciphertext", raw);
        Assert.DoesNotContain("envelope", raw);
        Assert.DoesNotContain("h-l-ada", raw);
        // An alert not sealed to it cannot be acknowledged from its console.
        Assert.Equal(HttpStatusCode.NotFound, (await _client.SendAsync(With("X-Organisation-Token", token, HttpMethod.Post, "/organisations/me/alerts/nope/ack", new { atMinutes = Now }))).StatusCode);
        // A wrong token is nobody.
        Assert.Equal(HttpStatusCode.Unauthorized, (await _client.SendAsync(With("X-Organisation-Token", "not-it", HttpMethod.Get, "/organisations/me/alerts"))).StatusCode);
    }

    [Fact]
    public async Task AWatchRelaysSealedPositionsToOneWatcherOnly_AndTheSweepNeverEscalatesIt()
    {
        (await _client.PostAsJsonAsync("/journeys", new { id = "w-1", account = "w-ada", expectedMinutes = Now + 20, graceMinutes = 0, notify = new[] { "h-w-aunt" }, watch = true })).EnsureSuccessStatusCode();
        (await _client.PostAsJsonAsync("/journeys/w-1/positions", new { to = "h-w-aunt", atMinutes = Now + 1, from = B64, nonce = B64, ciphertext = B64 })).EnsureSuccessStatusCode();
        // Not the watcher: refused, so a second name cannot be added from the wire.
        Assert.Equal(HttpStatusCode.UnprocessableEntity, (await _client.PostAsJsonAsync("/journeys/w-1/positions", new { to = "h-w-stranger", atMinutes = Now + 1, from = B64, nonce = B64, ciphertext = B64 })).StatusCode);
        var hers = await _client.GetFromJsonAsync<List<PositionReply>>("/journeys/w-1/positions?to=h-w-aunt");
        Assert.Single(hers!);
        Assert.Empty((await _client.GetFromJsonAsync<List<PositionReply>>("/journeys/w-1/positions?to=h-w-stranger"))!);
        // Long past its end, the sweep leaves it alone: a watch ends by itself and is not a journey the server escalates.
        var swept = await _client.PostAsync($"/journeys/sweep?nowMinutes={Now + 100}", null);
        swept.EnsureSuccessStatusCode();
        var j = await _client.GetFromJsonAsync<JourneyReply>("/journeys/w-1");
        Assert.Null(j!.EscalatedAtMinutes);
        // An ordinary journey is not a watch: positions are refused.
        (await _client.PostAsJsonAsync("/journeys", new { id = "j-1", account = "w-ada", expectedMinutes = Now + 20, graceMinutes = 15, notify = new[] { "h-w-aunt" } })).EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.NotFound, (await _client.PostAsJsonAsync("/journeys/j-1/positions", new { to = "h-w-aunt", atMinutes = Now + 1, from = B64, nonce = B64, ciphertext = B64 })).StatusCode);
    }

    [Fact]
    public async Task AdvisorySaysNothingUntilItCanSayAPlaceAndHours_AndAPatrolIsTheOrganisationsOwnLine()
    {
        // Far from every other test's reports, on its own cell.
        const double X = 700_500, Y = 700_500;
        Assert.Equal(HttpStatusCode.NoContent, (await _client.GetAsync($"/advisory?x={X}&y={Y}&nowMinutes={Now}")).StatusCode);
        for (var i = 0; i < 8; i++)
        {
            var account = $"adv-{i % 5}";
            if (i < 5) (await _client.PostAsJsonAsync("/accounts", new { id = account, phoneHash = $"h-{account}", publicKey = "pk", nowMinutes = 0L, device = $"d-{i}", installLineage = $"l-{i}" })).EnsureSuccessStatusCode();
            // Reported weeks ago at 22:00, oldest first, so every report has expired but is inside the ninety-day window.
            var at = Now - (30 - i) * 1440 - (Now % 1440) + 22 * 60;
            (await _client.PostAsJsonAsync("/reports", new { account, category = "robbery", x = X + i, y = Y, text = (string?)null, nowMinutes = at })).EnsureSuccessStatusCode();
        }
        var a = await _client.GetFromJsonAsync<AdvisoryReply>($"/advisory?x={X}&y={Y}&nowMinutes={Now}");
        Assert.NotNull(a);
        Assert.Equal(22, a.FromHour);
        Assert.Equal(23, a.ToHour);
        // A count and a category are not on the wire, by construction.
        var raw = await _client.GetStringAsync($"/advisory?x={X}&y={Y}&nowMinutes={Now}");
        Assert.DoesNotContain("robbery", raw);
        Assert.DoesNotContain("count", raw);
        // The next cell over says nothing about this one.
        Assert.Equal(HttpStatusCode.NoContent, (await _client.GetAsync($"/advisory?x={X + 1000}&y={Y}&nowMinutes={Now}")).StatusCode);

        var token = await VouchAsync("p-org", "h-p-org", "Ojota Station");
        var logged = await _client.SendAsync(With("X-Organisation-Token", token, HttpMethod.Post, "/organisations/me/patrols", new { x = X, y = Y, atMinutes = Now }));
        logged.EnsureSuccessStatusCode();
        var patrols = await (await _client.SendAsync(With("X-Organisation-Token", token, HttpMethod.Get, "/organisations/me/patrols"))).Content.ReadFromJsonAsync<List<PatrolReply>>();
        Assert.Single(patrols!);
        Assert.Equal(700, patrols![0].CellX);
        // Another organisation's console does not list it.
        var other = await VouchAsync("p-org2", "h-p-org2", "Ikeja Station");
        Assert.Empty((await (await _client.SendAsync(With("X-Organisation-Token", other, HttpMethod.Get, "/organisations/me/patrols"))).Content.ReadFromJsonAsync<List<PatrolReply>>())!);
    }

    private sealed record TokenReply(string OrganisationToken);
    private sealed record OrgReply(string PhoneHash, string Name);
    private sealed record OptInReply(string Owner, bool Accepted);
    private sealed record CircleReply(string WithPhoneHash, bool Accepted, string? Language);
    private sealed record ConsoleAlert(string Id, long AtMinutes, bool Cancelled, long? AcknowledgedAtMinutes);
    private sealed record AckReply(string ByPhoneHash, long AtMinutes);
    private sealed record AlertReply(string Id, List<AckReply> Acknowledgements);
    private sealed record PositionReply(long AtMinutes, string From, string Nonce, string Ciphertext);
    private sealed record JourneyReply(string Id, bool Confirmed, bool Cancelled, long? EscalatedAtMinutes);
    private sealed record AdvisoryReply(int CellX, int CellY, int FromHour, int ToHour);
    private sealed record PatrolReply(int CellX, int CellY, long AtMinutes);
}
