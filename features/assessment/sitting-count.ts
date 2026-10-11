// How many questions a sitting held, said once, from the number the backend
// recorded for it.
//
// The sitting size has changed three times (12, then 8, then 5) and the copy
// never followed: one screen said 10 situations while a sitting held 5. Every
// count shown to a person now comes from data, never from a number typed into
// a sentence, and an unknown total is left out rather than guessed.

/** "1 situation" / "3 situations". */
export function countOf(n: number, singular: string, plural = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

/**
 * "4 of 5 situations attempted", or "4 situations attempted" for a sitting
 * from before its size was recorded.
 */
export function situationsAttempted(attempted: number, inSitting: number | null): string {
  if (inSitting === null || inSitting <= 0) return `${countOf(attempted, "situation")} attempted`;
  return `${attempted} of ${countOf(inSitting, "situation")} attempted`;
}
