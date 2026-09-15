# ADR-0006 — Thirty more things, each checked against the refusals

## Status

Accepted, 2026-09-15.

## Context

The user asked for thirty things beyond the plan to make the product special.
Vitals checked each against one rule; Sentinel has six refusals in its product
statement — nothing about a person, no mass broadcast by default, no
unverified report propagates far, no *suspicious person*, no vigilante
coordination, no anonymous accusation — and a seventh from the risk register,
no engagement. Each idea below names the refusal it was checked against; the
ones that failed are listed last, with why.

## Decision

| # | Thing | Checked against | Phase |
|---|---|---|---|
| 1 | **The drill.** Once a month the app offers a rehearsal: the panic action, a payload marked DRILL, delivered to the circle as a drill. A control nobody has pressed is a control nobody will find. | Circle only | 2 |
| 2 | **Journey templates.** *Home from Ikeja* — one tap, destination, usual time, usual circle. The wedge under twenty seconds becomes under five. | No public surface | 3 |
| 3 | **Reachability.** Each circle member's phone confirms it can receive — push, SMS — and the circle screen says *reachable as of Tuesday* or *not confirmed*. A circle that cannot be reached is a list. | Circle only | 1 |
| 4 | **Battery-aware journeys.** A journey longer than the battery will last says so at the start, and offers the server-side escalation as the reason it still works. | Honest failure | 3 |
| 5 | **The official numbers, offline, by state.** Bundled, large, on every alert surface, before Sentinel's own actions; a state picker so they are the right ones. | Not a substitute | 0 |
| 6 | **The alert record, signed.** Every alert as an immutable record — sent, delivered, acknowledged, cancelled, by whom and when — exportable as a PDF signed with the phone's key, for a police report. | No person named but the user's own circle | 4 |
| 7 | **The false-alarm count, shown to the user only.** *You have sent 3 alerts and cancelled 2.* Never to the circle as a score; a mirror, not a rating. | No engagement | 4 |
| 8 | **The distinguishable cancel.** Cancelling an alert takes a gesture a coercer reaching over cannot perform — a held two-finger press and the PIN — and a cancel from the duress PIN sends *cancelled under duress* to the circle silently. | Coercion | 4 |
| 9 | **The decoy.** The duress PIN opens an app that looks idle and alerts in the background. | Coercion | 4 |
| 10 | **Silent mode.** No screen change, no sound, no vibration on trigger; the confirmation is a haptic pattern only the user knows. | Coercion | 2 |
| 11 | **Every trigger path the platform has.** Lock-screen widget, quick tile, power-button gesture, accessibility service on Android; widget, Control Centre control, Action Button, Back Tap on iOS. | Under two seconds | 2 |
| 12 | **The SMS in her language.** The message a circle member receives when the phone has no data is in the language *she* chose when she accepted the circle — English, Naijá, Yorùbá, Hausa, Igbo — because an aunt who reads no English gets a text she cannot act on. | Circle only; drafts say so | 8 |
| 13 | **Watch me home.** A time-bounded live share — twenty minutes, one contact — that ends by itself and says so to both. | Time-bounded; mutual consent | 3 |
| 14 | **The acknowledgement, not the map.** During an alert the circle screen shows who has acknowledged and who has not; it does not show where they are, because that is a muster map with a different name. | No coordination | 2 |
| 15 | **The escalation ladder, drawn.** Circle → the organisation you opted into → the official numbers dialled for you. Never strangers, never a fourth rung. | No mass broadcast | 4 |
| 16 | **The verifiable privacy screen.** Exactly what left the phone, when, to whom, hashed — and a plain sentence: *pseudonymous to other users, attributable to us*. | No anonymous accusation | 4 |
| 17 | **Who can see me right now.** One screen, always current: each circle member, and the condition under which they receive a location — *only during an alert*, *this journey until 22:40*. | Stalking (R5) | 1 |
| 18 | **Instant unilateral removal.** Either side removes the relationship now, with no reason given and no notification of the reason. | Stalking | 1 |
| 19 | **Power-off escalation.** The server escalates a journey at its expected end with no word from the phone; the phone's own alarm is the fast path, the server the guarantee. | Honest failure | 3 |
| 20 | **Mesh relay with nothing readable on the air.** BLE hops carry envelopes; a relaying phone learns that an alert exists and nothing in it. Hop limit three. | Cannot read | 2 |
| 21 | **My safe places.** The user's own list — a police post, a hospital, an aunt's shop — offered as journey destinations and shown on the alert screen with the official numbers. Never shared, never crowd-sourced. | No public surface | 3 |
| 22 | **Gloves and one hand.** A large-control mode for the panic screen; every target 64 dp; no gesture on that screen that needs two hands. | Under two seconds | 2 |
| 23 | **The debrief.** After an alert ends, what was sent, to whom, when acknowledged, what failed — plainly, once, then filed in the record. | Honest | 4 |
| 24 | **The closed list, explained.** The reporting screen (v1.1) shows the ten categories and says, in one sentence each, why there is no eleventh. | No suspicious person | 7 |
| 25 | **Corrections reach the audience.** A downgraded or retracted report is sent to exactly the accounts that saw it, and the correction cannot reach fewer than the claim did. | No unverified report propagates | 5 |
| 26 | **The data-request policy, in the app.** What the server holds, what it cannot read, and what it will do when asked for it — a page in Settings, not a PDF on a website. | Authority misuse (R8) | 4 |
| 27 | **The estate account.** An organisation with a named, accountable administrator, verified by a person, receiving alerts only from users who opted in, with a console that shows acknowledgement and nothing else. | Verified; opt-in | 4 |
| 28 | **Arrival that still asks.** A geofence detects arrival and the app asks *are you home?* — automatic detection never cancels an escalation silently. | Honest | 3 |
| 29 | **Route advisory as places and hours.** Density of expired reports along a route, at 500 m granularity, only above a threshold, phrased as *this road, these hours* and never as a claim about the people who live there. | No claim about a community | 8 |
| 30 | **Plain surfaces and less motion.** Two toggles in Settings, read at act time; the app complete with both on. | The floor | 0 |

### Refused

- **A "nearby responders" list** — who else with Sentinel is within 500 m and
  awake. It is the vigilante muster with a friendly name. Refused by *no
  coordination* and by FR-4.7.
- **A photograph on an incident.** Faces would be screened, but a screen that
  can fail is a lynching that can happen; the affordance is not built.
- **Responder ratings** — *this guard acknowledged fastest*. A leaderboard of
  who arrives first is an engagement signal about people. Refused twice over.
- **A vehicle plate field**, even "for the police". A plate names a person.
- **Nearby alerts on the map.** *Someone is in trouble 300 m from you* is a
  mass broadcast to strangers and an invitation to go there. The personal path
  reaches the circle and the opted-in organisation, and nobody else.
- **A public "I'm safe" board** after unrest. It is a list of who is where.

## Consequences

The thirty are in the roadmap by phase. Each, when built, carries its written
abuse answer in the changelog entry. The refused six stay refused; a request
for one is a request to amend this ADR, and the answer is in this ADR.
