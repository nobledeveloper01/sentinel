/**
 * The personal alert (FR-2): fast, unmetered, unconditional, to the circle
 * and the organisations the user opted into, and to nobody else. The record
 * is append-only: sent, each channel's attempt, each acknowledgement, the
 * cancel, and the duress facts — and it is what the debrief and the signed
 * export read.
 */

export type Channel = 'push' | 'serverSms' | 'deviceSms' | 'mesh';

export type AlertEvent =
  | { readonly kind: 'triggered'; readonly at: number; readonly path: string; readonly silent: boolean; readonly drill: boolean }
  | { readonly kind: 'attempt'; readonly at: number; readonly channel: Channel; readonly to: string; readonly outcome: 'delivered' | 'failed' | 'unknown' }
  | { readonly kind: 'acknowledged'; readonly at: number; readonly by: string }
  | { readonly kind: 'openedUnderDuress'; readonly at: number }
  | { readonly kind: 'cancelled'; readonly at: number; readonly underDuress: boolean }
  | { readonly kind: 'ended'; readonly at: number };

export interface AlertRecord {
  readonly id: string;
  readonly events: ReadonlyArray<AlertEvent>;
}

export function append(r: AlertRecord, e: AlertEvent): AlertRecord {
  return { id: r.id, events: [...r.events, e] };
}

export type Delivery =
  | { readonly state: 'delivered'; readonly by: ReadonlyArray<Channel> }
  | { readonly state: 'trying'; readonly since: number }
  | { readonly state: 'not delivered' };

/**
 * The honest state (FR-2.3): delivered by at least one channel, still
 * trying, or plainly not — and the screen puts the official numbers first
 * in the last case.
 */
export function delivery(r: AlertRecord, nowMinutes: number, patienceMinutes = 2): Delivery {
  const attempts = r.events.filter((e): e is Extract<AlertEvent, { kind: 'attempt' }> => e.kind === 'attempt');
  const ok = attempts.filter((a) => a.outcome === 'delivered').map((a) => a.channel);
  if (ok.length > 0) return { state: 'delivered', by: [...new Set(ok)] };
  const t = r.events.find((e) => e.kind === 'triggered');
  if (t && nowMinutes - t.at < patienceMinutes && attempts.some((a) => a.outcome === 'unknown')) {
    return { state: 'trying', since: t.at };
  }
  return { state: 'not delivered' };
}

/** Who has acknowledged and who has not — never where they are (ADR-0006 #14). */
export function acknowledgements(r: AlertRecord, circle: ReadonlyArray<string>): ReadonlyArray<{ readonly who: string; readonly at: number | null }> {
  return circle.map((who) => {
    const a = r.events.find((e) => e.kind === 'acknowledged' && e.by === who);
    return { who, at: a && a.kind === 'acknowledged' ? a.at : null };
  });
}

export function isOver(r: AlertRecord): boolean {
  return r.events.some((e) => e.kind === 'cancelled' || e.kind === 'ended');
}

/** The mirror, for the user only: sent and cancelled, never a score to anyone else. */
export function falseAlarmMirror(records: ReadonlyArray<AlertRecord>): { readonly sent: number; readonly cancelled: number } {
  const real = records.filter((r) => !r.events.some((e) => e.kind === 'triggered' && e.drill));
  return {
    sent: real.length,
    cancelled: real.filter((r) => r.events.some((e) => e.kind === 'cancelled')).length,
  };
}
