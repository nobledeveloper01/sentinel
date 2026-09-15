/**
 * ADR-0007: the personal half and the public half import nothing from each
 * other. A grep over the source, which is the only honest way to hold it.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const SRC = join(import.meta.dirname, '..', 'src');

test('personal never imports public, and public never imports personal', () => {
  for (const [half, other] of [['personal', 'public'], ['public', 'personal']] as const) {
    for (const f of readdirSync(join(SRC, half))) {
      const text = readFileSync(join(SRC, half, f), 'utf8');
      assert.ok(!text.includes(`../${other}/`), `${half}/${f} imports from ${other}`);
    }
  }
});

test('the closed list has no category about a person', () => {
  const text = readFileSync(join(SRC, 'public', 'categories.ts'), 'utf8');
  const list = text.split('CATEGORIES = [')[1]!.split('] as const')[0]!;
  assert.ok(!/suspicious|suspect|vehicle|stranger|wanted/i.test(list));
  assert.ok(!/person/i.test(list.replace('missing_person_appeal', '')));
});
