import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { decodePosition, fromBase64, generateKeyPair, open, phoneHash } from '@sentinel/crypto';

import App from '../src/App';
import { t } from '../src/phrases';
import { register } from '../src/relay';
import { begin, evening, fakeClock, holdToCancel, tap } from '../test-support/support';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: unknown }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

/**
 * The five decisions of 2026-09-17, on the phone: the second rung
 * (ADR-0009), places that never leave (ADR-0010), the watch with one
 * watcher (ADR-0011), advisory that says nothing until it can say hours
 * (ADR-0012), and the data-request page (ADR-0013).
 */
async function saveMe(name = 'Ada') {
  fireEvent.press(screen.getByRole('button', { name: t.settings }));
  fireEvent.changeText(screen.getByTestId('myPhone'), '0801 111 2222');
  fireEvent.changeText(screen.getByTestId('myName'), name);
  await tap(t.save);
}

describe('the second rung', () => {
  test('an organisation is opted into from a list of places, told nothing until it accepts, then sealed to and drawn on the ladder', async () => {
    fakeClock();
    const { server, services } = evening({ lat: 6.5244, lon: 3.3792 });
    const estate = { id: 'estate', phoneHash: phoneHash('0700 000 0001'), name: 'Ikeja Estate Security', keys: generateKeyPair() };
    await register(server, estate, 1);
    server.organisations.push({ phoneHash: estate.phoneHash, name: estate.name });
    render(<App services={services} />);
    await begin();
    await saveMe();
    const myId = phoneHash('0801 111 2222').slice(0, 16);

    await tap(t.settings);
    await tap(t.organisations);
    await waitFor(() => expect(screen.getByText('Ikeja Estate Security')).toBeTruthy());
    await tap(t.optIn);
    expect(screen.getByText(t.optedIn)).toBeTruthy();
    // An invitation, on the server like any member's, and no name of a person on it.
    expect(server.circles).toContainEqual({ owner: myId, withPhoneHash: estate.phoneHash, accepted: false, language: null });
    await tap(t.back);
    await tap(t.back);
    // Not accepted: the ladder's second rung is empty and the alert seals to nobody.
    await tap(t.panic);
    expect(screen.getByText(`2 · ${t.ladderNoOrganisation}`)).toBeTruthy();
    await waitFor(() => expect(server.alerts.size).toBe(1));
    expect([...server.alerts.values()][0]!.envelopes).toHaveLength(0);
    await holdToCancel();
    // The organisation accepts from its console; opening the circle learns it.
    server.accept(myId, estate.phoneHash, 'en');
    await tap(t.circle);
    await waitFor(() => expect(screen.getAllByText(t.onlyDuringAlert)).toHaveLength(1));
    await tap(t.back);
    await tap(t.panic);
    await waitFor(() => expect(server.alerts.size).toBe(2));
    const held = [...server.alerts.values()][1]!;
    expect(held.envelopes.map((e) => e.to)).toEqual([estate.phoneHash]);
    // Sealed to its key, like a member; the server saw no coordinate.
    const opened = decodePosition(open({ from: fromBase64(held.envelopes[0]!.from!), nonce: fromBase64(held.envelopes[0]!.nonce), ciphertext: fromBase64(held.envelopes[0]!.ciphertext) }, estate.keys));
    expect(opened.lat).toBeCloseTo(6.52, 2);
    expect(server.everythingHeld()).not.toContain('6.5244');
    expect(screen.getByText(`2 · ${t.ladderOrganisation}: Ikeja Estate Security`)).toBeTruthy();
    expect(screen.getByText(`3 · ${t.ladderNumbers}`)).toBeTruthy();
    jest.useRealTimers();
  });
});

describe('places', () => {
  test('a kept journey is one tap next time, a safe place is a destination and sits under the numbers during an alert, and none of it reaches the server', async () => {
    fakeClock();
    const { server, services } = evening();
    const bola = { id: 'bola', phoneHash: phoneHash('0803 000 0001'), name: 'Bola', keys: generateKeyPair() };
    await register(server, bola, 1);
    render(<App services={services} />);
    await begin();
    await saveMe();
    const myId = phoneHash('0801 111 2222').slice(0, 16);
    await tap(t.circle);
    fireEvent.changeText(screen.getByTestId('phone'), '0803 000 0001');
    await tap(t.invite);
    server.accept(myId, bola.phoneHash, 'yo');
    await tap(t.back);
    await tap(t.circle);
    await waitFor(() => expect(screen.getAllByText(t.onlyDuringAlert)).toHaveLength(1));
    await tap(t.back);

    // Keep a journey.
    await tap(t.journeyStart);
    fireEvent.changeText(screen.getByTestId('where'), 'Home from Ikeja');
    fireEvent.changeText(screen.getByTestId('minutes'), '40');
    await tap(t.keepAsTemplate);
    await tap(t.back);
    // A safe place, in Settings.
    await tap(t.settings);
    await tap(t.places);
    expect(screen.getByText('Home from Ikeja')).toBeTruthy();
    expect(screen.getByText(`${t.templateLine(40, 1)} · 0803 000 0001`)).toBeTruthy();
    fireEvent.changeText(screen.getByTestId('placeName'), 'Police post, Ojota');
    await tap(t.addSafePlace);
    expect(screen.getByText('Police post, Ojota')).toBeTruthy();
    await tap(t.back);
    // The privacy card counts them, and nothing about them left the phone.
    expect(screen.getByText(t.knowsPlaces(2))).toBeTruthy();
    expect(server.everythingHeld()).not.toContain('Ikeja');
    expect(server.everythingHeld()).not.toContain('Ojota');
    await tap(t.back);

    // One tap: the template starts a journey with its minutes and its people, and the server's copy has no label.
    await tap(t.journeyStart);
    await tap(t.startThisOne);
    await waitFor(() => expect(screen.getByTestId('journeyState').props.children).toBe(t.journeyUnderway('Home from Ikeja', 40)));
    const j = [...server.journeys.values()][0]!;
    expect(j.notify).toEqual([bola.phoneHash]);
    expect(server.everythingHeld()).not.toContain('Ikeja');
    await tap(t.arrived);
    // A safe place is offered as a destination.
    await tap(t.journeyStart);
    await tap('Police post, Ojota');
    expect(screen.getByTestId('where').props.value).toBe('Police post, Ojota');
    await tap(t.back);
    // And listed under the numbers during an alert.
    await tap(t.panic);
    expect(screen.getByText('Police post, Ojota')).toBeTruthy();
    await holdToCancel();
    jest.useRealTimers();
  });
});

