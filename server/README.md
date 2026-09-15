# Sentinel replica

ASP.NET Core Web API on .NET 9. It holds only what it cannot read (ADR-0004):
an alert's position arrives as an envelope sealed to the circle member's key
and leaves the same way; the server relays it, records that it did, sends the
SMS fallback and keeps that one was sent and to whom — never the text — and
runs a journey's escalation timer so a phone that died still escalates. Reach
(Phase 5) is computed here with authority, from a C# mirror of the domain's
rule held to the TypeScript by `fixtures/reach.json`.

```bash
# In memory, no database: http://localhost:5000
make server-run

# Tests, no database
make server-test
```

| Project | Holds |
|---|---|
| `Sentinel.Domain` | Reach and the escalation plan. No ASP.NET, no EF Core, no clock. |
| `Sentinel.Infrastructure` | The store: accounts, circles, journeys, envelopes, attempts. The SMS gateway interface. |
| `Sentinel.Api` | The endpoints. `Messages.cs` is read by `make copy-check`. |
| `tests/` | Parity over the fixture; the server-cannot-read test; escalation; the circle. |
