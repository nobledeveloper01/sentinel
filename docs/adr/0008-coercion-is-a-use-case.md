# ADR-0008 — Coercion is a use case

## Status

Accepted, 2026-09-15.

## Context

The person holding the phone during an alert may not be its owner, or may be
its owner with someone watching. A panic app that assumes a free hand and a
free screen fails in exactly the situation it is for.

## Decision

Three mechanisms, all in the domain as pure state so they can be tested:

1. **Silent mode.** A trigger produces no visible, audible or haptic change on
   the device beyond a haptic pattern the user chose during setup. The alert
   goes out as usual.
2. **The duress PIN.** Unlocking with the duress PIN opens a **decoy**: an app
   that appears idle, with no alert visible, while the alert continues and the
   circle is told *opened under duress*. Nothing on the decoy screen
   distinguishes it from the real one to a stranger.
3. **The distinguishable cancel.** Cancelling an alert takes an interaction a
   coercer cannot perform by reaching over — a two-finger hold for two seconds
   followed by the PIN — and the duress PIN at the cancel step sends *cancelled
   under duress* to the circle silently while the screen shows a normal cancel.

## Consequences

- The domain's `duress` module decides which state each PIN leads to and what
  the circle is told; the app renders the state it is given.
- Onboarding sets the duress PIN at the same time as the real one, in the same
  sentence, so it is not an expert feature.
- The alert record keeps the duress facts; the decoy screen never shows them.
