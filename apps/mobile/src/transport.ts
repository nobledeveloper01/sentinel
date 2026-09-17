/**
 * The wire, as the app sees it: a path, a body, an answer. `fetchTransport`
 * is the real one; `memoryTransport` is a server in a test — it holds
 * accounts and alerts the way the .NET one does, can be told to refuse, and
 * lets a test read back exactly what the server would hold.
 */
import { screen } from '@sentinel/domain';

const { screenText } = screen;

export interface Reply {
  readonly ok: boolean;
  readonly status: number;
  readonly body: unknown;
}

export interface Transport {
  get(path: string): Promise<Reply>;
  post(path: string, body: unknown): Promise<Reply>;
}

export function fetchTransport(baseUrl: string): Transport {
  const call = async (path: string, init: RequestInit): Promise<Reply> => {
    try {
      const r = await fetch(baseUrl + path, { ...init, headers: { 'content-type': 'application/json' } });
      let body: unknown = null;
      try {
        body = await r.json();
      } catch {
        body = null;
      }
      return { ok: r.ok, status: r.status, body };
    } catch {
      return { ok: false, status: 0, body: null };
    }
  };
  return {
    get: (path) => call(path, { method: 'GET' }),
    post: (path, body) => call(path, { method: 'POST', body: JSON.stringify(body) }),
  };
}

export interface HeldAlert {
  readonly id: string;
  readonly from: string;
  readonly atMinutes: number;
  readonly envelopes: ReadonlyArray<{ to: string; nonce: string; ciphertext: string; from?: string }>;
  readonly smsFallback: ReadonlyArray<{ to: string; text: string }>;
  readonly attempts: ReadonlyArray<{ channel: string; toPhoneHash: string; outcome: string; atMinutes: number }>;
  readonly acknowledgements: ReadonlyArray<{ byPhoneHash: string; atMinutes: number }>;
}

export interface CircleRow {
  readonly owner: string;
  readonly withPhoneHash: string;
  accepted: boolean;
  language: string | null;
}

export interface HeldReport {
  readonly id: string;
  readonly account: string;
  readonly category: string;
  readonly x: number;
  readonly y: number;
  readonly text: string | null;
  readonly atMinutes: number;
  withdrawn: boolean;
  readonly corroborations: string[];
  readonly disputes: Array<{ by: string; reason: string }>;
  readonly shown: Set<string>;
}

export interface HeldJourney {
  readonly id: string;
  readonly account: string;
  readonly expectedMinutes: number;
  readonly graceMinutes: number;
  readonly notify: ReadonlyArray<string>;
  readonly watch: boolean;
  readonly positions: Array<{ to: string; atMinutes: number; from: string; nonce: string; ciphertext: string }>;
}

export interface MemoryServer extends Transport {
  /** Journeys and watches, with the sealed positions a watch relays. */
  readonly journeys: Map<string, HeldJourney>;
  /** The organisations somebody vouched for, as the server would list them. */
  readonly organisations: Array<{ phoneHash: string; name: string }>;
  /** What `/advisory` answers, or null for silence. */
  advisory: { fromHour: number; toHour: number } | null;
  /** Reports, with a reach of 500 m and the stage the memory server gives: one voice, or *corroborated* at two. */
  readonly reports: Map<string, HeldReport>;
  getSync(path: string): Reply;
  postSync(path: string, body: unknown): Reply;
  readonly keys: Map<string, string>;
  readonly alerts: Map<string, HeldAlert>;
  readonly circles: CircleRow[];
  /** Alert id → cancelled under duress, as the phone told the server. */
  readonly cancels: Map<string, boolean>;
  readonly openedUnderDuress: Set<string>;
  /** The invitee's phone accepting, which only her phone can do. */
  accept(owner: string, withPhoneHash: string, language: string): void;
  /** A member's phone acknowledging an alert, which only her phone can do. */
  ack(alertId: string, byPhoneHash: string, atMinutes: number): void;
  /** Every byte the server has been handed, for a test to search. */
  everythingHeld(): string;
  refuse(on: boolean): void;
  smsDelivers(on: boolean): void;
}

