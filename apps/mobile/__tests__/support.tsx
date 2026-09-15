import { act, fireEvent, screen } from '@testing-library/react-native';

import { generateKeyPair } from '@sentinel/crypto';

import type { Services } from '../src/services';
import { memoryTransport } from '../src/transport';

/** An evening on the phone, against a server in memory that a test can read. */
export function evening(position: { lat: number; lon: number } | null = null) {
  const server = memoryTransport();
  const services: Services = { transport: server, position: () => Promise.resolve(position), keys: generateKeyPair(), now: () => 1000 };
  return { server, services };
}

/** A press whose side effects reach the server: let the promises settle inside act. */
export async function tap(name: string) {
  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name }));
    await Promise.resolve();
  });
}

export const fingers = (n: number) => ({ nativeEvent: { touches: Array.from({ length: n }, () => ({})) } });

/** Two fingers for two seconds on the cancel pad. Needs fake timers. */
export async function holdToCancel() {
  fireEvent(screen.getByTestId('holdToCancel'), 'touchStart', fingers(2));
  await act(async () => {
    jest.advanceTimersByTime(2000);
    await Promise.resolve();
  });
}

export function enterPin(digits: string) {
  for (const d of digits) fireEvent.press(screen.getByTestId(`key-${d}`));
  fireEvent.press(screen.getByTestId('key-✓'));
}
