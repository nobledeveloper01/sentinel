# ADR-0007 — Alerting your circle is a right; alarming strangers is a privilege

## Status

Accepted, 2026-09-15.

## Context

Two things look alike and are opposites. A panic alert reaches people who
already know and trust you; it must be fast, unmetered and unconditional,
because the cost of a false one is an embarrassed phone call. A community
report reaches strangers; it must be slow to widen, because the cost of a
false one is a death. A product that shares code between them inherits the
worst of each: a metered panic button, or an unmetered rumour.

## Decision

The **personal path** and the **public path** are separate: separate domain
modules, separate server endpoints, separate screens, separate release gates,
and nothing in common but the design system and the crypto. The personal path
ships in v1.0 with no public surface at all. The public path is a separate
release (v1.1) behind ADR-0002's property test, ADR-0003's screening and the
thirty-day city gate, and it can be withdrawn without touching the other.

The personal path never distributes beyond the circle and the organisations
the user opted into. The public path never triggers an alert to anybody's
circle. A test asserts that no function in `domain/personal` imports from
`domain/public` or the reverse.

## Consequences

- If the community layer ever proves less safe than the WhatsApp group it
  replaces, it is removed and the product that remains is whole.
- "Tell everyone nearby" on the alert screen is not a missing feature; it is
  a refused one (ADR-0006).
