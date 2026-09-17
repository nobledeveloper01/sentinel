import { encodeNoPosition, encodePosition, fromBase64, seal, toBase64, type KeyPair } from '@sentinel/crypto';
import { alert as A, circle as C, messages as M } from '@sentinel/domain';

import type { Transport } from './transport';

/**
 * The alert leaves the phone (ADR-0004): one envelope per circle member,
 * sealed to that member's key, and an SMS the server may send in her
 * language with no coordinate in it — the position is a link only she can
 * open. What comes back is the honest record: an attempt per channel per
 * member, as the server reports it, and *failed* for everyone if the server
 * could not be reached at all.
 */
export interface Me {
  readonly id: string;
  readonly phoneHash: string;
  readonly name: string;
  readonly keys: KeyPair;
}

export interface Position {
  readonly lat: number;
  readonly lon: number;
}

export interface Outcome {
  readonly events: ReadonlyArray<A.AlertEvent>;
  /** Members whose key the server does not have: they cannot be sealed to, and the screen says so. */
  readonly unreachable: ReadonlyArray<string>;
}

export async function relayAlert(
  transport: Transport,
  me: Me,
  members: ReadonlyArray<Extract<C.Relationship, { state: 'member' }>>,
  position: Position | null,
  alertId: string,
  atMinutes: number,
  kind: 'alert' | 'drill' | 'escalated' = 'alert',
): Promise<Outcome> {
  const plaintext = position ? encodePosition(position.lat, position.lon, atMinutes) : encodeNoPosition(atMinutes);
  const envelopes: Array<{ to: string; nonce: string; ciphertext: string; from: string }> = [];
  const smsFallback: Array<{ to: string; text: string }> = [];
  const unreachable: string[] = [];
  for (const m of members) {
    const reply = await transport.get(`/keys/${m.with}`);
    const pk = reply.ok ? (reply.body as { publicKey?: string }).publicKey : undefined;
    if (!pk) {
      unreachable.push(m.with);
      continue;
    }
    const env = seal(plaintext, me.keys, fromBase64(pk));
    envelopes.push({ to: m.with, nonce: toBase64(env.nonce), ciphertext: toBase64(env.ciphertext), from: toBase64(env.from) });
    smsFallback.push({ to: m.with, text: M.sms(kind, m.language, { name: me.name, link: `sentinel://a/${alertId}` }) });
  }
  const sent = await transport.post('/alerts', { id: alertId, from: me.id, atMinutes, envelopes, smsFallback });
  if (!sent.ok) {
    return {
      unreachable,
      events: members.map((m) => ({ kind: 'attempt', at: atMinutes, channel: 'push', to: m.with, outcome: 'failed' })),
    };
  }
  const record = await transport.get(`/alerts/${alertId}`);
  const attempts = record.ok ? ((record.body as { attempts?: ReadonlyArray<{ channel: string; toPhoneHash: string; outcome: string; atMinutes: number }> }).attempts ?? []) : [];
  return {
    unreachable,
    events: attempts.map((t) => ({
      kind: 'attempt',
      at: t.atMinutes,
      channel: asChannel(t.channel),
      to: t.toPhoneHash,
      outcome: t.outcome === 'delivered' ? 'delivered' : t.outcome === 'failed' ? 'failed' : 'unknown',
    })),
  };
}

function asChannel(c: string): A.Channel {
  return c === 'serverSms' || c === 'deviceSms' || c === 'mesh' ? c : 'push';
}

/** Register this phone with the server: a phone hash and a public key, never a name. */
export async function register(transport: Transport, me: Me, nowMinutes: number): Promise<boolean> {
  const r = await transport.post('/accounts', { id: me.id, phoneHash: me.phoneHash, publicKey: toBase64(me.keys.publicKey), nowMinutes });
  return r.ok;
}

/** What the server says about my circle: who has accepted, in which language. Nothing is shared with anyone else. */
export async function acceptedMembers(transport: Transport, owner: string): Promise<ReadonlyArray<{ hash: string; language: C.Language }>> {
  const r = await transport.get(`/circle/${owner}`);
  if (!r.ok || !Array.isArray(r.body)) return [];
  return (r.body as Array<{ withPhoneHash: string; accepted: boolean; language: string | null }>)
    .filter((c) => c.accepted && c.language !== null)
    .map((c) => ({ hash: c.withPhoneHash, language: asLanguage(c.language ?? 'en') }));
}

function asLanguage(l: string): C.Language {
  return l === 'pcm' || l === 'yo' || l === 'ha' || l === 'ig' ? l : 'en';
}

/** Who has acknowledged, as the server holds it — polled while an alert runs. */
export async function acknowledgements(transport: Transport, alertId: string): Promise<ReadonlyArray<{ by: string; at: number }>> {
  const r = await transport.get(`/alerts/${alertId}`);
  if (!r.ok) return [];
  const acks = (r.body as { acknowledgements?: ReadonlyArray<{ byPhoneHash: string; atMinutes: number }> }).acknowledgements ?? [];
  return acks.map((a) => ({ by: a.byPhoneHash, at: a.atMinutes }));
}

/** The organisations somebody vouched for (ADR-0009): names of places and the hash a phone seals to. Null when the server cannot be reached. */
export async function organisations(transport: Transport): Promise<ReadonlyArray<{ phoneHash: string; name: string }> | null> {
  const r = await transport.get('/organisations');
  if (!r.ok || !Array.isArray(r.body)) return null;
  return (r.body as Array<{ phoneHash: string; name: string }>).map((o) => ({ phoneHash: o.phoneHash, name: o.name }));
}

/**
 * One position of a watch (ADR-0011), sealed to the one watcher and posted
 * under the journey. No position is an envelope too, so her screen says
 * *no fix* rather than showing nothing and guessing why.
 */
export async function watchPosition(transport: Transport, me: Me, journeyId: string, watcher: string, position: Position | null, atMinutes: number): Promise<boolean> {
  const reply = await transport.get(`/keys/${watcher}`);
  const pk = reply.ok ? (reply.body as { publicKey?: string }).publicKey : undefined;
  if (!pk) return false;
  const plaintext = position ? encodePosition(position.lat, position.lon, atMinutes) : encodeNoPosition(atMinutes);
  const env = seal(plaintext, me.keys, fromBase64(pk));
  const sent = await transport.post(`/journeys/${journeyId}/positions`, { to: watcher, atMinutes, from: toBase64(env.from), nonce: toBase64(env.nonce), ciphertext: toBase64(env.ciphertext) });
  return sent.ok;
}
