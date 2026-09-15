/**
 * The closed list (ADR-0003). Events at places; nothing about a person. The
 * list cannot be extended at runtime and the test asserts there is no
 * category whose name contains a word for a person.
 */
export const CATEGORIES = [
  'robbery',
  'burglary',
  'road_blocked',
  'accident',
  'fire',
  'flooding',
  'gunfire_heard',
  'unrest_or_protest',
  'building_collapse',
  'power_line_down',
  'missing_person_appeal',
] as const;

export type Category = (typeof CATEGORIES)[number];

/** Hours before a report of each category leaves the feed (FR-4.5). */
export const EXPIRY_HOURS: Readonly<Record<Category, number>> = {
  robbery: 24,
  burglary: 24,
  road_blocked: 6,
  accident: 6,
  fire: 12,
  flooding: 48,
  gunfire_heard: 6,
  unrest_or_protest: 12,
  building_collapse: 48,
  power_line_down: 24,
  missing_person_appeal: 72,
};

/**
 * The one category that involves a person, available only to a verified
 * organisation or verified next of kin, and never distributed without a
 * human's review.
 */
export const HUMAN_REVIEW_ALWAYS: ReadonlySet<Category> = new Set(['missing_person_appeal']);

export function isCategory(s: string): s is Category {
  return (CATEGORIES as ReadonlyArray<string>).includes(s);
}

export function expired(category: Category, reportedMinutes: number, nowMinutes: number): boolean {
  return nowMinutes - reportedMinutes >= EXPIRY_HOURS[category] * 60;
}

/** Per account: three per day and one per half hour (FR-4.6). */
export function mayReportAgain(previousReportMinutes: ReadonlyArray<number>, nowMinutes: number): boolean {
  const day = previousReportMinutes.filter((m) => nowMinutes - m < 24 * 60).length;
  const halfHour = previousReportMinutes.some((m) => nowMinutes - m < 30);
  return day < 3 && !halfHour;
}
