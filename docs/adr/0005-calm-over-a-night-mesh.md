# ADR-0005 — Calm over a night mesh, with a solid floor

## Status

Accepted, 2026-09-15.

## Context

The user asked for the portfolio's 2027 design — glass, gradient, motion — and
the product's risk register says the product itself must not increase anxiety:
calm palette, no count badges, no engagement ranking, no unsolicited
notifications. Both hold, because the calm is in what moves and what is red,
not in whether a surface is glass.

## Decision

The design is **glass over a gradient mesh** — a night-blue to deep-teal wash,
never a warm one — with three depths that each mean one thing, exactly as
Vitals (ADR-0005 there) defined them: *low* for a card that sits in a list,
*mid* for a control, *high* for a sheet or the lock. Every glass surface has a
**solid twin** and every duration a **zero twin**, chosen at act time by two
Settings toggles and by the platform's Reduce Motion, and the app is complete
either way. The floor is a four-year-old Android phone with 2 GB.

**One gradient control per screen.** On the alert screen that control is the
panic action; nothing else on any screen carries the gradient.

**There is no red.** Not on the panic control, not on an alert, not on an
escalation. The attention colour is amber and it is used for facts — *no
service*, *not yet acknowledged* — never for urgency. Urgency is size and
position: the panic action is the largest thing on its screen and under the
thumb.

**Nothing counts.** No badge, no unread number, no "3 incidents near you".
Motion expresses a state that changed — an acknowledgement arriving, a journey
starting — and never a demand for attention: nothing pulses, nothing shakes.

Every text colour on every fill over every wash is contrast-asserted in CI,
light and dark, glass and solid.

## Consequences

- The panic screen at 200% text and with VoiceOver is the first thing the
  accessibility audit opens, and the panic action is operable without sight.
- A future "make the alert screen more urgent" is a request to break this ADR
  and gets an ADR of its own.
