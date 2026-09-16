import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import App from '../src/App';
import { t } from '../src/phrases';
import { begin, evening, tap } from '../test-support/support';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: unknown }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const HERE = { lat: 6.5244, lon: 3.3792 };

async function saveMe() {
  await tap(t.settings);
  fireEvent.changeText(screen.getByTestId('myPhone'), '0801 111 2222');
  fireEvent.changeText(screen.getByTestId('myName'), 'Ada');
  await tap(t.save);
}

describe('the public path', () => {
  test('with no fix the feed says so and nothing can be reported', async () => {
    const { services } = evening(null);
    render(<App services={services} />);
    await begin();
    await tap(t.nearby);
    await waitFor(() => expect(screen.getByText(t.nearbyNoPosition)).toBeTruthy());
    expect((screen.getByRole('button', { name: t.reportSomething }).props as { accessibilityState: { disabled: boolean } }).accessibilityState.disabled).toBe(true);
  });

  test('a name in the text is explained and cannot be sent; the event alone is; the report appears within reach as one voice; taking it back tells everyone shown', async () => {
    const { server, services } = evening(HERE);
    render(<App services={services} />);
    await begin();
    await saveMe();
    await tap(t.nearby);
    await waitFor(() => expect(screen.getByText(t.nearbyEmpty)).toBeTruthy());
    await tap(t.reportSomething);
    fireEvent.press(screen.getByTestId('cat-fire'));
    fireEvent.changeText(screen.getByTestId('reportText'), 'Fire in the shop, it was Mr Adebayo');
    expect(screen.getByTestId('explainer')).toBeTruthy();
    expect(screen.getByText(t.reasonName)).toBeTruthy();
    expect((screen.getByRole('button', { name: t.send }).props as { accessibilityState: { disabled: boolean } }).accessibilityState.disabled).toBe(true);
    fireEvent.changeText(screen.getByTestId('reportText'), 'Fire in the shop on the market road');
    expect(screen.queryByTestId('explainer')).toBeNull();
    await tap(t.send);
    await waitFor(() => expect(screen.getByText(t.category.fire!)).toBeTruthy());
    expect(screen.getByText(`${t.aboutMetres(0)} · ${t.stageReported}`)).toBeTruthy();
    expect(screen.getByText('Fire in the shop on the market road')).toBeTruthy();
    // The server holds no name, no number, and the category is on the list.
    expect(server.everythingHeld()).not.toContain('Adebayo');
    const held = [...server.reports.values()][0]!;
    expect(held.category).toBe('fire');
    // Somebody else was shown it; the reporter takes it back; that somebody is owed a correction.
    held.shown.add('someone-else');
    await tap(t.withdrawMine);
    await waitFor(() => expect(screen.getByText(t.nearbyEmpty)).toBeTruthy());
    expect((await server.get('/reports/corrections?account=someone-else')).body).toEqual([held.id]);
  });

  test('a server that cannot be reached says so on the report screen and sends nothing', async () => {
    const { server, services } = evening(HERE);
    render(<App services={services} />);
    await begin();
    await saveMe();
    await tap(t.nearby);
    await tap(t.reportSomething);
    fireEvent.press(screen.getByTestId('cat-flooding'));
    server.refuse(true);
    await tap(t.send);
    await waitFor(() => expect(screen.getByTestId('refused').props.children).toBe(t.refusedUnreachable));
    expect(server.reports.size).toBe(0);
  });

  test('the category about a person is not on the screen', async () => {
    const { services } = evening(HERE);
    render(<App services={services} />);
    await begin();
    await tap(t.nearby);
    await tap(t.reportSomething);
    expect(screen.queryByTestId('cat-missing_person_appeal')).toBeNull();
    expect(screen.getAllByTestId(/^cat-/)).toHaveLength(10);
  });
});
