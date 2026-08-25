# Sentinel

**Community safety coordination and emergency alerting for Nigeria.**

> **Read this first.** This is the one product in the portfolio where a design error causes direct
> physical harm. A false alarm can trigger mob violence. A misidentified "suspicious person" can
> get someone killed. A rumour amplified by a well-built app spreads faster than a rumour on
> WhatsApp. Every design decision here is constrained by that fact, and the abuse model is
> specified before any feature is.

Emergency response in most of Nigeria is functionally absent, so people improvise — and the
improvisation is a WhatsApp group. Those groups fail in four specific ways: nobody monitors them
at 2am, they have no geography, they amplify rumour with no correction mechanism, and they have
caused deaths.

See [`docs/00-PRODUCT-STATEMENT.md`](docs/00-PRODUCT-STATEMENT.md) for the full analysis.

---

## Status

Specified, not yet built. Deliberately **last** in the build order. The community layer — the part
that can get someone killed — is sequenced behind three separate safety gates and does not ship
until they pass.

## The insight

**In a system where a false alarm can kill someone, distribution must be earned, not granted.**

Most social products optimise for reach: easy to post, easy to share, easy to amplify. Applied
here, that produces a faster lynching.

Sentinel inverts it. Posting is easy; **reach is metered.** A report starts visible within 500
metres and widens only with independent corroboration. A single account — however panicked,
however malicious — cannot alarm a city.

The personal alert path is deliberately different: fast, unmetered, unconditional, because it goes
to people who already know and trust you. **Alerting your own circle is a right; alarming
strangers is a privilege.**

## What it refuses to do

- **No reporting of individual people.** No names, faces, descriptions, or plate numbers.
  Incidents are about events at places. This single rule removes the mechanism by which safety
  apps get people lynched.
- **No `suspicious_person` category.** It cannot be reported, because the concept has no
  legitimate use here and an obvious illegitimate one.
- **No vigilante coordination.** No muster points, no group dispatch, no "who's nearby and
  available".
- **No engagement monetisation.** An engagement-optimised safety app is a machine for
  manufacturing fear.

## Does it need a backend?

**Yes, and it is a safety requirement rather than an architectural one.** Two things only a server
can do: **send SMS when the sender's phone has no data** (iOS categorically cannot do this
itself), and **escalate a journey when the sender's phone is dead** — the scenario that matters
most.

The server is deliberately **not trusted with content**: alert locations are end-to-end encrypted
to circle devices and it relays ciphertext it cannot read. It is authoritative over exactly one
thing — **reach** — because that must be unforgeable by any client.

## The wedge

**Safe-arrival check-ins.** Someone travelling at night sets an expected arrival; if they do not
confirm, their chosen contacts are notified with their last known location. It works for one
person with zero other users, carries no abuse risk, and builds the habit of having a circle
configured *before* an emergency — the only time that configuration can usefully happen.

Nobody installs an emergency app during an emergency. It has to be useful beforehand.

## Platforms

Android 8.0+ and iOS 14+ from one codebase. Panic must fire in **under 2 seconds from a locked
device** on both, via every trigger path each platform offers — so the trigger path is entirely
native, reading a pre-computed payload with no JavaScript runtime in the way.
