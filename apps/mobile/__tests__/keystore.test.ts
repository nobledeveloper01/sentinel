import { bytesToHex } from '@noble/hashes/utils';

import { loadOrMakeKeys, memoryStore } from '../src/keystore';

describe('the device keys', () => {
  test('are made once and come back the same on the next launch', async () => {
    const store = memoryStore();
    const first = await loadOrMakeKeys(store);
    expect(first.held).toBe('store');
    expect(store.map.size).toBe(2);
    const second = await loadOrMakeKeys(store);
    expect(bytesToHex(second.keys.publicKey)).toBe(bytesToHex(first.keys.publicKey));
    expect(bytesToHex(second.signing.publicKey)).toBe(bytesToHex(first.signing.publicKey));
  });

  test('with no store, or a store that refuses, they are launch keys and say so', async () => {
    expect((await loadOrMakeKeys(null)).held).toBe('launch');
    const refusing = { ...memoryStore(), setSecret: () => Promise.resolve(false) };
    const k = await loadOrMakeKeys(refusing);
    expect(k.held).toBe('launch');
  });

  test('a corrupt value is replaced rather than trusted', async () => {
    const store = memoryStore();
    store.map.set('x25519', 'not hex');
    store.map.set('ed25519', 'zz');
    const k = await loadOrMakeKeys(store);
    expect(k.held).toBe('store');
    expect(store.map.get('x25519')).not.toBe('not hex');
  });
});
