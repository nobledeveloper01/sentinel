# ADR-0013 — The data-request policy is a page in the app

## Status

Accepted, 2026-09-17.

## Context

The risk register names authority misuse: a request for what the server
holds, from somebody with the power to insist. ADR-0006 #26 asked for the
policy to be in the app rather than a PDF on a website, because the person
who needs it is holding the phone, not browsing.

The obvious page is a paragraph of assurance. Assurance is not a policy.

## Decision

**The page says three things, each derived from the code that makes it
true.** What the server holds: the lines `knows()` already prints for the
privacy card, plus what the organisation console holds — acknowledgements,
patrols — because those are the server's too. What it cannot read: an
alert's position, a watch's positions, because they are envelopes sealed
to keys the server does not have, with the test that proves it named. What
happens when asked: the server hands over what it holds and nothing it
cannot read, because there is nothing else to hand over; the person is told
unless the law of the request forbids it; a request is logged as a fact in
the changelog of the service, not hidden.

**The page carries no legal promise.** It says what the code does, in the
words of the code; a promise about what people will do is a lawyer's, and
the reading by one is R7.

## Consequences

A page in Settings, its sentences in `phrases.ts` where the copy gate reads
them. When the server learns to hold something new, the page has a line to
add, and the privacy card's derivation makes that hard to forget.
