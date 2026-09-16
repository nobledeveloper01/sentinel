import type { SecretStore } from './keystore';
import NativeSecrets from './native/NativeSentinelSecrets';

import { Share } from 'react-native';

import { fetchTransport, type Transport } from './transport';
import type { Position } from './relay';

/**
 * What the app needs from outside itself, handed in at the root so a test
 * can hand in a server in memory, a position it chose and a store in memory.
 * The keys come from the platform's secure store through `keystore.ts`; a
 * platform without one gets keys for this launch, and the privacy card says
 * so.
 */
export interface Services {
  readonly transport: Transport;
  readonly position: () => Promise<Position | null>;
  /** The platform's secure store for the device keys, or null where there is none. */
  readonly secrets: SecretStore | null;
  readonly now: () => number;
  readonly share: (text: string) => Promise<void>;
}

export const SERVER_URL = 'http://127.0.0.1:5000';

export function defaultServices(): Services {
  return {
    transport: fetchTransport(SERVER_URL),
    // No fix until the platform's location comes with Phase 2's device work; the envelope says so honestly.
    position: () => Promise.resolve(null),
    secrets: NativeSecrets,
    now: () => Math.floor(Date.now() / 60_000),
    share: async (text) => {
      await Share.share({ message: text });
    },
  };
}
