import { View, type ViewProps } from 'react-native';

import { useColours, useTheme } from '../design/theme';
import { radius, space } from '../design/tokens';

export type Depth = 'low' | 'mid' | 'high';

/**
 * A glass surface at one of three depths, each meaning one thing (ADR-0005):
 * low for a card in a list, mid for a control, high for a sheet or the lock.
 * Under `Plain surfaces` it draws its solid twin, and nothing else changes.
 * The blur itself is the platform's on a device that has it; here the wash
 * shows through the alpha, which is what a 2 GB phone can afford.
 */
export function Glass({ depth = 'low', children, style, ...rest }: ViewProps & { depth?: Depth }) {
  const c = useColours();
  const { glass } = useTheme();
  const fill = glass
    ? { low: c.glassLow, mid: c.glassMid, high: c.glassHigh }[depth]
    : { low: c.solidLow, mid: c.solidMid, high: c.solidHigh }[depth];
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: fill,
          borderRadius: depth === 'high' ? radius.sheet : radius.card,
          borderWidth: 1,
          borderColor: c.hairline,
          padding: space.m,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
