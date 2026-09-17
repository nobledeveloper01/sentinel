/**
 * `@sentinel/domain`: the rules, with no platform in them.
 *
 * Two halves that never import each other (ADR-0007): the personal path,
 * which is a right, and the public path, which is a privilege.
 */
export * as circle from './personal/circle.ts';
export * as journey from './personal/journey.ts';
export * as alert from './personal/alert.ts';
export * as duress from './personal/duress.ts';
export * as numbers from './personal/numbers.ts';
export * as messages from './personal/messages.ts';
export * as places from './personal/places.ts';
export type { Language } from './personal/circle.ts';

export * as reach from './public/reach.ts';
export * as categories from './public/categories.ts';
export * as screen from './public/screen.ts';
export * as corrections from './public/corrections.ts';
export * as advisory from './public/advisory.ts';
