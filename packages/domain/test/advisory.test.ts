import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as advisory from '../src/public/advisory.ts';

const NOW = 100 * 24 * 60;
const at = (daysAgo: number, hour: number) => NOW - daysAgo * 1440 + hour * 60 - (NOW % 1440);

function cellReports(n: number, accounts: number, hours: ReadonlyArray<number>, x = 500, y = 500): advisory.ExpiredReport[] {
  return Array.from({ length: n }, (_, i) => ({ account: `a${i % accounts}`, x, y, atMinutes: at(1 + (i % 30), hours[i % hours.length]!) }));
}

test('below the thresholds there is nothing, not "no data" (ADR-0012)', () => {
  assert.equal(advisory.advisoryAt([], 500, 500, NOW), null);
  assert.equal(advisory.advisoryAt(cellReports(5, 5, [22]), 500, 500, NOW), null, 'five reports is not six');
  assert.equal(advisory.advisoryAt(cellReports(12, 3, [22]), 500, 500, NOW), null, 'three accounts is not four, however loud');
  // Old reports do not count, and neither does a report from the future.
  const stale = cellReports(8, 5, [22]).map((r) => ({ ...r, atMinutes: r.atMinutes - advisory.WINDOW_MINUTES - 1440 }));
  assert.equal(advisory.advisoryAt(stale, 500, 500, NOW), null);
});

test('above them it is a place and hours: the shortest band that holds most of the reports, wrapping midnight', () => {
  const late = cellReports(10, 5, [21, 22, 23, 0, 1]);
  const a = advisory.advisoryAt(late, 500, 500, NOW);
  assert.ok(a);
  assert.deepEqual({ cellX: a.cellX, cellY: a.cellY }, { cellX: 0, cellY: 0 });
  // Six of ten fall in 21..23; the band is the shortest with 60%.
  assert.equal(a.fromHour, 21);
  assert.equal(a.toHour, 0);
  // The next cell over says nothing about this one.
  assert.equal(advisory.advisoryAt(late, 1500, 500, NOW), null);
  // A daytime cluster does not wrap.
  const noon = advisory.advisoryAt(cellReports(6, 4, [12, 13]), 500, 500, NOW)!;
  assert.deepEqual([noon.fromHour, noon.toHour], [12, 14]);
});

test('the sentence carries no count and no category, by construction', () => {
  const a = advisory.advisoryAt(cellReports(30, 10, [2]), 500, 500, NOW)!;
  assert.deepEqual(Object.keys(a).sort(), ['cellX', 'cellY', 'fromHour', 'toHour']);
});
