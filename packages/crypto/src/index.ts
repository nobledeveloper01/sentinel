/**
 * The envelope (ADR-0004): a position sealed for one circle member under a
 * key agreed between the sender's device key and the member's, so the server
 * — which holds only the public halves — cannot open it. X25519 for the
 * agreement, HKDF for the key, XChaCha20-Poly1305 for the seal; all in
 * audited pure TypeScript that runs the same on a phone and in Node, with no
 * native module to trust.
 *
 * The domain knows nothing of this file; the app and the tests do.
 */
import { xchacha20poly1305 } from '@noble/ciphers/chacha';
import { x25519 } from '@noble/curves/ed25519';
import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, bytesToUtf8, randomBytes, utf8ToBytes } from '@noble/hashes/utils';

export interface KeyPair {
  readonly publicKey: Uint8Array;
  readonly secretKey: Uint8Array;
}

export interface Envelope {
  /** The sender's public key, so the member can derive the same key. */
  readonly from: Uint8Array;
  readonly nonce: Uint8Array;
  readonly ciphertext: Uint8Array;
}

export function generateKeyPair(random: (n: number) => Uint8Array = randomBytes): KeyPair {
  const secretKey = random(32);
  return { publicKey: x25519.getPublicKey(secretKey), secretKey };
}

const INFO = utf8ToBytes('sentinel envelope v1');

function agree(mySecret: Uint8Array, theirPublic: Uint8Array): Uint8Array {
  const shared = x25519.getSharedSecret(mySecret, theirPublic);
  return hkdf(sha256, shared, undefined, INFO, 32);
}

/** Seal bytes for one member. A new nonce every time; never reuse a key with a nonce. */
export function seal(plaintext: Uint8Array, sender: KeyPair, memberPublic: Uint8Array, random: (n: number) => Uint8Array = randomBytes): Envelope {
  const key = agree(sender.secretKey, memberPublic);
  const nonce = random(24);
  return { from: sender.publicKey, nonce, ciphertext: xchacha20poly1305(key, nonce).encrypt(plaintext) };
}

/** Open an envelope as the member; throws on the wrong key or a changed byte. */
export function open(envelope: Envelope, member: KeyPair): Uint8Array {
  const key = agree(member.secretKey, envelope.from);
  return xchacha20poly1305(key, envelope.nonce).decrypt(envelope.ciphertext);
}

/** A position as the bytes an envelope carries: two decimals as text, and a minute. */
export function encodePosition(lat: number, lon: number, atMinutes: number): Uint8Array {
  return utf8ToBytes(`${lat.toFixed(5)},${lon.toFixed(5)},${atMinutes}`);
}

export function decodePosition(bytes: Uint8Array): { lat: number; lon: number; atMinutes: number } {
  const [lat, lon, at] = bytesToUtf8(bytes).split(',');
  return { lat: Number(lat), lon: Number(lon), atMinutes: Number(at) };
}

/**
 * A phone number as the circle knows it: E.164 for Nigeria, then SHA-256,
 * hex. The server matches invitations on the hash and never holds a number;
 * a hash of a number is not secret, only unlisted, which ADR-0004 says.
 */
export function phoneHash(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('234')) digits = digits.slice(3);
  else if (digits.startsWith('0')) digits = digits.slice(1);
  const e164 = `+234${digits}`;
  return bytesToHex(sha256(utf8ToBytes(e164)));
}
