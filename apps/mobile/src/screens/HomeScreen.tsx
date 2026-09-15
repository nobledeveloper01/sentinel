import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { numbers } from '@sentinel/domain';

import { Gap, PrimaryAction, SecondaryAction } from '../components/Actions';
import { Glass } from '../components/Glass';
import { Text } from '../components/Text';
import { space } from '../design/tokens';
import { t } from '../phrases';

/**
 * The home is the alert screen, because nobody opens a panic app to browse.
 * The official numbers first and largest (rule 6); the panic action the one
 * gradient control, under the thumb; the journey — the wedge — beneath it.
 */
export function HomeScreen({
  state,
  card,
  onPanic,
  onJourney,
  onCircle,
  onSettings,
}: {
  state: string | null;
  /** A journey under way, above the fold, or nothing. */
  card?: ReactNode;
  onPanic: () => void;
  onJourney: () => void;
  onCircle: () => void;
  onSettings: () => void;
}) {
  const insets = useSafeAreaInsets();
  const official = numbers.numbersFor(state);
  return (
    <View style={[styles.fill, { paddingTop: insets.top + space.l, paddingBottom: insets.bottom + space.l }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="display">{t.home}</Text>
        <Gap />
        <Glass depth="low" accessibilityRole="summary">
          <Text variant="secondary" tone="secondary">
            {t.officialFirst}
          </Text>
          <Gap h={space.s} />
          {official.slice(0, 2).map((n) => (
            <Text key={n.number} variant="display" accessibilityLabel={`${n.label} ${n.number}`}>
              {n.number}
            </Text>
          ))}
          <Gap h={space.s} />
          <Text variant="small" tone="secondary">
            {t.notASubstitute}
          </Text>
        </Glass>
        <Gap h={space.l} />
        <PrimaryAction label={t.panic} size="panic" onPress={onPanic} accessibilityHint={t.panicHint} />
        <Gap h={space.s} />
        <Text variant="secondary" tone="secondary" style={styles.centre}>
          {t.panicHint}
        </Text>
        <Gap h={space.l} />
        {card ? (
          <>
            {card}
            <Gap />
          </>
        ) : null}
        <SecondaryAction label={t.journeyStart} onPress={onJourney} />
        <Gap h={space.s} />
        <SecondaryAction label={t.circle} onPress={onCircle} />
        <Gap h={space.s} />
        <SecondaryAction label={t.settings} onPress={onSettings} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: space.l },
  centre: { textAlign: 'center' },
});
