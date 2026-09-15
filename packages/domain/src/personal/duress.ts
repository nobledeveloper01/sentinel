/**
 * Coercion is a use case (ADR-0008). The PIN decides which face the app
 * shows and what the circle is told; cancelling takes an interaction a
 * coercer cannot perform by reaching over; the duress PIN at the cancel step
 * cancels on the screen and says *under duress* to the circle.
 */

export interface Pins {
  /** Hashes, never the digits; the domain compares what it is given. */
  readonly realHash: string;
  readonly duressHash: string;
}

export type Face = 'real' | 'decoy' | 'refused';

export function faceFor(pins: Pins, enteredHash: string): Face {
  if (enteredHash === pins.realHash) return 'real';
  if (enteredHash === pins.duressHash) return 'decoy';
  return 'refused';
}

/** The two PINs must differ; a decoy that is the real PIN is no decoy. */
export function validPins(pins: Pins): boolean {
  return pins.realHash !== pins.duressHash && pins.realHash.length > 0 && pins.duressHash.length > 0;
}

export interface CancelGesture {
  readonly fingers: number;
  readonly heldMs: number;
}

export const CANCEL_FINGERS = 2;
export const CANCEL_HOLD_MS = 2_000;

/** The gesture alone is not enough; the PIN follows it. */
export function gestureAccepted(g: CancelGesture): boolean {
  return g.fingers === CANCEL_FINGERS && g.heldMs >= CANCEL_HOLD_MS;
}

export type CancelOutcome =
  | { readonly cancelled: true; readonly tellCircle: 'cancelled' | 'cancelled under duress' }
  | { readonly cancelled: false };

/**
 * What a cancel attempt does: nothing without the gesture; a normal cancel
 * with the real PIN; a cancel that looks normal on the screen and says
 * *under duress* to the circle with the duress PIN.
 */
export function cancel(pins: Pins, g: CancelGesture, enteredHash: string): CancelOutcome {
  if (!gestureAccepted(g)) return { cancelled: false };
  switch (faceFor(pins, enteredHash)) {
    case 'real':
      return { cancelled: true, tellCircle: 'cancelled' };
    case 'decoy':
      return { cancelled: true, tellCircle: 'cancelled under duress' };
    default:
      return { cancelled: false };
  }
}
