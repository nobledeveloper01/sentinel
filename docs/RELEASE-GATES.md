# Release gates

The gates that need something this repository cannot supply: a phone in a
hand, a person, a city. Each names what it needs and which phase it clears.
The software gates live in `make ci`.

## Blocks v1.0

| # | Gate | Needs | Phase |
|---|---|---|---|
| R1 | **Under two seconds from physical input on a locked device**, every trigger path, both platforms. A panic control that is slow is a panic control that is not pressed. | Real Android and iOS handsets, a stopwatch | Phase 2 |
| R2 | **The delivery matrix passes.** Data/no-data × service/no-service × platform: at least one channel delivers, or the user is told plainly and shown the official numbers. | Handsets, a SIM with no data, a room with no service | Phase 2 |
| R3 | **Escalation fires with the phone switched off** at the expected arrival time — the server's timer, not the device's. | A handset and a circle member's phone | Phase 3 |
| R4 | **Mesh relay on mixed-platform hardware**: hop limits, out-of-range behaviour, no plaintext on the air. | Three handsets, at least one of each platform | Phase 2 |
| R5 | **iOS Critical Alerts entitlement** applied for in Phase 0. Denied is a documented state, not a blocker: server SMS is the guarantee. | Apple | Phase 0 |
| R7 | **An outside reading of the abuse model** — someone who has seen the WhatsApp failure mode, reading every surface for a way to hurt someone. | A person | Phase 4 |

## Blocks v1.1

| # | Gate | Needs | Phase |
|---|---|---|---|
| R6 | **Thirty days in one city with zero harm incidents**, with a staffed human-review queue. Missed: investigate, remediate, restart the clock. | A city, reviewers, a month | Phase 7 |
| R8 | **Zero platform-amplified violence, continuously.** One incident suspends the community layer and v1.0 ships alone. | Vigilance | Always |

## Cleared

None yet.
