# Journal

What we did each session, and what surprised us. Newest last.

## 2026-09-15 — The foundation

### What we did

Started last, by decision: the product statement says why on its first page
and the portfolio's memory says it in one line — physical-safety stakes. The
user asked for the same shape as Vitals: thirty more things, a 2027 design with
glass, gradient and motion, the mark and the launch screens, a .NET backend,
phases, and to run on auto.

The scaffold is Backhaul's, which is green on CI and has already met every
toolchain trap this stack has (pnpm hoisting, the Android platform that is not
published, CocoaPods' locale). Its domain and screens were removed; its shell,
its boundary lint and its gates were kept. The Xcode licence on this Mac
expired mid-afternoon, so every `git` call goes through the Command Line
Tools' own binary until the user accepts it.

The documents came first, and the eight ADRs settle what the product refuses
before it has a feature: nothing about a person, reach is earned, the personal
path is a right and the public one a privilege, the server holds only what it
cannot read, calm over a night mesh, thirty things checked against the
refusals, coercion as a use case.

### What surprised us

**The thirty things had to be checked against six refusals, not one rule.**
Vitals had one line — nothing clinical is computed. Sentinel has six, and the
one that bit most often was the one that looks harmless: *no feature that
identifies who else is nearby and available*. Half the "community" ideas that
come naturally are exactly that feature with a different name.

**A name at the start of a sentence walked through the screen.** The first
rule wanted a character before the capitalised pair, and *Chukwuemeka Okafor
took the generator* is where a name most often is. Any pair now, with the
second word excused only when it is the word for a place.

**The copy gate's first catch was TypeScript.** `${official[0]!.label}` has an
exclamation mark in it. The rule reads what follows the mark now.

**One of 146 contrast pairs failed**: dark green on the highest glass over the
teal wash. An eye would not have found it; the test did, in a second.

**The Xcode licence lapsed mid-build and every `python3` is Xcode's.** The
scripts exited 69 with a sentence about a licence, and — worse — the edits
piped through a heredoc silently did not happen, because the shim printed
its sentence and returned before reading stdin. Three files were found
unedited an hour later. The Command Line Tools carry their own `python3`,
`git` and `make`, and the session's PATH points there until the licence is
accepted. The habit for next time: check the exit code of an edit, not just
the absence of an error.

**Grid's README is the shape.** The user asked for it after the first cut,
which was a summary. Twelve sections: the problem, how it works, the app,
each layer, quick start, correctness notes, the pipeline, data handling,
development, layout, status, licensing. The screenshots wait on the licence.

## 2026-09-15, later — the first CI run, and the circle

The first run on GitHub was cancelled by the second push a minute behind it;
the second failed on `mark-check`: fifteen Android icons "not what the mark
draws". The iOS ones matched. The runner's Pillow and this machine's produce
different bytes for the same small circle — a resampler that moved by one
level of grey. The gate compared bytes; it now compares pixels within a
tolerance of eight, still fails on a painted pixel (tried), and CI pins the
Pillow version too. **A byte-exact gate on a rendered image is a gate on the
renderer's version**, which is the lesson from Snag's fixture again, from the
other side.

Then the envelope, the phone hash, the reducer, and the two screens. The
reducer is the thing worth having: an evening — invite, accept, start a
journey, never confirm, the alert, the cancel — runs through it in a test
with no screen, and the screens only dispatch. Four things it settled by
being written: a second panic during an alert does not start a second
record; a journey nobody confirms becomes an alert *by the journey path* so
the debrief knows; removing a member removes the name; the alert screen with
nobody in the circle says so beside the number, instead of a list with
nothing in it — found because the home test lost its demo circle.

`TextEncoder` is not a thing TypeScript will promise a React Native target
has. `@noble/hashes/utils` has `utf8ToBytes` and `bytesToHex`, which is what
the envelope uses now on both sides.

## 2026-09-15, evening — the alert leaves the phone

The relay: keys fetched by hash, one envelope per accepted member, the SMS
in her language with a link and never a coordinate, and the server's own
record of attempts read back into the alert record, so *told* on the screen
means the server said so. A server in memory that the app talks to in tests
the way it will talk to the .NET one, with `everythingHeld()` so a test can
search for the coordinate, the name and the number and find none.

**Two alerts in one minute had one id.** The reducer named an alert by its
minute; the test that panicked, cancelled and panicked again inside a fixed
clock found the second alert overwriting the first on the server and the
relay effect never re-running, because nothing about the id had changed. The
id carries the count of past alerts now. A clock that does not move is a good
way to find what was keyed on it.

**The lint wanted the fakes to be honest about being synchronous.** An
`async` method with no `await` is a promise for nothing; the memory server's
`get` and `post` are plain functions wrapped in `Promise.resolve`, and a test
that presses a button whose side effect reaches the server awaits a tick
inside `act`, which is what the effect needed anyway.

The envelope row carries the sender's public key now, because the member
cannot derive the shared key without it, and the server's `/keys/{hash}`
hands out public halves — the thing the server is allowed to know.

## 2026-09-15, night — the cancel a coercer cannot perform

ADR-0008 on the screen: the two-finger hold, the PIN pad, the duress PIN
that cancels on the screen and tells the server the truth, silent mode on a
long press, and the lock that the settings button becomes while an alert is
hidden — the real PIN reveals it, the duress PIN opens the idle home and
records *opened under duress*.

**The `hidden: a.silent` line never landed.** The patch that added it to the
panic case targeted text an earlier patch had already changed, and the
replace found nothing and said nothing — the same failure Vitals' journal
records twice. The test that long-pressed and expected the home found the
alert screen instead. Read the file after a patch, every time.

**Presses batched into one render did not see each other.** The PIN pad
kept its digits in state and read them from the closure, so four presses
inside one `act` each saw an empty string and the last one won: one dot,
and a PIN of one digit. The digits live in a ref now and the state only
draws the dots. The earlier test had passed only because its presses were
outside `act`, one render each — a test that passes for the wrong reason.

## 2026-09-15, night — what it knows, signed

The privacy card is derived from state — `knows()` returns facts, the screen
only has the words — which is Grid's consent-copy rule again: a sentence
about what is held that is generated from what is held cannot lie. The
export copies Vitals' shape to the byte so the verifier is the same script;
the crypto test runs Python on a good file, a flipped byte and the wrong key,
so the second verifier is exercised on every run and not trusted from the
day it agreed.

**A helper in `__tests__` is a test suite with no tests**, and Jest fails the
run for it while still printing *172 passed*. My grep on the `Tests:` line
read green over a failing `make ci` and the commit went out that way; the
next push carries the fix. The helper lives in `test-support/` now, and the
lesson is the one Tender wrote down: read the exit code, not the line you
were looking for.

## 2026-09-15, night — the screen, twice

The screen's rules in C#, and a fixture of 135 texts the TypeScript wrote
with its verdicts. Parity held on the first run; the clothing rule was
commented out to see the test fail, and it did, on the first text. The
regexes crossed unchanged except one thing worth writing down: `IgnoreCase`
is set on every pattern but the capitalised pair, because the capitals are
the point of that one, and a port that set it everywhere would have made
every two words a name.

The fixture generator found something too: *Two Fulani herdsmen* is blocked
for the identifier and *for a name*, because "Two Fulani" is a capitalised
pair. Right verdict, one reason too many. Left as it is — a second reason
never hurts a block — and noted here in case it ever decides an appeal.

The welcome screen last: four rules, the number, one button, and every test
that renders the app now reads the rules first, which is a small honest cost
of a screen nobody can skip.

**The copy gate read a link as a comment.** `sentinel://a/${alertId}` has
`//` in it; the gate stripped from there to the end of the line, the
template literal lost its closing backtick, every quote below paired with
the wrong partner, and the gate reported an exclamation mark in a "string"
that was forty lines of code. The strip wants whitespace or a line start
before the slashes now. Sixty-two strings checked before; eighty-eight
after — the gate had been reading less of the file than it said.

**Fake timers hung `act` on the runner and not here.** Every test that
faked the clock for the two-second hold timed out at five seconds on
GitHub's Node 22, and its `afterEach` timed out behind it — 173 green on
this machine's Node 26, forty minutes of nothing on the runner, cancelled by
hand. Faking `setImmediate`, `nextTick` and `queueMicrotask` fakes the loop
the testing library flushes `act` through; the runner's Node scheduled it
differently and never came back. `fakeClock()` leaves those three real and
fakes only what the hold and the minute need. The lesson Noosphere wrote
down applies here too: local green means little; say which Node.

## 2026-09-16, morning — the keys in the store

The Keychain module from Keys, renamed and with the two things this product
needs said in its comment: *after first unlock* because an alert may span a
reboot in a pocket, *this device only* because a backup is somebody else's
phone. Android gets what Keys never had — EncryptedSharedPreferences under a
Keystore master key — and CI compiles both. `keystore.ts` loads or makes,
treats a corrupt value as none, and reports where the keys live; the privacy
card reads that rather than assuming, so a phone with no store says *for
this launch only* instead of lying. What no test here can say is whether the
keys are still there after a real reboot; that stays on the handset day.

## 2026-09-16 — the community layer, last

Everything else was built, so the thing the plan said to build last was
next: the feed, the report, corroborate, dispute, withdraw, and the server
computing reach per report. Six tests on the running server, and the first
run of the second one failed for a reason worth the journal.

**The location trace was a point, and it made every witness the reporter.**
The independence rule collapses two accounts with the same trace. The first
implementation set the trace to the cell an account last reported from — so
two strangers who corroborated one fire from the same street became one
voice, and nothing could ever pass 500 m. The trace is a *history* now: the
sorted set of cells over the last twenty events, and a fingerprint only after
five; until then it is unique to the account. The test that proves it also
found the semantics: reach is computed from what is known *now*, so once two
accounts are known to move together, every report they ever touched drops
back to 500 m — the earlier ones included. That is right, and it was not what
the first assertion said.

**The copy gate read the domain's reason strings in the app.** `'a
description of a person'` in a `switch` tripped the rule written for exactly
those words. The domain hands the app a key now — `looks`, `group`, `plate`
— and the words live in phrases where the gate can read them as copy. An
`unknown:{id}` device and lineage for an account that sent none, because an
empty string equal to another empty string would have made every phone one
phone.

**An organisation's own word is `confirmed`.** The console test expected an
approved appeal to reach as `reported`; the reach rules say one verified
organisation makes `confirmed`, and 5 km. The test was wrong and the engine
right, which is the direction to be wrong in — the rule has 800 worlds
behind it and the test had me.

## 2026-09-17 — the code that was left

**Did.** Went through ADR-0006's thirty and the roadmap for what was code
and not a handset, a person or a city, and found five: the escalation ladder
with an organisation on its second rung, journey templates and safe places,
watch me home, route advisory with patrol logging, and the data-request page.
Five ADRs first, then the domain, the server with a parity fixture for
advisory, the phone, and a console for the organisation. 24 domain, 22
server, 186 app and 3 console tests; every gate green.

### What surprised us

**The organisation was a reviewer, not a rung.** Since the console was built
it could vouch and decide the one category about a person; nothing sent it
an alert, because nothing sends an alert to anyone but a member. The shape
that costs nothing is the right one: an organisation *is* a member, of a
second kind, and everything a member gets — the envelope, the acknowledgement,
the removal — it gets by the same code. The console shows acknowledgement and
nothing else, and the test asserts the wire has no `ciphertext` in it.

**A sweep in one test escalated another test's journey.** The API tests share
one in-memory store, and the watch test sweeps a hundred minutes ahead to
prove a watch is left alone; the journey test two files over expected its
escalation at minute 75 and found 288,100. The factory takes a store name
now. Isolation that was never needed until a test reached into the future.

**Reports posted backwards in time count as today's.** The rate limit asks
whether a previous report is within a day of *now*, and a report an hour in
the future is; the advisory test posted eight reports newest first and the
third was refused for *too many*. Oldest first, as a real week arrives.

**Everything but `verified` was fine with the copy gate, and it was right.**
*Verified organisations* tripped the rule that bans the word in copy — it is
a badge, and a badge is a claim. They are *vouched for*, which is what the
administrator did.

**Two buttons called Start.** The journey screen's *Start* and a template's
*Start* shared a name, and the test found both. *Start this one* now; the
screen-reader user would have found it first.

### Still open

- The hardware and people gates as before: R1–R4, R7, and a city for R6.
  Nothing on the roadmap is code any more.
- The organisation's own phone is a phone: it opens envelopes in the same app
  a person does. There is no organisation face; the console is the desk and
  the app is the guard's pocket, and whether that holds up is a question for
  the reading, not for this keyboard.
- Trigger paths (ADR-0006 #11) and the BLE mesh (#20) are native code that
  cannot be seen to work without handsets, and were not written blind.

## 2026-09-22 — The first simulator run

### What we did

Built and ran the app on a simulator for the first time, fixed the three
defects that run exposed, strengthened the two guards that should have caught
one of them, and captured nine screenshots.

### What surprised us

**The app had never started.** Every device key begins with random bytes,
`@noble/*` asks `crypto.getRandomValues` for them, and Hermes does not have
it — so the first render threw before anything was drawn. The domain tests
never saw it, because Node has Web Crypto and because every crypto function
takes an injectable `random` the tests supply. The one call site that does not
inject is `keystore.ts`, which mints the device's own keys at launch, and that
only runs on a device. Fixed with the platform CSPRNG and **no fallback**
(ADR-0014): a security product that will not start is a bug; one that starts
with predictable keys is a breach, and the failure has to be the first.

**Three files agreed on a colour that was never on the screen.** The six
`glass*` tokens were written `#AARRGGBB` — the Android order. React Native
reads `#RRGGBBAA`, so `glassMid: '#B3FFFFFF'`, meant as white at 70%,
rendered as opaque cyan: every text field in Settings was a solid block of
accent with the placeholder unreadable on top of it.

The second half is the part worth keeping. `design-check` compared DESIGN.md
against tokens.ts and they matched — both were wrong the same way. And
`contrast.test.ts` took the alpha off the front and the colour off the back,
so it computed the contrast of white at 70%, asserted it passed, and was right
about a colour the app never drew. **Two guards, one blind spot, and 186 green
tests over a surface nobody would ever see.** All three read `#RRGGBBAA` now;
`design-check` gained two rules — an eight-digit token ending in `FF` is
refused, and a `glass*` token whose RGB is not white is refused — and was
broken on purpose with the original value and watched to fail on both before
being put back.

**A third one a person saw and I did not.** Every gradient button painted
about 86% of the way across. I had already captured five screenshots with the
defect in them and not registered it, because the label stays centred on the
*full* width — so the control looks deliberate until you notice its right edge
does not line up with the glass button directly beneath it. The gradient is an
SVG pinned by `absoluteFill` that also carried `width="100%" height="100%"`;
absoluteFill pins left and right, the props set an explicit width, and
react-native-svg resolved the pair to a box narrower than the button.

The lesson is not about SVG. Reading a screen is a different act from testing
one, and neither replaces the other — I had run the tests and looked at the
pictures, and it still took somebody else saying *the buttons are not
complete*.

**A build fix that was not ours to leave.** CocoaPods writes the pods project's
deployment floor from the oldest any pod declares — 12.4 — and Xcode 27 refuses
anything below 15, so the generated project would not compile at all. The
`post_install` hook raises every pod to the app's own floor rather than to
Xcode's minimum: two numbers that must agree are better kept as one.

### Still open

- Nine screens captured. The alert in progress and the duress decoy want a run
  of their own.
- Nothing here is a hardware result. Panic latency, the trigger paths and the
  abuse model still want a handset, a stopwatch and an outside reader.
