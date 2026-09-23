"use client";

// What the assistant may say: the answering rules, and the promises it refuses to make.

import type { RoleDetail, RoleKnowledge } from "@/lib/api";
import { filled, money } from "./assistant-knowledge";
export function assistantAnswers(
  role: RoleDetail,
  knowledge?: RoleKnowledge | null,
): Array<{ q: string; a: string }> {
  const k = filled(knowledge);
  const out: Array<{ q: string; a: string }> = [];

  // The role's notes are deliberately NOT offered here as a canned answer.
  // They are raw material - often pages of pasted source - and printing them
  // into a chat bubble is unreadable whatever the question was. The backend
  // assistant gets them and answers from them in a few sentences; this
  // matcher only ever says things somebody wrote as an answer.

  // The written depth. Where it does not exist for this role, the question is
  // not offered at all - an assistant that answers everything thinly is worth
  // less than one that answers fewer things and is never caught out.
  if (k.standards.length > 0 && role.skills.length > 0) {
    out.push({
      q: "What does good look like here?",
      a:
        k.standards.map((s) => `At ${s.when}: ${s.looksLike}`).join(" ") +
        ` The people who move up are judged on ${role.skills
          .slice(0, 2)
          .map((s) => s.name.toLowerCase())
          .join(" and ")} long before anyone looks at a certificate.`,
    });
  }

  if (k.industry.length > 0) {
    out.push({
      q: "What is the industry doing?",
      a: k.industry.map((i) => `${i.heading} - ${i.detail}`).join(" "),
    });
  }

  // Described as what happens to people who do this work, never as what will
  // happen to the person reading it.
  if (role.growth.length > 0) {
    out.push({
      q: "Where does it lead?",
      a:
        "The usual path, for people who stay and are good at it: " +
        role.growth
          .map(
            (g) =>
              `${g.title} typically around ${g.when.toLowerCase()}, ${money(g.pay.min)}–${money(g.pay.max)} a month.`,
          )
          .join(" ") +
        (k.transfers.length > 0
          ? ` That is the common route rather than a promise - plenty of people take longer, and some go sideways instead: ${k.transfers.join("; ")}.`
          : " That is the common route rather than a promise - plenty of people take longer, and plenty move sideways instead of up."),
    });
  }

  if (role.hardTruths.length > 0) {
    out.push({
      q: "What would put me off?",
      a:
        role.hardTruths.join(" ") +
        (k.ceilings.length > 0
          ? ` And the honest ceiling: ${k.ceilings.join(" ")}`
          : ""),
    });
  }

  if (k.tools.length > 0) {
    out.push({
      q: "What will I actually be using?",
      a: `Day to day: ${k.tools.join(", ")}. Most of it is normally taught on the job in the first fortnight rather than expected on arrival.`,
    });
  }

  // The written depth, as answers rather than announcements. On a tour these
  // are delivered unprompted; here they wait to be asked for, which is the
  // difference between somebody exploring on their own and somebody being
  // shown round.
  if (k.interview) {
    out.push({
      q: "What is the interview like?",
      a: `How they actually hire for it: ${k.interview.stages.join(" then ")}. What they are really deciding is ${k.interview.judgedOn.join(", ")} - so the preparation that works is rehearsing those rather than memorising answers.`,
    });
  }
  if (k.opportunities.length > 0) {
    out.push({
      q: "Where can this take me?",
      a: `Inside ${sectorName(role)} the same experience is wanted for: ${k.opportunities.join("; ")}.`,
    });
  }
  if (k.importance) {
    out.push({ q: "Why does this job matter?", a: k.importance });
  }
  if (k.succeed.length > 0) {
    out.push({
      q: "What do the ones who do well do?",
      a: k.succeed.join(" "),
    });
  }
  if (k.withAI) {
    out.push({ q: "Is AI changing this job?", a: k.withAI });
  }

  // Ranges, described as typical and indicative. Never a number anyone could
  // mistake for something they have been offered.
  out.push({
    q: "What does it really pay?",
    a: `Typically ${money(role.payMonthly.min)}–${money(role.payMonthly.max)} a month to start, and it varies by employer and city. ${role.payNote} For most people the jump that changes things is the second one, not the first - ${
      role.growth[1]
        ? `${role.growth[1].title} usually sits around ${money(role.growth[1].pay.min)}–${money(role.growth[1].pay.max)}.`
        : "though I do not have reliable numbers past the first step for this one, so I will not invent them."
    }`,
  });

  if (role.workContext.hours || role.workContext.pace) {
    out.push({
      q: "What is the day actually like?",
      a: `${role.workContext.environment}. Hours are ${role.workContext.hours.toLowerCase()}, the pace is ${role.workContext.pace.toLowerCase()}, and you would be one of ${role.workContext.team.toLowerCase()}.${
        role.workMix[0]
          ? ` The largest single part of it is ${role.workMix[0].label.toLowerCase()} - about ${role.workMix[0].share}% of the time.`
          : ""
      }`,
    });
  }

  return out;
}

/**
 * Guarantees, and flattery dressed as assessment. Both make a promise we
 * cannot keep on someone else's behalf - an employer's, or the future's.
 */
