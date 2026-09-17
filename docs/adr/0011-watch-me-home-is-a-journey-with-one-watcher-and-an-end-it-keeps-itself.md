# ADR-0011 — Watch me home is a journey with one watcher and an end it keeps itself

## Status

Accepted, 2026-09-17.

## Context

A journey shares a position only on escalation; that is the wedge, and it
is what most nights need. Some nights need a person watching for twenty
minutes: the walk from the bus stop, the okada from the junction. ADR-0006
#13 asked for *watch me home* — time-bounded, one contact, ends by itself,
and says so to both.

The obvious implementation is a live map for the circle. A live map is the
thing this product refuses to build: a muster surface, and a surface a
coercer can read over a shoulder. The other obvious implementation is a
flag on the journey that the app never honours, which is what `liveShare`
was until now.

## Decision

**A watch is a journey whose plan is twenty minutes, whose `notify` is one
member, and whose positions are sealed to that member as they are taken.**
Each position is an envelope only she can open, posted under the journey and
read by her phone; the server relays and holds, and cannot read one. The
watcher sees the positions on her phone as a trail; she is never shown the
positions of anyone else, because there is nobody else.

**It ends by itself.** At the expected minute the watch is over — no grace,
no escalation from a watch — and both phones are told: the watched phone
shows *the watch has ended*, the watcher's shows the same. If the person
wants escalation, that is a journey, and the screen says so beside the watch.

**One watcher.** Two watchers is a group; a group with a live position is
the map.

## Consequences

`whoCanSeeMe` already says *this journey, until*; a watch reads the same
way. The server gains one route pair, positions in and positions out, both
envelopes. Positions arrive only while the app is alive and has a fix — on
this phone today, never, because the platform location is Phase 2 device
work — so a watch with no fix is honest about it: sealed *no position*
envelopes at each tick, and the watcher's screen says *no fix* rather than
drawing a point.
