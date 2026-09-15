import { useEffect, useReducer, useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { phoneHash } from '@sentinel/crypto';
import { alert as A, journey as J } from '@sentinel/domain';

import { JourneyCard } from './components/JourneyCard';
import { Mesh } from './components/Mesh';
import { ThemeProvider, useTheme } from './design/theme';
import { AlertScreen } from './screens/AlertScreen';
import { CircleScreen } from './screens/CircleScreen';
import { HomeScreen } from './screens/HomeScreen';
import { JourneyScreen } from './screens/JourneyScreen';
import { INITIAL, reduce, sharedJourneys } from './state';

/**
 * The shell: the home (the numbers, the panic action, the wedge), the alert
 * screen it leads to, the circle and the journey. Every change to state goes
 * through `reduce`; the screens only dispatch.
 */
export default function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <Root />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

function useMinute(): number {
  const [m, setM] = useState(() => Math.floor(Date.now() / 60_000));
  useEffect(() => {
    const id = setInterval(() => setM(Math.floor(Date.now() / 60_000)), 15_000);
    return () => clearInterval(id);
  }, []);
  return m;
}

export function Root() {
  const { isDark } = useTheme();
  const [s, dispatch] = useReducer(reduce, INITIAL);
  const now = useMinute();
  const circleNames = s.circle.members.map((m) => ({ hash: m.with, name: s.names[m.with] ?? m.with }));

  // The journey's plan, run on the phone as long as the phone is alive; the
  // server runs the same plan (J.serverPlan) for when it is not.
  useEffect(() => {
    if (s.journey && J.stateAt(s.journey.plan, now, s.journey.confirmed, false) === 'escalated') {
      dispatch({ type: 'journeyEscalated', now });
    }
  }, [s.journey, now]);

  let screen;
  if (s.alert && !A.isOver(s.alert)) {
    screen = (
      <AlertScreen
        record={s.alert}
        circle={circleNames}
        state="Lagos"
        nowMinutes={now}
        onCancel={() => dispatch({ type: 'cancelAlert', now, underDuress: false })}
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
        onInvite={(phone) => dispatch({ type: 'invite', hash: phoneHash(phone), name: phone, now })}
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
        onStart={(j) => dispatch({ type: 'startJourney', journey: j })}
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
