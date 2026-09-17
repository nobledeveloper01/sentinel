/**
 * The organisation console's rules (ADR-0009, ADR-0012), apart from the DOM
 * so a test can hold them: what the console asks the server, what it shows,
 * and — the point — what it never shows. An alert here is *when* and
 * *whether we acknowledged*; a position is in an envelope on the phone
 * that holds the key, and a console is a screen in a room anyone can walk
 * past.
 */

export interface Api {
  get(path: string): Promise<unknown>;
  post(path: string, body: unknown): Promise<unknown>;
}

export interface OptIn {
  readonly owner: string;
  readonly accepted: boolean;
}

export interface ConsoleAlert {
  readonly id: string;
  readonly atMinutes: number;
  readonly cancelled: boolean;
  readonly acknowledgedAtMinutes: number | null;
}

export interface Patrol {
  readonly cellX: number;
  readonly cellY: number;
  readonly atMinutes: number;
}

/** Fetch with the organisation's token on every call; a wrong token is nobody and the caller is told. */
export function withToken(baseUrl: string, token: string, fetcher: typeof fetch = fetch): Api {
  const call = async (path: string, init: RequestInit): Promise<unknown> => {
    const r = await fetcher(baseUrl + path, { ...init, headers: { 'content-type': 'application/json', 'x-organisation-token': token } });
    if (r.status === 401) throw new Error('not this organisation');
    if (!r.ok) throw new Error(`the server said ${r.status}`);
    const text = await r.text();
    return text.length === 0 ? null : (JSON.parse(text) as unknown);
  };
  return {
    get: (path) => call(path, { method: 'GET' }),
    post: (path, body) => call(path, { method: 'POST', body: JSON.stringify(body) }),
  };
}

export async function optIns(api: Api): Promise<ReadonlyArray<OptIn>> {
  const rows = (await api.get('/organisations/me/optins')) as Array<{ owner: string; accepted: boolean }>;
  return rows.map((r) => ({ owner: r.owner, accepted: r.accepted }));
}

export function accept(api: Api, owner: string): Promise<unknown> {
  return api.post('/organisations/me/accept', { owner });
}

/**
 * The alerts sealed to this organisation, newest first, as the server
 * answers them. The shape is asserted here rather than trusted: a field
 * the console did not ask for is a field it will not render.
 */
export async function alerts(api: Api): Promise<ReadonlyArray<ConsoleAlert>> {
  const rows = (await api.get('/organisations/me/alerts')) as Array<{ id: string; atMinutes: number; cancelled: boolean; acknowledgedAtMinutes: number | null }>;
  return rows.map((r) => ({ id: r.id, atMinutes: r.atMinutes, cancelled: r.cancelled, acknowledgedAtMinutes: r.acknowledgedAtMinutes ?? null }));
}

export function acknowledge(api: Api, id: string, nowMinutes: number): Promise<unknown> {
  return api.post(`/organisations/me/alerts/${encodeURIComponent(id)}/ack`, { atMinutes: nowMinutes });
}

export async function patrols(api: Api): Promise<ReadonlyArray<Patrol>> {
  const rows = (await api.get('/organisations/me/patrols')) as Array<{ cellX: number; cellY: number; atMinutes: number }>;
  return rows.map((r) => ({ cellX: r.cellX, cellY: r.cellY, atMinutes: r.atMinutes }));
}

export function logPatrol(api: Api, x: number, y: number, nowMinutes: number): Promise<unknown> {
  return api.post('/organisations/me/patrols', { x, y, atMinutes: nowMinutes });
}

/** One line per alert, in the words a guard reads: when, the state, and whether we acknowledged. Never where. */
export function describeAlert(a: ConsoleAlert, nowMinutes: number): string {
  const age = nowMinutes - a.atMinutes;
  const when = age < 1 ? 'just now' : age < 60 ? `${age} min ago` : age < 1440 ? `${Math.floor(age / 60)} h ago` : `${Math.floor(age / 1440)} d ago`;
  const state = a.cancelled ? 'ended by the person' : 'in progress';
  const ack = a.acknowledgedAtMinutes === null ? 'not yet acknowledged' : 'acknowledged';
  return `${when} · ${state} · ${ack}`;
}

/** The minute the phone and the server count in. */
export function minuteNow(now: () => number = Date.now): number {
  return Math.floor(now() / 60_000);
}