describe('watch me home', () => {
  test('one watcher, positions sealed to her alone, an end it keeps itself that both are told of', async () => {
    fakeClock();
    const { server, services, tick } = evening({ lat: 6.5244, lon: 3.3792 });
    const bola = { id: 'bola', phoneHash: phoneHash('0803 000 0001'), name: 'Bola', keys: generateKeyPair() };
    await register(server, bola, 1);
    render(<App services={services} />);
    await begin();
    await saveMe();
    const myId = phoneHash('0801 111 2222').slice(0, 16);
    await tap(t.circle);
    fireEvent.changeText(screen.getByTestId('phone'), '0803 000 0001');
    await tap(t.invite);
    server.accept(myId, bola.phoneHash, 'yo');
    await tap(t.back);
    await tap(t.circle);
    await waitFor(() => expect(screen.getAllByText(t.onlyDuringAlert)).toHaveLength(1));
    await tap(t.back);

    await tap(t.watchMe);
    fireEvent.changeText(screen.getByTestId('watchWhere'), 'the bus stop');
    await tap(t.watchGo);
    await waitFor(() => expect(screen.getByTestId('journeyState').props.children).toBe(t.watchUnderway('0803 000 0001', 20)));
    const w = [...server.journeys.values()][0]!;
    expect(w.watch).toBe(true);
    expect(w.notify).toEqual([bola.phoneHash]);
    expect(w.graceMinutes).toBe(0);
    // A position went out, sealed to her; she opens it, the server cannot.
    await waitFor(() => expect(w.positions.length).toBeGreaterThan(0));
    const p = w.positions[0]!;
    const seen = decodePosition(open({ from: fromBase64(p.from), nonce: fromBase64(p.nonce), ciphertext: fromBase64(p.ciphertext) }, bola.keys));
    expect(seen.lat).toBeCloseTo(6.52, 2);
    expect(server.everythingHeld()).not.toContain('6.5244');
    expect(server.everythingHeld()).not.toContain('bus stop');
    // Who can see me says so, for the watch's twenty minutes.
    await tap(t.circle);
    expect(screen.getByText(new RegExp(t.thisJourneyUntil))).toBeTruthy();
    await tap(t.back);
    // Twenty minutes later it is over by itself: no alert, and both told.
    for (let i = 0; i < 20; i++) await tick();
    await waitFor(() => expect(screen.getByTestId('watchEnded')).toBeTruthy());
    expect(server.alerts.size).toBe(0);
    await tap(t.watchOk);
    expect(screen.queryByTestId('watchEnded')).toBeNull();
    jest.useRealTimers();
  });
});

describe('advisory and the data-request page', () => {
  test('nothing renders below the thresholds; above them a place and hours, and never a category', async () => {
    const { server, services } = evening({ lat: 6.5244, lon: 3.3792 });
    render(<App services={services} />);
    await begin();
    await saveMe();
    await tap(t.nearby);
    await waitFor(() => expect(screen.getByText(t.nearbyEmpty)).toBeTruthy());
    expect(screen.queryByTestId('advisory')).toBeNull();
    await tap(t.back);
    server.advisory = { fromHour: 21, toHour: 2 };
    await tap(t.nearby);
    await waitFor(() => expect(screen.getByTestId('advisory')).toBeTruthy());
    expect(screen.getByText(t.advisory('21:00', '02:00'))).toBeTruthy();
  });

  test('the page says what is held in the words of the card, what cannot be read, and what happens when asked', async () => {
    const { services } = evening();
    render(<App services={services} />);
    await begin();
    await tap(t.settings);
    await tap(t.policy);
    expect(screen.getByText(t.policyCannotLines)).toBeTruthy();
    expect(screen.getByText(t.policyAskedLines)).toBeTruthy();
    expect(screen.getByText(t.policyNoPromise)).toBeTruthy();
    expect(screen.getByTestId('policyKnows').props.children).toContain('location:none');
  });
});
