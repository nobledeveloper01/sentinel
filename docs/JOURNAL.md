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
