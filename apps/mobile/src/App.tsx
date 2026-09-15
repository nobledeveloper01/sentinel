import { useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { alert } from '@sentinel/domain';

import { Mesh } from './components/Mesh';
import { ThemeProvider, useTheme } from './design/theme';
import { AlertScreen } from './screens/AlertScreen';
import { HomeScreen } from './screens/HomeScreen';

/**
 * Phase 0's shell: the home (the numbers, the panic action, the wedge), and
 * the alert screen it leads to. The trigger paths, the channels and the keys
 * come with Phases 1 and 2; the record they write is already the domain's.
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

function Root() {
  const { isDark } = useTheme();
  const [record, setRecord] = useState<alert.AlertRecord | null>(null);
  const nowMinutes = () => Math.floor(Date.now() / 60_000);
  const circle = [{ hash: 'demo', name: 'Your circle' }];
  return (
    <Mesh>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      {record && !alert.isOver(record) ? (
        <AlertScreen
          record={record}
          circle={circle}
          state="Lagos"
          nowMinutes={nowMinutes()}
          onCancel={() => setRecord(alert.append(record, { kind: 'cancelled', at: nowMinutes(), underDuress: false }))}
        />
      ) : (
        <HomeScreen
          state="Lagos"
          onPanic={() =>
            setRecord({
              id: String(Date.now()),
              events: [{ kind: 'triggered', at: nowMinutes(), path: 'screen', silent: false, drill: false }],
            })
          }
          onJourney={() => {}}
          onCircle={() => {}}
        />
      )}
    </Mesh>
  );
}
