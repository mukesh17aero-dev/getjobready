"use client";

// The guided tour: its chapters, its hooks and how a line is spoken.

import { assistantAnswers } from "./assistant-answers";
import type { RoleDetail, RoleKnowledge } from "@/lib/api";
import { RichText } from "@/components/ui/rich-text";
import { filled } from "./assistant-knowledge";
export function Face({
  pulsing,
  small,
  arriving,
}: {
  pulsing?: boolean;
  small?: boolean;
  arriving?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full shadow-[0_2px_12px_-2px_var(--color-brand-violet)] ring-1 ring-white/40 ${
        small ? "mt-0.5 h-7 w-7" : "h-10 w-10"
      } ${arriving ? "motion-safe:animate-assistant-arrive" : ""}`}
      style={{
        background:
          "radial-gradient(circle at 32% 28%, var(--color-brand-violet-soft) 0%, var(--color-brand-violet) 45%, var(--color-brand-violet-deep) 100%)",
      }}
    >
      {/* The turning light. Under reduced motion it simply sits still and the
          disc still looks lit - the character survives, the movement does not. */}
      <span
        className="absolute inset-[-40%] opacity-70 motion-safe:animate-assistant"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0deg, color-mix(in srgb, var(--color-brand-teal-soft) 85%, transparent) 70deg, transparent 150deg, color-mix(in srgb, var(--color-brand-violet-soft) 90%, transparent) 250deg, transparent 330deg)",
        }}
      />
      {/* A highlight, so it reads as lit from somewhere rather than flat. */}
      <span className="absolute left-[18%] top-[14%] h-1.5 w-1.5 rounded-full bg-white/80 blur-[1px]" />
      {pulsing && (
        <span className="absolute inset-0 rounded-full ring-2 ring-brand-teal motion-safe:animate-pulse" />
      )}
    </span>
  );
}

/**
 * The line on the resting bar. Every hook names something specific it can
 * answer, so the invitation is a promise it can keep - and reading the hook
 * is itself worth something even to someone who never taps.
 */
export function assistantHooks(
  role: RoleDetail,
  knowledge?: RoleKnowledge | null,
): Array<{ teaser: string; q: string }> {
  const k = filled(knowledge);
  const shrinking = k.industry.find((i) =>
    /shrink|less|automat|fewer|disappear/i.test(i.heading + i.detail),
  );
  const offers = [
    {
      teaser: `What does ${role.growth[1]?.title ?? "the next step"} actually pay?`,
      q: "What does it really pay?",
    },
    {
      teaser: "What separates good from adequate here?",
      q: "What does good look like here?",
    },
    ...(shrinking
      ? [
          {
            teaser: `The part of this job that is shrinking - ask me`,
            q: "What is the industry doing?",
          },
        ]
      : []),
    {
      teaser: "Where people go after two years of this",
      q: "Where does it lead?",
    },
    {
      teaser: `What ${role.workContext.hours.toLowerCase()} really means`,
      q: "What is the day actually like?",
    },
    {
      teaser: "The part of this people find hardest",
      q: "What would put me off?",
    },
  ];

  // The line on the bar is an invitation, so it may only offer what there is
  // an answer to. Anything unanswerable for this role never gets said.
  const answerable = new Set(assistantAnswers(role, k).map((a) => a.q));
  const usable = offers.filter((o) => answerable.has(o.q));
  return usable.length > 0
    ? usable
    : [{ teaser: "Ask me anything about this role", q: "" }];
}

/**
 * What a guide says when a role comes up: the one thing this job actually is,
 * the shape of the day, and a question back. Every clause is read off the
 * record - no claim here that the page above does not already carry.
 */
export function tourOpening(role: RoleDetail): string {
  const biggest = role.workMix.slice().sort((a, b) => b.share - a.share)[0];
  const day = biggest
    ? `Most of it - about ${biggest.share}% - is ${biggest.label.toLowerCase()}: ${biggest.detail.toLowerCase()}.`
    : "";
  const hard = role.hardTruths[0]
    ? ` The part people find hardest: ${role.hardTruths[0].charAt(0).toLowerCase()}${role.hardTruths[0].slice(1)}`
    : "";
  return `${role.pitch} ${day}${hard} Ask me anything while you read - what it pays past the first step, where it leads, or what would put you off it.`;
}

/**
 * The tour's actual content: what the assistant says about a role, in order,
 * over about two minutes.
 *
 * This is the whole reason a tour exists. A job description tells somebody what
 * the tasks are; it never tells them why the job matters where it sits, what it
 * opens up, what the people who do well actually do, what an interview is
 * really testing, or what the work is turning into now that software does part
 * of it. Those are the questions a nineteen-year-old cannot look up and has
 * nobody to ask.
 *
 * Every chapter that makes a claim about the world comes from written
 * RoleKnowledge. Where it has not been written, the chapter is not invented -
 * it is skipped, and the closing line names what is missing. The chapters that
 * are always present are arithmetic and juxtaposition on the record itself.
 *
 * Nothing here may break the promise rule; the tests run every line through it.
 */
/**
 * Which part of a stop a chapter belongs to.
 *
 * The tour shows a stop in tabs, and what separates them is the KIND of thing
 * being said rather than its length: what the job is, what a posting leaves
 * out, how the same title differs by industry, and the questions somebody is
 * turning over about themselves. The builder decides this because the builder
 * is the only thing that knows - the alternative was the tab strip matching on
 * chapter titles, which breaks the first time one is reworded.
 */
export type ChapterGroup = "role" | "deeper" | "industries";

export type Chapter = {
  title: string;
  text: string;
  group?: ChapterGroup;
  /**
   * A chapter whose content is a set of separate things rather than a
   * paragraph - each industry and what changes about the job there. Run
   * together into prose they read as one long sentence nobody finishes, so
   * the renderer sets them out one per line with the label in front.
   * `text` still carries the flattened version for anything that only has
   * room for a string.
   */
  items?: Array<{ label: string; detail: string }>;
};

export function tourBriefing(
  role: RoleDetail,
  knowledge?: RoleKnowledge | null,
): Chapter[] {
  const k = filled(knowledge);
  const out: Chapter[] = [];
  const sector = role.sector.toLowerCase();

  // Opening: what this is, and where the day actually goes.
  const busiest = role.workMix.slice().sort((a, b) => b.share - a.share)[0];
  out.push({
    group: "role",
    title: "What this actually is",
    text: `${role.pitch}${
      busiest
        ? ` Most of it - about ${busiest.share}% - is ${busiest.label.toLowerCase()}: ${busiest.detail.toLowerCase()}.`
        : ""
    } Here are the parts a job description leaves out.`,
  });

  // Why it matters where it sits.
  if (k.importance) {
    out.push({ group: "deeper", title: "Why this job exists", text: k.importance });
  }

  // What it opens up inside the industry.
  if (k.opportunities.length > 0) {
    out.push({
      group: "deeper",
      title: "What it opens up",
      text: `It is not one job, it is a door into several. Inside ${sector} the same experience is wanted for: ${k.opportunities.join("; ")}.`,
    });
  }

  // What the people who do well actually do - behaviour, not testimony.
  if (k.succeed.length > 0) {
    out.push({
      group: "deeper",
      title: "What the ones who do well do",
      text: `The people who get somewhere in this are not the ones who were best on day one. They are the ones who do these things. ${k.succeed.join(" ")}`,
    });
  }

  // What actually decides who moves up.
  if (k.skillsThatMatter.length > 0) {
    out.push({
      group: "deeper",
      title: "What decides who moves up",
      text: `In order: ${k.skillsThatMatter
        .map((sk) => `${sk.name} - ${sk.why}.`)
        .join(" ")}`,
    });
  } else if (role.skills.length > 0) {
    out.push({
      group: "deeper",
      title: "What decides who moves up",
      text: `From the record: ${role.skills
        .map((sk) => `${sk.name.toLowerCase()} (${sk.why.toLowerCase()})`)
        .join(
          "; ",
        )}. Nobody is going to ask for a certificate before they look at those.`,
    });
  }

  // The interview, and what each stage is really for.
  if (k.interview) {
    const { stages, judgedOn } = k.interview;
    out.push({
      group: "deeper",
      title: "How they actually hire",
      text: `${stages.join(" then ")}. What they are really deciding is ${judgedOn.join(", ")} - so the preparation that works is rehearsing those, not memorising answers.`,
    });
  }

  // What the work is turning into.
  if (k.withAI) {
    out.push({ group: "deeper", title: "What it is turning into", text: k.withAI });
  } else if (k.industry.length > 0) {
    out.push({
      group: "deeper",
      title: "What it is turning into",
      text: `${k.industry[0]!.heading} - ${k.industry[0]!.detail}`,
    });
  }

  // Growth, as a shape rather than a promise.
  const [first, second] = role.growth;
  if (first && second) {
    out.push({
      group: "deeper",
      title: "Growth, plainly",
      text: `${first.title} typically comes around ${first.when.toLowerCase()} and ${second.title} around ${second.when.toLowerCase()}. That is the common route rather than a promise - what actually moves people along it is the list above, not time served.`,
    });
  }

  // What it does not become. The assistant has to be able to disappoint.
  if (k.ceilings.length > 0) {
    out.push({ group: "deeper", title: "The honest ceiling", text: k.ceilings.join(" ") });
  }

  // The questions the person is actually turning over, asked as questions.
  //
  // These sit late on purpose. The chapters above are about the work; these
  // are about them - whether they would be taken, what they would keep if it
  // went wrong, what would be said at home - and they only land once somebody
  // knows what the job is. Each appears only if it has been written for this
  // role: a heading with nothing under it advertises a gap rather than
  // closing one.
  const wondering = role.studentQuestions;
  (
    [
      ["Would they take someone like me?", wondering?.entry],
      ["Where are these jobs - would I have to move?", wondering?.where],
      ["If I leave after a year, what do I take with me?", wondering?.transfers],
      ["Will this job still exist?", wondering?.changing],
    ] as const
  ).forEach(([title, text]) => {
    if (text && text.trim() !== "") {
      // Read with the deeper insight rather than on a tab of their own,
      // which too few people opened.
      out.push({ group: "deeper", title, text: text.trim() });
    }
  });

  // The same title is a different job depending on where it is done.
  const industries = (role.acrossIndustries ?? []).filter(
    (row) => row.industry.trim() !== "" && row.difference.trim() !== "",
  );
  if (industries.length > 0) {
    out.push({
      group: "industries",
      title: "The same job, different industries",
      text: industries
        .map((row) => `${row.industry}: ${row.difference}`)
        .join(" "),
      items: industries.map((row) => ({
        label: row.industry.trim(),
        detail: row.difference.trim(),
      })),
    });
  }

  // A tour stop used to end on "What I do not have yet" - a chapter listing
  // the RoleKnowledge fields nobody had written. It is gone. The reticence it
  // came from still holds and still shows where it belongs: a chapter with
  // nothing behind it is simply not built, and the assistant still says it
  // does not know when it is asked something we do not hold. But ending the
  // briefing on an inventory of our own gaps told the person nothing about
  // the job and left the last word with what is missing.

  return out;
}

/**
 * What somebody said, set out so it can be read.
 *
 * A reply came back as one string and was printed as one paragraph, so an
 * answer with two or three points in it arrived as a wall. This keeps the
 * text exactly as written - nothing is parsed, nothing is interpreted as
 * markup - and only decides where the breaks go: blank lines become
 * paragraphs, and a line opening with a dash or a number becomes a list item.
 * A single-paragraph answer, which is most of them, renders exactly as before.
 */
export function Spoken({ text }: { text: string }) {
  // One formatter for every piece of written text in the product - see
  // components/rich-text.tsx. This used to be its own copy handling paragraphs
  // and bullets; it gained tables for free the day the shared one did, which
  // is the argument for having one.
  return <RichText text={text} />;
}
