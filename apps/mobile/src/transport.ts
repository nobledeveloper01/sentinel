/**
 * The wire, as the app sees it: a path, a body, an answer. `fetchTransport`
 * is the real one; `memoryTransport` is a server in a test — it holds
 * accounts and alerts the way the .NET one does, can be told to refuse, and
 * lets a test read back exactly what the server would hold.
 */
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
}

export interface CircleRow {
  readonly owner: string;
  readonly withPhoneHash: string;
  accepted: boolean;
  language: string | null;
}

export interface MemoryServer extends Transport {
  getSync(path: string): Reply;
  postSync(path: string, body: unknown): Reply;
  readonly keys: Map<string, string>;
  readonly alerts: Map<string, HeldAlert>;
  readonly circles: CircleRow[];
  /** The invitee's phone accepting, which only her phone can do. */
  accept(owner: string, withPhoneHash: string, language: string): void;
  /** Every byte the server has been handed, for a test to search. */
  everythingHeld(): string;
  refuse(on: boolean): void;
  smsDelivers(on: boolean): void;
}

export function memoryTransport(): MemoryServer {
  const keys = new Map<string, string>();
  const alerts = new Map<string, HeldAlert>();
  const circles: CircleRow[] = [];
  let refusing = false;
  let sms = true;
  const held: string[] = [];
  const reply = (status: number, body: unknown = null): Reply => ({ ok: status < 400, status, body });
  return {
    keys,
    alerts,
    circles,
    accept(owner, withPhoneHash, language) {
      const row = circles.find((c) => c.owner === owner && c.withPhoneHash === withPhoneHash);
      if (row) {
        row.accepted = true;
        row.language = language;
      }
    },
    everythingHeld: () => held.join('\n') + '\n' + JSON.stringify([...keys], null, 0) + JSON.stringify([...alerts], null, 0) + JSON.stringify(circles),
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
      const circle = /^\/circle\/(.+)$/.exec(path);
      if (circle) return reply(200, circles.filter((c) => c.owner === circle[1]).map((c) => ({ withPhoneHash: c.withPhoneHash, accepted: c.accepted, language: c.language })));
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
        alerts.set(b.id, { ...b, attempts });
        return reply(200, { id: b.id });
      }
      if (/^\/alerts\/.+\/cancel$/.test(path)) return reply(200);
      return reply(404);
    },
  };
}
