import { act, fireEvent, render, screen } from '@testing-library/react-native';

import App from '../src/App';
import { t } from '../src/phrases';
import { begin, enterPin, evening, fingers, tap } from '../test-support/support';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: unknown }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

async function setPins(real: string, duress: string) {
  await tap(t.settings);
  fireEvent.changeText(screen.getByTestId('pin1'), real);
  fireEvent.changeText(screen.getByTestId('pin2'), duress);
  await tap(t.savePins);
  await tap(t.back);
}

describe('the cancel a coercer cannot perform by reaching over', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('one finger, or two fingers lifted early, cancels nothing; two fingers for two seconds does', async () => {
    const { server, services } = evening();
    render(<App services={services} />);
    begin();
    await tap(t.panic);
    const pad = screen.getByTestId('holdToCancel');
    fireEvent(pad, 'touchStart', fingers(1));
    act(() => jest.advanceTimersByTime(3000));
    expect(screen.getByTestId('delivery')).toBeTruthy();
    fireEvent(pad, 'touchStart', fingers(2));
    act(() => jest.advanceTimersByTime(1000));
    fireEvent(pad, 'touchEnd', fingers(0));
    act(() => jest.advanceTimersByTime(3000));
    expect(screen.getByTestId('delivery')).toBeTruthy();
    fireEvent(pad, 'touchStart', fingers(2));
    await act(async () => {
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
    });
    expect(screen.getByRole('button', { name: t.panic })).toBeTruthy();
    expect([...server.cancels.values()]).toEqual([false]);
  });

  test('with PINs set, the hold leads to the pad: the real PIN cancels, the duress PIN cancels on the screen and says so to the server, a wrong PIN says so', async () => {
    const { server, services } = evening();
    render(<App services={services} />);
    begin();
    await setPins('2468', '1357');
    await tap(t.panic);
    fireEvent(screen.getByTestId('holdToCancel'), 'touchStart', fingers(2));
    await act(async () => {
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
    });
    enterPin('9999');
    expect(screen.getByTestId('pinWrong')).toBeTruthy();
    expect(screen.queryByRole('button', { name: t.panic })).toBeNull();
    enterPin('1357');
    expect(screen.getByRole('button', { name: t.panic })).toBeTruthy();
    expect([...server.cancels.values()]).toEqual([true]);
    // And the real PIN, the next time.
    await tap(t.panic);
    fireEvent(screen.getByTestId('holdToCancel'), 'touchStart', fingers(2));
    await act(async () => {
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
    });
    enterPin('2468');
    expect([...server.cancels.values()]).toEqual([true, false]);
  });

  test('two PINs that are the same are refused', async () => {
    const { services } = evening();
    render(<App services={services} />);
    begin();
    await tap(t.settings);
    fireEvent.changeText(screen.getByTestId('pin1'), '1111');
    fireEvent.changeText(screen.getByTestId('pin2'), '1111');
    expect((screen.getByRole('button', { name: t.savePins }).props as { accessibilityState: { disabled: boolean } }).accessibilityState.disabled).toBe(true);
  });
});

describe('silent mode and the decoy', () => {
  test('a held panic changes nothing on the screen; the alert still reaches the server; the real PIN reveals it', async () => {
    const { server, services } = evening();
    render(<App services={services} />);
    begin();
    await setPins('2468', '1357');
    await act(async () => {
      fireEvent(screen.getByRole('button', { name: t.panic }), 'longPress');
      await Promise.resolve();
    });
    expect(screen.getByRole('button', { name: t.panic })).toBeTruthy();
    expect(screen.queryByTestId('delivery')).toBeNull();
    expect(server.alerts.size).toBe(1);
    await tap(t.settings);
    enterPin('2468');
    expect(screen.getByTestId('delivery')).toBeTruthy();
  });

  test('the duress PIN opens the idle home, the alert continues, and the server is told', async () => {
    const { server, services } = evening();
    render(<App services={services} />);
    begin();
    await setPins('2468', '1357');
    await act(async () => {
      fireEvent(screen.getByRole('button', { name: t.panic }), 'longPress');
      await Promise.resolve();
    });
    await tap(t.settings);
    await act(async () => {
      enterPin('1357');
      await Promise.resolve();
    });
    expect(screen.getByRole('button', { name: t.panic })).toBeTruthy();
    expect(screen.queryByTestId('delivery')).toBeNull();
    expect([...server.openedUnderDuress]).toEqual([...server.alerts.keys()]);
    expect(server.cancels.size).toBe(0);
  });
});
