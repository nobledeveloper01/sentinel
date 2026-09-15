import { generateKeyPair, open, decodePosition, fromBase64, toBase64 } from '@sentinel/crypto';
import { alert as A } from '@sentinel/domain';

import { relayAlert, register, type Me } from '../src/relay';
import { memoryTransport } from '../src/transport';

const member = (hash: string, language: 'en' | 'yo') => ({ with: hash, state: 'member' as const, since: 0, language });

function someone(name: string): Me {
  return { id: `id-${name}`, phoneHash: `hash-${name}`, name, keys: generateKeyPair() };
}

describe('the alert leaving the phone', () => {
  test('each member gets an envelope only she can open; the server holds no coordinate; the SMS is in her language and carries none', async () => {
    const server = memoryTransport();
    const me = someone('Ada');
    const bola = someone('Bola');
    const chidi = someone('Chidi');
    await register(server, bola, 1);
    await register(server, chidi, 1);
    const out = await relayAlert(server, me, [member(bola.phoneHash, 'yo'), member(chidi.phoneHash, 'en')], { lat: 6.5244, lon: 3.3792 }, 'a1', 100);
    expect(out.unreachable).toEqual([]);
    const held = server.alerts.get('a1')!;
    expect(held.envelopes).toHaveLength(2);
    expect(server.everythingHeld()).not.toContain('6.5244');
    expect(server.everythingHeld()).not.toContain('3.3792');
    const forBola = held.envelopes.find((e) => e.to === bola.phoneHash)!;
    const opened = open({ from: fromBase64(forBola.from!), nonce: fromBase64(forBola.nonce), ciphertext: fromBase64(forBola.ciphertext) }, bola.keys);
    expect(decodePosition(opened)).toEqual({ lat: 6.5244, lon: 3.3792, atMinutes: 100 });
    expect(() => open({ from: fromBase64(forBola.from!), nonce: fromBase64(forBola.nonce), ciphertext: fromBase64(forBola.ciphertext) }, chidi.keys)).toThrow();
    expect(held.smsFallback.find((s) => s.to === bola.phoneHash)!.text).toContain('ìkìlọ̀');
    expect(held.smsFallback.find((s) => s.to === bola.phoneHash)!.text).not.toContain('6.5');
    // The record: an unknown push and a delivered SMS per member.
    const record: A.AlertRecord = { id: 'a1', events: [{ kind: 'triggered', at: 100, path: 'screen', silent: false, drill: false }, ...out.events] };
    expect(A.delivery(record, 100).state).toBe('delivered');
  });

  test('a server that cannot be reached leaves every member failed, and the record says not delivered', async () => {
    const server = memoryTransport();
    const me = someone('Ada');
    server.refuse(true);
    const out = await relayAlert(server, me, [member('h1', 'en')], null, 'a2', 100);
    expect(out.events).toEqual([{ kind: 'attempt', at: 100, channel: 'push', to: 'h1', outcome: 'failed' }]);
    const record: A.AlertRecord = { id: 'a2', events: [{ kind: 'triggered', at: 100, path: 'screen', silent: false, drill: false }, ...out.events] };
    expect(A.delivery(record, 100).state).toBe('not delivered');
  });

  test('a member the server has no key for is named as unreachable rather than sealed to nobody', async () => {
    const server = memoryTransport();
    const me = someone('Ada');
    const bola = someone('Bola');
    await register(server, bola, 1);
    const out = await relayAlert(server, me, [member(bola.phoneHash, 'en'), member('nobody', 'en')], null, 'a3', 100);
    expect(out.unreachable).toEqual(['nobody']);
    expect(server.alerts.get('a3')!.envelopes).toHaveLength(1);
  });

  test('no position is sealed as no position, not as a coordinate', async () => {
    const server = memoryTransport();
    const me = someone('Ada');
    const bola = someone('Bola');
    await register(server, bola, 1);
    await relayAlert(server, me, [member(bola.phoneHash, 'en')], null, 'a4', 100);
    const e = server.alerts.get('a4')!.envelopes[0]!;
    expect(decodePosition(open({ from: fromBase64(e.from!), nonce: fromBase64(e.nonce), ciphertext: fromBase64(e.ciphertext) }, bola.keys))).toEqual({ lat: null, lon: null, atMinutes: 100 });
    expect(toBase64(me.keys.publicKey)).toBe(e.from);
  });
});
