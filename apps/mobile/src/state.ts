import { alert as A, circle as C, duress as D, journey as J, places as P } from '@sentinel/domain';

/**
 * Everything the app holds, and the one function that changes it. Pure, so
 * a test drives a whole evening through it without a screen; the screens
 * dispatch, the store persists (Phase 1), and nothing else touches state.
 */
export interface Screen {
  readonly name: 'home' | 'circle' | 'journey' | 'settings' | 'nearby' | 'report' | 'watch' | 'places' | 'organisations' | 'policy';
}

/** What the circle knows me by. The keys live here until the Keychain module holds them. */
export interface Me {
  readonly id: string;
  readonly phoneHash: string;
  readonly name: string;
}

export interface Prefs {
  readonly glass: boolean;
  readonly reduced: boolean;
  readonly large: boolean;
}

export interface AppState {
  readonly screen: Screen['name'];
  /** The rules were read once; the home is shown after. */
  readonly onboarded: boolean;
  readonly me: Me;
  readonly prefs: Prefs;
  readonly circle: C.Circle;
  /** Display names the user typed, by phone hash. Never sent anywhere. */
  readonly names: Readonly<Record<string, string>>;
  readonly alert: A.AlertRecord | null;
  /** The alert is running and the screen shows nothing of it: sent silently, or opened under duress. */
  readonly hidden: boolean;
  readonly pins: D.Pins | null;
  readonly journey: { readonly plan: J.Journey; readonly confirmed: boolean } | null;
  /** A watch that ended by itself, shown once and then forgotten (ADR-0011). */
  readonly watchEnded: string | null;
  /** Templates and safe places: kept here, never sent (ADR-0010). */
  readonly places: P.Places;
  readonly past: ReadonlyArray<A.AlertRecord>;
  /** Members the last alert could not be sealed to — the server has no key for them. */
  readonly unreachable: ReadonlyArray<string>;
}

export const INITIAL: AppState = {
  screen: 'home',
  onboarded: false,
  me: { id: '', phoneHash: '', name: '' },
  prefs: { glass: true, reduced: false, large: false },
  circle: C.EMPTY,
  names: {},
  alert: null,
  hidden: false,
  pins: null,
  journey: null,
  watchEnded: null,
  places: P.NONE,
  past: [],
  unreachable: [],
};

export type Action =
  | { readonly type: 'go'; readonly to: Screen['name'] }
  | { readonly type: 'me'; readonly me: Me }
  | { readonly type: 'onboarded' }
  | { readonly type: 'pref'; readonly key: keyof Prefs; readonly on: boolean }
  | { readonly type: 'unreachable'; readonly hashes: ReadonlyArray<string> }
  | { readonly type: 'pins'; readonly pins: D.Pins }
  | { readonly type: 'reveal' }
  | { readonly type: 'openedUnderDuress'; readonly now: number }
  | { readonly type: 'invite'; readonly hash: string; readonly name: string; readonly now: number; readonly kind?: C.Kind }
  | { readonly type: 'accepted'; readonly hash: string; readonly language: C.Language; readonly now: number }
  | { readonly type: 'remove'; readonly hash: string }
  | { readonly type: 'panic'; readonly now: number; readonly path: string; readonly silent: boolean }
  | { readonly type: 'alertEvent'; readonly event: A.AlertEvent }
  | { readonly type: 'cancelAlert'; readonly now: number; readonly underDuress: boolean }
  | { readonly type: 'startJourney'; readonly journey: J.Journey }
  | { readonly type: 'arrived' }
  | { readonly type: 'journeyEscalated'; readonly now: number }
  | { readonly type: 'watchOver' }
  | { readonly type: 'watchSeen' }
  | { readonly type: 'saveTemplate'; readonly template: P.Template }
  | { readonly type: 'forgetTemplate'; readonly label: string }
  | { readonly type: 'addSafePlace'; readonly label: string }
  | { readonly type: 'forgetSafePlace'; readonly label: string };

