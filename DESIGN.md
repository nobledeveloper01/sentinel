# Design

Glass over a night mesh, with a solid floor. Read ADR-0005 for the reasons;
this file is the rules and the numbers, and `apps/mobile/src/design/tokens.ts`
is the same numbers as code. `make design-check` fails when the two disagree.

## The floor

A four-year-old Android phone with 2 GB of RAM and a 720p screen, held in one
hand, at night, possibly by someone who is frightened. Everything below is
drawn where the phone can afford it and replaced by a solid surface where it
cannot, and the app is complete either way. `Plain surfaces` and `Less motion`
in Settings, and the platform's Reduce Motion, are read at act time.

## Calm

- **No red.** Not on the panic control, not on an alert. Urgency is size and
  position, never colour.
- **Nothing counts.** No badge, no unread number, no "near you".
- **Nothing pulses.** Motion says a state changed; it never asks for attention.
- **The official numbers come first** on every alert surface, larger than
  Sentinel's own actions.
- **Plain words.** *Your circle has been told.* Never *ALERT SENT!* Never an
  exclamation mark. Never a word from the list `make copy-check` holds.

## Palette

| Token | Light | Dark | Used for |
|---|---|---|---|
| `washStart` | `#E8F1F6` | `#0A1A2B` | The mesh's first stop |
| `washEnd` | `#EEF0F8` | `#0F1F2E` | The mesh's second stop |
| `washTeal` | `#DCEEF2` | `#0C2B33` | The mesh's teal bloom |
| `glassLow` | `#FFFFFF8C` | `#FFFFFF0F` | A card in a list |
| `glassMid` | `#FFFFFFB3` | `#FFFFFF1A` | A control |
| `glassHigh` | `#FFFFFFD9` | `#FFFFFF29` | A sheet, the lock, the decoy |
| `solidLow` | `#F6F8FB` | `#132131` | Twin of `glassLow` |
| `solidMid` | `#FFFFFF` | `#1A2B3D` | Twin of `glassMid` |
| `solidHigh` | `#FFFFFF` | `#22364B` | Twin of `glassHigh` |
| `textPrimary` | `#0B1826` | `#EEF3F8` | Words |
| `textSecondary` | `#4B5B6E` | `#AEBBCA` | Quieter words, 4.5:1 on every fill |
| `textOnAccent` | `#FFFFFF` | `#06121E` | Words on the gradient |
| `accent` | `#0F5E78` | `#5CC3D6` | The gradient's start, the one control |
| `accentEnd` | `#3450A8` | `#8FA3F0` | The gradient's end |
| `attention` | `#8A5A00` | `#F0B650` | A fact that needs a look: *no service*, *not yet acknowledged* |
| `fine` | `#1E6B45` | `#7ADDA6` | Acknowledged, arrived, reachable |
| `hairline` | `#C6D0DB` | `#2B3A4B` | Where depth alone is too subtle |
| `code` | `#000000` | `#000000` | QR modules on white, for a camera |

There is no `danger` token. Adding one is a change to ADR-0005.

## Type

Inter, bundled. `display` 32/38 semibold · `headline` 22/28 semibold ·
`title` 17/22 semibold · `body` 16/24 · `secondary` 14/20 · `small` 12/16.
Body is never below 16 on a phone. Everything scales to 200% without
truncation; the panic screen is audited at 200% first.

## Targets

48 dp standard · 56 dp on the alert screen · 64 dp for the panic action and
in the large-control mode. The panic action is the largest element on its
screen and under the thumb of a one-handed grip on a 5" phone.

## Motion

150–250 ms, ease-out in, ease-in out; nothing longer than 400 ms. Every
duration has a zero twin. The splash sweeps the gradient through the mark once
and cuts under Reduce Motion.

## The mark

A ring, open at the top, with a single point above the gap — a beacon, not a
shield and not an eye. Drawn by `scripts/mark.py` into the launcher icons and
the launch screens, in the gradient on the mesh; `make mark-check` fails when
an icon is not what the script draws.
