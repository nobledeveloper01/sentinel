# Changelog

Every change that a user or an operator could notice, newest first. The
project is pre-release, so everything is under Unreleased until v1.0.

## [Unreleased]

### Added

- **The community layer, built last as planned and not shipped.** *Near you*:
  every unexpired report whose reach covers where the phone is, as a category
  at a distance with its stage in words — no count, no ranking, no map. *Report
  something*: the closed list as tiles, the place is where the phone is, a
  sentence about the event checked on every keystroke with the explainer
  saying why and offering the event instead; the one category about a person
  is not on the screen. *I saw this too*, *That is not right* with four fixed
  reasons, *Take back my report* — and a withdrawal reaches everyone it was
  shown to. On the server, reach is computed per report from what is known
  now; the location trace is a history, so neighbours at one event are two
  voices and accounts that always move together are one. *Abuse model:* the
  500 m ceiling on one account's word is asserted on the running server; the
  screen runs on the phone and again on the server; a modified client that
  skips either gains nothing; there is nothing to count, rank or share.
- **The device keys survive a launch.** `SentinelSecrets`: the Keychain on iOS
  at *after first unlock, this device only* — a phone that reboots in a
  pocket during an alert still seals the next position; a key never travels
  in a backup to a phone somebody else holds — and EncryptedSharedPreferences
  under a Keystore master key on Android. A platform without the module, or
  a store that refuses, gets keys for this launch, and the privacy card says
  which of the two it is. *Abuse model:* a key in a plain file is a key on a
  jailbroken phone; a key that quietly fell back to a file would look exactly
  like this being done.
- **Who has acknowledged**, asked of the server every tick while an alert
  runs, each new one an event on the record — so *not yet* on the screen
  becomes *acknowledged* when her phone says so, and never before.
- **The first launch is the rules.** Four sentences — the number first and
  largest, *your circle and nobody else*, how to send silently and how to
  end an alert, *never about a person* — and one action, which opens onto
  the number, because the circle cannot be told without one. Nothing to skip.
- **The screen runs on the server too.** The same rules in C#, held to the
  TypeScript by a fixture of 135 texts — the corpus and texts built from
  parts — with the verdict and the reasons each was given; broken on purpose
  and watched to fail. *Abuse model:* a modified client that skips the
  on-device screen gains nothing, because the server refuses the same text
  for the same reasons.
- **What Sentinel knows about you**, on Settings, derived from the state
  itself — the number as a code, the name and who it goes to, how many in
  the circle, how many records, two keys, no location — so the screen cannot
  drift from what is held.
- **The record, signed.** The last alert record shared as text: every event
  as a line, the phone's Ed25519 key, a signature; verified by the app or by
  `scripts/verify-record.py` with nothing but Python. *Abuse model:* a record
  that can be edited after the night is a record nobody can rely on in a
  dispute; one that verifies is evidence of what the phone did, and only
  that.
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
