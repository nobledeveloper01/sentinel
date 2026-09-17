import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as circle from '../src/personal/circle.ts';
import * as journey from '../src/personal/journey.ts';
import * as places from '../src/personal/places.ts';

test('an organisation is a member of a second kind, told what a member is told, on the second rung (ADR-0009)', () => {
  let c = circle.invite(circle.EMPTY, 'aunt', 1);
  c = circle.invite(c, 'estate', 2, 'organisation');
  assert.deepEqual(circle.ladder(c), { circle: [], organisations: [], officialNumbers: true }, 'nothing before acceptance');
  c = circle.accept(c, 'aunt', 'yo', 3);
  c = circle.accept(c, 'estate', 'en', 4);
  assert.deepEqual(circle.ladder(c), { circle: ['aunt'], organisations: ['estate'], officialNumbers: true });
  // The same conditions as a person: only during an alert, or a journey shared.
  const seen = circle.whoCanSeeMe(c, [], false, 10);
  assert.equal(seen.length, 2);
  assert.equal(seen[1]!.condition, 'only during an alert');
  // Either side, now, no reason — an organisation is removed like anyone.
  assert.deepEqual(circle.ladder(circle.remove(c, 'estate')).organisations, []);
  // What was written before organisations existed is a person.
  assert.equal(circle.kindOf({ with: 'x', state: 'invited', since: 0 }), 'person');
});

test('places are lists the phone keeps: templates need minutes and people, safe places are labels, and nothing is ranked (ADR-0010)', () => {
  let p = places.saveTemplate(places.NONE, { label: '  Home from  Ikeja ', minutes: 40, notify: ['aunt', 'aunt'] });
  assert.deepEqual(p.templates, [{ label: 'Home from Ikeja', minutes: 40, notify: ['aunt'] }]);
  assert.equal(places.saveTemplate(p, { label: 'Nowhere', minutes: 0, notify: ['aunt'] }).templates.length, 1, 'no minutes is not a template');
  assert.equal(places.saveTemplate(p, { label: 'Nobody', minutes: 10, notify: [] }).templates.length, 1, 'nobody to tell is not a template');
  p = places.saveTemplate(p, { label: 'Home from Ikeja', minutes: 55, notify: ['aunt', 'bola'] });
  assert.equal(p.templates.length, 1, 'the same label replaces');
  assert.equal(p.templates[0]!.minutes, 55);
  p = places.addSafePlace(p, 'Police post, Ojota');
  p = places.addSafePlace(p, 'Police post, Ojota');
  p = places.addSafePlace(p, "Aunt's shop");
  assert.equal(p.safe.length, 2);
  assert.deepEqual(places.destinations(p), ['Police post, Ojota', "Aunt's shop", 'Home from Ikeja']);
  // A template whose people left still starts, with those who remain.
  assert.deepEqual(places.usable(p.templates[0]!, ['bola']).notify, ['bola']);
  assert.deepEqual(places.usable(p.templates[0]!, []).notify, []);
  p = places.forgetSafePlace(places.forgetTemplate(p, 'Home from Ikeja'), "Aunt's shop");
  assert.deepEqual(places.destinations(p), ['Police post, Ojota']);
  let full = places.NONE;
  for (let i = 0; i < 20; i++) full = places.addSafePlace(full, `place ${i}`);
  assert.equal(full.safe.length, places.MAX_SAFE_PLACES);
});

test('a watch is twenty minutes with one watcher, never asks, never escalates, and is over at the minute (ADR-0011)', () => {
  const w = journey.watch('w1', 100, 'aunt', 'the bus stop');
  assert.equal(journey.isWatch(w), true);
  assert.equal(w.expectedMinutes, 120);
  assert.deepEqual(w.notify, ['aunt']);
  assert.equal(journey.watchOver(w, 119), false);
  assert.equal(journey.watchOver(w, 120), true);
  // The plan a watch would have has no reminders and escalates at the minute it ends — which the app never runs for a watch.
  assert.deepEqual(journey.plan(w).remind, []);
  // An ordinary journey is not a watch, even shared live.
  const j: journey.Journey = { ...w, graceMinutes: 15 };
  assert.equal(journey.isWatch(j), false);
  assert.equal(journey.watchOver(j, 200), false);
});
