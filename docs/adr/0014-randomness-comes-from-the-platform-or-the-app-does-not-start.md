# ADR-0014 — Randomness comes from the platform, or the app does not start

## Status

Accepted, 2026-09-22.

## Context

Every secret in Sentinel begins as random bytes: the X25519 device key, the
Ed25519 signing key, and the nonce on every sealed envelope. `@sentinel/crypto`
gets them from `@noble/hashes`' `randomBytes`, which calls
`crypto.getRandomValues`.

**Hermes does not implement `crypto.getRandomValues`.** React Native's JS
runtime has no Web Crypto. So the first time the app asked for a key it threw:

> Render Error — crypto.getRandomValues must be defined

Found the first time the app was run on a simulator. Until then nothing had
caught it: the domain tests pass because Node has Web Crypto, and every
function in `@sentinel/crypto` takes an injectable `random` that the tests
supply. The one call site that does not inject — `keystore.ts`, which mints the
device's own keys at launch — is the one that only runs on a device.

## Decision

**`react-native-get-random-values` is imported as the first line of
`index.js`,** before the app or anything it pulls in.

It is a shim over the platform's own CSPRNG — `SecRandomCopyBytes` on iOS,
`SecureRandom` on Android — and nothing else. It generates no entropy of its
own, which is the property that matters: the randomness behind a Sentinel key
is the randomness the operating system uses for its own keys, and this
repository adds no opinion to it.

The import is first because it is a side effect on `global`, and a module
loaded above it that reached for randomness at module scope would still throw.
That ordering is load-bearing rather than stylistic, and the comment in
`index.js` says so.

## What is refused

**A JavaScript fallback.** Several polyfills seed from `Math.random` when no
platform source is available. `Math.random` is not a CSPRNG in any engine and
is seeded predictably in some. A Sentinel envelope sealed with a key from a
predictable source is an envelope the server could open, and the property this
product is built on — *the server relays what it cannot read* — would be false
while every test still passed.

So there is no fallback. On a platform with no CSPRNG the app throws on
startup, exactly as it did before this ADR. **A security product that will not
start is a bug; one that starts with weak keys is a breach**, and the failure
mode has to be the first.

## Consequences

The simulator run that found this is now the thing that would find it again:
the app cannot reach its first screen without a working randomness source,
which makes this the cheapest possible regression test and one no CI box
without a device can replace.

The domain tests keep injecting their own `random`, and should: a test that
depended on the platform source would be non-deterministic. The gap this
leaves — the one call site that does not inject — is a *device* gap, and it is
listed as one.
