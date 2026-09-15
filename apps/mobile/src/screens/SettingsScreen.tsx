import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Gap, PrimaryAction, SecondaryAction } from '../components/Actions';
import { Glass } from '../components/Glass';
import { Text } from '../components/Text';
import { useColours } from '../design/theme';
import { radius, space, target, typeScale } from '../design/tokens';
import { t } from '../phrases';
import type { Prefs } from '../state';

/**
 * Who the circle knows me as, and the floor: plain surfaces, less motion,
 * large controls — each read at act time (ADR-0005), each a complete mode.
 */
export function SettingsScreen({
  phone,
  name,
  prefs,
  onSave,
  onPref,
  onBack,
}: {
  phone: string;
  name: string;
  prefs: Prefs;
  onSave: (phone: string, name: string) => void;
  onPref: (key: keyof Prefs, on: boolean) => void;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const c = useColours();
  const [p, setP] = useState(phone);
  const [n, setN] = useState(name);
  const input = [styles.input, typeScale.body, { color: c.textPrimary, borderColor: c.hairline, backgroundColor: c.glassMid }];
  const rows: ReadonlyArray<{ key: keyof Prefs; label: string }> = [
    { key: 'glass', label: t.plainSurfaces },
    { key: 'reduced', label: t.lessMotion },
    { key: 'large', label: t.largeControls },
  ];
  return (
    <View style={[styles.fill, { paddingTop: insets.top + space.l, paddingBottom: insets.bottom + space.l }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="display">{t.settings}</Text>
        <Gap h={space.xs} />
        <Text variant="secondary" tone="secondary">
          {t.settingsHint}
        </Text>
        <Gap />
        <TextInput testID="myPhone" value={p} onChangeText={setP} keyboardType="phone-pad" placeholder={t.yourNumber} placeholderTextColor={c.textSecondary} accessibilityLabel={t.yourNumber} style={input} />
        <Gap h={space.s} />
        <TextInput testID="myName" value={n} onChangeText={setN} placeholder={t.yourName} placeholderTextColor={c.textSecondary} accessibilityLabel={t.yourName} style={input} />
        <Gap h={space.s} />
        <PrimaryAction label={t.save} disabled={p.replace(/\D/g, '').length < 10 || n.trim().length === 0} onPress={() => onSave(p, n.trim())} />
        <Gap />
        <Glass depth="low">
          {rows.map((r) => {
            // "Plain surfaces" is the glass switch inverted: on means no glass.
            const on = r.key === 'glass' ? !prefs.glass : prefs[r.key];
            return (
              <View key={r.key} style={styles.row}>
                <Text variant="body" style={styles.grow}>
                  {r.label}
                </Text>
                <Switch
                  testID={`pref-${r.key}`}
                  value={on}
                  onValueChange={(v) => onPref(r.key, r.key === 'glass' ? !v : v)}
                  accessibilityLabel={r.label}
                  trackColor={{ true: c.accent, false: c.hairline }}
                />
              </View>
            );
          })}
        </Glass>
        <Gap />
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
