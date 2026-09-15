/**
 * The official numbers (ADR-0006 #5), bundled, by state, on every alert
 * surface before Sentinel's own actions. Sentinel is not a substitute for
 * them and says so. A sample of states here; the table is data and grows.
 */
export interface OfficialNumber {
  readonly label: string;
  readonly number: string;
}

export const NATIONAL: ReadonlyArray<OfficialNumber> = [
  { label: 'Emergency', number: '112' },
  { label: 'Police', number: '199' },
  { label: 'Fire', number: '112' },
];

export const BY_STATE: Readonly<Record<string, ReadonlyArray<OfficialNumber>>> = {
  Lagos: [
    { label: 'Lagos emergency', number: '767' },
    { label: 'Lagos emergency (alt)', number: '112' },
    { label: 'LASEMA', number: '08060907333' },
  ],
  FCT: [{ label: 'FCT emergency', number: '112' }],
  Kano: [{ label: 'Kano emergency', number: '112' }],
  Rivers: [{ label: 'Rivers emergency', number: '112' }],
};

export function numbersFor(state: string | null): ReadonlyArray<OfficialNumber> {
  const local = state ? BY_STATE[state] ?? [] : [];
  const seen = new Set<string>();
  return [...local, ...NATIONAL].filter((n) => (seen.has(n.number) ? false : (seen.add(n.number), true)));
}
