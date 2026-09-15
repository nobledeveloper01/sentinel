import { generateKeyPair, type KeyPair } from '@sentinel/crypto';

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
  readonly now: () => number;
}

export const SERVER_URL = 'http://127.0.0.1:5000';

export function defaultServices(): Services {
  return {
    transport: fetchTransport(SERVER_URL),
    // No fix until the platform's location comes with Phase 2's device work; the envelope says so honestly.
    position: () => Promise.resolve(null),
    keys: generateKeyPair(),
    now: () => Math.floor(Date.now() / 60_000),
  };
}
