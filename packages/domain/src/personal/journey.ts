/**
 * Safe arrival (FR-3), the wedge. A journey has an expected end; at that
 * minute the phone asks, at +5 and +10 it asks again, at +15 (configurable)
 * the chosen circle members are told with the last known position and the
 * trail. The plan is computed once so the device can schedule it with the
 * app killed and the server can run the same plan with the phone dead.
 * Arrival by geofence still asks; automatic detection never cancels an
 * escalation silently.
 */

export interface Journey {
  readonly id: string;
  readonly startedMinutes: number;
  readonly expectedMinutes: number;
  /** Circle members told on escalation; live sharing is a separate flag. */
  readonly notify: ReadonlyArray<string>;
  readonly liveShare: boolean;
  readonly graceMinutes: number;
  readonly destination: { readonly x: number; readonly y: number; readonly label: string };
}

export const DEFAULT_GRACE_MINUTES = 15;
export const ARRIVAL_GEOFENCE_M = 150;

export type JourneyState =
  | 'underway'
  | 'asking'
  | 'reminding'
  | 'escalated'
  | 'arrived'
  | 'cancelled';

export interface Plan {
  readonly ask: number;
  readonly remind: ReadonlyArray<number>;
  readonly escalate: number;
}

/** The minutes at which each step fires, from one expected time. */
export function plan(j: Journey): Plan {
  return {
    ask: j.expectedMinutes,
    remind: [j.expectedMinutes + 5, j.expectedMinutes + 10].filter((m) => m < j.expectedMinutes + j.graceMinutes),
    escalate: j.expectedMinutes + j.graceMinutes,
  };
}

/** What the journey is at a minute, given nothing has been confirmed. */
export function stateAt(j: Journey, nowMinutes: number, confirmed: boolean, cancelled: boolean): JourneyState {
  if (cancelled) return 'cancelled';
  if (confirmed) return 'arrived';
  const p = plan(j);
  if (nowMinutes >= p.escalate) return 'escalated';
  if (p.remind.some((m) => nowMinutes >= m)) return 'reminding';
  if (nowMinutes >= p.ask) return 'asking';
  return 'underway';
}

/** Inside the fence: the app asks *are you home?* — it never decides. */
export function nearDestination(j: Journey, x: number, y: number): boolean {
  return Math.hypot(x - j.destination.x, y - j.destination.y) <= ARRIVAL_GEOFENCE_M;
}

/**
 * Whether the battery outlasts the journey (ADR-0006 #4): the app says so at
 * the start, and says the server escalates regardless.
 */
export function batteryOutlasts(batteryMinutesLeft: number, j: Journey, nowMinutes: number): boolean {
  return batteryMinutesLeft >= j.expectedMinutes + j.graceMinutes - nowMinutes;
}

/**
 * The server's copy of the plan needs only the expected minute, the grace,
 * and who to tell — never the destination, which stays on the phone.
 */
export function serverPlan(j: Journey): { readonly escalateAtMinutes: number; readonly notify: ReadonlyArray<string> } {
  return { escalateAtMinutes: plan(j).escalate, notify: j.notify };
}
