import { StyleSheet, View, type ViewProps } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useColours, useTheme } from '../design/theme';

/**
 * The night mesh behind every screen: two washes and a teal bloom. Under
 * `Plain surfaces` it is one flat colour, which is the solid floor.
 */
export function Mesh({ children, style, ...rest }: ViewProps) {
  const c = useColours();
  const { glass } = useTheme();
  return (
    <View {...rest} style={[StyleSheet.absoluteFill, { backgroundColor: c.washStart }, style]}>
      {glass ? (
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
          <Defs>
            <LinearGradient id="wash" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={c.washStart} />
              <Stop offset="0.55" stopColor={c.washTeal} />
              <Stop offset="1" stopColor={c.washEnd} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100" height="100" fill="url(#wash)" />
        </Svg>
      ) : null}
      {children}
    </View>
  );
}
