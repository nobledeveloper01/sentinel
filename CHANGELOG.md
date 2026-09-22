# Changelog

Every change that a user or an operator could notice, newest first. The
project is pre-release, so everything is under Unreleased until v1.0.

## [Unreleased]

### Fixed

- **The app now starts.** Every device key begins with random bytes, and the
  JavaScript runtime React Native uses has no `crypto.getRandomValues`, so the
  first render threw before anything was drawn. Randomness now comes from the
  platform's own CSPRNG, with no JavaScript fallback: a product whose keys
  could be predicted is worse than one that will not launch (ADR-0014).
- **Glass surfaces are glass again.** Six colour tokens were written with the
  alpha channel at the front, which React Native reads as the colour — so
  every text field and card rendered as a solid block of accent with the text
  on it unreadable. Both the design gate and the contrast test parsed them the
  same wrong way, so all three agreed on a colour that was never on screen.
  All three now read `#RRGGBBAA`, and the gate refuses the other order.

### Added

- **The ladder has three rungs, and the second is an organisation you chose.**
  The alert screen draws who is told, in order: your circle, the organisation
  you opted into, the official numbers above — and never a fourth. An
  organisation is a member of a second kind: opted into from a list of places
  somebody vouched for, told nothing until it accepts from its own console,
  then sealed to like anyone and removed like anyone. Its console shows the
  opt-ins waiting, the alerts sealed to it and whether it acknowledged, and
  its own patrol lines. *Abuse model:* an alert to a guard house the person
  never chose is an alert to strangers, so the opt-in is theirs and the
  acceptance is mutual; the console never shows a position — it is in an
  envelope on the phone that holds the key — and a console is a screen in a
  room anyone can walk past.
- **Places the phone keeps and never sends.** *Journeys I take often* — kept
  from a journey with one press, started next time with one — and *places I
  would go*, listed under the numbers during an alert and offered as
  destinations. Both on the phone only, counted on the privacy card, lost by
  a reinstall on purpose. *Abuse model:* the places a person goes and the
  places they run to are the pattern of a life; the server holds nothing it
  can read about where anyone is, and this is not the exception. Nothing is
  ranked or suggested; a safe place is where you said you would go, not a
  claim that it is safe.
- **Watch me home.** Twenty minutes, one person, your position as you go
  sealed to her alone, an end it keeps itself that both phones are told of.
  No escalation — for that, start a journey, and the screen says so. A phone
  with no fix seals *no position* rather than nothing, so her screen says
  *no fix* rather than guessing. *Abuse model:* two watchers is a group, and a
  group with a live position is the map this product refuses; the second
  name is dropped by the rule and refused by the server.
- **Advisory as a place and hours.** *Near you* now carries one sentence when
  it can — *around here, past reports have mostly been between 21:00 and
  02:00; about this area, not about anyone in it* — from expired reports
  pooled across categories, only in a cell with six reports from four
  accounts in ninety days, and otherwise nothing at all. The same thresholds
  run on the server, held to the phone by a fixture of 120 generated cells.
  *Abuse model:* a sparse map of a city is a map of its poorer streets read
  as a claim about the people who live there; below the thresholds the
  screen shows nothing, not *no data*, and the sentence never carries a
  count or a category.
- **When we are asked for your data**, a page in Settings: what the server
  holds, in the lines the privacy card derives from state; what it cannot
  read, with the test that proves it named; what happens when somebody with
  authority asks. In the words of the code, with no promise about people.

- **The organisation console.** An administrator with `SENTINEL_ADMIN_TOKEN`
  vouches for an organisation — an estate, a company, a station, never a
  person — and a *named* reviewer decides the one category about a person,
  which is not distributed before. A decision without a name is refused; the
  console without the token refuses everybody. *Abuse model:* the appeal is
  the only surface that can name a person; it is behind an accountable
  administrator and a reviewer's name, and a modified client cannot post it.
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
