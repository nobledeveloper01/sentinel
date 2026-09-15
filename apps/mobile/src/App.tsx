import { useEffect, useMemo, useReducer, useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { phoneHash } from '@sentinel/crypto';
import { alert as A, circle as C, journey as J } from '@sentinel/domain';

import { JourneyCard } from './components/JourneyCard';
import { Mesh } from './components/Mesh';
import { ThemeProvider, useTheme } from './design/theme';
import { acceptedMembers, register, relayAlert } from './relay';
import { AlertScreen } from './screens/AlertScreen';
import { CircleScreen } from './screens/CircleScreen';
import { HomeScreen } from './screens/HomeScreen';
import { JourneyScreen } from './screens/JourneyScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { defaultServices, type Services } from './services';
import { INITIAL, reduce, sharedJourneys } from './state';

/**
 * The shell: the home (the numbers, the panic action, the wedge), the alert
 * screen it leads to, the circle, the journey, settings. Every change to
 * state goes through `reduce`; the screens only dispatch; the relay is the
 * one place bytes leave the phone.
 */
export default function App({ services }: { services?: Services }) {
  const svc = useMemo(() => services ?? defaultServices(), [services]);
  const [s, dispatch] = useReducer(reduce, INITIAL);
  return (
    <ThemeProvider glass={s.prefs.glass} reduced={s.prefs.reduced}>
      <SafeAreaProvider>
        <Root services={svc} state={s} dispatch={dispatch} />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

function useMinute(now: () => number): number {
  const [m, setM] = useState(now);
  useEffect(() => {
    const id = setInterval(() => setM(now()), 15_000);
    return () => clearInterval(id);
  }, [now]);
  return m;
}

export function Root({ services, state: s, dispatch }: { services: Services; state: ReturnType<typeof reduce>; dispatch: (a: Parameters<typeof reduce>[1]) => void }) {
  const { isDark } = useTheme();
  const now = useMinute(services.now);
  const circleNames = s.circle.members.map((m) => ({ hash: m.with, name: s.names[m.with] ?? m.with }));
  const me = { ...s.me, keys: services.keys };

  // The journey's plan, run on the phone as long as the phone is alive; the
  // server runs the same plan (J.serverPlan) for when it is not.
  useEffect(() => {
    if (s.journey && J.stateAt(s.journey.plan, now, s.journey.confirmed, false) === 'escalated') {
      dispatch({ type: 'journeyEscalated', now });
    }
  }, [s.journey, now, dispatch]);

  // A new alert leaves the phone once: sealed to each member, and the
  // attempts the server reports become the record's own events.
  const alertId = s.alert?.id ?? null;
  const triggeredBy = s.alert?.events[0]?.kind === 'triggered' ? s.alert.events[0].path : null;
  useEffect(() => {
    if (!alertId) return;
    let cancelled = false;
    void (async () => {
      const at = services.now();
      const position = await services.position();
      const out = await relayAlert(services.transport, me, C.members(s.circle), position, alertId, at, triggeredBy === 'journey' ? 'escalated' : 'alert');
      if (cancelled) return;
      dispatch({ type: 'unreachable', hashes: out.unreachable });
      for (const e of out.events) dispatch({ type: 'alertEvent', event: e });
    })();
    return () => {
      cancelled = true;
    };
    // The alert id is the one thing that should re-run this; the rest is read once.
  }, [alertId]);

  // Who has accepted, asked of the server whenever the circle is opened:
  // acceptance happens on the other phone, so this is the only way to learn it.
  const onCircle = s.screen === 'circle';
  useEffect(() => {
    if (!onCircle || !s.me.id) return;
    let stale = false;
    void acceptedMembers(services.transport, s.me.id).then((rows) => {
      if (stale) return;
      for (const r of rows) dispatch({ type: 'accepted', hash: r.hash, language: r.language, now: services.now() });
    });
    return () => {
      stale = true;
    };
  }, [onCircle, s.me.id]);

  let screen;
  if (s.alert && !A.isOver(s.alert)) {
    screen = (
      <AlertScreen
        record={s.alert}
        circle={circleNames}
        unreachable={s.unreachable}
        state="Lagos"
        nowMinutes={now}
        onCancel={() => {
          void services.transport.post(`/alerts/${s.alert!.id}/cancel`, { underDuress: false });
          dispatch({ type: 'cancelAlert', now, underDuress: false });
        }}
      />
    );
  } else if (s.screen === 'circle') {
    screen = (
      <CircleScreen
        circle={s.circle}
        names={s.names}
        sharedJourneys={sharedJourneys(s)}
        alertRunning={false}
        nowMinutes={now}
        onInvite={(phone) => {
          const hash = phoneHash(phone);
          void services.transport.post('/circle/invite', { owner: s.me.id, withPhoneHash: hash });
          dispatch({ type: 'invite', hash, name: phone, now });
        }}
        onRemove={(hash) => dispatch({ type: 'remove', hash })}
        onBack={() => dispatch({ type: 'go', to: 'home' })}
      />
    );
  } else if (s.screen === 'journey') {
    screen = (
      <JourneyScreen
        circle={s.circle}
        names={s.names}
        nowMinutes={now}
        batteryMinutesLeft={null}
        onStart={(j) => {
          void services.transport.post('/journeys', { id: j.id, account: s.me.id, expectedMinutes: j.expectedMinutes, graceMinutes: j.graceMinutes, notify: j.notify });
          dispatch({ type: 'startJourney', journey: j });
        }}
        onBack={() => dispatch({ type: 'go', to: 'home' })}
      />
    );
  } else if (s.screen === 'settings') {
    screen = (
      <SettingsScreen
        phone=""
        name={s.me.name}
        prefs={s.prefs}
        onSave={(phone, name) => {
          const next = { id: s.me.id || phoneHash(phone).slice(0, 16), phoneHash: phoneHash(phone), name };
          dispatch({ type: 'me', me: next });
          void register(services.transport, { ...next, keys: services.keys }, now);
          dispatch({ type: 'go', to: 'home' });
        }}
        onPref={(key, on) => dispatch({ type: 'pref', key, on })}
        onBack={() => dispatch({ type: 'go', to: 'home' })}
      />
    );
  } else {
    screen = (
      <HomeScreen
        state="Lagos"
        card={s.journey ? <JourneyCard journey={s.journey.plan} nowMinutes={now} onArrived={() => dispatch({ type: 'arrived' })} /> : null}
        onPanic={() => dispatch({ type: 'panic', now, path: 'screen', silent: false })}
        onJourney={() => dispatch({ type: 'go', to: 'journey' })}
        onCircle={() => dispatch({ type: 'go', to: 'circle' })}
        onSettings={() => dispatch({ type: 'go', to: 'settings' })}
      />
    );
  }
  return (
    <Mesh>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {screen}
    </Mesh>
  );
}
