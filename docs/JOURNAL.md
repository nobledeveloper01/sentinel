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
