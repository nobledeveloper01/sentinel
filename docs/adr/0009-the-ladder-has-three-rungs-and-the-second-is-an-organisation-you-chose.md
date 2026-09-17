# ADR-0009 — The ladder has three rungs, and the second is an organisation you chose

## Status

Accepted, 2026-09-17.

## Context

The alert reaches the circle and nobody else. That is the rule, and it
leaves a gap the product statement names: an estate with a guard house, a
company with a security desk, a station — an organisation that could act on
an alert faster than an aunt across town, if the person had asked it to. The
organisation exists on the server since ADR-0006 #27, vouched for by an
administrator with the token, and the only thing it can do is decide the one
report category about a person. It receives no alert, because nothing sends
it one.

The obvious shape is a list of nearby organisations the alert also goes to.
That is a mass broadcast with a badge on it: an alert to a guard house the
person never chose is an alert to strangers, and it is refused by rule 2.

## Decision

**An organisation is a member of the circle, of a second kind, and it is
told only what a member is told.** The user opts in from a list of verified
organisations — names of places, never people — and the opt-in is an
invitation the organisation accepts from its own console, so consent stays
mutual and either side ends it now. Once accepted, the alert is sealed to the
organisation's key like any member's; the honest delivery state, the
acknowledgement and the cancel are the same code.

**The console shows acknowledgement and nothing else.** An organisation
reads, with its own token issued when it was vouched for, the alerts sealed
to it — when, whether it acknowledged, whether the person ended it — and it
acknowledges from there. It does not read a position; the position is in an
envelope only its key opens, on its phone, not on the console. It does not
see the person's other members. It sees no report feed.

**The ladder is drawn, and it has three rungs.** Circle → the organisation
you opted into → the official numbers, on the alert screen in that order,
with the numbers first and largest as everywhere. There is no fourth rung
and no *nearby responders*; the refusals in ADR-0006 stand.

## Consequences

`Relationship` carries a `kind`; `whoCanSeeMe` lists an organisation with
the same conditions as a person. The server gains a list of verified
organisations by name, per-organisation tokens, and a console of three
routes. The organisation's phone is a phone: it registers a key like any
account, and the guard who holds it sees the alert in the same app.

What this does not do is tell the organisation where the person is on the
console. A guard who needs the position opens the envelope on the phone the
key lives on, which is the design: nothing readable leaves the phone, and a
console is a screen in a room anyone can walk past.
