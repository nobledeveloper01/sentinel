import { alert as A, circle as C } from '@sentinel/domain';

import { INITIAL, reduce, sharedJourneys, type AppState } from '../src/state';

/** One evening through the reducer, with no screen in the way. */
function run(actions: Parameters<typeof reduce>[1][], from: AppState = INITIAL): AppState {
  return actions.reduce(reduce, from);
}

describe('the app state', () => {
  test('an invitation shares nothing until it is accepted, and a removal takes the name with it', () => {
    let s = run([{ type: 'invite', hash: 'h1', name: 'Ada', now: 100 }]);
    expect(C.members(s.circle)).toHaveLength(0);
    expect(C.whoCanSeeMe(s.circle, sharedJourneys(s), false, 100)).toHaveLength(0);
    s = reduce(s, { type: 'accepted', hash: 'h1', language: 'yo', now: 101 });
    expect(C.members(s.circle)).toHaveLength(1);
    expect(C.whoCanSeeMe(s.circle, sharedJourneys(s), false, 101)[0]?.condition).toBe('only during an alert');
    s = reduce(s, { type: 'remove', hash: 'h1' });
    expect(s.circle.members).toHaveLength(0);
    expect(s.names).toEqual({});
  });

  test('a second panic during an alert does not start a second record; the cancel keeps the first', () => {
    let s = run([{ type: 'panic', now: 10, path: 'screen', silent: false }]);
    const first = s.alert;
    s = reduce(s, { type: 'panic', now: 11, path: 'screen', silent: false });
    expect(s.alert).toBe(first);
    s = reduce(s, { type: 'cancelAlert', now: 12, underDuress: false });
    expect(s.alert).toBeNull();
    expect(s.past).toHaveLength(1);
    expect(A.isOver(s.past[0]!)).toBe(true);
  });

  test('a journey the person never confirms becomes an alert to the people it named, by the journey path', () => {
    let s = run([
      { type: 'invite', hash: 'h1', name: 'Ada', now: 0 },
      { type: 'accepted', hash: 'h1', language: 'en', now: 0 },
      {
        type: 'startJourney',
        journey: { id: 'j', startedMinutes: 0, expectedMinutes: 30, notify: ['h1'], liveShare: false, graceMinutes: 15, destination: { x: 0, y: 0, label: 'home' } },
      },
    ]);
    expect(s.screen).toBe('home');
    expect(C.whoCanSeeMe(s.circle, sharedJourneys(s), false, 10)[0]?.condition).toEqual({ journeyUntil: 45 });
    s = reduce(s, { type: 'journeyEscalated', now: 45 });
    expect(s.journey).toBeNull();
    expect(s.alert?.events[0]).toMatchObject({ kind: 'triggered', path: 'journey' });
  });

  test('two alerts in the same minute do not share an id', () => {
    let s = run([{ type: 'panic', now: 10, path: 'screen', silent: false }]);
    const first = s.alert!.id;
    s = run([{ type: 'cancelAlert', now: 10, underDuress: false }, { type: 'panic', now: 10, path: 'screen', silent: false }], s);
    expect(s.alert!.id).not.toBe(first);
  });

  test('arriving ends the journey and nobody is told', () => {
    const s = run([
      {
        type: 'startJourney',
        journey: { id: 'j', startedMinutes: 0, expectedMinutes: 30, notify: [], liveShare: false, graceMinutes: 15, destination: { x: 0, y: 0, label: 'home' } },
      },
      { type: 'arrived' },
    ]);
    expect(s.journey).toBeNull();
    expect(s.alert).toBeNull();
  });
});
