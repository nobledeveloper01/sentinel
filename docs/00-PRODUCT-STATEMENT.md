# Sentinel — Product Statement

**Community safety coordination and emergency alerting for Nigeria.**

> **Read this section first.** Sentinel is the only product in this portfolio where a design
> error causes direct physical harm. A false alarm can trigger mob violence. A misidentified
> "suspicious person" can get someone killed. A rumour amplified by a well-built app spreads
> faster than a rumour on WhatsApp. Every design decision in these documents is constrained by
> that fact, and the abuse model is specified before any feature is.

---

## The Problem

Emergency response in most of Nigeria is functionally absent. Not slow — absent.

There is no reliable number that summons help within a useful timeframe in most places. Response
capability is thin, unevenly distributed, and in many areas the nearest effective responder is
not an official service at all but a neighbour, an estate security post, or a registered
vigilante group operating with community sanction.

So people improvise, and the improvisation is a WhatsApp group.

**WhatsApp groups are the incumbent emergency system, and they fail in four specific ways:**

1. **Nobody is monitoring at 2am.** A message into a group of 200 people at 2am reaches 200
   silent phones. There is no escalation, no acknowledgement, no way to know whether anyone read
   it.
2. **They have no geography.** A group covers whoever joined it, not whoever is nearby. The
   person best placed to help may not be in the group; 180 people 40 km away are.
3. **They amplify rumour with no correction mechanism.** A forwarded message about a robbery two
   years ago in another state circulates as tonight's emergency. There is no way to verify, no
   way to correct, and the correction never travels as far as the rumour.
4. **They have caused deaths.** Unverified accusations of theft, kidnapping or witchcraft
   circulated in local groups have led directly to mob violence and killings. This is not a
   hypothetical risk of the category — it is the documented history of the category.

Any product entering this space inherits failure mode 4 as its primary design problem.

---

## The Product

Sentinel is an emergency alerting and community-safety coordination tool with **verification and
abuse resistance as its core mechanics**, not as moderation bolted on afterwards.

1. **Personal alert** — a panic action reaches your own trusted circle first: family, chosen
   contacts, and the responders you have explicitly opted into. Live location, continuously
   updated.
2. **Guaranteed delivery** — the alert goes out by push, and **by SMS when there is no data**,
   and if the phone has no service at all it relays through nearby Sentinel devices over
   Bluetooth. An alert that does not arrive is not an alert.
3. **Safe arrival** — journey check-ins with automatic escalation. If you do not confirm arrival
   by the time you set, your circle is told, with your last known location.
4. **Community incidents** — a geographically scoped feed of what is happening nearby, with
   **structured verification** and **strict rules about what may be reported at all**.
5. **Route advisory** — historical incident density along a route, presented as information about
   places and times, never as a claim about people.

---

## What Sentinel Deliberately Refuses To Do

This list is as important as the feature list, and it is not negotiable in later revisions.

- **No reporting of individual people.** No names, no photographs of people, no descriptions of
  suspects, no vehicle plates. Incidents are about **events at places**, never about persons.
  This single rule removes the mechanism by which safety apps get people lynched.
- **No mass broadcast to strangers by default.** A personal alert reaches *your* circle and
  responders *you* opted into. Wider distribution requires verification thresholds that a single
  panicked or malicious user cannot reach alone.
- **No unverified incident propagates far.** Reach is a function of corroboration. One report is
  visible to the immediate vicinity. Wide visibility requires independent corroboration from
  distinct, established accounts.
- **No "suspicious person" category exists.** It cannot be reported, because the concept has no
  legitimate use here and an obvious illegitimate one.
- **No vigilante coordination features.** Sentinel does not organise a response, does not
  dispatch groups, does not provide muster points, and does not tell anybody to go anywhere.
- **No anonymous accusations.** Reports are pseudonymous to other users but attributable
  internally, and this is stated plainly to every user at signup.

---

## The Insight

**In a system where a false alarm can kill someone, distribution must be earned, not granted.**

Most social and safety products optimise for reach: make it easy to post, easy to share, easy to
amplify. Applied here, that produces a faster lynching.

Sentinel inverts it. Posting is easy; **reach is metered**. A report starts visible to a few
hundred metres. It widens with independent corroboration, with reporter history, and with time.
A single account — however panicked, however malicious — cannot alarm a city.

The personal alert path is different, and deliberately so: it is fast, unmetered, and
unconditional, because it goes to **people who already know and trust you**. The asymmetry is
the design. **Alerting your own circle is a right; alarming strangers is a privilege.**

---

## The Wedge

**Safe arrival check-ins.**

Someone travelling at night sets an expected arrival time. If they do not confirm, their chosen
contacts are notified with their last known location.

It works for one person with zero other users on the platform. It carries no abuse risk — there
is no public surface. It creates the habit of having the app open and the circle configured
*before* an emergency, which is the only time that configuration can usefully happen. And it
addresses an anxiety that is present on an ordinary Tuesday, not only during a crisis.

Nobody installs an emergency app during an emergency. Sentinel therefore has to be useful
beforehand.

---

## Target User

**Primary — the urban and peri-urban adult who travels at night.** Commutes late, drives
intercity, or lives somewhere with genuine security concern. Has a smartphone and a small
circle of family they would want alerted.

**Secondary — the estate or neighbourhood association.** Already runs a WhatsApp group and pays
for security. Wants something that actually escalates and that keeps a record.

**Tertiary — registered community security.** Estate guards, community-sanctioned vigilante
groups, private security firms. Onboarded only through a verified organisational account with an
accountable named administrator, never as self-declared individuals.

**Explicitly not a user:** anyone seeking to report, track, describe or accuse an individual
person. The product has no affordance for it.

---

## Why Now

- **Security concern is a mainstream daily consideration** across much of the country, not a
  regional one.
- **The incumbent is demonstrably harmful.** WhatsApp-driven misinformation has a body count,
  and there is now enough documented evidence of that pattern to design against it deliberately.
- **Offline mesh relay is practical.** BLE relay between nearby devices is now achievable on
  commodity phones, which matters enormously where network shutdowns or dead zones coincide with
  the emergencies themselves.
- **Nothing in the market treats verification as the core mechanic.** Existing panic-button apps
  are either single-user with no community layer, or community feeds with no abuse model.

---

## Explicitly Not

- **Not a replacement for emergency services.** Sentinel says so in the product, prominently, and
  always surfaces official numbers alongside its own actions.
- **Not a neighbourhood-watch surveillance network.** No cameras, no faces, no person reports.
- **Not a vigilante coordination tool.** See above.
- **Not a crime-statistics or crime-mapping product.** Historical density is shown as route
  advisory only, at coarse granularity, and never as a claim about a community or its residents.
- **Not a fintech, not a marketplace, and never monetised by engagement.** An engagement-optimised
  safety app is a machine for manufacturing fear.
