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
import * as categories from '../packages/domain/src/public/categories.ts';
import * as screen from '../packages/domain/src/public/screen.ts';

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

// The screen (ADR-0003): the corpus the phone is tested on, plus texts built
// from parts, each with the verdict the TypeScript gives. The server runs the
// same rules in C# so a report the phone would refuse is refused there too.
const corpus = [
  'A tall man in a black shirt broke into the shop',
  'It was Mr Adebayo from the next street',
  'Two Fulani herdsmen were seen near the junction',
  'The car was LND-234-XY, a blue Toyota',
  'Call the thief on 08031234567',
  'A woman wearing hijab ran past',
  'he was wearing a red cap and jeans',
  'Chukwuemeka Okafor took the generator',
  'Okada rider in a yellow jacket, dark skinned',
  'Oga Musa and his boys did it',
  'Robbery at the junction by the filling station, around 9pm',
  'Road blocked at Ojota, traffic backed up to the bridge',
  'Fire in a shop on the market road, smoke visible from the estate gate',
  'Gunfire heard near the school, three shots, nobody hurt as far as we know',
  'Flooding on Allen Avenue, water to the knee',
];
const openings = ['Robbery', 'Fire', 'Flooding', 'Road blocked', 'Gunfire heard', 'Accident', 'Crowd gathering', 'Power line down'];
const places = ['at the junction', 'on Allen Avenue', 'near Ikeja Market', 'by the estate gate', 'at Ojota bridge', 'behind the school'];
const tails = [
  '',
  ', around 9pm',
  ', a tall man ran off',
  ', plate ABC 123 DE',
  ', call 08123456789',
  ', it was Alhaji Bello',
  ', he was wearing a blue kaftan',
  ', two Hausa boys',
  ', Bola Ahmed saw it',
  ', nobody hurt',
];
const sg = new Gen(99);
const texts = [...corpus];
for (let i = 0; i < 120; i++) {
  texts.push(`${openings[sg.next(openings.length)]} ${places[sg.next(places.length)]}${tails[sg.next(tails.length)]}`);
}
const screened = texts.map((text) => ({ text, ...screen.screenText(text) }));
const okCount = screened.filter((s) => s.ok).length;
if (okCount === 0 || okCount === screened.length) throw new Error('the screen fixture has to hold both verdicts');
writeFileSync(join(import.meta.dirname, '..', 'fixtures', 'screen.json'), JSON.stringify({ generated: 'scripts/emit-fixtures.ts', ok: okCount, blocked: screened.length - okCount, texts: screened }, null, 1) + '\n');
console.log(`wrote ${screened.length} screened texts: ${okCount} ok, ${screened.length - okCount} blocked`);

// The closed list and its expiry, for the C# to agree with.
writeFileSync(
  join(import.meta.dirname, '..', 'fixtures', 'categories.json'),
  JSON.stringify({ generated: 'scripts/emit-fixtures.ts', expiryHours: categories.EXPIRY_HOURS, humanReviewAlways: [...categories.HUMAN_REVIEW_ALWAYS] }, null, 1) + '\n',
);
console.log(`wrote ${categories.CATEGORIES.length} categories`);
