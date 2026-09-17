# Roadmap

The order is the abuse model's: the parts that can hurt nobody first, the part
that can hurt someone last and behind its own gates. Each phase names its exit
gate, and each gate is one of two kinds — a **software gate**, which `make ci`
holds, and a **hardware or people gate**, which needs a phone in a hand, a
person, or a city, and is listed in `docs/RELEASE-GATES.md`. `PHASE` holds the
number of the phase that is **current**.

## Phase 0 — Foundation

The monorepo; `packages/domain` under the boundary lint; the React Native app
shell on the New Architecture; the calm glass design system with light and dark
authored and every pair contrast-asserted; the mark and the launch screens; the
.NET server skeleton; the gates, each broken on purpose once; the eight ADRs.

**Exit gate**. *Both platforms build in CI; the domain boundary and the copy
gate are proved to fire; the design system's contrast test passes on every
pair; the iOS Critical Alerts entitlement application is submitted (R5).*

## Phase 1 — Crypto and the circle **current**

Key agreement (X25519), envelopes (XChaCha20-Poly1305 or the platform's
ChaCha20-Poly1305), key rotation, device keys; circle invites with mutual
consent, instant unilateral revocation, and the screen that says exactly who
can receive your location and under what conditions.

**Exit gate**. *A test proves the server cannot decrypt an alert location — it
holds an envelope, tries every key it has, and fails. A release blocker from
this phase onward.*

## Phase 2 — The panic path

Every trigger path each platform offers; the pre-computed payload so the
trigger sends before the app is awake; the three channels in parallel — push,
server SMS, device SMS on Android — and the BLE mesh relay as the fourth;
delivery receipts, acknowledgement, the honest failure state with the official
numbers on it.

**Exit gate**. *Under two seconds from physical input on a locked device on
every path, both platforms, measured on hardware (R1); the delivery matrix —
data/no-data × service/no-service × platform — passes with at least one
channel succeeding or the user told plainly (R2); the mesh relay verified on
mixed-platform hardware with hop limits (R4).*

## Phase 3 — Safe arrival, the wedge

A journey in under twenty seconds: where, when, who. Live sharing or on
escalation only. The prompt at the expected time, reminders at +5 and +10,
the circle told at +15 with the last known location and the trail. Escalation
scheduled on the device so it fires with the app killed, **and on the server
independently** so it fires with the phone dead. Arrival by geofence, still
confirmed, never silently cancelling an escalation.

**Exit gate**. *Escalation fires when the phone is switched off at the expected
time — verified physically, not simulated (R3).*

## Phase 4 — Trust surfaces → **v1.0**

Silent mode; the duress PIN and its decoy; the verifiable privacy screen and
the access log; the immutable alert record and its signed export; organisation
verification and opt-in; the guard's receipt of an alert; onboarding that
teaches the rules; the accessibility audit with the panic action operable
without sight; battery budgets; the device matrix.

**Built 2026-09-17, the code that was left.** The ladder drawn with its three
rungs; an organisation opted into as a member of a second kind, accepting from
its own console and sealed to like anyone (ADR-0009); the data-request page
in Settings (ADR-0013). The accessibility audit and the battery budget are the
handset's; the outside reading is R7.

**Exit gate**. *v1.0 ships with no public surface: personal alerting and safe
arrival only.*

## Phase 5 — The reach engine

Built and adversarially tested before any reporting screen exists: the stage
machine, independence scoring, velocity anomaly suppression, distribution-list
retention so a correction reaches exactly the original audience, the
human-review queue.

**Exit gate**. *Property-based tests prove no sequence of actions by one
account, or by accounts sharing any independence signal, distributes an
unverified report beyond 500 m. A release blocker.*

## Phase 6 — Content screening

On-device rules and a server model over an adversarial corpus: names, ethnic
and religious identifiers, descriptions of persons, clothing, plates, phone
numbers, transliterations, deliberate obfuscation; faces in images. Fail
closed.

**Exit gate**. *The corpus pass rate meets its threshold, and fail-closed is
verified by taking the screener offline and confirming free text and images
are refused while category-and-location reports still succeed.*

## Phase 7 — The community layer → **v1.1**

The reporting screen with the closed category list, the radius-bounded feed,
corroborate and dispute with fixed reasons, stage badges, corrections that
reach everyone who saw the claim, the blocked-report explainer, the
organisation console.

**Built 2026-09-16, the code, last as planned.** The feed within reach, the
report screen with the closed list and the blocked-report explainer,
corroborate and dispute with fixed reasons, the withdrawal that reaches
everyone shown, and the server's `/reports` with the reach engine computing
every stage from what it knows now. Not the organisation console, and not
shipped: the exit gate is a city.

**Exit gate**. *Launched to one city with a staffed review queue; thirty days
with zero harm incidents before any expansion (R6). If the layer ever
demonstrates it is less safe than the WhatsApp group it replaces, it is
withdrawn and v1.0 ships alone.*

## Phase 8 — Advisory and reach → *v1.2*

Route advisory from expired-report aggregates at coarse granularity and with
minimum thresholds, never a claim about a community; patrol logging; the
circle's SMS in four more languages; the organisation web console.

**Built 2026-09-17.** Advisory as a place and hours from expired reports,
above thresholds and otherwise nothing, held to the phone by a fixture of 120
cells; patrols as lines an organisation writes about itself; the console at
`apps/web` (ADR-0012). The SMS in five languages was built in Phase 1. What
remains is a native speaker of each.

**Exit gate**. *Advisory renders nothing below its thresholds; a native speaker
of each language has read the SMS a circle member receives.*
