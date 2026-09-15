# ADR-0002 — Reach is earned, and a single account never passes 500 metres

## Status

Accepted, 2026-09-15.

## Context

The product statement's insight: in a system where a false alarm can kill,
distribution must be earned, not granted. Every social product optimises for
reach; applied here that produces a faster lynching. The failure has a body
count and a mechanism, and the mechanism is one account reaching many.

## Decision

Distribution is a **pure function** in the domain, `reach.stageOf(report,
evidence, now)`, that maps a report and the evidence for it to one of four
stages — *reported* (500 m), *corroborated* (2 km), *confirmed* (5 km),
*verified* (area) — and it is computed **on the server with authority**. The
client renders the stage it is given and can influence nothing.

Evidence counts only from accounts that are **independent** of each other and
of the reporter: no shared device fingerprint, no shared install lineage, no
circle relationship, no implausibly correlated location history. Independence
is a function too, `independence.of(a, b, signals)`, and a set of accounts
sharing any signal collapses to one for counting.

A **velocity anomaly** — more reports in an area and window than its baseline
allows — suppresses distribution to *reported* pending human review, and the
suppression fails safe.

The rule that governs the rest: **no sequence of actions by one account, or by
any set of accounts that collapses to one, can advance a report beyond
`reported`.** It is property-tested over generated worlds — accounts, signals,
reports, corroborations, disputes, in any order and any number — and the test
is a release blocker.

## Consequences

- The reporting screen is not built until this engine passes its property
  test (Phase 5 before Phase 7); the riskiest surface ships with the most
  tested rule behind it.
- Every account that saw a report is remembered, because a correction must
  reach exactly that audience, never fewer.
- The server is the authority for reach and for nothing about content: it
  counts, it never reads a location (ADR-0004).
