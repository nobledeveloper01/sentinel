import { fireEvent, render, screen } from '@testing-library/react-native';

import App from '../src/App';
import { t } from '../src/phrases';
import { begin } from '../test-support/support';

/** Whether a button is disabled, read the way a screen reader reads it. */
const disabled = (name: string) =>
  (screen.getByRole('button', { name }).props as { accessibilityState: { disabled: boolean } }).accessibilityState.disabled;

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: unknown }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('the circle', () => {
  test('is empty and says so; an invitation is listed as not yet accepted and shares nothing', async () => {
    render(<App />);
    await begin();
    fireEvent.press(screen.getByRole('button', { name: t.circle }));
    expect(screen.getByText(t.circleEmpty)).toBeTruthy();
    expect(disabled(t.invite)).toBe(true);
    fireEvent.changeText(screen.getByTestId('phone'), '0803 123 4567');
    fireEvent.press(screen.getByRole('button', { name: t.invite }));
    expect(screen.getByText(`0803 123 4567 · ${t.invited}`)).toBeTruthy();
    // Nothing shared: the "who can see me" card still says nobody.
    expect(screen.getByText(t.circleEmpty)).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: t.remove }));
    expect(screen.queryByText(`0803 123 4567 · ${t.invited}`)).toBeNull();
  });
});

describe('the journey', () => {
  test('shows the plan before it starts, refuses to start with nowhere to go, and sits on the home once under way', async () => {
    render(<App />);
    await begin();
    fireEvent.press(screen.getByRole('button', { name: t.journeyStart }));
    expect(screen.getByTestId('plan').props.children).toBe(t.planLine(45, 60));
    expect(disabled(t.journeyGo)).toBe(true);
    fireEvent.changeText(screen.getByTestId('where'), 'Yaba');
    fireEvent.changeText(screen.getByTestId('minutes'), '20');
    expect(screen.getByTestId('plan').props.children).toBe(t.planLine(20, 35));
    // Nobody in the circle yet: the journey cannot name anyone, so it cannot start.
    expect(disabled(t.journeyGo)).toBe(true);
    expect(screen.getByText(t.circleEmpty)).toBeTruthy();
  });
});
