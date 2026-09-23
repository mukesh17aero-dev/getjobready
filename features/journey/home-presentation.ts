/** Keep the original recommendation's opening sentence and omit appended explanations. */
export function pickupReason(reason: string): string {
  const plain = reason.replace(/\*([^*]+)\*/g, "$1").replace(/\s+/g, " ").trim();
  const sentence = [...new Intl.Segmenter("en", { granularity: "sentence" }).segment(plain)][0]?.segment.trim() ?? "";
  const opening = sentence.split(/\s+(?:—|–|-)\s+|;/)[0].trim();
  return opening && !/[.!?][”’"']?$/.test(opening) ? `${opening}.` : opening;
}
