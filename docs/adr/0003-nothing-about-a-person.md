# ADR-0003 — Nothing about a person

## Status

Accepted, 2026-09-15.

## Context

Every documented death in this category traces to one shape: a message about a
*person* — a name, a description, a photograph, a plate — carried to people who
then found someone matching it. Remove the shape and the mechanism is gone.

## Decision

Incidents are **events at places**. The category list is closed —
`robbery`, `burglary`, `road_blocked`, `accident`, `fire`, `flooding`,
`gunfire_heard`, `unrest_or_protest`, `building_collapse`, `power_line_down` —
and it has no *suspicious person*, no *suspicious vehicle*, and no free
category. The one exception, `missing_person_appeal`, exists only for a
verified organisation or verified next of kin and never distributes without a
human's review.

Free text is **screened before submission** for names, ethnic and religious
identifiers, descriptions of persons, clothing, plates and phone numbers, with
an adversarial corpus of Nigerian name patterns and transliterations; a match
blocks with an explanation and an offer to describe the event instead. Images
are screened for faces and refused if any is found. The screen **fails
closed**: with the screener unavailable, free text and images are refused and
a category-and-location report still succeeds.

`make copy-check` fails the build on the words the app itself must never say
— *suspicious*, *suspect*, *description*, *identify*, *lookout*, *wanted*, and
the vocabulary of mobilisation — in every language it speaks.

## Consequences

- There is no "add a photo of the person" and there is no place to ask for
  one; the affordance does not exist, so it cannot be misused.
- A screen that cannot be reached is a screen that refuses, not one that
  waves through: the availability of a service is never the availability of a
  loophole.
- Route advisory (Phase 8) shows places and times, never a word about who
  lives there.
