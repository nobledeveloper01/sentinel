# Changelog

Every change that a user or an operator could notice, newest first. The
project is pre-release, so everything is under Unreleased until v1.0.

## [Unreleased]

### Added

- **The envelope.** `packages/crypto`: X25519, HKDF and XChaCha20-Poly1305
  from `@noble`, sealing a position for one circle member; a test hands a
  party everything the server holds and it cannot open it. A phone number
  becomes a hash before it becomes anything else. *Abuse model:* the server
  is the party most worth compromising, and it holds nothing that opens;
  the hash of a number is unlisted, not secret, and the ADR says so.
- **The circle screen.** Invite by number, listed as *not yet accepted* and
  sharing nothing until it is; remove either way, now, no reason. *Who can
  see where I am, right now* is the one card that is always current — empty
  says so. *Abuse model:* a member added without consent could watch; nothing
  is shared before the invitee accepts on their own phone.
- **The journey screen.** Where, by when, who to tell; the plan — *in N
  minutes the phone asks, after M the people above are told where you were*
  — shown before it starts, with the line that the server does it even if
  the phone dies. A journey nobody confirms becomes an alert to the people it
  named, by the journey path, with the same honest delivery state.
  *Abuse model:* a journey could be used to watch someone; it names only
  circle members and ends at the escalate minute.
- **The alert with nobody to tell** says so beside the official number,
  instead of a list with nothing in it.
- **The foundation.** The monorepo, the pure domain under a boundary lint
  proved to fire, the .NET server, the calm glass design system with its solid
  floor, the mark and the launch screens, and the gates. The eight ADRs that
  settle what the product refuses before it has a single feature.
