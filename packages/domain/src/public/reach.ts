/**
 * Reach is earned (ADR-0002).
 *
 * A report is visible to 500 metres and widens only with independent
 * corroboration, reporter standing and time. The stage is a pure function of
 * the evidence, computed on the server with authority; the client renders
 * what it is given and can influence nothing.
 *
 * The rule the rest of this file exists to keep: no sequence of actions by
 * one account, or by any set of accounts that collapses to one under the
 * independence rule, advances a report beyond `reported`. The property test
 * in `test/reach.test.ts` generates worlds and checks it.
 */

export type Stage = 'reported' | 'corroborated' | 'confirmed' | 'verified';

/** Metres each stage may travel; `verified` is area-wide. */
export const RADIUS_M: Readonly<Record<Stage, number>> = {
  reported: 500,
  corroborated: 2_000,
  confirmed: 5_000,
  verified: Number.POSITIVE_INFINITY,
};

/** Who may be told by push at each stage. Below `confirmed`, nobody. */
export const PUSH: Readonly<Record<Stage, 'none' | 'opt-in' | 'yes'>> = {
  reported: 'none',
  corroborated: 'none',
  confirmed: 'opt-in',
  verified: 'yes',
};

export interface Account {
  readonly id: string;
  /** Minutes since 1970 the account was created. */
  readonly createdMinutes: number;
  /** Signals that make two accounts one for counting (FR-4.3). */
  readonly device: string;
  readonly installLineage: string;
  /** Account ids this one is in a circle with. */
  readonly circle: ReadonlyArray<string>;
  /** A coarse location-history fingerprint; equal means implausibly correlated. */
  readonly locationTrace: string;
  /** True for a verified organisation with an accountable administrator. */
  readonly organisation: boolean;
}

export interface Report {
  readonly id: string;
  readonly reporter: string;
  readonly atMinutes: number;
  /** Coarse position in metres on a local grid: enough to measure distance. */
  readonly x: number;
  readonly y: number;
}

export interface Corroboration {
  readonly by: string;
  readonly report: string;
  readonly atMinutes: number;
  readonly x: number;
  readonly y: number;
}

export interface Dispute {
  readonly by: string;
  readonly report: string;
  readonly atMinutes: number;
  readonly reason: 'didnt_happen' | 'already_over' | 'wrong_location' | 'old_news';
}

export interface Evidence {
  readonly accounts: ReadonlyMap<string, Account>;
  readonly report: Report;
  readonly corroborations: ReadonlyArray<Corroboration>;
  readonly disputes: ReadonlyArray<Dispute>;
  /** Reports in the same area and window, for the velocity rule. */
  readonly nearbyReportsInWindow: number;
  /** The area's usual count for that window; a surge is a multiple of it. */
  readonly baselineForWindow: number;
  /** An official source (a verified feed) has confirmed this report. */
  readonly officialSource: boolean;
  readonly nowMinutes: number;
}

/** A new account may not report for 48 hours or corroborate for 14 days (FR-1.2). */
export const MAY_REPORT_AFTER_MINUTES = 48 * 60;
export const MAY_CORROBORATE_AFTER_MINUTES = 14 * 24 * 60;

export const CORROBORATION_WINDOW_MINUTES = 30;
export const CORROBORATION_WITHIN_M = 1_000;

/** A surge: this many times the baseline, and at least this many reports. */
export const VELOCITY_MULTIPLE = 4;
export const VELOCITY_FLOOR = 6;

/** Disputes at or above this share of (corroborations + disputes) downgrade. */
export const DISPUTE_RATIO = 0.5;

/**
 * Two accounts are independent when they share none of the signals FR-4.3
 * names. Independence is symmetric and is not transitive: the collapse below
 * handles chains.
 */
export function independent(a: Account, b: Account): boolean {
  if (a.id === b.id) return false;
  if (a.device === b.device) return false;
  if (a.installLineage === b.installLineage) return false;
  if (a.circle.includes(b.id) || b.circle.includes(a.id)) return false;
  if (a.locationTrace === b.locationTrace) return false;
  return true;
}

