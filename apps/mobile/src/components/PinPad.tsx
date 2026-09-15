import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { pinHash } from '@sentinel/crypto';

import { Text } from './Text';
import { useColours } from '../design/theme';
import { radius, space, target } from '../design/tokens';
import { t } from '../phrases';

/**
 * Four to six digits, entered by touch, hashed before anything else sees
 * them. The pad is the same on the real screen and the decoy, which is the
 * point of the decoy.
 */
export function PinPad({ label, onEntered, wrong }: { label: string; onEntered: (hash: string) => void; wrong?: boolean }) {
  const c = useColours();
  // The digits live in a ref so that presses batched into one render still
  // see each other; the state only draws the dots.
  const held = useRef('');
  const [digits, setDigits] = useState('');
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'];
  const set = (d: string) => {
    held.current = d;
    setDigits(d);
  };
  const press = (k: string) => {
    const d = held.current;
    if (k === '⌫') return set(d.slice(0, -1));
    if (k === '✓') {
      if (d.length >= 4) {
        set('');
        onEntered(pinHash(d));
      }
      return;
    }
    if (d.length < 6) set(d + k);
  };
  return (
    <View accessibilityLabel={label}>
      <Text variant="title">{label}</Text>
      <Text variant="display" testID="pinDots" accessibilityLabel={`${digits.length} digits`}>
        {'●'.repeat(digits.length) || ' '}
      </Text>
      {wrong ? (
        <Text variant="small" tone="attention" testID="pinWrong">
          {t.wrongPin}
        </Text>
      ) : null}
      <View style={styles.grid}>
        {keys.map((k) => (
          <Pressable
            key={k}
            testID={`key-${k}`}
            accessibilityRole="button"
            accessibilityLabel={k === '⌫' ? t.remove : k === '✓' ? t.save : k}
            onPress={() => press(k)}
            style={({ pressed }) => [styles.key, { backgroundColor: c.glassMid, borderColor: c.hairline, opacity: pressed ? 0.8 : 1 }]}
          >
            <Text variant="headline">{k}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s, marginTop: space.s },
  key: { width: '30%', minHeight: target.alert, borderRadius: radius.card, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
