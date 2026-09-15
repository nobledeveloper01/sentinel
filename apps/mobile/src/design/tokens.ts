/**
 * The design tokens from `DESIGN.md`, and nothing else.
 *
 * No screen defines a colour, a size or a spacing of its own. `make
 * design-check` reads this file and DESIGN.md and fails when they disagree,
 * and fails on any colour literal outside this file — including, on purpose,
 * any red: there is no `danger` token, and that is ADR-0005.
 */

export const palette = {
  light: {
    washStart: '#E8F1F6',
    washEnd: '#EEF0F8',
    washTeal: '#DCEEF2',
    glassLow: '#8CFFFFFF',
    glassMid: '#B3FFFFFF',
    glassHigh: '#D9FFFFFF',
    solidLow: '#F6F8FB',
    solidMid: '#FFFFFF',
    solidHigh: '#FFFFFF',
    textPrimary: '#0B1826',
    textSecondary: '#4B5B6E',
    textOnAccent: '#FFFFFF',
    accent: '#0F5E78',
    accentEnd: '#3450A8',
    attention: '#8A5A00',
    fine: '#1E6B45',
    hairline: '#C6D0DB',
    code: '#000000',
  },
  dark: {
    washStart: '#0A1A2B',
    washEnd: '#0F1F2E',
    washTeal: '#0C2B33',
    glassLow: '#0FFFFFFF',
    glassMid: '#1AFFFFFF',
    glassHigh: '#29FFFFFF',
    solidLow: '#132131',
    solidMid: '#1A2B3D',
    solidHigh: '#22364B',
    textPrimary: '#EEF3F8',
    textSecondary: '#AEBBCA',
    textOnAccent: '#06121E',
    accent: '#5CC3D6',
    accentEnd: '#8FA3F0',
    attention: '#F0B650',
    fine: '#7ADDA6',
    hairline: '#2B3A4B',
    code: '#000000',
  },
} as const;

export type Colours = (typeof palette)['light'] | (typeof palette)['dark'];

/** Inter, bundled; sizes and line heights from DESIGN.md. */
export const typeScale = {
  display: { fontSize: 32, lineHeight: 38, fontFamily: 'Inter-SemiBold' },
  headline: { fontSize: 22, lineHeight: 28, fontFamily: 'Inter-SemiBold' },
  title: { fontSize: 17, lineHeight: 22, fontFamily: 'Inter-SemiBold' },
  body: { fontSize: 16, lineHeight: 24, fontFamily: 'Inter-Regular' },
  secondary: { fontSize: 14, lineHeight: 20, fontFamily: 'Inter-Regular' },
  small: { fontSize: 12, lineHeight: 16, fontFamily: 'Inter-Medium' },
} as const;

export const space = { xs: 4, s: 8, sm: 12, m: 16, l: 24, xl: 32, xxl: 48 } as const;
export const radius = { card: 20, sheet: 28, chip: 14, input: 12 } as const;

/** 48 standard, 56 on the alert screen, 64 for the panic action (DESIGN.md). */
export const target = { standard: 48, alert: 56, panic: 64 } as const;

/** Every duration has a zero twin, read at act time from `motion`. */
export const duration = { enter: 200, exit: 150, sweep: 400 } as const;
