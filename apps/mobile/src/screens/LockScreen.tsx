import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Gap, SecondaryAction } from '../components/Actions';
import { PinPad } from '../components/PinPad';
import { Text } from '../components/Text';
import { space } from '../design/tokens';
import { t } from '../phrases';

/**
 * The PIN before a hidden alert is shown. The real PIN reveals it; the
 * duress PIN opens the decoy — the idle home — and tells the circle; a wrong
 * PIN says so and nothing else. Nothing on this screen says an alert exists.
 */
export function LockScreen({ wrong, onEntered, onBack }: { wrong: boolean; onEntered: (hash: string) => void; onBack: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.fill, { paddingTop: insets.top + space.l, paddingBottom: insets.bottom + space.l }]}>
      <Text variant="display">{t.settings}</Text>
      <Gap />
      <PinPad label={t.enterPin} wrong={wrong} onEntered={onEntered} />
      <View style={styles.grow} />
      <SecondaryAction label={t.back} onPress={onBack} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, paddingHorizontal: space.l },
  grow: { flex: 1 },
});
