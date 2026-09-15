/**
 * The trusted circle (FR-1.3). Membership is mutually consented, either side
 * removes it now with no reason given, and a member receives a location only
 * during an alert or a journey shared with them. `whoCanSeeMe` is the one
 * screen that is always current.
 */

export type Relationship =
  | { readonly with: string; readonly state: 'invited'; readonly since: number }
  | { readonly with: string; readonly state: 'member'; readonly since: number; readonly language: Language };

export type Language = 'en' | 'pcm' | 'yo' | 'ha' | 'ig';

export interface Circle {
  readonly members: ReadonlyArray<Relationship>;
}

export const EMPTY: Circle = { members: [] };

export function invite(c: Circle, phoneHash: string, now: number): Circle {
  if (c.members.some((m) => m.with === phoneHash)) return c;
  return { members: [...c.members, { with: phoneHash, state: 'invited', since: now }] };
}

/** The invitee accepted, in their language. Nothing is shared before this. */
export function accept(c: Circle, phoneHash: string, language: Language, now: number): Circle {
  return {
    members: c.members.map((m) =>
      m.with === phoneHash && m.state === 'invited' ? { with: m.with, state: 'member', since: now, language } : m,
    ),
  };
}

/** Either side, now, no reason. */
export function remove(c: Circle, phoneHash: string): Circle {
  return { members: c.members.filter((m) => m.with !== phoneHash) };
}

export function members(c: Circle): ReadonlyArray<Extract<Relationship, { state: 'member' }>> {
  return c.members.filter((m): m is Extract<Relationship, { state: 'member' }> => m.state === 'member');
}

export interface SharingNow {
  readonly with: string;
  readonly condition: 'only during an alert' | { readonly journeyUntil: number } | 'alert in progress';
}

/**
 * Who can see me right now, and under what condition. A member with no
 * journey shared and no alert running sees nothing, and the screen says so.
 */
export function whoCanSeeMe(
  c: Circle,
  sharedJourneys: ReadonlyArray<{ readonly with: ReadonlyArray<string>; readonly until: number }>,
  alertRunning: boolean,
  now: number,
): ReadonlyArray<SharingNow> {
  return members(c).map((m) => {
    if (alertRunning) return { with: m.with, condition: 'alert in progress' };
    const j = sharedJourneys.find((s) => s.with.includes(m.with) && s.until > now);
    return { with: m.with, condition: j ? { journeyUntil: j.until } : 'only during an alert' };
  });
}
