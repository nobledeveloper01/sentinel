import { useEffect, useMemo, useReducer, useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { exportRecord, phoneHash } from '@sentinel/crypto';
import { alert as A, circle as C, duress as D, journey as J } from '@sentinel/domain';

import { Gap, SecondaryAction } from './components/Actions';
import { Glass } from './components/Glass';
import { JourneyCard } from './components/JourneyCard';
import { Text } from './components/Text';
import { space } from './design/tokens';
import * as Community from './community';
import { Mesh } from './components/Mesh';
import { ThemeProvider, useTheme } from './design/theme';
import { acceptedMembers, acknowledgements, organisations, register, relayAlert, watchPosition } from './relay';
import { AlertScreen } from './screens/AlertScreen';
import { CircleScreen } from './screens/CircleScreen';
import { HomeScreen } from './screens/HomeScreen';
import { JourneyScreen } from './screens/JourneyScreen';
import { LockScreen } from './screens/LockScreen';
import { NearbyScreen } from './screens/NearbyScreen';
import { OrganisationsScreen } from './screens/OrganisationsScreen';
import { PlacesScreen } from './screens/PlacesScreen';
import { PolicyScreen } from './screens/PolicyScreen';
import { ReportScreen } from './screens/ReportScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { WatchScreen } from './screens/WatchScreen';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { defaultServices, type Services } from './services';
import { launchKeys, loadOrMakeKeys, type DeviceKeys } from './keystore';
import { t } from './phrases';
import { INITIAL, knows, reduce, sharedJourneys } from './state';

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
  // The device keys: from the store when there is one, otherwise for this launch.
  const [device, setDevice] = useState<DeviceKeys>(launchKeys);
  useEffect(() => {
    let stale = false;
    void loadOrMakeKeys(services.secrets).then((k) => {
      if (!stale) setDevice(k);
    });
    return () => {
      stale = true;
    };
  }, [services.secrets]);
  // A hidden alert is behind the PIN: the settings button asks for it first.
  const [locked, setLocked] = useState(false);
  const [wrongPin, setWrongPin] = useState(false);
  const circleNames = s.circle.members.map((m) => ({ hash: m.with, name: s.names[m.with] ?? m.with }));
  const me = { ...s.me, keys: device.keys };

  // The journey's plan, run on the phone as long as the phone is alive; the
  // server runs the same plan (J.serverPlan) for when it is not. A watch
  // ends by itself at its minute and never escalates (ADR-0011).
  useEffect(() => {
    if (!s.journey) return;
    if (J.watchOver(s.journey.plan, now)) dispatch({ type: 'watchOver' });
    else if (!J.isWatch(s.journey.plan) && J.stateAt(s.journey.plan, now, s.journey.confirmed, false) === 'escalated') {
      dispatch({ type: 'journeyEscalated', now });
    }
  }, [s.journey, now, dispatch]);

  // A watch's positions: one sealed envelope to the watcher per tick, as
  // long as the watch runs — a fix, or the honest *no position*.
  const watchId = s.journey && J.isWatch(s.journey.plan) ? s.journey.plan.id : null;
  const watcher = s.journey?.plan.notify[0] ?? null;
  const [watchHasFix, setWatchHasFix] = useState(true);
  useEffect(() => {
    if (!watchId || !watcher) return;
    let stale = false;
    void (async () => {
      const position = await services.position();
      if (stale) return;
      setWatchHasFix(position !== null);
      await watchPosition(services.transport, me, watchId, watcher, position, now);
    })();
    return () => {
      stale = true;
    };
    // Every tick of the minute, for as long as the watch runs.
  }, [watchId, watcher, now]);

  // The organisations somebody vouched for, asked whenever that screen is opened.
  const [orgs, setOrgs] = useState<ReadonlyArray<{ phoneHash: string; name: string }> | null>([]);
  const onOrgs = s.screen === 'organisations';
  useEffect(() => {
    if (!onOrgs) return;
    let stale = false;
    void organisations(services.transport).then((list) => {
      if (!stale) setOrgs(list);
    });
    return () => {
      stale = true;
    };
  }, [onOrgs, services.transport]);

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

  // Who has acknowledged, asked of the server every tick while an alert
  // runs; each new one becomes an event on the record.
  const acked = (s.alert?.events.filter((e) => e.kind === 'acknowledged').map((e) => (e as { by: string }).by) ?? []).join(',');
  useEffect(() => {
    if (!alertId) return;
    let stale = false;
    const known = acked.split(',');
    void acknowledgements(services.transport, alertId).then((acks) => {
      if (stale) return;
      for (const a of acks) {
        if (!known.includes(a.by)) dispatch({ type: 'alertEvent', event: { kind: 'acknowledged', at: a.at, by: a.by } });
      }
    });
    return () => {
      stale = true;
    };
    // Every tick of the minute, for as long as the alert runs.
  }, [alertId, now, services.transport, dispatch, acked]);

  // The public path: what is near, asked whenever the feed is opened, with
  // the corrections this account is owed; refusals as words on the screen.
  const [feed, setFeed] = useState<{ reports: ReadonlyArray<Community.NearbyReport> | null; state: 'ok' | 'no position' | 'unreachable'; corrections: ReadonlyArray<string>; advisory: { fromHour: number; toHour: number } | null }>({ reports: null, state: 'ok', corrections: [], advisory: null });
  const [refused, setRefused] = useState<Community.Refusal | null>(null);
  const [mine, setMine] = useState<ReadonlyArray<string>>([]);
  const [feedTick, setFeedTick] = useState(0);
  const onFeed = s.screen === 'nearby';
  useEffect(() => {
    if (!onFeed) return;
    let stale = false;
    void (async () => {
      const at = await services.position();
      if (!at) {
        if (!stale) setFeed({ reports: null, state: 'no position', corrections: [], advisory: null });
        return;
      }
      const [reports, corrections, advisory] = await Promise.all([
        Community.nearby(services.transport, s.me.id, at, services.now()),
        Community.corrections(services.transport, s.me.id),
        Community.advisory(services.transport, at, services.now()),
      ]);
      if (!stale) setFeed({ reports, state: reports === null ? 'unreachable' : 'ok', corrections, advisory });
    })();
    return () => {
      stale = true;
    };
  }, [onFeed, feedTick, services, s.me.id]);
  const refresh = () => setFeedTick((n) => n + 1);

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

  const running = s.alert !== null && !A.isOver(s.alert);
  let screen;
  if (!s.onboarded) {
    screen = <WelcomeScreen state="Lagos" onBegin={() => dispatch({ type: 'onboarded' })} />;
  } else if (running && !s.hidden) {
    screen = (
      <AlertScreen
        record={s.alert}
        circle={circleNames}
        ladder={C.ladder(s.circle)}
        safePlaces={s.places.safe}
        unreachable={s.unreachable}
        pins={s.pins}
        state="Lagos"
        nowMinutes={now}
        onCancel={(underDuress) => {
          void services.transport.post(`/alerts/${s.alert!.id}/cancel`, { underDuress });
          dispatch({ type: 'cancelAlert', now, underDuress });
        }}
      />
    );
  } else if (locked) {
    screen = (
      <LockScreen
        wrong={wrongPin}
        onBack={() => {
          setLocked(false);
          setWrongPin(false);
        }}
        onEntered={(hash) => {
          const face = s.pins ? D.faceFor(s.pins, hash) : 'real';
          if (face === 'real') {
            setLocked(false);
            setWrongPin(false);
            dispatch(running ? { type: 'reveal' } : { type: 'go', to: 'settings' });
          } else if (face === 'decoy') {
            // The decoy: back to the idle home, the circle told, the screen not.
            setLocked(false);
            setWrongPin(false);
            if (running) void services.transport.post(`/alerts/${s.alert.id}/duress`, {});
            dispatch(running ? { type: 'openedUnderDuress', now } : { type: 'go', to: 'home' });
          } else {
            setWrongPin(true);
          }
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
        places={s.places}
        onStart={(j) => {
          void services.transport.post('/journeys', { id: j.id, account: s.me.id, expectedMinutes: j.expectedMinutes, graceMinutes: j.graceMinutes, notify: j.notify });
          dispatch({ type: 'startJourney', journey: j });
        }}
        onKeep={(template) => dispatch({ type: 'saveTemplate', template })}
        onBack={() => dispatch({ type: 'go', to: 'home' })}
      />
    );
  } else if (s.screen === 'watch') {
    screen = (
      <WatchScreen
        circle={s.circle}
        names={s.names}
        nowMinutes={now}
        onStart={(j) => {
          // The server's copy: the minute it ends and the one watcher; never the label.
          void services.transport.post('/journeys', { id: j.id, account: s.me.id, expectedMinutes: j.expectedMinutes, graceMinutes: 0, notify: j.notify, watch: true });
          dispatch({ type: 'startJourney', journey: j });
        }}
        onBack={() => dispatch({ type: 'go', to: 'home' })}
      />
    );
  } else if (s.screen === 'places') {
    screen = (
      <PlacesScreen
        places={s.places}
        names={s.names}
        members={C.members(s.circle).map((m) => m.with)}
        onStartTemplate={(tpl) => {
          const j: J.Journey = { id: String(now), startedMinutes: now, expectedMinutes: now + tpl.minutes, notify: tpl.notify, liveShare: false, graceMinutes: J.DEFAULT_GRACE_MINUTES, destination: { x: 0, y: 0, label: tpl.label } };
          void services.transport.post('/journeys', { id: j.id, account: s.me.id, expectedMinutes: j.expectedMinutes, graceMinutes: j.graceMinutes, notify: j.notify });
          dispatch({ type: 'startJourney', journey: j });
        }}
        onForgetTemplate={(label) => dispatch({ type: 'forgetTemplate', label })}
        onAddSafePlace={(label) => dispatch({ type: 'addSafePlace', label })}
        onForgetSafePlace={(label) => dispatch({ type: 'forgetSafePlace', label })}
        onBack={() => dispatch({ type: 'go', to: 'settings' })}
      />
    );
  } else if (s.screen === 'organisations') {
    screen = (
      <OrganisationsScreen
        organisations={orgs}
        circle={s.circle}
        onOptIn={(o) => {
          // An invitation, like any member's: told nothing until it accepts from its console.
          void services.transport.post('/circle/invite', { owner: s.me.id, withPhoneHash: o.phoneHash });
          dispatch({ type: 'invite', hash: o.phoneHash, name: o.name, now, kind: 'organisation' });
        }}
        onOptOut={(hash) => dispatch({ type: 'remove', hash })}
        onBack={() => dispatch({ type: 'go', to: 'settings' })}
      />
    );
  } else if (s.screen === 'policy') {
    screen = <PolicyScreen knows={knows(s, device.held)} onBack={() => dispatch({ type: 'go', to: 'settings' })} />;
  } else if (s.screen === 'nearby') {
    screen = (
      <NearbyScreen
        reports={feed.reports}
        corrections={feed.corrections}
        mine={mine}
        state={feed.state}
        advisory={feed.advisory}
        onReport={() => {
          setRefused(null);
          dispatch({ type: 'go', to: 'report' });
        }}
        onCorroborate={(id) => {
          void services.position().then((at) => at && Community.corroborate(services.transport, id, s.me.id, at, services.now()).then(refresh));
        }}
        onDispute={(id, reason) => {
          void Community.dispute(services.transport, id, s.me.id, reason, services.now()).then(refresh);
        }}
        onWithdraw={(id) => {
          void Community.withdraw(services.transport, id, s.me.id).then(refresh);
        }}
        onBack={() => dispatch({ type: 'go', to: 'home' })}
      />
    );
  } else if (s.screen === 'report') {
    screen = (
      <ReportScreen
        refused={refused}
        onSend={(category, text) => {
          void (async () => {
            const at = await services.position();
            if (!at) {
              setRefused({ reason: t.reportNoPosition, details: [] });
              return;
            }
            const out = await Community.report(services.transport, s.me.id, category, at, text, services.now());
            if ('id' in out) {
              setMine([...mine, out.id]);
              setRefused(null);
              refresh();
              dispatch({ type: 'go', to: 'nearby' });
            } else {
              setRefused(out);
            }
          })();
        }}
        onBack={() => dispatch({ type: 'go', to: 'nearby' })}
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
          void register(services.transport, { ...next, keys: device.keys }, now);
          dispatch({ type: 'go', to: 'home' });
        }}
        onPref={(key, on) => dispatch({ type: 'pref', key, on })}
        onPins={(pins) => dispatch({ type: 'pins', pins })}
        knows={knows(s, device.held)}
        hasRecord={s.past.length > 0}
        onShareRecord={() => {
          const last = s.past[s.past.length - 1];
          if (last) void services.share(exportRecord(last, device.signing));
        }}
        onPlaces={() => dispatch({ type: 'go', to: 'places' })}
        onOrganisations={() => dispatch({ type: 'go', to: 'organisations' })}
        onPolicy={() => dispatch({ type: 'go', to: 'policy' })}
        onBack={() => dispatch({ type: 'go', to: 'home' })}
      />
    );
  } else {
    screen = (
      <HomeScreen
        state="Lagos"
        card={
          s.journey ? (
            <JourneyCard
              journey={s.journey.plan}
              nowMinutes={now}
              watcherName={watcher ? (s.names[watcher] ?? watcher) : undefined}
              hasFix={watchHasFix}
              onArrived={() => {
                if (s.journey && J.isWatch(s.journey.plan)) dispatch({ type: 'watchOver' });
                else dispatch({ type: 'arrived' });
              }}
            />
          ) : s.watchEnded !== null ? (
            <WatchEndedCard where={s.watchEnded} onOk={() => dispatch({ type: 'watchSeen' })} />
          ) : null
        }
        onPanic={() => dispatch({ type: 'panic', now, path: 'screen', silent: false })}
        onPanicSilent={() => dispatch({ type: 'panic', now, path: 'screen-held', silent: true })}
        onJourney={() => dispatch({ type: 'go', to: 'journey' })}
        onWatch={() => dispatch({ type: 'go', to: 'watch' })}
        onCircle={() => dispatch({ type: 'go', to: 'circle' })}
        onSettings={() => (running || s.pins ? setLocked(true) : dispatch({ type: 'go', to: 'settings' }))}
        onNearby={() => dispatch({ type: 'go', to: 'nearby' })}
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

/** The watch ended by itself (ADR-0011): said once, on the home, then gone. */
function WatchEndedCard({ where, onOk }: { where: string; onOk: () => void }) {
  return (
    <Glass depth="mid" accessibilityLabel={t.watchEnded(where)}>
      <Text variant="title" testID="watchEnded">
        {t.watchEnded(where)}
      </Text>
      <Gap h={space.s} />
      <SecondaryAction label={t.watchOk} onPress={onOk} />
    </Glass>
  );
}
