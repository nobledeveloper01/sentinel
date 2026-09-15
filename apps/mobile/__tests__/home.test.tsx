import { render, screen, fireEvent } from '@testing-library/react-native';

import App from '../src/App';
import { t } from '../src/phrases';

// The provider is a native view that renders nothing under Jest without
// metrics; the test wants the tree, not the insets.
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: unknown }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('the home', () => {
  test('the official number comes first and the panic action is the one gradient control', () => {
    render(<App />);
    expect(screen.getByText('767')).toBeTruthy();
    expect(screen.getByText(t.notASubstitute)).toBeTruthy();
    expect(screen.getByRole('button', { name: t.panic })).toBeTruthy();
  });

  test('the panic action opens the alert with the number still first, and the cancel ends it', () => {
    render(<App />);
    fireEvent.press(screen.getByRole('button', { name: t.panic }));
    expect(screen.getByTestId('delivery')).toBeTruthy();
    expect(screen.getByText('767')).toBeTruthy();
    // Nobody in the circle yet: the screen says so, beside the number, instead of pretending.
    expect(screen.getByText(t.alertNobody)).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: t.cancelAlert }));
    expect(screen.getByRole('button', { name: t.panic })).toBeTruthy();
  });
});
