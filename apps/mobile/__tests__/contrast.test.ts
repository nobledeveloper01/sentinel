/**
 * Every text tone on every fill it can sit on, in both palettes, glass and
 * solid, composited over the darkest and lightest wash: 4.5:1 or the build
 * fails. A calm palette that cannot be read is not calm.
 */
import { palette } from '../src/design/tokens';

function rgb(hex: string): [number, number, number, number] {
  const h = hex.replace('#', '');
  const a = h.length === 8 ? parseInt(h.slice(0, 2), 16) / 255 : 1;
  const s = h.length === 8 ? h.slice(2) : h;
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16), a];
}
function over(top: string, under: [number, number, number]): [number, number, number] {
  const [r, g, b, a] = rgb(top);
  return [r * a + under[0] * (1 - a), g * a + under[1] * (1 - a), b * a + under[2] * (1 - a)];
}
function lum([r, g, b]: [number, number, number]): number {
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function ratio(fg: [number, number, number], bg: [number, number, number]): number {
  const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
  return (a! + 0.05) / (b! + 0.05);
}

describe('contrast', () => {
  for (const [name, p] of Object.entries(palette)) {
    const washes = [p.washStart, p.washEnd, p.washTeal].map((w) => over(w, [0, 0, 0]));
    const fills = ['glassLow', 'glassMid', 'glassHigh', 'solidLow', 'solidMid', 'solidHigh'] as const;
    const texts = ['textPrimary', 'textSecondary', 'attention', 'fine'] as const;
    for (const fill of fills) {
      for (const text of texts) {
        for (const [i, wash] of washes.entries()) {
          test(`${name}: ${text} on ${fill} over wash ${i}`, () => {
            const bg = over(p[fill], wash);
            const fg = over(p[text], bg);
            expect(ratio(fg, bg)).toBeGreaterThanOrEqual(4.5);
          });
        }
      }
    }
    test(`${name}: textOnAccent on the gradient's both ends`, () => {
      for (const end of [p.accent, p.accentEnd]) {
        expect(ratio(over(p.textOnAccent, [0, 0, 0]), over(end, [0, 0, 0]))).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
});
