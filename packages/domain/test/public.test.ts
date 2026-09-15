import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as categories from '../src/public/categories.ts';
import * as corrections from '../src/public/corrections.ts';
import * as screen from '../src/public/screen.ts';

test('the closed list: expiry per category, rate limits per account', () => {
  assert.ok(categories.isCategory('robbery'));
  assert.ok(!categories.isCategory('suspicious_person'));
  assert.ok(categories.expired('road_blocked', 0, 6 * 60));
  assert.ok(!categories.expired('flooding', 0, 47 * 60));
  assert.ok(categories.HUMAN_REVIEW_ALWAYS.has('missing_person_appeal'));
  assert.ok(categories.mayReportAgain([], 100));
  assert.ok(!categories.mayReportAgain([80], 100), 'one per half hour');
  assert.ok(!categories.mayReportAgain([10, 300, 600], 900), 'three per day');
  assert.ok(categories.mayReportAgain([10, 300, 600], 10 + 24 * 60 + 1));
});

test('the screen: the adversarial corpus is blocked, and events at places pass', () => {
  const blocked = [
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
  ];
  for (const t of blocked) {
    const s = screen.screenText(t);
    assert.ok(!s.ok, `passed: ${t}`);
  }
  const allowed = [
    'Robbery at the junction by the filling station, around 9pm',
    'Road blocked at Ojota, traffic backed up to the bridge',
    'Fire in a shop on the market road, smoke visible from the estate gate',
    'Gunfire heard near the school, three shots, nobody hurt as far as we know',
    'Flooding on Allen Avenue, water to the knee',
  ];
  for (const t of allowed) {
    const s = screen.screenText(t);
    assert.ok(s.ok, `blocked: ${t} — ${s.reasons.join(', ')}`);
  }
});

test('the screen fails closed: no screener, no free text and no image, and the report still stands', () => {
  const down = screen.admit({ text: 'Road blocked at Ojota', hasImage: true, imageHasFace: false }, false);
  assert.deepEqual(down, { category: true, text: false, image: false, reasons: ['screener unavailable'] });
  const up = screen.admit({ text: 'Road blocked at Ojota', hasImage: true, imageHasFace: true }, true);
  assert.equal(up.text, true);
  assert.equal(up.image, false);
  assert.ok(up.reasons.includes('a face'));
  const bare = screen.admit({}, false);
  assert.deepEqual(bare.reasons, []);
});

test('a correction reaches everyone who saw the claim', () => {
  let d: corrections.Distribution = { report: 'r', seenBy: new Set() };
  for (const a of ['a', 'b', 'c', 'b']) d = corrections.shown(d, a);
  assert.deepEqual([...corrections.correctionAudience(d)].sort(), ['a', 'b', 'c']);
});
