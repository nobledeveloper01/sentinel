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
