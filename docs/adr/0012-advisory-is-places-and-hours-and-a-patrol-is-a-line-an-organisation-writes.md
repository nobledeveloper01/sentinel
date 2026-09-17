# ADR-0012 — Advisory is places and hours, and a patrol is a line an organisation writes

## Status

Accepted, 2026-09-17.

## Context

Phase 8 has two things left: route advisory from expired reports at coarse
granularity above thresholds, and patrol logging for organisations. Both are
code with nothing outside the repository to wait for, and both are surfaces
where a careless sentence hurts someone.

The obvious advisory is a heat map. A heat map of a city is a map of its
poorer streets, read as a claim about the people who live there; the
product statement refuses it by name.

## Decision

**Advisory is a sentence about a place and hours, computed from expired
reports, shown only above thresholds, and never a number.** The domain
groups reports older than their reach window into cells of one kilometre
and hours of the day; a cell speaks only when at least six reports from at
least four accounts fall in it over ninety days, and it says *this area,
these hours* — the hours being the contiguous band that holds most of them.
Below the thresholds it says nothing at all, and the screen shows nothing,
not *no data*. The categories are pooled; the sentence never names one,
because *robbery, this street, these hours* is a claim with a victim's
address in it.

**The same thresholds run on the server**, held to the TypeScript by a
fixture of generated worlds like reach, so the server cannot say more than
the phone would.

**A patrol is a line an organisation writes about itself.** The organisation
console takes *patrolled, this cell, this minute* from the organisation's
own token and lists it back to the same organisation. A patrol names no
person, no report and no other organisation; it reaches no feed; it is not
an input to reach or advisory. It is a log a guard house keeps because it
has always kept one, on paper.

## Consequences

The advisory sentence appears on *Near you* under the reports, when there
is one. There is no advisory screen, no map, no route; a route is a set of
cells and the sentence is per cell. Patrols are the first thing the server
holds that an organisation wrote about its own work, and the data-request
page says so.
