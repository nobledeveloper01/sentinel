using System.Net;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Sentinel.Infrastructure;

namespace Sentinel.Api.Tests;

/// <summary>
/// ADR-0004's gate: the server holds only what it cannot read. A phone seals
/// a position for a circle member under a key the server never sees; the
/// server stores and relays the envelope; nothing it holds contains the
/// coordinate, and nothing it holds can open the envelope.
/// </summary>
public class ServerCannotReadTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    public ServerCannotReadTests(WebApplicationFactory<Program> f)
    {
        _factory = f;
        _client = f.CreateClient();
    }

    [Fact]
    public async Task TheServerCannotProduceTheCoordinateFromAnythingItHolds()
    {
        // The phone: a position, a key agreed with the circle member (the
        // server sees only the public halves), an AEAD envelope.
        var position = "6.5244,3.3792";
        using var sender = ECDiffieHellman.Create(ECCurve.NamedCurves.nistP256);
        using var member = ECDiffieHellman.Create(ECCurve.NamedCurves.nistP256);
        var shared = sender.DeriveKeyMaterial(member.PublicKey);
        var key = SHA256.HashData(shared);
        var nonce = RandomNumberGenerator.GetBytes(12);
        var plaintext = Encoding.UTF8.GetBytes(position);
        var ciphertext = new byte[plaintext.Length];
        var tag = new byte[16];
        using (var aead = new ChaCha20Poly1305(key)) aead.Encrypt(nonce, plaintext, ciphertext, tag);
        var sealedBytes = ciphertext.Concat(tag).ToArray();

        var id = $"alert-{Guid.NewGuid():N}";
        var res = await _client.PostAsJsonAsync("/alerts", new RelayAlert(id, "sender-hash", 1000,
            [new Envelope("member-hash", Convert.ToBase64String(nonce), Convert.ToBase64String(sealedBytes))],
            [new SmsFallback("member-hash", "Ada sent an alert. Last position: https://s.ng/x")]));
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);

        // Everything the server holds, byte by byte: no coordinate anywhere,
        // and not the SMS text either.
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SentinelDbContext>();
        var everything = new StringBuilder();
        foreach (var e in db.Envelopes) everything.Append(Convert.ToHexString(e.Nonce)).Append(Convert.ToHexString(e.Ciphertext)).Append(Encoding.Latin1.GetString(e.Ciphertext));
        foreach (var t in db.Attempts) everything.Append(t.Channel).Append(t.ToPhoneHash).Append(t.Outcome);
        foreach (var a in db.Alerts) everything.Append(a.Id).Append(a.From);
        var held = everything.ToString();
        Assert.DoesNotContain(position, held);
        Assert.DoesNotContain("6.5244", held);
        Assert.DoesNotContain("https://s.ng/x", held);

        // And the envelope opens for the member, and for nobody without the key.
        var got = await _client.GetFromJsonAsync<AlertView>($"/alerts/{id}");
        var env = Assert.Single(got!.Envelopes);
        var bytes = Convert.FromBase64String(env.Ciphertext);
        var memberKey = SHA256.HashData(member.DeriveKeyMaterial(sender.PublicKey));
        var opened = new byte[bytes.Length - 16];
        using (var aead = new ChaCha20Poly1305(memberKey)) aead.Decrypt(Convert.FromBase64String(env.Nonce), bytes[..^16], bytes[^16..], opened);
        Assert.Equal(position, Encoding.UTF8.GetString(opened));
        var wrong = RandomNumberGenerator.GetBytes(32);
        Assert.ThrowsAny<CryptographicException>(() =>
        {
            using var aead = new ChaCha20Poly1305(wrong);
            aead.Decrypt(Convert.FromBase64String(env.Nonce), bytes[..^16], bytes[^16..], new byte[opened.Length]);
        });
        // The record says an SMS went, to whom, and that is all.
        Assert.Contains(got.Attempts, t => t.Channel == "serverSms" && t.Outcome == "delivered");
    }

    [Fact]
    public async Task AJourneyEscalatesOnTheServerWhenThePhoneSaysNothing()
    {
        var id = $"j-{Guid.NewGuid():N}";
        var reg = await _client.PostAsJsonAsync("/journeys", new RegisterJourney(id, "acct", 60, 15, ["aunt-hash"]));
        Assert.Equal(HttpStatusCode.OK, reg.StatusCode);
        // Before the grace: nothing.
        var early = await (await _client.PostAsync("/journeys/sweep?nowMinutes=74", null)).Content.ReadFromJsonAsync<Sweep>();
        var j = await _client.GetFromJsonAsync<JourneyView>($"/journeys/{id}");
        Assert.Null(j!.EscalatedAtMinutes);
        // At the grace, with the phone silent: escalated once, and once only.
        await _client.PostAsync("/journeys/sweep?nowMinutes=75", null);
        await _client.PostAsync("/journeys/sweep?nowMinutes=80", null);
        j = await _client.GetFromJsonAsync<JourneyView>($"/journeys/{id}");
        Assert.Equal(75, j!.EscalatedAtMinutes);
        // A confirmed journey never escalates.
        var id2 = $"j-{Guid.NewGuid():N}";
        await _client.PostAsJsonAsync("/journeys", new RegisterJourney(id2, "acct", 60, 15, ["aunt-hash"]));
        await _client.PostAsync($"/journeys/{id2}/confirm", null);
        await _client.PostAsync("/journeys/sweep?nowMinutes=90", null);
        var j2 = await _client.GetFromJsonAsync<JourneyView>($"/journeys/{id2}");
        Assert.Null(j2!.EscalatedAtMinutes);
        _ = early;
    }

    [Fact]
    public async Task TheCircleIsMutualAndEitherSideEndsIt()
    {
        var owner = $"o-{Guid.NewGuid():N}";
        await _client.PostAsJsonAsync("/circle/invite", new Invite(owner, "aunt"));
        var before = await _client.GetFromJsonAsync<List<CircleView>>($"/circle/{owner}");
        Assert.False(Assert.Single(before!).Accepted);
        await _client.PostAsJsonAsync("/circle/accept", new Accept(owner, "aunt", "yo"));
        var after = await _client.GetFromJsonAsync<List<CircleView>>($"/circle/{owner}");
        Assert.Equal(("aunt", true, "yo"), (after![0].WithPhoneHash, after[0].Accepted, after[0].Language));
        await _client.DeleteAsync($"/circle/aunt/{owner}");
        var gone = await _client.GetFromJsonAsync<List<CircleView>>($"/circle/{owner}");
        Assert.Empty(gone!);
    }

    private sealed record AlertView(string Id, List<EnvelopeView> Envelopes, List<AttemptView> Attempts);
    private sealed record EnvelopeView(string ToPhoneHash, string Nonce, string Ciphertext);
    private sealed record AttemptView(string Channel, string ToPhoneHash, string Outcome, long AtMinutes);
    private sealed record Sweep(int Escalated);
    private sealed record JourneyView(string Id, bool Confirmed, bool Cancelled, long? EscalatedAtMinutes);
    private sealed record CircleView(string WithPhoneHash, bool Accepted, string Language);
}
