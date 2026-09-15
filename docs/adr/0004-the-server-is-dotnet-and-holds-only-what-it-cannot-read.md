# ADR-0004 — The server is .NET, and holds only what it cannot read

## Status

Accepted, 2026-09-15.

## Context

The server has three jobs a phone cannot do: escalate a journey when the phone
is dead, send an SMS when the phone has no data, and compute reach with an
authority no client can influence. It must not have a fourth: knowing where
anybody is. A dataset of who was where, when, is the thing an authority asks
for and a breach hands over; the safest dataset is the one that does not
exist.

## Decision

The server is **ASP.NET Core 9 in C#**, the same language and shape as
Backhaul's and Vitals' replicas, with the same rule about a language for a
reason and not for a preference. Its store is Postgres, in-memory in tests.

An alert's and a journey's **location leaves the phone sealed** — an envelope
under keys agreed with each circle member (X25519, then an AEAD) — and the
server stores and forwards the envelope. It holds the plaintext of what it
needs and nothing more: who is in whose circle, when a journey is expected to
end, which organisation a user opted into, which accounts saw which report. A
server test creates an alert, gives the server every key it has, and shows it
cannot produce a coordinate; it is the Phase 1 gate and a release blocker.

The one place a location is plaintext on the server is the **SMS fallback**,
because an SMS cannot carry a ciphertext a phone without the app could open.
It is generated at send time from an envelope the *recipient's* device could
open, sent, and not kept; the record says an SMS was sent and to whom, never
what it said.

## Consequences

- The server's authority is over reach and time, never over content. It
  cannot rank, cannot read, cannot be asked.
- A key rotation is a client matter; the server sees new envelopes.
- The reach engine is mirrored in C# and held to the TypeScript by fixtures
  the domain writes and the server reads, as in Backhaul.
