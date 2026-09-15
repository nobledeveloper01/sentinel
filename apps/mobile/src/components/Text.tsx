import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useColours } from '../design/theme';
import { typeScale, type Colours } from '../design/tokens';

type Role = keyof typeof typeScale;
type Tone = 'primary' | 'secondary' | 'onAccent' | 'attention' | 'fine';

const TONE: Record<Tone, keyof Colours> = {
  primary: 'textPrimary',
  secondary: 'textSecondary',
  onAccent: 'textOnAccent',
  attention: 'attention',
  fine: 'fine',
};

/** Every word on every screen goes through here, in Inter, from the scale. */
export function Text({ variant = 'body', tone = 'primary', style, ...rest }: RNTextProps & { variant?: Role; tone?: Tone }) {
  const c = useColours();
  return <RNText {...rest} allowFontScaling maxFontSizeMultiplier={2} style={[typeScale[variant], { color: c[TONE[tone]] }, style]} />;
}
