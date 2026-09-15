import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { numbers } from '@sentinel/domain';

import { Gap, PrimaryAction } from '../components/Actions';
import { Glass } from '../components/Glass';
import { Text } from '../components/Text';
import { space } from '../design/tokens';
import { t } from '../phrases';

/**
 * Onboarding that teaches the rules (Phase 4): four sentences, the official
 * number first and largest, and one action — which goes to Settings, because
 * the circle cannot be told without a number. There is nothing to skip.
 */
export function WelcomeScreen({ state, onBegin }: { state: string | null; onBegin: () => void }) {
  const insets = useSafeAreaInsets();
  const official = numbers.numbersFor(state);
  return (
    <View style={[styles.fill, { paddingTop: insets.top + space.l, paddingBottom: insets.bottom + space.l }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="display">{t.welcome}</Text>
        <Gap />
        <Glass depth="low">
          <Text variant="body">{t.rule1}</Text>
          <Gap h={space.s} />
          {official.slice(0, 2).map((n) => (
            <Text key={n.number} variant="display" accessibilityLabel={`${n.label} ${n.number}`}>
              {n.number}
            </Text>
          ))}
        </Glass>
        <Gap />
        {[t.rule2, t.rule3, t.rule4].map((r) => (
          <View key={r}>
            <Text variant="body">{r}</Text>
            <Gap h={space.s} />
          </View>
        ))}
        <Gap />
        <PrimaryAction label={t.begin} onPress={onBegin} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: space.l },
});
