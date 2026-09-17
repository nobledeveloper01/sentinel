import { accept, acknowledge, alerts, describeAlert, logPatrol, minuteNow, optIns, patrols, withToken, type Api } from './console.js';

/**
 * The organisation console (ADR-0009, ADR-0012): an estate's guard house
 * with its own token, seeing the opt-ins waiting, the alerts sealed to it
 * and whether it acknowledged, and its own patrol lines. Nothing else: no
 * position, no member of anyone's circle, no feed, no map.
 *
 * No framework and no bundler; three lists and a form. The rules that are
 * not arrangement live in `console.ts`, where a test holds them.
 */
const TOKEN_KEY = 'sentinel.organisation.token.v1';
const app = document.querySelector<HTMLElement>('#app');
if (app === null) throw new Error('no #app to render into');
const baseUrl = document.documentElement.dataset['api'] ?? 'http://127.0.0.1:5000';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, ...children: Array<Node | string>): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  for (const c of children) node.append(c);
  return node;
}

function render(...nodes: Node[]): void {
  app!.replaceChildren(...nodes);
}

function signIn(problem = ''): void {
  const input = el('input', { type: 'password', placeholder: 'Organisation token', 'aria-label': 'Organisation token' });
  const go = el('button', { class: 'primary', type: 'button' }, 'Open the console');
  go.addEventListener('click', () => {
    if (input.value.trim().length === 0) return;
    localStorage.setItem(TOKEN_KEY, input.value.trim());
    void console_(withToken(baseUrl, input.value.trim()));
  });
  render(
    el('h1', {}, 'Sentinel'),
    el('p', { class: 'muted' }, 'The organisation console. The token was handed to you by the person who vouched for your organisation; it is yours and nobody else’s.'),
    el('div', { class: 'card' }, input, el('div', { style: 'height: .5rem' }), go, problem ? el('p', { class: 'attention' }, problem) : ''),
  );
}

async function console_(api: Api): Promise<void> {
  let waiting;
  let sealed;
  let lines;
  try {
    [waiting, sealed, lines] = await Promise.all([optIns(api), alerts(api), patrols(api)]);
  } catch (e) {
    localStorage.removeItem(TOKEN_KEY);
    signIn(e instanceof Error ? e.message : 'could not reach the server');
    return;
  }
  const now = minuteNow();
  const refresh = () => void console_(api);

  const optInRows = waiting.filter((o) => !o.accepted).map((o) => {
    const b = el('button', { type: 'button' }, 'Accept');
    b.addEventListener('click', () => void accept(api, o.owner).then(refresh));
    return el('div', { class: 'card row' }, el('span', {}, `Somebody opted in · ${o.owner.slice(0, 8)}…`), b);
  });

  const alertRows = sealed.map((a) => {
    const b = el('button', { type: 'button', class: 'primary' }, 'Acknowledge');
    b.disabled = a.acknowledgedAtMinutes !== null || a.cancelled;
    b.addEventListener('click', () => void acknowledge(api, a.id, minuteNow()).then(refresh));
    const line = el('span', { class: a.acknowledgedAtMinutes === null && !a.cancelled ? 'attention' : 'fine' }, describeAlert(a, now));
    return el('div', { class: 'card row' }, line, b);
  });

  const x = el('input', { type: 'number', placeholder: 'x, metres', 'aria-label': 'x, metres' });
  const y = el('input', { type: 'number', placeholder: 'y, metres', 'aria-label': 'y, metres' });
  const log = el('button', { type: 'button' }, 'Log a patrol here');
  log.addEventListener('click', () => {
    if (x.value === '' || y.value === '') return;
    void logPatrol(api, Number(x.value), Number(y.value), minuteNow()).then(refresh);
  });
  const patrolRows = lines.map((p) => el('li', {}, `cell ${p.cellX},${p.cellY} · ${describeAlert({ id: '', atMinutes: p.atMinutes, cancelled: false, acknowledgedAtMinutes: 0 }, now).split(' · ')[0] ?? ''}`));

  const out = el('button', { type: 'button' }, 'Sign out');
  out.addEventListener('click', () => {
    localStorage.removeItem(TOKEN_KEY);
    signIn();
  });

  render(
    el('div', { class: 'row' }, el('h1', {}, 'Sentinel'), out),
    el('p', { class: 'muted' }, 'What this console shows: who opted in, the alerts sealed to you and whether you acknowledged, and your own patrol lines. It never shows where anyone is; the position is on the phone that holds your key.'),
    el('h2', {}, 'Waiting for you to accept'),
    ...(optInRows.length > 0 ? optInRows : [el('p', { class: 'muted' }, 'Nobody is waiting.')]),
    el('h2', {}, 'Alerts sealed to you'),
    ...(alertRows.length > 0 ? alertRows : [el('p', { class: 'muted' }, 'None.')]),
    el('h2', {}, 'Patrols'),
    el('div', { class: 'card' }, el('div', { class: 'row' }, x, y), el('div', { style: 'height: .5rem' }), log),
    el('ul', {}, ...patrolRows),
  );
}

const held = localStorage.getItem(TOKEN_KEY);
if (held === null) signIn();
else void console_(withToken(baseUrl, held));
