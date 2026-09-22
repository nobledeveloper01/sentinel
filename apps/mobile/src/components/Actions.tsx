import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useColours } from '../design/theme';
import { radius, space, target } from '../design/tokens';
import { Text } from './Text';

/**
 * The one gradient control a screen may carry (ADR-0005). On the alert
 * screen it is the panic action, at 64 dp, the largest thing on the screen.
 */
export function PrimaryAction({
  label,
  size = 'standard',
  onPress,
  onLongPress,
  disabled,
  accessibilityHint,
}: {
  label: string;
  size?: keyof typeof target;
  onPress?: PressableProps['onPress'];
  onLongPress?: PressableProps['onLongPress'];
  disabled?: boolean;
  accessibilityHint?: string;
}) {
  const c = useColours();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={1500}
      style={({ pressed }) => [styles.primary, { minHeight: target[size], opacity: disabled ? 0.5 : pressed ? 0.85 : 1 }]}
    >
      {/*
        Sized by `absoluteFill` alone. It also carried width="100%"
        height="100%", and those fight it: absoluteFill pins left and right,
        the props set an explicit width, and react-native-svg resolved the
        pair to a box narrower than the button — so the gradient stopped
        about 86% of the way across while the label stayed centred on the
        full width. It read as a button that had not finished drawing.
      */}
      <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none" viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="brand" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={c.accent} />
            <Stop offset="1" stopColor={c.accentEnd} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" rx="0" fill="url(#brand)" />
      </Svg>
      <Text variant={size === 'panic' ? 'headline' : 'title'} tone="onAccent">
        {label}
      </Text>
    </Pressable>
  );
}

/** Every other control: glass at the mid depth, the hairline round it. */
export function SecondaryAction({ label, onPress, disabled }: { label: string; onPress?: PressableProps['onPress']; disabled?: boolean }) {
  const c = useColours();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.secondary, { backgroundColor: c.glassMid, borderColor: c.hairline, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 }]}
    >
      <Text variant="title">{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primary: { borderRadius: radius.card, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.l },
  secondary: { borderRadius: radius.card, borderWidth: 1.5, minHeight: target.standard, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.l },
});

export function Gap({ h = space.m }: { h?: number }) {
  return <View style={{ height: h }} />;
}
