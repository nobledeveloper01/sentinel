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
import { pinHash } from '@sentinel/crypto';
import { duress as D } from '@sentinel/domain';

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
  onPins,
  knows,
  hasRecord,
  onShareRecord,
  onBack,
}: {
  phone: string;
  name: string;
  prefs: Prefs;
  onSave: (phone: string, name: string) => void;
  onPref: (key: keyof Prefs, on: boolean) => void;
  onPins: (pins: D.Pins) => void;
  /** The lines of "what Sentinel knows", derived from state. */
  knows: ReadonlyArray<string>;
  hasRecord: boolean;
  onShareRecord: () => void;
  onBack: () => void;
}) {
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  const pins: D.Pins = { realHash: pinHash(pin1), duressHash: pinHash(pin2) };
  const pinsOk = /^\d{4,6}$/.test(pin1) && /^\d{4,6}$/.test(pin2) && D.validPins(pins) && pin1 !== pin2;
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
        <Text variant="title">{t.pin}</Text>
        <Gap h={space.xs} />
        <Text variant="secondary" tone="secondary">
          {t.pinsHint}
        </Text>
        <Gap h={space.s} />
        <TextInput testID="pin1" value={pin1} onChangeText={setPin1} keyboardType="number-pad" secureTextEntry placeholder={t.pin} placeholderTextColor={c.textSecondary} accessibilityLabel={t.pin} style={input} />
        <Gap h={space.s} />
        <TextInput testID="pin2" value={pin2} onChangeText={setPin2} keyboardType="number-pad" secureTextEntry placeholder={t.duressPin} placeholderTextColor={c.textSecondary} accessibilityLabel={t.duressPin} style={input} />
        <Gap h={space.s} />
        <SecondaryAction
          label={t.savePins}
          disabled={!pinsOk}
          onPress={() => {
            onPins(pins);
            setPin1('');
            setPin2('');
          }}
        />
        <Gap />
        <Glass depth="low" testID="knows">
          <Text variant="title">{t.knows}</Text>
          <Gap h={space.xs} />
          {knows.map((line) => (
            <Text key={line} variant="body">
              {describeKnown(line)}
            </Text>
          ))}
          <Text variant="small" tone="secondary">
            {t.knowsNothingElse}
          </Text>
        </Glass>
        <Gap />
        <SecondaryAction label={t.shareRecord} disabled={!hasRecord} onPress={onShareRecord} />
        <Gap h={space.xs} />
        <Text variant="small" tone="secondary">
          {t.shareRecordHint}
        </Text>
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

/** A fact about what is held, as a sentence. The facts come from `knows()` in state; only the words live here. */
function describeKnown(line: string): string {
  const [key, value] = line.split(':', 2) as [string, string];
  switch (key) {
    case 'number':
      return value === 'none' ? t.knowsNoNumber : t.knowsNumber(value);
    case 'name':
      return value === 'none' ? '' : t.knowsName(value);
    case 'circle':
      return t.knowsCircle(Number(value));
    case 'alerts':
      return t.knowsAlerts(Number(value));
    case 'keys':
      return t.knowsKeys;
    default:
      return '';
  }
}
