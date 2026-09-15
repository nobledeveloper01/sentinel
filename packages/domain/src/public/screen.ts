/**
 * Content screening (ADR-0003). Free text is checked before submission for
 * what would make it about a person; a match blocks with a reason and an
 * offer to describe the event instead. The screen fails closed: when the
 * server-side screener is unavailable, free text and images are refused and
 * a category-and-location report still succeeds.
 *
 * The rules here are the on-device half — patterns, not a model — and the
 * corpus in `test/screen.test.ts` is the adversarial half.
 */

export type Reason =
  | 'a name'
  | 'a description of a person'
  | 'clothing'
  | 'an ethnic or religious identifier'
  | 'a vehicle plate'
  | 'a phone number';

export interface Screened {
  readonly ok: boolean;
  readonly reasons: ReadonlyArray<Reason>;
}

const PHONE = /\b(?:\+?234|0)[789][01]\d{8}\b/;
/** Nigerian plates: ABC-123-DE, ABC 123 DE, LND-234-XY, with or without separators. */
const PLATE = /\b[A-Z]{3}[-\s]?\d{2,3}[-\s]?[A-Z]{2}\b/i;
const PERSON_NOUNS = 'man|woman|boy|girl|guy|lady|men|women|boys|girls|person|people|youths?|individuals?|okada rider|driver|conductor';
const DESCRIPTOR = new RegExp(
  `\\b(tall|short|fat|slim|thin|dark|light[- ]skinned|fair|bearded|bald|old|young|huge|big)\\s+(${PERSON_NOUNS})\\b|` +
    `\\b(${PERSON_NOUNS})\\s+(in|wearing|with)\\s+(a|an|the|black|white|red|blue|green|yellow|brown|grey|gray)\\b|` +
    `\\b(he|she|they)\\s+(was|were|is|are)\\s+wearing\\b`,
  'i',
);
const CLOTHING = /\b(wearing|dressed in|in a|in an)\s+(black|white|red|blue|green|yellow|brown|grey|gray|ankara|agbada|kaftan|hijab|jalabiya|cap|hoodie|jacket|shirt|trousers|jeans)\b/i;
const IDENTIFIER = /\b(hausa|fulani|yoruba|igbo|ijaw|tiv|kanuri|efik|ibibio|edo|northerner|southerner|christian|muslim|pastor|imam|foreigner|beggar|almajiri|herdsmen|herder)\b/i;
/** A capitalised pair not at the start of a sentence, or a title, reads as a name. */
const TITLE = /\b(?:mr|mrs|miss|ms|alhaji|alhaja|chief|pastor|oga|madam|mallam|dr|engr|barr)\.?\s+[A-Z][a-z]+/i;
/**
 * Two capitalised words together read as a name — at the start of a
 * sentence too, which is where a name most often is — unless the second is
 * the word for a place: Allen Avenue is a road, not a person.
 */
const PLACE_WORDS = /^(avenue|road|street|junction|estate|market|bridge|stop|roundabout|hospital|school|mosque|church|station|garage|close|crescent|lane|way|express|expressway|area|phase|gate|plaza|mall|park|island|beach|river|creek)$/i;
const PAIR = /\b([A-Z][a-z]{2,})\s+([A-Z][a-z]{2,})\b/g;
function looksLikeName(text: string): boolean {
  for (const m of text.matchAll(PAIR)) {
    if (!PLACE_WORDS.test(m[2]!)) return true;
  }
  return false;
}

/** The on-device rules over one text. */
export function screenText(text: string): Screened {
  const reasons: Reason[] = [];
  if (PHONE.test(text)) reasons.push('a phone number');
  if (PLATE.test(text)) reasons.push('a vehicle plate');
  if (IDENTIFIER.test(text)) reasons.push('an ethnic or religious identifier');
  if (DESCRIPTOR.test(text)) reasons.push('a description of a person');
  if (CLOTHING.test(text)) reasons.push('clothing');
  if (TITLE.test(text) || looksLikeName(text)) reasons.push('a name');
  return { ok: reasons.length === 0, reasons };
}

/**
 * What a report may carry given the screener's state. The category and the
 * location always may; the rest only when the screener is up and passed.
 */
export function admit(
  input: { text?: string; hasImage?: boolean; imageHasFace?: boolean },
  screenerAvailable: boolean,
): { category: true; text: boolean; image: boolean; reasons: ReadonlyArray<Reason | 'screener unavailable' | 'a face'> } {
  const reasons: Array<Reason | 'screener unavailable' | 'a face'> = [];
  let text = false;
  let image = false;
  if (!screenerAvailable) {
    if (input.text || input.hasImage) reasons.push('screener unavailable');
  } else {
    if (input.text) {
      const s = screenText(input.text);
      text = s.ok;
      reasons.push(...s.reasons);
    }
    if (input.hasImage) {
      image = !input.imageHasFace;
      if (input.imageHasFace) reasons.push('a face');
    }
  }
  return { category: true, text, image, reasons };
}
