import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { generateKeyPair, phoneHash } from '@sentinel/crypto';

import App from '../src/App';
import { t } from '../src/phrases';
import { register } from '../src/relay';
import { begin, evening, fakeClock, holdToCancel, tap } from '../test-support/support';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: unknown }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));


async function saveMe(name = 'Ada') {
  fireEvent.press(screen.getByRole('button', { name: t.settings }));
  fireEvent.changeText(screen.getByTestId('myPhone'), '0801 111 2222');
  fireEvent.changeText(screen.getByTestId('myName'), name);
  await tap(t.save);
}

describe('the alert path', () => {
  test('a panic with nobody in the circle sends no envelope, and the screen puts the number first with the honest line', async () => {
    const { server, services } = evening();
    render(<App services={services} />);
    await begin();
    await tap(t.panic);
    expect(screen.getByText('767')).toBeTruthy();
    expect(screen.getByText(t.alertNobody)).toBeTruthy();
    await waitFor(() => expect(server.alerts.size).toBe(1));
    expect(server.alerts.values().next().value!.envelopes).toHaveLength(0);
  });

  test('registering sends a hash and a public key and never the name or the number', async () => {
    const { server, services } = evening();
    render(<App services={services} />);
    await begin();
    await saveMe('Ada Okafor');
    await waitFor(() => expect(server.keys.size).toBe(1));
    expect(server.everythingHeld()).not.toContain('Ada');
    expect(server.everythingHeld()).not.toContain('0801');
    expect(server.everythingHeld()).not.toContain('2222');
  });

  test('an invitation shares nothing until the other phone accepts; then the alert is sealed to her and the server never sees the coordinate', async () => {
    fakeClock();
    const { server, services, tick } = evening({ lat: 6.5244, lon: 3.3792 });
    const bola = { id: 'bola', phoneHash: phoneHash('0803 000 0001'), name: 'Bola', keys: generateKeyPair() };
    await register(server, bola, 1);
    render(<App services={services} />);
    await begin();
    await saveMe();
    const myId = [...server.keys.keys()].length === 2 ? phoneHash('0801 111 2222').slice(0, 16) : '';
    expect(myId).not.toBe('');
    // Invite Bola, and somebody whose phone has not joined.
    fireEvent.press(screen.getByRole('button', { name: t.circle }));
    fireEvent.changeText(screen.getByTestId('phone'), '0803 000 0001');
    fireEvent.press(screen.getByRole('button', { name: t.invite }));
    fireEvent.changeText(screen.getByTestId('phone'), '0803 000 0002');
    fireEvent.press(screen.getByRole('button', { name: t.invite }));
    fireEvent.press(screen.getByRole('button', { name: t.back }));
    // Not accepted yet: a panic now seals to nobody.
    await tap(t.panic);
    await waitFor(() => expect(server.alerts.size).toBe(1));
    expect([...server.alerts.values()][0]!.envelopes).toHaveLength(0);
    await holdToCancel();
    // Bola accepts on her phone, in Yorùbá; the stranger never does.
    server.accept(myId, bola.phoneHash, 'yo');
    server.accept(myId, phoneHash('0803 000 0002'), 'en'); // accepted, but her phone has no key
    await tap(t.circle);
    await waitFor(() => expect(screen.getAllByText(t.onlyDuringAlert)).toHaveLength(2));
    fireEvent.press(screen.getByRole('button', { name: t.back }));
    await tap(t.panic);
    await waitFor(() => expect(server.alerts.size).toBe(2));
    const held = [...server.alerts.values()][1]!;
    expect(held.envelopes).toHaveLength(1);
    expect(held.envelopes[0]!.to).toBe(bola.phoneHash);
    expect(held.smsFallback[0]!.text).toContain('Ada');
    expect(held.smsFallback[0]!.text).toContain('ìkìlọ̀');
    expect(server.everythingHeld()).not.toContain('6.5244');
    expect(server.everythingHeld()).not.toContain('3.3792');
    // The screen: Bola told, the other named as unreachable — never shown as told.
    await waitFor(() => expect(screen.getByText(`0803 000 0002 · ${t.notSealed}`)).toBeTruthy());
    expect(screen.getByText(`0803 000 0001 · ${t.notYetAcknowledged}`)).toBeTruthy();
    expect(screen.getByTestId('delivery').props.children).toBe(t.alertSentTo);
    // Bola acknowledges on her phone; a minute later this one knows.
    server.ack(held.id, bola.phoneHash, 1001);
    await tick();
    await waitFor(() => expect(screen.getByText(`0803 000 0001 · ${t.acknowledgedBy}`)).toBeTruthy());
    jest.useRealTimers();
  });

  test('the settings switches turn glass off and motion off at act time', async () => {
    const { services } = evening();
    render(<App services={services} />);
    await begin();
    fireEvent.press(screen.getByRole('button', { name: t.settings }));
    fireEvent(screen.getByTestId('pref-glass'), 'valueChange', true);
    fireEvent(screen.getByTestId('pref-reduced'), 'valueChange', true);
    expect(screen.getByTestId('pref-glass').props.value).toBe(true);
    expect(screen.getByTestId('pref-reduced').props.value).toBe(true);
  });
});
