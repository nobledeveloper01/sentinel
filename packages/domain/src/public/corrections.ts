/**
 * A correction reaches exactly the audience that saw the claim, never fewer
 * (FR-4.4). Every account a report was shown to is remembered against it,
 * and a downgrade or retraction addresses that list.
 */

export interface Distribution {
  readonly report: string;
  readonly seenBy: ReadonlySet<string>;
}

export function shown(d: Distribution, account: string): Distribution {
  const seenBy = new Set(d.seenBy);
  seenBy.add(account);
  return { report: d.report, seenBy };
}

/** The audience a correction must reach: the whole list, and it cannot shrink. */
export function correctionAudience(d: Distribution): ReadonlySet<string> {
  return d.seenBy;
}
