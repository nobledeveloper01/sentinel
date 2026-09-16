import { bytesToHex, hexToBytes } from '@noble/hashes/utils';

import { generateKeyPair, signingKeyPair, type KeyPair } from '@sentinel/crypto';

/** The three methods the platform store gives; a test hands in a Map. */
export interface SecretStore {
  setSecret(key: string, value: string): Promise<boolean>;
  getSecret(key: string): Promise<string | null>;
  removeSecret(key: string): Promise<boolean>;
}

export interface DeviceKeys {
  readonly keys: KeyPair;
  readonly signing: KeyPair;
  /** Where they live: the platform's secure store, or this launch only. The privacy card says which. */
  readonly held: 'store' | 'launch';
}

/** Keys for this launch only, when there is no store or it refused. */
export function launchKeys(): DeviceKeys {
  return { keys: generateKeyPair(), signing: signingKeyPair(), held: 'launch' };
}

/**
 * The keys from the store, or new ones written to it. A store that refuses
 * the write leaves the keys as launch keys and says so, rather than keeping
 * them somewhere else.
 */
export async function loadOrMakeKeys(store: SecretStore | null): Promise<DeviceKeys> {
  if (!store) return launchKeys();
  const x = await store.getSecret('x25519');
  const e = await store.getSecret('ed25519');
  if (x && e) {
    try {
      const xs = hexToBytes(x);
      const es = hexToBytes(e);
      return { keys: { secretKey: xs, publicKey: generateKeyPair(() => xs).publicKey }, signing: { secretKey: es, publicKey: signingKeyPair(() => es).publicKey }, held: 'store' };
    } catch {
      // A corrupt value is treated as no value; new keys replace it below.
    }
  }
  const fresh = launchKeys();
  const ok = (await store.setSecret('x25519', bytesToHex(fresh.keys.secretKey))) && (await store.setSecret('ed25519', bytesToHex(fresh.signing.secretKey)));
  return ok ? { ...fresh, held: 'store' } : fresh;
}

/** A store in memory, for tests and for a launch whose platform has none. */
export function memoryStore(): SecretStore & { readonly map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    setSecret: (k, v) => {
      map.set(k, v);
      return Promise.resolve(true);
    },
    getSecret: (k) => Promise.resolve(map.get(k) ?? null),
    removeSecret: (k) => Promise.resolve(map.delete(k)),
  };
}
