# Changelog

Every change that a user or an operator could notice, newest first. The
project is pre-release, so everything is under Unreleased until v1.0.

## [Unreleased]

### Added

- **Coercion is a use case (ADR-0008), on the screen.** Cancelling takes two
  fingers held for two seconds — one finger, or two lifted early, cancels
  nothing — and then the PIN. The duress PIN at that step cancels on the
  screen and tells the server *under duress*; a wrong PIN says so and nothing
  else. Holding the alert button sends silently: nothing on the screen
  changes, the alert reaches the server, and the settings button asks for
  the PIN before showing it — the real PIN reveals the alert, the duress PIN
  opens the idle home, records *opened under duress* and tells the server.
  Two PINs in Settings, four to six digits, refused if they are the same,
  hashed before anything else sees them. With no PIN set the hold alone
  cancels, which is still not a reach-over. *Abuse model:* a coercer holding
  the phone sees an idle app or a normal cancel; the circle is told the
  truth either way.
- **The alert leaves the phone.** One envelope per accepted circle member,
  sealed to her key fetched from the server by phone hash; an SMS the server
  may send in her language with the position as a link and never a
  coordinate; and the attempts the server reports become the record's own
  events, so the screen's *told / reaching / could not be reached* is what
  happened and not what was hoped. A server that cannot be reached leaves
  every member *failed*. A member whose phone has not joined is named on the
  alert screen as unreachable, never shown as told. No position is sealed as
  *no position*, the same length as a position, so the server cannot tell.
  *Abuse model:* the server holds envelopes, public keys and hashes; a test
  searches everything it was handed for the coordinate, the name and the
  number, and finds none.
- **Settings.** Your number — hashed before it leaves the phone — and the
  name your circle knows you by; plain surfaces, less motion and large
  controls, each read at act time.
- **The circle asks the server who has accepted**, because acceptance happens
  on the other phone. An invitation shares nothing until then, in the app and
  on the server both.
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
