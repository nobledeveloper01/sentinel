using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Sentinel.Api.Tests;

/// <summary>A phone seals to a member by their public key; the server hands out public halves by phone hash and nothing else.</summary>
public class KeysTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    public KeysTests(WebApplicationFactory<Program> f) => _client = f.CreateClient();

    [Fact]
    public async Task APublicKeyIsFoundByPhoneHashAndAnUnknownHashIsNot()
    {
        var reg = await _client.PostAsJsonAsync("/accounts", new { id = "acct-keys", phoneHash = "hash-keys", publicKey = "pk-base64", nowMinutes = 1L });
        reg.EnsureSuccessStatusCode();
        var found = await _client.GetFromJsonAsync<KeyReply>("/keys/hash-keys");
        Assert.Equal("pk-base64", found!.PublicKey);
        var missing = await _client.GetAsync("/keys/nobody");
        Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
    }

    private sealed record KeyReply(string PublicKey);
}
