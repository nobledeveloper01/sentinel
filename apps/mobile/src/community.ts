import { categories as Cat, reach as R, screen as S } from '@sentinel/domain';

import { toXY } from './geo';
import type { Position } from './relay';
import type { Transport } from './transport';

/**
 * The public path on the phone (ADR-0002, ADR-0003, ADR-0007): a report is a
 * category at a place; free text goes through the screen here before it goes
 * anywhere, and the server screens it again; what comes back is only what
 * the reach engine let reach this position. No counts come back, by design.
 */
export interface NearbyReport {
  readonly id: string;
  readonly category: Cat.Category;
  readonly atMinutes: number;
  readonly text: string | null;
  readonly stage: R.Stage;
  readonly distanceM: number;
}

export type Refusal = { readonly reason: string; readonly details: ReadonlyArray<string> };

export const DISPUTE_REASONS = ['didnt_happen', 'wrong_place', 'already_over', 'duplicate'] as const;
export type DisputeReason = (typeof DISPUTE_REASONS)[number];

function refusal(body: unknown): Refusal {
  const b = (body ?? {}) as { reason?: string; details?: ReadonlyArray<string> };
  return { reason: b.reason ?? 'unreachable', details: b.details ?? [] };
}

/** The screen on the phone: the same rules as the server, before a byte leaves. */
export function screenOnDevice(text: string): S.Screened {
  return S.screenText(text);
}

export async function report(transport: Transport, account: string, category: Cat.Category, at: Position, text: string | null, nowMinutes: number): Promise<{ id: string } | Refusal> {
  if (text && !S.screenText(text).ok) return { reason: 'about a person', details: S.screenText(text).reasons };
  const { x, y } = toXY(at);
  const r = await transport.post('/reports', { account, category, x, y, text, nowMinutes });
  return r.ok ? { id: (r.body as { id: string }).id } : refusal(r.body);
}

export async function nearby(transport: Transport, account: string, at: Position, nowMinutes: number): Promise<ReadonlyArray<NearbyReport> | null> {
  const { x, y } = toXY(at);
  const r = await transport.get(`/reports/nearby?account=${encodeURIComponent(account)}&x=${x}&y=${y}&nowMinutes=${nowMinutes}`);
  if (!r.ok || !Array.isArray(r.body)) return null;
  return (r.body as Array<{ id: string; category: string; atMinutes: number; text: string | null; stage: string; distanceM: number }>)
    .filter((n) => Cat.isCategory(n.category))
    .map((n) => ({ id: n.id, category: n.category as Cat.Category, atMinutes: n.atMinutes, text: n.text, stage: asStage(n.stage), distanceM: n.distanceM }));
}

function asStage(s: string): R.Stage {
  return s === 'corroborated' || s === 'confirmed' || s === 'verified' ? s : 'reported';
}

export async function corroborate(transport: Transport, id: string, account: string, at: Position, nowMinutes: number): Promise<Refusal | null> {
  const { x, y } = toXY(at);
  const r = await transport.post(`/reports/${id}/corroborate`, { account, x, y, nowMinutes });
  return r.ok ? null : refusal(r.body);
}

export async function dispute(transport: Transport, id: string, account: string, reason: DisputeReason, nowMinutes: number): Promise<Refusal | null> {
  const r = await transport.post(`/reports/${id}/dispute`, { account, reason, nowMinutes });
  return r.ok ? null : refusal(r.body);
}

export async function withdraw(transport: Transport, id: string, account: string): Promise<Refusal | null> {
  const r = await transport.post(`/reports/${id}/withdraw`, { account });
  return r.ok ? null : refusal(r.body);
}

/** Reports this account was shown that were since withdrawn: the corrections it is owed (FR-4.4). */
export async function corrections(transport: Transport, account: string): Promise<ReadonlyArray<string>> {
  const r = await transport.get(`/reports/corrections?account=${encodeURIComponent(account)}`);
  return r.ok && Array.isArray(r.body) ? (r.body as string[]) : [];
}

/**
 * The advisory for where the phone is (ADR-0012): a place and hours, or
 * null — and null renders nothing. A server that cannot be reached is null
 * too; there is no advisory to be wrong about.
 */
export async function advisory(transport: Transport, at: Position, nowMinutes: number): Promise<{ fromHour: number; toHour: number } | null> {
  const { x, y } = toXY(at);
  const r = await transport.get(`/advisory?x=${x}&y=${y}&nowMinutes=${nowMinutes}`);
  if (!r.ok || r.status === 204 || r.body === null || typeof r.body !== 'object') return null;
  const b = r.body as { fromHour?: number; toHour?: number };
  return typeof b.fromHour === 'number' && typeof b.toHour === 'number' ? { fromHour: b.fromHour, toHour: b.toHour } : null;
}
