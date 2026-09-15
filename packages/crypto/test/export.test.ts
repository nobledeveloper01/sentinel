/**
 * The record's export verifies under the app and under a hundred lines of
 * plain Python that share nothing with it; a flipped byte fails both; the
 * wrong key fails the Python when told which key to expect.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { bytesToHex } from '@noble/hashes/utils';

import { exportRecord, signingKeyPair, verifyExport } from '../src/index.ts';

const record = {
  id: '1000-1',
  events: [
    { kind: 'triggered', at: 1000, path: 'screen', silent: false, drill: false },
    { kind: 'attempt', at: 1000, channel: 'push', to: 'hash-bola', outcome: 'unknown' },
    { kind: 'acknowledged', at: 1002, by: 'hash-bola' },
    { kind: 'cancelled', at: 1005, underDuress: false },
  ],
};

function python(args: string[]): number {
  try {
    execFileSync('python3', [join(import.meta.dirname, '../../../scripts/verify-record.py'), ...args], { stdio: 'pipe' });
    return 0;
  } catch (e) {
    return (e as { status: number }).status;
  }
}

test('a good export verifies in the app and under Python; a flipped byte fails both; the wrong key fails the Python', () => {
  const key = signingKeyPair();
  const text = exportRecord(record, key);
  assert.deepEqual(verifyExport(text), { ok: true, publicKey: bytesToHex(key.publicKey), lines: 4 });
  const dir = mkdtempSync(join(tmpdir(), 'sentinel-'));
  const good = join(dir, 'good.txt');
  writeFileSync(good, text);
  assert.equal(python([good]), 0);
  assert.equal(python([good, bytesToHex(key.publicKey)]), 0);
  assert.equal(python([good, bytesToHex(signingKeyPair().publicKey)]), 1, 'the wrong key');
  // One character of one event changed.
  const flipped = text.replace('"at":1002', '"at":1003');
  assert.notEqual(flipped, text);
  assert.deepEqual(verifyExport(flipped), { ok: false });
  const bad = join(dir, 'bad.txt');
  writeFileSync(bad, flipped);
  assert.equal(python([bad]), 1);
});

test('the export is canonical: the same record in any key order signs to the same bytes', () => {
  const key = signingKeyPair(() => new Uint8Array(32).fill(7));
  const a = exportRecord({ id: 'x', events: [{ kind: 'triggered', at: 1 }] }, key);
  const b = exportRecord({ id: 'x', events: [{ at: 1, kind: 'triggered' }] }, key);
  assert.equal(a, b);
});
