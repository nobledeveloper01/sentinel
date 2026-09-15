import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { circle as C } from '@sentinel/domain';

import { Gap, PrimaryAction, SecondaryAction } from '../components/Actions';
import { Glass } from '../components/Glass';
import { Text } from '../components/Text';
import { useColours } from '../design/theme';
import { radius, space, target, typeScale } from '../design/tokens';
import { t } from '../phrases';

/**
 * The circle (FR-1.3): invite by number, the invitee accepts before anything
 * is shared, either side removes it now. *Who can see where I am, right now*
 * is the one screen that is always current — a member with nothing shared
 * sees nothing, and the screen says so.
 */
export function CircleScreen({
  circle,
  names,
  sharedJourneys,
  alertRunning,
  nowMinutes,
  onInvite,
  onRemove,
  onBack,
}: {
  circle: C.Circle;
  names: Readonly<Record<string, string>>;
  sharedJourneys: ReadonlyArray<{ with: ReadonlyArray<string>; until: number }>;
  alertRunning: boolean;
  nowMinutes: number;
  onInvite: (phone: string) => void;
  onRemove: (hash: string) => void;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const c = useColours();
  const [phone, setPhone] = useState('');
  const seeing = C.whoCanSeeMe(circle, sharedJourneys, alertRunning, nowMinutes);
  return (
    <View style={[styles.fill, { paddingTop: insets.top + space.l, paddingBottom: insets.bottom + space.l }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="display">{t.circle}</Text>
        <Gap h={space.xs} />
        <Text variant="secondary" tone="secondary">
          {t.circleHint}
        </Text>
        <Gap />
        <Glass depth="low">
          <Text variant="title">{t.whoCanSeeMe}</Text>
          <Gap h={space.s} />
          {seeing.length === 0 ? (
            <Text variant="secondary" tone="secondary">
              {t.circleEmpty}
            </Text>
          ) : (
            seeing.map((s) => (
              <View key={s.with} style={styles.row} accessibilityLabel={`${names[s.with] ?? s.with}: ${describe(s.condition)}`}>
                <Text variant="body" style={styles.grow}>
                  {names[s.with] ?? s.with}
                </Text>
                <Text variant="small" tone={s.condition === 'only during an alert' ? 'secondary' : 'attention'}>
                  {describe(s.condition)}
                </Text>
              </View>
            ))
          )}
        </Glass>
        <Gap />
        {circle.members
          .filter((m) => m.state === 'invited')
          .map((m) => (
            <View key={m.with} style={styles.row}>
              <Text variant="body" tone="secondary" style={styles.grow}>
                {names[m.with] ?? m.with} · {t.invited}
              </Text>
              <SecondaryAction label={t.remove} onPress={() => onRemove(m.with)} />
            </View>
          ))}
        {C.members(circle).map((m) => (
          <View key={m.with} style={styles.row}>
            <Text variant="body" style={styles.grow}>
              {names[m.with] ?? m.with}
            </Text>
            <SecondaryAction label={t.remove} onPress={() => onRemove(m.with)} />
          </View>
        ))}
        <Gap />
        <TextInput
          testID="phone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder={t.phoneNumber}
          placeholderTextColor={c.textSecondary}
          accessibilityLabel={t.phoneNumber}
          style={[styles.input, typeScale.body, { color: c.textPrimary, borderColor: c.hairline, backgroundColor: c.glassMid }]}
        />
        <Gap h={space.s} />
        <PrimaryAction
          label={t.invite}
          disabled={phone.replace(/\D/g, '').length < 10}
          onPress={() => {
            onInvite(phone);
            setPhone('');
          }}
        />
        <Gap />
        <SecondaryAction label={t.back} onPress={onBack} />
      </ScrollView>
    </View>
  );
}

function describe(condition: C.SharingNow['condition']): string {
  if (condition === 'only during an alert') return t.onlyDuringAlert;
  if (condition === 'alert in progress') return t.alertInProgress;
  const d = new Date(condition.journeyUntil * 60_000);
  return `${t.thisJourneyUntil} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: space.l },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: target.standard, gap: space.s },
  grow: { flex: 1 },
  input: { borderWidth: 1, borderRadius: radius.input, paddingHorizontal: space.m, minHeight: target.standard },
});
