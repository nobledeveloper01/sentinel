import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, type GestureResponderEvent } from 'react-native';

import { duress as D } from '@sentinel/domain';

import { Text } from './Text';
import { useColours } from '../design/theme';
import { radius, space, target } from '../design/tokens';
import { t } from '../phrases';

/**
 * The interaction a coercer cannot perform by reaching over (ADR-0008): two
 * fingers, held for two seconds. The domain owns the numbers; this owns the
 * touches. Lifting a finger early starts again from nothing.
 */
export function HoldToCancel({ label, onHeld }: { label: string; onHeld: () => void }) {
  const c = useColours();
  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  };
  useEffect(() => clear, []);
  const touches = (e: GestureResponderEvent) => e.nativeEvent.touches.length;
  const onTouch = (e: GestureResponderEvent) => {
    const n = touches(e);
    if (D.gestureAccepted({ fingers: n, heldMs: D.CANCEL_HOLD_MS })) {
      if (!timer.current) {
        setHolding(true);
        timer.current = setTimeout(() => {
          timer.current = null;
          setHolding(false);
          onHeld();
        }, D.CANCEL_HOLD_MS);
      }
    } else {
      clear();
    }
  };
  return (
    <View
      testID="holdToCancel"
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={t.cancelHow}
      onTouchStart={onTouch}
      onTouchMove={onTouch}
      onTouchEnd={onTouch}
      onTouchCancel={clear}
      style={[styles.pad, { backgroundColor: holding ? c.accent : c.glassMid, borderColor: c.hairline }]}
    >
      <Text variant="title" tone={holding ? 'onAccent' : 'primary'}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { minHeight: target.panic, borderRadius: radius.card, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.l },
});
