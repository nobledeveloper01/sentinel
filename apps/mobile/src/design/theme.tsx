import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { palette, type Colours } from './tokens';

/**
 * The palette follows the phone (ADR-0005 keeps no default of its own: a
 * frightened person at night is on a phone already in the mode they chose),
 * and two toggles turn glass and motion off at act time. Both are complete
 * modes, not degraded ones.
 */
export interface Theme {
  readonly colours: Colours;
  readonly isDark: boolean;
  /** False: every glass surface draws its solid twin. */
  readonly glass: boolean;
  /** True: every duration is zero. */
  readonly reduced: boolean;
}

const ThemeContext = createContext<Theme>({
  colours: palette.light,
  isDark: false,
  glass: true,
  reduced: false,
});

export function ThemeProvider({
  children,
  glass = true,
  reduced = false,
}: {
  children: ReactNode;
  glass?: boolean;
  reduced?: boolean;
}) {
  const scheme = useColorScheme();
  const value = useMemo<Theme>(() => {
    const isDark = scheme === 'dark';
    return { colours: isDark ? palette.dark : palette.light, isDark, glass, reduced };
  }, [scheme, glass, reduced]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

export function useColours(): Colours {
  return useContext(ThemeContext).colours;
}
