/**
 * ADR-0002's property: no sequence of actions by one account, or by any set
 * of accounts that collapses to one, distributes an unverified report beyond
 * 500 metres. Worlds are generated from a seeded LCG — using the high bits,
 * because low bits of an LCG are not random and a generator that never
 * produces a case is a green test over nothing.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as reach from '../src/public/reach.ts';

class Gen {
  private s: number;
  constructor(seed: number) {
    this.s = seed >>> 0;
  }
  next(n: number): number {
    this.s = (Math.imul(this.s, 1664525) + 1013904223) >>> 0;
    return Math.floor((this.s >>> 8) / 16777216 * n);
  }
  bool(): boolean {
    return this.next(2) === 1;
  }
}

const ESTABLISHED = 0;
const NOW = 30 * 24 * 60; // a month in

function account(id: string, g: Gen, opts: Partial<reach.Account> = {}): reach.Account {
  return {
    id,
    createdMinutes: ESTABLISHED,
    device: `dev-${g.next(1_000_000)}`,
    installLineage: `lin-${g.next(1_000_000)}`,
    circle: [],
    locationTrace: `loc-${g.next(1_000_000)}`,
    organisation: false,
    ...opts,
  };
}

function evidence(accounts: reach.Account[], report: reach.Report, corroborations: reach.Corroboration[], extra: Partial<reach.Evidence> = {}): reach.Evidence {
  return {
    accounts: new Map(accounts.map((a) => [a.id, a])),
    report,
    corroborations,
    disputes: [],
    nearbyReportsInWindow: 1,
    baselineForWindow: 1,
    officialSource: false,
    nowMinutes: NOW + 10,
    ...extra,
  };
}

const report = (reporter: string): reach.Report => ({ id: 'r1', reporter, atMinutes: NOW, x: 0, y: 0 });
const corr = (by: string, at = NOW + 5): reach.Corroboration => ({ by, report: 'r1', atMinutes: at, x: 100, y: 100 });

test('one account, however it acts, never leaves 500 metres', () => {
  let worlds = 0;
  for (let seed = 1; seed <= 300; seed++) {
    const g = new Gen(seed);
    const a = account('a', g);
    // Every action a single account has: report, corroborate its own report
    // any number of times, from any position, at any time.
    const cs = Array.from({ length: g.next(10) }, () => ({ ...corr('a', NOW + g.next(60)), x: g.next(2000), y: g.next(2000) }));
    const e = evidence([a], report('a'), cs, { officialSource: false });
    const stage = reach.stageOf(e);
    assert.ok(stage === 'reported' || stage === 'none', `seed ${seed}: ${stage}`);
    assert.ok(reach.radiusOf(stage) <= 500);
    worlds++;
  }
  assert.equal(worlds, 300);
});

test('accounts sharing any independence signal collapse to one and never leave 500 metres', () => {
  const signals = ['device', 'installLineage', 'locationTrace', 'circle'] as const;
  let collapsed = 0;
  for (let seed = 1; seed <= 500; seed++) {
    const g = new Gen(seed);
    const n = 2 + g.next(8);
    const shared = signals[g.next(signals.length)]!;
    const accounts: reach.Account[] = [];
    for (let i = 0; i < n; i++) {
      const a = account(`a${i}`, g);
      accounts.push(
        shared === 'device' ? { ...a, device: 'same-phone' }
        : shared === 'installLineage' ? { ...a, installLineage: 'same-install' }
        : shared === 'locationTrace' ? { ...a, locationTrace: 'same-trace' }
        : { ...a, circle: accounts.map((x) => x.id) },
      );
    }
    // A chain for the circle case: a0—a1, a1—a2, …, which is not transitive
    // by pair but collapses by chain.
    const cs = accounts.slice(1).map((a) => corr(a.id, NOW + g.next(25)));
    const e = evidence(accounts, report(accounts[0]!.id), cs);
    const stage = reach.stageOf(e);
    assert.ok(stage === 'reported' || stage === 'none', `seed ${seed} shared ${shared}: ${stage}`);
    if (reach.collapse(accounts).length === 1) collapsed++;
  }
  assert.ok(collapsed > 400, `the generator made collapsing sets: ${collapsed}`);
});

test('independent, established accounts do earn reach — so the test above is not vacuous', () => {
  const g = new Gen(7);
  const accounts = Array.from({ length: 6 }, (_, i) => account(`a${i}`, g));
  const two = evidence(accounts, report('a0'), [corr('a1'), corr('a2')]);
  assert.equal(reach.stageOf(two), 'corroborated');
  const four = evidence(accounts, report('a0'), [corr('a1'), corr('a2'), corr('a3'), corr('a4')]);
  assert.equal(reach.stageOf(four), 'confirmed');
  const org = evidence(accounts.map((a) => (a.id === 'a5' ? { ...a, organisation: true } : a)), report('a0'), [corr('a5')]);
  assert.equal(reach.stageOf(org), 'confirmed', 'one verified organisation confirms');
  const verified = evidence(accounts.map((a) => (a.id === 'a5' ? { ...a, organisation: true } : a)), report('a0'), [corr('a1'), corr('a2'), corr('a3'), corr('a4'), corr('a5')]);
  assert.equal(reach.stageOf(verified), 'verified');
  assert.equal(reach.stageOf(evidence(accounts, report('a0'), [], { officialSource: true })), 'verified');
});

test('a new account cannot report for 48 hours and cannot corroborate for 14 days', () => {
  const g = new Gen(3);
  const fresh = account('f', g, { createdMinutes: NOW - 60 });
  const old = Array.from({ length: 4 }, (_, i) => account(`o${i}`, g));
  assert.equal(reach.stageOf(evidence([fresh, ...old], report('f'), [corr('o0'), corr('o1')])), 'none');
  const tenDays = account('t', g, { createdMinutes: NOW - 10 * 24 * 60 });
  const e = evidence([...old, tenDays], report('o0'), [corr('o1'), corr('t')]);
  assert.equal(reach.stageOf(e), 'reported', 'the ten-day account did not count');
});

test('a surge pins everything to reported; a dispute ratio pulls it down', () => {
  const g = new Gen(11);
  const accounts = Array.from({ length: 8 }, (_, i) => account(`a${i}`, g));
  const strong = [corr('a1'), corr('a2'), corr('a3'), corr('a4')];
  assert.equal(reach.stageOf(evidence(accounts, report('a0'), strong, { nearbyReportsInWindow: 12, baselineForWindow: 2 })), 'reported');
  assert.equal(reach.stageOf(evidence(accounts, report('a0'), strong, { nearbyReportsInWindow: 5, baselineForWindow: 1 })), 'confirmed', 'below the floor is not a surge');
  const disputed = evidence(accounts, report('a0'), strong, {
    disputes: ['a5', 'a6', 'a7', 'a1'].map((by) => ({ by, report: 'r1', atMinutes: NOW + 8, reason: 'didnt_happen' as const })),
  });
  assert.equal(reach.stageOf(disputed), 'reported');
});

test('corroboration outside the window or the distance does not count', () => {
  const g = new Gen(5);
  const accounts = Array.from({ length: 4 }, (_, i) => account(`a${i}`, g));
  const late = { ...corr('a1'), atMinutes: NOW + 31 };
  const far = { ...corr('a2'), x: 5000, y: 5000 };
  assert.equal(reach.stageOf(evidence(accounts, report('a0'), [late, far, corr('a3')])), 'reported');
});
