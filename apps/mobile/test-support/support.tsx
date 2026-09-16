import { act, fireEvent, screen } from '@testing-library/react-native';


import { t } from '../src/phrases';
import { memoryStore } from '../src/keystore';
import type { Services } from '../src/services';
import { memoryTransport } from '../src/transport';

/** An evening on the phone, against a server in memory that a test can read. */
export function evening(position: { lat: number; lon: number } | null = null) {
  const server = memoryTransport();
  const shared: string[] = [];
  let minute = 1000;
  const services: Services = {
    transport: server,
    position: () => Promise.resolve(position),
    secrets: memoryStore(),
    now: () => minute,
    share: (text) => {
      shared.push(text);
      return Promise.resolve();
    },
  };
  /** A minute passes, and the app's own clock notices. Needs fake timers. */
  const tick = async () => {
    minute += 1;
    await act(async () => {
      jest.advanceTimersByTime(15_000);
      await Promise.resolve();
    });
  };
  return { server, services, shared, tick };
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

/** Through the welcome: let the keys load, read the rules, then back out of the settings it opens onto. */
export async function begin() {
  await act(async () => {
    await Promise.resolve();
  });
  fireEvent.press(screen.getByRole('button', { name: t.begin }));
  fireEvent.press(screen.getByRole('button', { name: t.back }));
}

/**
 * Fake timers for the hold and the minute, with the loop React and the
 * testing library flush through — setImmediate, nextTick, queueMicrotask —
 * left real. Faking those hangs `act` on the CI runner's Node, which the
 * machine this was written on did not show.
 */
export function fakeClock() {
  jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick', 'queueMicrotask'] });
}
