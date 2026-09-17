import assert from 'node:assert/strict';
import { test } from 'node:test';

import { acknowledge, alerts, describeAlert, optIns, withToken, type Api } from '../src/console.ts';

/**
 * What the console does that is not arrangement: the token on every call,
 * a wrong token as nobody, and the shape of an alert — which is the point.
 * A field the console never asked for is a field it cannot render, and a
 * position is not in the shape.
 */
function fakeFetch(routes: Record<string, { status: number; body?: unknown }>) {
  const calls: Array<{ url: string; headers: Record<string, string>; body: string | undefined }> = [];
  const fetcher = ((url: string | URL | Request, init?: RequestInit) => {
    const spelled = typeof url === 'string' ? url : url instanceof URL ? url.href : url.url;
    const key = spelled.replace(/^https?:\/\/[^/]+/, '');
    calls.push({ url: key, headers: (init?.headers as Record<string, string>) ?? {}, body: init?.body as string | undefined });
    const r = routes[key] ?? { status: 404 };
    return Promise.resolve(new Response(r.body === undefined ? '' : JSON.stringify(r.body), { status: r.status }));
  }) as typeof fetch;
  return { fetcher, calls };
}

test('every call carries the organisation token, and a wrong one is nobody', async () => {
  const { fetcher, calls } = fakeFetch({ '/organisations/me/optins': { status: 200, body: [{ owner: 'ada', accepted: false }] } });
  const api = withToken('http://x', 'tok-1', fetcher);
  assert.deepEqual(await optIns(api), [{ owner: 'ada', accepted: false }]);
  assert.equal(calls[0]!.headers['x-organisation-token'], 'tok-1');
  const nobody = withToken('http://x', 'wrong', fakeFetch({ '/organisations/me/optins': { status: 401 } }).fetcher);
  await assert.rejects(optIns(nobody), /not this organisation/);
});

test('an alert is when, the state and whether we acknowledged — a position the server sent anyway is not kept', async () => {
  const api: Api = {
    get: () => Promise.resolve([{ id: 'a1', atMinutes: 100, cancelled: false, acknowledgedAtMinutes: null, lat: 6.5, ciphertext: 'xx' }]),
    post: () => Promise.resolve(null),
  };
  const [a] = await alerts(api);
  assert.deepEqual(Object.keys(a!).sort(), ['acknowledgedAtMinutes', 'atMinutes', 'cancelled', 'id']);
  assert.equal(describeAlert(a!, 130), '30 min ago · in progress · not yet acknowledged');
  assert.equal(describeAlert({ ...a!, cancelled: true, acknowledgedAtMinutes: 101 }, 100 + 3 * 1440), '3 d ago · ended by the person · acknowledged');
});

test('acknowledging posts the minute and nothing else', async () => {
  const { fetcher, calls } = fakeFetch({ '/organisations/me/alerts/a%2F1/ack': { status: 200 } });
  await acknowledge(withToken('http://x', 't', fetcher), 'a/1', 555);
  assert.equal(calls[0]!.url, '/organisations/me/alerts/a%2F1/ack');
  assert.deepEqual(JSON.parse(calls[0]!.body!), { atMinutes: 555 });
});