export function reduce(s: AppState, a: Action): AppState {
  switch (a.type) {
    case 'go':
      return { ...s, screen: a.to };
    case 'me':
      return { ...s, me: a.me };
    case 'onboarded':
      return { ...s, onboarded: true, screen: 'settings' };
    case 'pref':
      return { ...s, prefs: { ...s.prefs, [a.key]: a.on } };
    case 'unreachable':
      return { ...s, unreachable: a.hashes };
    case 'pins':
      return D.validPins(a.pins) ? { ...s, pins: a.pins } : s;
    case 'reveal':
      return { ...s, hidden: false };
    case 'openedUnderDuress':
      // The decoy: the screen stays idle; the record and the circle know.
      return s.alert ? { ...s, hidden: true, alert: A.append(s.alert, { kind: 'openedUnderDuress', at: a.now }) } : s;
    case 'invite':
      return { ...s, circle: C.invite(s.circle, a.hash, a.now, a.kind ?? 'person'), names: { ...s.names, [a.hash]: a.name } };
    case 'accepted':
      return { ...s, circle: C.accept(s.circle, a.hash, a.language, a.now) };
    case 'remove': {
      const names = { ...s.names };
      delete names[a.hash];
      return { ...s, circle: C.remove(s.circle, a.hash), names };
    }
    case 'panic':
      if (s.alert && !A.isOver(s.alert)) return s;
      return {
        ...s,
        screen: 'home',
        unreachable: [],
        // Silent: the alert runs and the screen shows nothing of it (ADR-0008).
        hidden: a.silent,
        // Two alerts in one minute must not share an id: the second would overwrite the first on the server.
        alert: { id: `${a.now}-${s.past.length + 1}`, events: [{ kind: 'triggered', at: a.now, path: a.path, silent: a.silent, drill: false }] },
      };
    case 'alertEvent':
      return s.alert ? { ...s, alert: A.append(s.alert, a.event) } : s;
    case 'cancelAlert': {
      if (!s.alert) return s;
      const done = A.append(s.alert, { kind: 'cancelled', at: a.now, underDuress: a.underDuress });
      return { ...s, alert: null, hidden: false, past: [...s.past, done] };
    }
    case 'startJourney':
      return { ...s, screen: 'home', journey: { plan: a.journey, confirmed: false } };
    case 'arrived':
      return { ...s, journey: null };
    case 'watchOver':
      // A watch ends by itself and says so once; it never becomes an alert.
      return s.journey && J.isWatch(s.journey.plan) ? { ...s, journey: null, watchEnded: s.journey.plan.destination.label } : s;
    case 'watchSeen':
      return { ...s, watchEnded: null };
    case 'saveTemplate':
      return { ...s, places: P.saveTemplate(s.places, a.template) };
    case 'forgetTemplate':
      return { ...s, places: P.forgetTemplate(s.places, a.label) };
    case 'addSafePlace':
      return { ...s, places: P.addSafePlace(s.places, a.label) };
    case 'forgetSafePlace':
      return { ...s, places: P.forgetSafePlace(s.places, a.label) };
    case 'journeyEscalated': {
      // The journey becomes an alert to the people it named — the same
      // record, the same honest delivery state, the same cancel. A watch
      // never gets here: it ends by itself.
      if (!s.journey || J.isWatch(s.journey.plan)) return s;
      const alert: A.AlertRecord = {
        id: `${a.now}-${s.past.length + 1}`,
        events: [{ kind: 'triggered', at: a.now, path: 'journey', silent: false, drill: false }],
      };
      return { ...s, journey: null, alert, hidden: false };
    }
  }
}

/** The journeys a member can currently see, for `whoCanSeeMe`. */
export function sharedJourneys(s: AppState): ReadonlyArray<{ with: ReadonlyArray<string>; until: number }> {
  return s.journey ? [{ with: s.journey.plan.notify, until: J.plan(s.journey.plan).escalate }] : [];
}

/** What the app holds about the person, derived from the state itself so the screen cannot drift from the truth. */
export function knows(s: AppState, keysHeld: 'store' | 'launch' = 'launch'): ReadonlyArray<string> {
  return [
    s.me.phoneHash ? `number:${s.me.phoneHash.slice(0, 8)}` : 'number:none',
    s.me.name ? `name:${s.me.name}` : 'name:none',
    `circle:${s.circle.members.length}`,
    `alerts:${s.past.length + (s.alert ? 1 : 0)}`,
    `keys:${keysHeld}`,
    `places:${s.places.templates.length + s.places.safe.length}`,
    'location:none',
  ];
}
