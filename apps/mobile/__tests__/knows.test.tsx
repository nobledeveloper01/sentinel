import { fireEvent, render, screen } from '@testing-library/react-native';

import { verifyExport } from '@sentinel/crypto';

import App from '../src/App';
import { t } from '../src/phrases';
import { evening, holdToCancel, tap } from '../test-support/support';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: unknown }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('what Sentinel knows about you', () => {
  test('is derived from what the app holds, and changes as it does', async () => {
    const { services } = evening();
    render(<App services={services} />);
    await tap(t.settings);
    expect(screen.getByText(t.knowsNoNumber)).toBeTruthy();
    expect(screen.getByText(t.knowsCircle(0))).toBeTruthy();
    expect(screen.getByText(t.knowsAlerts(0))).toBeTruthy();
    expect(screen.getByText(t.knowsNothingElse)).toBeTruthy();
    fireEvent.changeText(screen.getByTestId('myPhone'), '0801 111 2222');
    fireEvent.changeText(screen.getByTestId('myName'), 'Ada');
    await tap(t.save);
    await tap(t.settings);
    expect(screen.getByText(t.knowsName('Ada'))).toBeTruthy();
    expect(screen.queryByText(t.knowsNoNumber)).toBeNull();
  });

  test('the last alert record is shared signed, and verifies', async () => {
    jest.useFakeTimers();
    const { services, shared } = evening();
    render(<App services={services} />);
    await tap(t.settings);
    expect((screen.getByRole('button', { name: t.shareRecord }).props as { accessibilityState: { disabled: boolean } }).accessibilityState.disabled).toBe(true);
    await tap(t.back);
    await tap(t.panic);
    await holdToCancel();
    await tap(t.settings);
    expect(screen.getByText(t.knowsAlerts(1))).toBeTruthy();
    await tap(t.shareRecord);
    expect(shared).toHaveLength(1);
    const v = verifyExport(shared[0]!);
    expect(v.ok).toBe(true);
    expect(shared[0]).toContain('"kind":"cancelled"');
    expect(shared[0]).not.toContain('6.5');
    jest.useRealTimers();
  });
});
