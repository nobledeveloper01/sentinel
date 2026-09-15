import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as alert from '../src/personal/alert.ts';
import * as circle from '../src/personal/circle.ts';
import * as duress from '../src/personal/duress.ts';
import * as journey from '../src/personal/journey.ts';
import * as messages from '../src/personal/messages.ts';
import * as numbers from '../src/personal/numbers.ts';

test('the circle: nothing is shared before the invitee accepts; removal is instant', () => {
  let c = circle.invite(circle.EMPTY, 'h1', 10);
  assert.equal(circle.members(c).length, 0);
  assert.deepEqual(circle.whoCanSeeMe(c, [], true, 20), [], 'an invitee sees nothing even during an alert');
  c = circle.accept(c, 'h1', 'yo', 15);
  assert.equal(circle.members(c)[0]!.language, 'yo');
  assert.deepEqual(circle.whoCanSeeMe(c, [], false, 20), [{ with: 'h1', condition: 'only during an alert' }]);
  assert.deepEqual(circle.whoCanSeeMe(c, [{ with: ['h1'], until: 100 }], false, 20), [{ with: 'h1', condition: { journeyUntil: 100 } }]);
  assert.deepEqual(circle.whoCanSeeMe(c, [{ with: ['h1'], until: 100 }], false, 101), [{ with: 'h1', condition: 'only during an alert' }], 'a share ends by itself');
  c = circle.remove(c, 'h1');
  assert.equal(c.members.length, 0);
});

test('a journey: ask at the time, remind at +5 and +10, escalate at +15; arrival still asks', () => {
  const j: journey.Journey = { id: 'j', startedMinutes: 0, expectedMinutes: 60, notify: ['h1'], liveShare: false, graceMinutes: 15, destination: { x: 0, y: 0, label: 'Home' } };
  assert.deepEqual(journey.plan(j), { ask: 60, remind: [65, 70], escalate: 75 });
  assert.equal(journey.stateAt(j, 30, false, false), 'underway');
  assert.equal(journey.stateAt(j, 60, false, false), 'asking');
  assert.equal(journey.stateAt(j, 66, false, false), 'reminding');
  assert.equal(journey.stateAt(j, 75, false, false), 'escalated');
  assert.equal(journey.stateAt(j, 75, true, false), 'arrived');
  assert.ok(journey.nearDestination(j, 100, 100));
  assert.ok(!journey.nearDestination(j, 200, 0));
  assert.ok(!journey.batteryOutlasts(20, j, 30));
  assert.deepEqual(journey.serverPlan(j), { escalateAtMinutes: 75, notify: ['h1'] }, 'the server never gets the destination');
  const short: journey.Journey = { ...j, graceMinutes: 8 };
  assert.deepEqual(journey.plan(short).remind, [65], 'a reminder past the grace is not a reminder');
});

test('the alert record: delivered by one channel, still trying, or plainly not', () => {
  let r: alert.AlertRecord = { id: 'a', events: [] };
  r = alert.append(r, { kind: 'triggered', at: 100, path: 'widget', silent: false, drill: false });
  r = alert.append(r, { kind: 'attempt', at: 100, channel: 'push', to: 'h1', outcome: 'unknown' });
  assert.deepEqual(alert.delivery(r, 101), { state: 'trying', since: 100 });
  assert.deepEqual(alert.delivery(r, 103), { state: 'not delivered' }, 'patience runs out and the numbers come first');
  r = alert.append(r, { kind: 'attempt', at: 101, channel: 'serverSms', to: 'h1', outcome: 'delivered' });
  assert.deepEqual(alert.delivery(r, 103), { state: 'delivered', by: ['serverSms'] });
  r = alert.append(r, { kind: 'acknowledged', at: 102, by: 'h1' });
  assert.deepEqual(alert.acknowledgements(r, ['h1', 'h2']), [{ who: 'h1', at: 102 }, { who: 'h2', at: null }]);
  assert.ok(!alert.isOver(r));
  const drill: alert.AlertRecord = { id: 'd', events: [{ kind: 'triggered', at: 1, path: 'drill', silent: false, drill: true }] };
  const cancelled = alert.append(r, { kind: 'cancelled', at: 110, underDuress: false });
  assert.deepEqual(alert.falseAlarmMirror([cancelled, drill]), { sent: 1, cancelled: 1 }, 'a drill is not counted');
});

test('duress: the PIN chooses the face; the cancel needs the gesture and says the truth to the circle', () => {
  const pins: duress.Pins = { realHash: 'R', duressHash: 'D' };
  assert.ok(duress.validPins(pins));
  assert.ok(!duress.validPins({ realHash: 'R', duressHash: 'R' }));
  assert.equal(duress.faceFor(pins, 'D'), 'decoy');
  assert.equal(duress.faceFor(pins, 'X'), 'refused');
  assert.deepEqual(duress.cancel(pins, { fingers: 1, heldMs: 5000 }, 'R'), { cancelled: false }, 'one finger is a reach-over');
  assert.deepEqual(duress.cancel(pins, { fingers: 2, heldMs: 1000 }, 'R'), { cancelled: false }, 'too short');
  assert.deepEqual(duress.cancel(pins, { fingers: 2, heldMs: 2000 }, 'R'), { cancelled: true, tellCircle: 'cancelled' });
  assert.deepEqual(duress.cancel(pins, { fingers: 2, heldMs: 2000 }, 'D'), { cancelled: true, tellCircle: 'cancelled under duress' });
});

test('the official numbers come with the state and never repeat', () => {
  const lagos = numbers.numbersFor('Lagos');
  assert.equal(lagos[0]!.number, '767');
  assert.equal(lagos.filter((n) => n.number === '112').length, 1);
  assert.equal(numbers.numbersFor(null)[0]!.number, '112');
});

test('every language has every SMS, none shouts, each names the number to call', () => {
  const keys = messages.keysOf('en');
  for (const l of messages.LANGUAGES) {
    assert.deepEqual([...messages.keysOf(l)].sort(), [...keys].sort(), l);
    for (const k of keys) {
      const s = messages.sms(k, l, { name: 'Ada', link: 'https://s.ng/x', time: '22:40' });
      assert.ok(!s.includes('!'), `${l}.${k} shouts`);
      assert.ok(!s.includes('{'), `${l}.${k} left a placeholder`);
      if (k !== 'arrived' && k !== 'cancelled' && k !== 'drill') assert.ok(s.includes('112'), `${l}.${k} names no number`);
    }
  }
  assert.ok(messages.sms('cancelledDuress', 'ha', { name: 'Ada' }).includes('112'));
});
