import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { circle as C, journey as J } from '@sentinel/domain';

import { Gap, PrimaryAction, SecondaryAction } from '../components/Actions';
import { Text } from '../components/Text';
import { useColours } from '../design/theme';
import { radius, space, target, typeScale } from '../design/tokens';
import { t } from '../phrases';

/**
 * Watch me home (ADR-0011): one watcher, twenty minutes, positions sealed
 * to her alone, an end it keeps itself. No escalation — the screen says
 * that a journey is the thing with one.
 */
export function WatchScreen({
  circle,
  names,
  nowMinutes,
  onStart,
  onBack,
}: {
  circle: C.Circle;
  names: Readonly<Record<string, string>>;
  nowMinutes: number;
  onStart: (j: J.Journey) => void;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const c = useColours();
  const people = C.members(circle).filter((m) => C.kindOf(m) === 'person');
  const [watcher, setWatcher] = useState<string | null>(people[0]?.with ?? null);
  const [where, setWhere] = useState('');
  return (
    <View style={[styles.fill, { paddingTop: insets.top + space.l, paddingBottom: insets.bottom + space.l }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="display">{t.watchMe}</Text>
        <Gap h={space.xs} />
        <Text variant="secondary" tone="secondary">
          {t.watchHint}
        </Text>
        <Gap />
        <TextInput
          testID="watchWhere"
          value={where}
          onChangeText={setWhere}
          placeholder={t.watchWhere}
          placeholderTextColor={c.textSecondary}
          accessibilityLabel={t.watchWhere}
          style={[styles.input, typeScale.body, { color: c.textPrimary, borderColor: c.hairline, backgroundColor: c.glassMid }]}
        />
        <Gap />
        <Text variant="title">{t.watchWho}</Text>
        {people.length === 0 ? (
          <Text variant="secondary" tone="secondary">
            {t.circleEmpty}
          </Text>
        ) : (
          people.map((m) => (
            <View key={m.with} style={styles.row}>
              <Text variant="body" style={styles.grow}>
                {names[m.with] ?? m.with}
              </Text>
              <SecondaryAction label={watcher === m.with ? t.telling : t.notTelling} onPress={() => setWatcher(m.with)} />
            </View>
          ))
        )}
        <Gap />
        <PrimaryAction label={t.watchGo} disabled={watcher === null || where.trim().length === 0} onPress={() => watcher && onStart(J.watch(`w${nowMinutes}`, nowMinutes, watcher, where.trim()))} />
        <Gap h={space.s} />
        <SecondaryAction label={t.back} onPress={onBack} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: space.l },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: target.standard, gap: space.s },
  grow: { flex: 1 },
  input: { borderWidth: 1, borderRadius: radius.input, paddingHorizontal: space.m, minHeight: target.standard },
});
