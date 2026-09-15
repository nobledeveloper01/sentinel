# Sentinel

Community safety coordination and emergency alerting for Nigeria. A React
Native app for Android and iOS from one codebase, a pure-TypeScript domain the
app and the server are both held to, and a .NET replica that holds only what
it cannot read. Read `docs/00-PRODUCT-STATEMENT.md` for why this exists — and
read its first paragraph twice — then `docs/ROADMAP.md` for the phase and its
exit gate, and `docs/adr/` for what is already decided. `PHASE` holds the
current phase number.

The one sentence that decides most arguments:

> **Alerting your own circle is a right; alarming strangers is a privilege.**

Sentinel is the only product in this portfolio where a design error causes
direct physical harm. A false alarm can start a mob; a "suspicious person"
report can get somebody killed; a rumour carried by a well-built app travels
faster than one on WhatsApp. Every feature answers, in writing, *how could
this be used to hurt someone, and what stops it?* — before it is built.

## The things that are never traded

1. **Nothing about a person.** No names, no photographs of people, no
   descriptions, no plates. Incidents are events at places. There is no
   *suspicious person* category and there never will be; free text is screened
   and the screen fails closed. `make copy-check` fails the build on the words
   that would cross the line. ADR-0003.
2. **Reach is earned.** A report is visible to 500 m. It widens only with
   independent corroboration, reporter history and time, computed on the server
   from a pure function the domain owns. **No single account, and no set of
   accounts sharing an independence signal, can distribute an unverified report
   beyond 500 m** — property-tested over generated worlds, and a release
   blocker. ADR-0002.
3. **The personal path is fast and unmetered** because it reaches people who
   already trust you. The two paths share nothing but the design system;
   separate code, separate gates. ADR-0007.
4. **The server cannot read a location.** Alert and journey locations leave the
   phone as envelopes sealed to the circle's keys. The server relays, times and
   meters; it never opens. A test proves it. ADR-0004.
5. **No engagement, ever.** No counts, no badges, no ranking, no notification
   about anything outside the radius you chose, no analytics SDK at all. A
   safety app optimised for engagement manufactures fear. ADR-0005.
6. **Never a substitute for emergency services.** The official numbers are on
   every alert surface, large, before Sentinel's own actions.
7. **Coercion is a use case.** Silent mode, a duress PIN that opens a decoy,
   and a cancel that a coercer cannot perform by reaching over. ADR-0008.
8. **The domain imports nothing.** Not React, not a clock, not randomness;
   `make boundary` proves the rule still fires.

## Working on this repo

- `make ci` is the gate. `make gates` runs the blocking ones alone.
- **Prove a guard fires before trusting it.** Break it on purpose, watch it
  fail, put it back. This has found real defects in every project in this
  portfolio.
- ADRs live in `docs/adr/`. **Write one for any non-obvious decision, before
  the code that depends on it** — and for this product, every feature's ADR or
  changelog entry carries its abuse-model answer.
- **`docs/JOURNAL.md` every working session.** What we did, and what surprised us.
- The domain tests with `pnpm test` in seconds and needs no device. Run it
  first. The server tests with `dotnet test` and need no database.
- **Never commit a record.** A fixture is synthetic; a real alert is somebody's
  worst night.

## Definition of done

- [ ] **Abuse-model review for this feature, in writing** — not a formality
- [ ] Domain unit tested, ≥ 95%; reach property tests passing if reach was touched
- [ ] No new path permits unmetered distribution; no new surface accepts
      person-identifying content; no mobilisation affordance; no engagement signal
- [ ] Works offline; every alert path has an honest failure state with the
      official numbers on it
- [ ] Panic latency re-measured on hardware if the alert path was touched
- [ ] Light and dark authored; every pair contrast-asserted; glass and solid
- [ ] 200% text; screen-reader labelled; **the panic action operable without sight**
- [ ] Reduce Motion honoured
- [ ] Copy reviewed against the calm-language rules in `DESIGN.md`
- [ ] ADR written for any non-obvious decision; `CHANGELOG.md` updated
- [ ] `make ci` green