/**
 * Accounts that share any signal, directly or through a chain, count as one.
 * Returns one representative per group.
 */
export function collapse(accounts: ReadonlyArray<Account>): ReadonlyArray<Account> {
  const groups: Account[][] = [];
  for (const a of accounts) {
    const joined = groups.filter((g) => g.some((m) => !independent(a, m)));
    if (joined.length === 0) {
      groups.push([a]);
    } else {
      // Merge every group this account links, so a chain collapses too.
      const merged = joined.flat().concat(a);
      for (const g of joined) groups.splice(groups.indexOf(g), 1);
      groups.push(merged);
    }
  }
  return groups.map((g) => g[0]!);
}

function distanceM(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

/**
 * Independent corroborators: established accounts, within the window and the
 * distance, independent of the reporter and of each other.
 */
export function independentCorroborators(e: Evidence): ReadonlyArray<Account> {
  const reporter = e.accounts.get(e.report.reporter);
  const candidates: Account[] = [];
  for (const c of e.corroborations) {
    if (c.report !== e.report.id) continue;
    const a = e.accounts.get(c.by);
    if (!a) continue;
    if (c.atMinutes - a.createdMinutes < MAY_CORROBORATE_AFTER_MINUTES) continue;
    if (c.atMinutes < e.report.atMinutes) continue;
    if (c.atMinutes - e.report.atMinutes > CORROBORATION_WINDOW_MINUTES) continue;
    if (distanceM(c.x, c.y, e.report.x, e.report.y) > CORROBORATION_WITHIN_M) continue;
    if (reporter && !independent(a, reporter)) continue;
    if (candidates.some((x) => x.id === a.id)) continue;
    candidates.push(a);
  }
  return collapse(candidates);
}

/** A surge in the area, which suppresses distribution pending a person. */
export function surge(e: Evidence): boolean {
  return (
    e.nearbyReportsInWindow >= VELOCITY_FLOOR &&
    e.nearbyReportsInWindow >= e.baselineForWindow * VELOCITY_MULTIPLE
  );
}

/** Disputes from established, independent accounts, collapsed. */
export function independentDisputers(e: Evidence): ReadonlyArray<Account> {
  const seen: Account[] = [];
  for (const d of e.disputes) {
    if (d.report !== e.report.id) continue;
    const a = e.accounts.get(d.by);
    if (!a) continue;
    if (d.atMinutes - a.createdMinutes < MAY_CORROBORATE_AFTER_MINUTES) continue;
    if (seen.some((x) => x.id === a.id)) continue;
    seen.push(a);
  }
  return collapse(seen);
}

/**
 * The stage. Order of the rules is the order of the safeguards: a report that
 * should not exist is nothing; a surge pins everything to `reported`; a
 * dispute ratio pulls the stage down; then the evidence is counted.
 */
export function stageOf(e: Evidence): Stage | 'none' {
  const reporter = e.accounts.get(e.report.reporter);
  if (!reporter) return 'none';
  if (e.report.atMinutes - reporter.createdMinutes < MAY_REPORT_AFTER_MINUTES && !reporter.organisation) {
    return 'none';
  }
  if (surge(e)) return 'reported';
  const corroborators = independentCorroborators(e);
  const disputers = independentDisputers(e);
  const votes = corroborators.length + disputers.length;
  if (votes > 0 && disputers.length / votes >= DISPUTE_RATIO) return 'reported';
  const orgs = corroborators.filter((a) => a.organisation).length + (reporter.organisation ? 1 : 0);
  const n = corroborators.length;
  if (e.officialSource || (orgs >= 1 && n >= 4)) return 'verified';
  if (n >= 4 || orgs >= 1) return 'confirmed';
  if (n >= 2) return 'corroborated';
  return 'reported';
}

/** The metres a report at this stage may travel; nothing for `none`. */
export function radiusOf(stage: Stage | 'none'): number {
  return stage === 'none' ? 0 : RADIUS_M[stage];
}