export const PROMISE_PATTERNS: RegExp[] = [
  /\byou (?:will|'ll|are going to) (?:earn|get|make|become|land|be hired|be promoted)\b/i,
  /\bguarantee|guaranteed|assured\b/i,
  /\byou(?:'d| would| will) be (?:great|perfect|excellent|ideal)\b/i,
  /\b(?:this|it) (?:will|is sure to) (?:land|get) you\b/i,
  /\bwithin \d+ (?:months?|years?),? you\b/i,
  /\bdefinitely\b/i,
];

export function breaksPromiseRule(text: string): boolean {
  return PROMISE_PATTERNS.some((p) => p.test(text));
}

/**
 * Someone asking whether they personally would be good at it, or whether the
 * job is theirs. We answer with what we can actually stand behind - the work
 * and what it asks - and hand the judgement back to them.
 */
export function isAskingForAPromise(question: string): boolean {
  return /\b(?:will i|would i be|am i good|am i right|can i get|guarantee|do i have a chance|will i get)\b/i.test(
    question,
  );
}

export function sectorName(role: RoleDetail) {
  return role.sector.toLowerCase();
}

function declinePromise(role: RoleDetail) {
  return `I am not going to tell you that you would be good at it, or that you would get it - I have no way of knowing either, and a guess from me is the kind of thing someone plans a year around. What I can do is be exact about what the work asks for and what it is like on a bad day in ${sectorName(role)}, and let you be the one who decides.`;
}

export function behindAll(role: RoleDetail, knowledge: RoleKnowledge) {
  const behind = knowledge.behind ?? {};
  const first = role.responsibilities.find((r) => behind[r]);
  return first
    ? `Take "${first}". ${behind[first]}`
    : "I do not have the notes on what each of those lines is really like for this role yet, and I would rather tell you that than make one up. What I can be exact about is the pay, where the work leads and what people find hard about it.";
}

/**
 * What each answer is about, in the words somebody would actually type. Keys
 * are the questions in assistantAnswers; a typed question that hits one of
 * these gets the real answer instead of an apology.
 */
const ABOUT: Array<{ q: string; words: RegExp }> = [
  {
    q: "Anything else I should know?",
    words: /anything else|what else|else should i know|other than that/i,
  },
  {
    q: "What is the interview like?",
    words: /interview|hiring|hire|recruit|selection|round|test\b/i,
  },
  {
    q: "Where can this take me?",
    words:
      /take me|lead to|opportunit|next role|move (?:to|into)|grow into|options/i,
  },
  {
    q: "Why does this job matter?",
    words:
      /why (?:does|is).*(?:matter|important)|importance|point of (?:this|the) (?:job|role)/i,
  },
  {
    q: "What do the ones who do well do?",
    words: /do well|succeed|success|get ahead|stand out|best at/i,
  },
  {
    q: "Is AI changing this job?",
    words:
      /\bai\b|automat|robot|replaced|machine learning|software (?:doing|taking)/i,
  },
  {
    q: "What does it really pay?",
    words: /pay|salary|earn|money|package|ctc|stipend|income/i,
  },
  {
    q: "Where does it lead?",
    words:
      /career|progress|promotion|senior|ladder|after (?:two|2|three|3) year/i,
  },
  {
    q: "What would put me off?",
    words: /hard|difficult|worst|downside|bad|dislike|put me off|struggle/i,
  },
  {
    q: "What is the day actually like?",
    words: /day|hours|shift|timing|routine|typical|schedule|weekend/i,
  },
  {
    q: "What does good look like here?",
    words: /good look|expected|standard|competent|judged/i,
  },
  {
    q: "What is the industry doing?",
    words: /industry|sector|market|trend|growing|shrinking/i,
  },
  {
    q: "What will I actually be using?",
    words: /tool|software|system|app|equipment|use\b/i,
  },
];

/**
 * Anything typed. A promise is declined outright; a question we hold an answer
 * to is answered with it; anything else is admitted as a gap. It never invents
 * the middle case, which is the only one worth getting right.
 */
export function replyTo(
  question: string,
  role: RoleDetail,
  knowledge?: RoleKnowledge | null,
): string {
  if (isAskingForAPromise(question)) return declinePromise(role);
  const answers = assistantAnswers(role, knowledge);
  for (const { q, words } of ABOUT) {
    if (!words.test(question)) continue;
    const found = answers.find((a) => a.q === q);
    if (found) return found.a;
  }
  // Nothing matched.
  //
  // This used to answer by printing the role's notes field verbatim. That was
  // wrong twice over: the notes are raw material an admin pastes - pages of
  // it - so the reply was a wall of text nobody reads, and it was a
  // non-sequitur, because the notes are not an answer to whatever was asked.
  // Somebody asking "what happens if I don't do well" got a table of salaries.
  //
  // The notes belong to the backend assistant, which is given them along with
  // everything else and told to answer the actual question in a few sentences.
  // Here, with no model, the honest move is the one below: say we do not have
  // it. See ROLE_ASSISTANT_SYSTEM in the backend's role-assistant module.
  return unanswered(role);
}

// The refusal matters more than any answer: an assistant that bluffs once is worth
// nothing afterwards, because the person has tested us and we failed.
function unanswered(role: RoleDetail) {
  return `In the live version I answer this from what we know about ${sectorName(role)} and this role specifically - and where we do not have it, I say so plainly rather than guessing. A wrong pay figure or an invented trend would cost more than the question was worth.`;
}

/**
 * The mark. A lit disc with the light turning slowly inside it, rather than an
 * initial in a circle - close enough to a face to be addressed, far enough
 * from one to avoid pretending to be a person.
 *
 * It is never a red dot and it never bounces. Both of those say notification,
 * and a decade of notifications has taught everyone to close them without
 * reading. Presence is what earns the tap.
 */
