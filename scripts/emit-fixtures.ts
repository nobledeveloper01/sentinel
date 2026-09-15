/**
 * The reach fixture (ADR-0002, ADR-0004): generated worlds and the stage the
 * TypeScript gives each, written for the C# mirror to read. Regenerated with
 * `make fixtures` whenever a rule changes — part of changing the rule, not a
 * chore. The generator uses the high bits of its LCG, because the low bits
 * are not random and once produced a green test over an empty set.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import * as reach from '../packages/domain/src/public/reach.ts';

class Gen {
  private s: number;
  constructor(seed: number) {
    this.s = seed >>> 0;
  }
  next(n: number): number {
    this.s = (Math.imul(this.s, 1664525) + 1013904223) >>> 0;
    return Math.floor(((this.s >>> 8) / 16777216) * n);
  }
}

const NOW = 30 * 24 * 60;
const worlds: unknown[] = [];
const counts: Record<string, number> = {};
for (let seed = 1; seed <= 200; seed++) {
  const g = new Gen(seed);
  const n = 1 + g.next(8);
  const shared = g.next(4); // 0 independent, 1 device, 2 lineage, 3 trace
  const accounts: reach.Account[] = [];
  for (let i = 0; i < n; i++) {
    const fresh = g.next(6) === 0;
    accounts.push({
      id: `a${i}`,
      createdMinutes: fresh ? NOW - g.next(20 * 24 * 60) : 0,
      device: shared === 1 && g.next(2) === 0 ? 'shared-device' : `dev-${g.next(1_000_000)}`,
      installLineage: shared === 2 && g.next(2) === 0 ? 'shared-lineage' : `lin-${g.next(1_000_000)}`,
      circle: g.next(5) === 0 && i > 0 ? [`a${g.next(i)}`] : [],
      locationTrace: shared === 3 && g.next(2) === 0 ? 'shared-trace' : `loc-${g.next(1_000_000)}`,
      organisation: g.next(9) === 0,
    });
  }
  const report: reach.Report = { id: 'r', reporter: 'a0', atMinutes: NOW, x: 0, y: 0 };
  const corroborations: reach.Corroboration[] = [];
  for (let i = 1; i < n; i++) {
    if (g.next(4) === 0) continue;
    corroborations.push({ by: `a${i}`, report: 'r', atMinutes: NOW + g.next(40), x: g.next(1500), y: g.next(600) });
  }
  const disputes: reach.Dispute[] = [];
  for (let i = 1; i < n; i++) {
    if (g.next(5) === 0) disputes.push({ by: `a${i}`, report: 'r', atMinutes: NOW + g.next(30), reason: 'didnt_happen' });
  }
  const e: reach.Evidence = {
    accounts: new Map(accounts.map((a) => [a.id, a])),
    report,
    corroborations,
    disputes,
    nearbyReportsInWindow: g.next(10),
    baselineForWindow: 1 + g.next(3),
    officialSource: g.next(20) === 0,
    nowMinutes: NOW + 45,
  };
  const stage = reach.stageOf(e);
  counts[stage] = (counts[stage] ?? 0) + 1;
  worlds.push({
    seed,
    accounts,
    report,
    corroborations,
    disputes,
    nearbyReportsInWindow: e.nearbyReportsInWindow,
    baselineForWindow: e.baselineForWindow,
    officialSource: e.officialSource,
    nowMinutes: e.nowMinutes,
    stage,
  });
}
// Every stage has to appear, or the fixture proves less than it looks.
for (const s of ['none', 'reported', 'corroborated', 'confirmed', 'verified']) {
  if (!counts[s]) throw new Error(`the generator produced no ${s} world`);
}
const out = join(import.meta.dirname, '..', 'fixtures', 'reach.json');
writeFileSync(out, JSON.stringify({ generated: 'scripts/emit-fixtures.ts', counts, worlds }, null, 1) + '\n');
console.log(`wrote ${worlds.length} worlds: ${JSON.stringify(counts)}`);
