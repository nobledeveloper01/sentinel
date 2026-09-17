/**
 * Route advisory (ADR-0012): a sentence about a place and hours, from
 * expired reports, above thresholds, never a number and never a category.
 * Below the thresholds there is nothing — not *no data*, nothing — because
 * a sparse map of a city is a map of its poorer streets read as a claim
 * about the people who live there.
 */

export interface ExpiredReport {
  readonly account: string;
  readonly x: number;
  readonly y: number;
  readonly atMinutes: number;
}

/** One kilometre: coarse enough that a cell is an area, not an address. */
export const CELL_M = 1000;
export const WINDOW_MINUTES = 90 * 24 * 60;
export const MIN_REPORTS = 6;
export const MIN_ACCOUNTS = 4;
/** The band of hours that speaks: the shortest contiguous band holding at least this share of the cell's reports. */
export const BAND_SHARE = 0.6;

export interface Advisory {
  readonly cellX: number;
  readonly cellY: number;
  /** Hours of the day, inclusive start, exclusive end; may wrap midnight (from 21 to 2). */
  readonly fromHour: number;
  readonly toHour: number;
}

export function cellOf(x: number, y: number): { readonly cellX: number; readonly cellY: number } {
  return { cellX: Math.floor(x / CELL_M), cellY: Math.floor(y / CELL_M) };
}

function hourOf(atMinutes: number): number {
  return Math.floor((((atMinutes % 1440) + 1440) % 1440) / 60);
}

/**
 * The shortest band of hours, wrapping midnight if it must, that holds at
 * least `BAND_SHARE` of the counts. Ties go to the earlier start, so the
 * answer is one answer.
 */
export function band(byHour: ReadonlyArray<number>): { readonly fromHour: number; readonly toHour: number } {
  const total = byHour.reduce((a, b) => a + b, 0);
  let best: { fromHour: number; toHour: number; length: number } | null = null;
  for (let length = 1; length <= 24; length++) {
    for (let start = 0; start < 24; start++) {
      let sum = 0;
      for (let i = 0; i < length; i++) sum += byHour[(start + i) % 24] ?? 0;
      if (sum >= total * BAND_SHARE && (best === null || length < best.length)) {
        best = { fromHour: start, toHour: (start + length) % 24, length };
      }
    }
    if (best !== null) break;
  }
  return best ?? { fromHour: 0, toHour: 0 };
}

/**
 * What can be said about one cell, or null. Only reports inside the window
 * count; only a cell with enough reports from enough different accounts
 * speaks; and it says hours, not a count.
 */
export function advisoryFor(
  reports: ReadonlyArray<ExpiredReport>,
  cellX: number,
  cellY: number,
  nowMinutes: number,
): Advisory | null {
  const inCell = reports.filter((r) => {
    const c = cellOf(r.x, r.y);
    return c.cellX === cellX && c.cellY === cellY && nowMinutes - r.atMinutes <= WINDOW_MINUTES && r.atMinutes <= nowMinutes;
  });
  if (inCell.length < MIN_REPORTS) return null;
  if (new Set(inCell.map((r) => r.account)).size < MIN_ACCOUNTS) return null;
  const byHour = new Array<number>(24).fill(0);
  for (const r of inCell) byHour[hourOf(r.atMinutes)] = (byHour[hourOf(r.atMinutes)] ?? 0) + 1;
  const b = band(byHour);
  return { cellX, cellY, fromHour: b.fromHour, toHour: b.toHour };
}

/** The advisory for where the phone is, or null. */
export function advisoryAt(reports: ReadonlyArray<ExpiredReport>, x: number, y: number, nowMinutes: number): Advisory | null {
  const c = cellOf(x, y);
  return advisoryFor(reports, c.cellX, c.cellY, nowMinutes);
}
