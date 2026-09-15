import { generateKeyPair, signingKeyPair, type KeyPair } from '@sentinel/crypto';

import { Share } from 'react-native';

import { fetchTransport, type Transport } from './transport';
import type { Position } from './relay';

/**
 * What the app needs from outside itself, handed in at the root so a test
 * can hand in a server in memory and a position it chose. The keys are
 * generated per launch here until the Keychain module holds them across
 * launches — which is a hardware gate, and the roadmap says so.
 */
export interface Services {
  readonly transport: Transport;
  readonly position: () => Promise<Position | null>;
  readonly keys: KeyPair;
  /** Ed25519, for the record's export. */
  readonly signing: KeyPair;
  readonly now: () => number;
  readonly share: (text: string) => Promise<void>;
}

export const SERVER_URL = 'http://127.0.0.1:5000';

export function defaultServices(): Services {
  return {
    transport: fetchTransport(SERVER_URL),
    // No fix until the platform's location comes with Phase 2's device work; the envelope says so honestly.
    position: () => Promise.resolve(null),
    keys: generateKeyPair(),
    signing: signingKeyPair(),
    now: () => Math.floor(Date.now() / 60_000),
    share: async (text) => {
      await Share.share({ message: text });
    },
  };
}
