// Text copied onto a resume, in the resume's own voice.
//
// Parts of the profile are written by the app *to* the person - the profile
// summary opens "You're a System Development Engineer II at Amazon..." - which
// is right on the profile page and wrong on their resume, where it reads as
// somebody else describing them. Resumes also drop "I": the builder's own
// writer and checklist hold to "Handled 40 tickets a day", never "I handled".
//
// So copied text loses its pronouns, whichever person they are in:
//   "You're a X with..."        -> "X with..."
//   "You've led a team of 15."  -> "Led a team of 15."
//   "I am a X" / "I led..."     -> "X" / "Led..."
//   "...working with your team" -> "...working with the team"
// Deterministic and conservative: it only removes pronouns and the helper
// verb that comes with them, and never adds a word of its own beyond "the"
// after a preposition, where dropping "your" would leave a gap.

const PREPOSITIONS = "with|to|for|of|on|in|at|from|by|into|across|through|within|about|over|under|around|among|between|alongside";

// A sentence starts at the beginning, or after . ! ? (and a closing quote or bracket).
const START = String.raw`(^|[.!?]["”’)\]]?\s+)`;
const AP = "['’]";

const capitalise = (start: string, rest: string) => start + rest.charAt(0).toUpperCase() + rest.slice(1);

/** One copied passage, without "you"/"your" or "I"/"my". */
export function resumeVoice(text: string): string {
  if (!text) return text;
  let t = text;
  const atStart = (pattern: string) => new RegExp(`${START}${pattern}\\s+(\\S)`, "gi");
  // A sentence-start pronoun must be followed by a space, so "i.e." never matches.
  const drop = (pattern: string) => {
    t = t.replace(atStart(pattern), (_m, start: string, next: string) => capitalise(start, next));
  };
  // "You're a X" / "I am an X": the role itself starts the sentence.
  drop(`(?:you${AP}re|you are|you were|i${AP}m|i am|i was)\\s+(?:a|an)`);
  // Subject and helper verb at the start of a sentence.
  drop(`(?:you${AP}re|you are|you were|i${AP}m|i am|i was)`);
  drop(`(?:you${AP}ve|you have|you had|i${AP}ve|i have|i had)`);
  drop(`(?:you${AP}ll|you will|you would|you${AP}d|i${AP}ll|i will|i would|i${AP}d)`);
  drop(`(?:you|i)`);
  drop(`(?:your|my)`);
  // Inside a sentence: "with your team" keeps its sense as "with the team".
  t = t.replace(new RegExp(`\\b(${PREPOSITIONS})\\s+(?:your|my)\\b`, "gi"), "$1 the");
  // "...and you've led" -> "...and led".
  t = t.replace(new RegExp(`\\b(and|but|while|where|when|as|so|because|then)\\s+(?:you|i)(?:${AP}re|${AP}ve|${AP}ll|${AP}d|${AP}m|\\s+(?:are|were|have|had|will|would|am|was))?\\s+`, "gi"), "$1 ");
  // Anything left: the pronoun goes, its sentence stays.
  t = t.replace(/\b(?:your|yours|yourself|my|myself)\b\s*/gi, "");
  t = t.replace(new RegExp(`\\byou(?:${AP}(?:re|ve|ll|d))?\\b\\s*`, "gi"), "");
  // "I" only as a pronoun - before a lower-case word - so "Phase I", "Engineer II" and "i.e." survive.
  t = t.replace(new RegExp(`\\bI(?:${AP}(?:m|ve|ll|d))?\\s+(?=[a-z])(?!(?:of|and|or|to|in|for|the)\\b)`, "g"), "");
  return t
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/^\s+/, "")
    .replace(/^(\S)/, (c) => c.toUpperCase());
}
