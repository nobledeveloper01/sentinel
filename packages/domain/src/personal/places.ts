/**
 * Places the phone keeps and never sends (ADR-0010): journey templates —
 * *home from Ikeja*, the usual minutes, the usual people — and safe places,
 * the user's own list of where they would go. Both are lists the user edits;
 * neither is ranked, suggested, shared or synced. A safe place is where the
 * user said they would go, not a claim that it is safe.
 */

export interface Template {
  readonly label: string;
  readonly minutes: number;
  readonly notify: ReadonlyArray<string>;
}

export interface SafePlace {
  readonly label: string;
}

export interface Places {
  readonly templates: ReadonlyArray<Template>;
  readonly safe: ReadonlyArray<SafePlace>;
}

export const NONE: Places = { templates: [], safe: [] };

export const MAX_TEMPLATES = 8;
export const MAX_SAFE_PLACES = 8;

function clean(label: string): string {
  return label.trim().replace(/\s+/g, ' ');
}

/** Adds or replaces by label. A template with no minutes or nobody to tell is not a template. */
export function saveTemplate(p: Places, t: Template): Places {
  const label = clean(t.label);
  if (label.length === 0 || t.minutes <= 0 || t.notify.length === 0) return p;
  const rest = p.templates.filter((x) => x.label !== label);
  if (rest.length >= MAX_TEMPLATES) return p;
  return { ...p, templates: [...rest, { label, minutes: Math.round(t.minutes), notify: [...new Set(t.notify)] }] };
}

export function forgetTemplate(p: Places, label: string): Places {
  return { ...p, templates: p.templates.filter((x) => x.label !== clean(label)) };
}

export function addSafePlace(p: Places, label: string): Places {
  const l = clean(label);
  if (l.length === 0 || p.safe.some((x) => x.label === l) || p.safe.length >= MAX_SAFE_PLACES) return p;
  return { ...p, safe: [...p.safe, { label: l }] };
}

export function forgetSafePlace(p: Places, label: string): Places {
  return { ...p, safe: p.safe.filter((x) => x.label !== clean(label)) };
}

/**
 * A template with a member who has since left the circle still starts —
 * with the members who remain. A template whose people have all gone is
 * offered with nobody and the screen says so, rather than vanishing.
 */
export function usable(t: Template, members: ReadonlyArray<string>): Template {
  return { ...t, notify: t.notify.filter((m) => members.includes(m)) };
}

/** The destinations offered on the journey screen: the safe places, then the templates' labels, each once. */
export function destinations(p: Places): ReadonlyArray<string> {
  const out: string[] = [];
  for (const s of p.safe) if (!out.includes(s.label)) out.push(s.label);
  for (const t of p.templates) if (!out.includes(t.label)) out.push(t.label);
  return out;
}
