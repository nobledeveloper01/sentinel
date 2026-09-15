/**
 * The envelope opens for the member it was sealed for and for nobody else;
 * a changed byte is refused; and a party holding only what the server holds
 * — every public key — cannot open it.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { decodePosition, encodePosition, generateKeyPair, open, phoneHash, seal } from '../src/index.ts';

test('the member opens it; the server, holding only public keys, cannot', () => {
  const phone = generateKeyPair();
  const aunt = generateKeyPair();
  const stranger = generateKeyPair();
  const position = encodePosition(6.5244, 3.3792, 1_000_000);
  const env = seal(position, phone, aunt.publicKey);
  assert.deepEqual(decodePosition(open(env, aunt)), { lat: 6.5244, lon: 3.3792, atMinutes: 1_000_000 });
  // What the server holds: both public keys and the envelope. No secret.
  const serverHolds = { ...env, to: aunt.publicKey };
  assert.throws(() => open(env, { publicKey: serverHolds.to, secretKey: serverHolds.from }));
  assert.throws(() => open(env, { publicKey: serverHolds.from, secretKey: serverHolds.to }));
  assert.throws(() => open(env, stranger));
  const text = new TextDecoder().decode(env.ciphertext);
  assert.ok(!text.includes('6.5244'), 'the coordinate is not in the bytes');
});

test('a changed byte is refused, and two seals of the same bytes differ', () => {
  const phone = generateKeyPair();
  const aunt = generateKeyPair();
  const position = encodePosition(6.5, 3.3, 1);
  const a = seal(position, phone, aunt.publicKey);
  const b = seal(position, phone, aunt.publicKey);
  assert.notDeepEqual(a.nonce, b.nonce);
  assert.notDeepEqual(a.ciphertext, b.ciphertext);
  const tampered = { ...a, ciphertext: Uint8Array.from(a.ciphertext, (x, i) => (i === 3 ? x ^ 1 : x)) };
  assert.throws(() => open(tampered, aunt));
});

test('the key pairs are deterministic from the random source, and different sources differ', () => {
  const fixed = (n: number) => new Uint8Array(n).fill(7);
  assert.deepEqual(generateKeyPair(fixed).publicKey, generateKeyPair(fixed).publicKey);
  assert.notDeepEqual(generateKeyPair(fixed).publicKey, generateKeyPair((n) => new Uint8Array(n).fill(8)).publicKey);
});

test('the same number in any Nigerian spelling hashes the same; a different number does not', () => {
  const a = phoneHash('0803 123 4567');
  assert.equal(phoneHash('+234 803 123 4567'), a);
  assert.equal(phoneHash('2348031234567'), a);
  assert.equal(a.length, 64);
  assert.notEqual(phoneHash('08031234568'), a);
});
