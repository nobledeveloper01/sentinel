# ADR-0001 — The domain is pure TypeScript, and lint says so

## Status

Accepted, 2026-09-15.

## Context

The reach engine, the escalation ladder, the duress logic and the content rules
are the product. The server runs the reach engine with authority; the phone
runs the escalation ladder with the app killed; the content rules run on-device
and on the server. If any of it depends on a framework, a clock or a device id,
it cannot be run in two places and held to the same answer, and it cannot be
property-tested in a second.

## Decision

`packages/domain` is pure TypeScript. It imports nothing from React, React
Native, navigation, storage, or the platform; it takes the time as an argument
and the randomness as an argument. An ESLint rule forbids the imports, and
`make boundary` injects a violation and fails the build if the rule has stopped
matching — a rule that silently stops matching leaves the build green and the
guarantee gone.

## Consequences

- Every rule is a function of its inputs and can be run over generated worlds.
- The server (C#) mirrors what it must — the reach engine — and is held to the
  TypeScript by fixtures the domain writes and the server reads.
- The app is thin: it renders what the domain decided, and it owns the parts
  the domain cannot — the trigger paths, the channels, the keys, the screen.
