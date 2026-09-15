import { fireEvent, render, screen } from '@testing-library/react-native';

import App from '../src/App';
import { t } from '../src/phrases';
import { evening } from '../test-support/support';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: unknown }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

test('the first launch is the rules, the number first, one action, nothing to skip — and it opens onto the number', () => {
  const { services } = evening();
  render(<App services={services} />);
  expect(screen.getByText(t.welcome)).toBeTruthy();
  expect(screen.getByText('767')).toBeTruthy();
  for (const r of [t.rule1, t.rule2, t.rule3, t.rule4]) expect(screen.getByText(r)).toBeTruthy();
  expect(screen.queryByRole('button', { name: t.panic })).toBeNull();
  expect(screen.getAllByRole('button')).toHaveLength(1);
  fireEvent.press(screen.getByRole('button', { name: t.begin }));
  expect(screen.getByTestId('myPhone')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: t.back }));
  expect(screen.getByRole('button', { name: t.panic })).toBeTruthy();
});