export function memoryTransport(): MemoryServer {
  const keys = new Map<string, string>();
  const alerts = new Map<string, HeldAlert>();
  const circles: CircleRow[] = [];
  const cancels = new Map<string, boolean>();
  const reports = new Map<string, HeldReport>();
  const openedUnderDuress = new Set<string>();
  const journeys = new Map<string, HeldJourney>();
  const organisations: Array<{ phoneHash: string; name: string }> = [];
  let refusing = false;
  let sms = true;
  const held: string[] = [];
  const reply = (status: number, body: unknown = null): Reply => ({ ok: status < 400, status, body });
  return {
    keys,
    alerts,
    circles,
    cancels,
    openedUnderDuress,
    reports,
    journeys,
    organisations,
    advisory: null,
    ack(alertId, byPhoneHash, atMinutes) {
      const a = alerts.get(alertId);
      if (a) alerts.set(alertId, { ...a, acknowledgements: [...a.acknowledgements, { byPhoneHash, atMinutes }] });
    },
    accept(owner, withPhoneHash, language) {
      const row = circles.find((c) => c.owner === owner && c.withPhoneHash === withPhoneHash);
      if (row) {
        row.accepted = true;
        row.language = language;
      }
    },
    everythingHeld: () => held.join('\n') + '\n' + JSON.stringify([...keys], null, 0) + JSON.stringify([...alerts], null, 0) + JSON.stringify(circles) + JSON.stringify([...journeys]),
    refuse: (on) => {
      refusing = on;
    },
    smsDelivers: (on) => {
      sms = on;
    },
    get(path) {
      return Promise.resolve(this.getSync(path));
    },
    getSync(path: string): Reply {
      if (refusing) return reply(503);
      const key = /^\/keys\/(.+)$/.exec(path);
      if (key) {
        const pk = keys.get(key[1]!);
        return pk === undefined ? reply(404) : reply(200, { publicKey: pk });
      }
      const alert = /^\/alerts\/(.+)$/.exec(path);
      if (alert) {
        const a = alerts.get(alert[1]!);
        return a === undefined ? reply(404) : reply(200, a);
      }
      const nearby = /^\/reports\/nearby\?account=([^&]+)&x=([^&]+)&y=([^&]+)&nowMinutes=(\d+)$/.exec(path);
      if (nearby) {
        const [, account, xs, ys] = nearby;
        const x = Number(xs);
        const y = Number(ys);
        const out = [...reports.values()]
          .filter((r) => !r.withdrawn)
          .map((r) => ({ r, d: Math.sqrt((r.x - x) ** 2 + (r.y - y) ** 2) }))
          .filter(({ r, d }) => d <= (r.corroborations.length >= 2 ? 1000 : 500))
          .map(({ r, d }) => {
            r.shown.add(decodeURIComponent(account!));
            return { id: r.id, category: r.category, atMinutes: r.atMinutes, x: r.x, y: r.y, text: r.text, stage: r.corroborations.length >= 2 ? 'corroborated' : 'reported', distanceM: Math.round(d) };
          });
        return reply(200, out);
      }
      const corrections = /^\/reports\/corrections\?account=(.+)$/.exec(path);
      if (corrections) return reply(200, [...reports.values()].filter((r) => r.withdrawn && r.shown.has(decodeURIComponent(corrections[1]!))).map((r) => r.id));
      const circle = /^\/circle\/(.+)$/.exec(path);
      if (circle) return reply(200, circles.filter((c) => c.owner === circle[1]).map((c) => ({ withPhoneHash: c.withPhoneHash, accepted: c.accepted, language: c.language })));
      if (path === '/organisations') return reply(200, organisations);
      if (path.startsWith('/advisory?')) return this.advisory === null ? reply(204) : reply(200, this.advisory);
      const positions = /^\/journeys\/([^/]+)\/positions\?to=(.+)$/.exec(path);
      if (positions) {
        const j = journeys.get(positions[1]!);
        return reply(200, (j?.positions ?? []).filter((p) => p.to === decodeURIComponent(positions[2]!)).map(({ atMinutes, from, nonce, ciphertext }) => ({ atMinutes, from, nonce, ciphertext })));
      }
      return reply(404);
    },
    post(path, body) {
      return Promise.resolve(this.postSync(path, body));
    },
    postSync(path: string, body: unknown): Reply {
      held.push(JSON.stringify(body));
      if (refusing) return reply(503);
      if (path === '/accounts') {
        const b = body as { id: string; phoneHash: string; publicKey: string };
        keys.set(b.phoneHash, b.publicKey);
        return reply(200, { id: b.id });
      }
      if (path === '/reports') {
        const b = body as { account: string; category: string; x: number; y: number; text: string | null; nowMinutes: number };
        if (!b.account) return reply(422, { reason: 'no account', details: [] });
        // The same screen the server runs, so a modified client gains nothing here either.
        const screened = b.text ? screenText(b.text) : null;
        if (screened && !screened.ok) return reply(422, { reason: 'about a person', details: screened.reasons });
        const id = `${b.account}-${reports.size + 1}`;
        reports.set(id, { id, account: b.account, category: b.category, x: b.x, y: b.y, text: b.text, atMinutes: b.nowMinutes, withdrawn: false, corroborations: [], disputes: [], shown: new Set() });
        return reply(200, { id });
      }
      const act = /^\/reports\/(.+)\/(corroborate|dispute|withdraw)$/.exec(path);
      if (act) {
        const r = reports.get(act[1]!);
        if (!r) return reply(422, { reason: 'no such report', details: [] });
        const b = body as { account: string; reason?: string };
        if (act[2] === 'corroborate') {
          if (b.account === r.account) return reply(422, { reason: 'your own report', details: [] });
          if (!r.corroborations.includes(b.account)) r.corroborations.push(b.account);
        } else if (act[2] === 'dispute') r.disputes.push({ by: b.account, reason: b.reason ?? '' });
        else if (b.account === r.account) r.withdrawn = true;
        else return reply(422, { reason: 'not yours', details: [] });
        return reply(200, act[2] === 'withdraw' ? { told: r.shown.size } : null);
      }
      if (path === '/journeys') {
        const b = body as { id: string; account: string; expectedMinutes: number; graceMinutes: number; notify: string[]; watch?: boolean };
        journeys.set(b.id, { id: b.id, account: b.account, expectedMinutes: b.expectedMinutes, graceMinutes: b.graceMinutes, notify: b.notify, watch: b.watch === true, positions: [] });
        return reply(200, { id: b.id, escalateAtMinutes: b.expectedMinutes + b.graceMinutes });
      }
      const position = /^\/journeys\/([^/]+)\/positions$/.exec(path);
      if (position) {
        const j = journeys.get(position[1]!);
        if (!j || !j.watch) return reply(404);
        const b = body as { to: string; atMinutes: number; from: string; nonce: string; ciphertext: string };
        if (!j.notify.includes(b.to)) return reply(422, { reason: 'not the watcher' });
        j.positions.push(b);
        return reply(200);
      }
      if (path === '/circle/invite') {
        const b = body as { owner: string; withPhoneHash: string };
        if (!circles.some((c) => c.owner === b.owner && c.withPhoneHash === b.withPhoneHash)) circles.push({ ...b, accepted: false, language: null });
        return reply(200);
      }
      if (path === '/alerts') {
        const b = body as { id: string; from: string; atMinutes: number; envelopes: HeldAlert['envelopes']; smsFallback: HeldAlert['smsFallback'] };
        const attempts = [
          ...b.envelopes.map((e) => ({ channel: 'push', toPhoneHash: e.to, outcome: 'unknown', atMinutes: b.atMinutes })),
          ...b.smsFallback.map((s) => ({ channel: 'serverSms', toPhoneHash: s.to, outcome: sms ? 'delivered' : 'failed', atMinutes: b.atMinutes })),
        ];
        alerts.set(b.id, { ...b, attempts, acknowledgements: [] });
        return reply(200, { id: b.id });
      }
      const cancel = /^\/alerts\/(.+)\/cancel$/.exec(path);
      if (cancel) {
        cancels.set(cancel[1]!, (body as { underDuress: boolean }).underDuress);
        return reply(200);
      }
      const duress = /^\/alerts\/(.+)\/duress$/.exec(path);
      if (duress) {
        openedUnderDuress.add(duress[1]!);
        return reply(200);
      }
      return reply(404);
    },
  };
}
