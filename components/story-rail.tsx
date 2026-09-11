"use client";

import Link from "next/link";
import { ArrowRight, Check } from "@/components/icons";
import type { Stage, Story } from "@/lib/stages";

// The home page's side rail: what you have done, beside where you can go.
//
// The page used to say only two things - what to do next, and what the doors
// are. Both are about the future, so somebody who spent forty minutes here
// last week arrived at the screen a stranger sees, minus a bar that had
// moved. This is the missing half.
//
// Three blocks, in this order, because they answer three different questions:
// the story says who you are here, "in progress" says what is open, and
// "completed" says what is behind you. A list on its own is not a story - it
// makes somebody read six rows and do the joining themselves - and a story on
// its own cannot be acted on.
//
// Stages that have not opened are deliberately absent. Four greyed rows
// telling somebody what they cannot do yet is most of a column spent on
// refusals; the whole map is on /journey, which the foot of the rail links to.
//
// The whole rail folds away, not just its contents. A record is worth most to
// the person building one and least to somebody who came here to open a door,
// so anybody it is in the way of can put it away and get the width back - the
// doors go from two columns to three as it goes.
//
// Collapsed it becomes a spine rather than disappearing: the title turned on
// its side, the stage count, and the chevron that brings it back. A control
// that vanishes when used is a control people are afraid to press.
//
// The open state lives in the page, not here, because the grid beside it has
// to change at the same moment. It is not remembered between visits - that
// needs a stored preference to avoid the rail flashing open before a script
// decides it should not be.

export function StoryRail({
  /** Who they are and what the profile still needs, both by rule. */
  story,
  stages,
  open,
  onToggle,
}: {
  story: Story;
  stages: Stage[];
  open: boolean;
  onToggle: () => void;
}) {
  const live = stages.filter((stage) => stage.state === "live");
  const done = stages.filter((stage) => stage.state === "done");
  // Nothing behind them yet: the second block is an invitation, not a
  // report on work in flight.
  const fresh = done.length === 0;

  // ---- folded: a spine on a laptop, one slim bar on a phone ----
  if (!open) {
    return (
      <aside className="animate-fade-up overflow-hidden rounded-2xl border border-slate-200 bg-surface">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={false}
          aria-label="Show your story so far"
          className="group flex min-h-11 w-full cursor-pointer items-center gap-3 px-2.5 py-3 text-left transition-colors hover:bg-slate-50 lg:h-full lg:flex-col lg:justify-start lg:px-1.5 lg:py-4"
        >
          {/* Big enough to be the obvious thing to press: folded, this
              circle is the only way back, so it carries the weight the whole
              rail had. */}
          <span
            aria-hidden
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-teal/15 text-[1.15rem] font-bold leading-none text-brand-teal-deep ring-1 ring-brand-teal/30 transition-colors group-hover:bg-brand-teal/25 dark:text-brand-teal-soft"
          >
            &#9656;
          </span>
          <span className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-brand-teal-deep dark:text-brand-teal-soft lg:mt-3 lg:[writing-mode:vertical-rl]">
            Your story so far
          </span>
          {/* What is earned stays visible while the rail is away, so folding
              it reads as putting the record aside rather than losing it. */}
          <span className="ml-auto flex items-center gap-1.5 lg:ml-0 lg:mt-4 lg:flex-col">
            {stages.map((stage) => (
              <span
                key={stage.id}
                aria-hidden
                className={`h-1.5 w-1.5 rounded-full ${
                  stage.state === "done"
                    ? "bg-brand-teal"
                    : stage.state === "live"
                      ? "bg-brand-violet"
                      : "bg-slate-200"
                }`}
              />
            ))}
            <span className="ml-1 text-[0.7rem] font-semibold text-slate-400 lg:ml-0 lg:mt-2 lg:[writing-mode:vertical-rl]">
              {done.length}/{stages.length}
            </span>
          </span>
        </button>
      </aside>
    );
  }

  return (
    <aside className="animate-fade-up rounded-2xl border border-slate-200 bg-surface p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-brand-teal-deep dark:text-brand-teal-soft">
          Your story so far
        </h2>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded
          aria-label="Hide your story so far"
          className="-mr-2 -mt-2 grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-brand-ink"
        >
          <span aria-hidden className="text-[1.15rem] leading-none">
            &#9666;
          </span>
        </button>
      </div>
      {story.who ? (
        <p className="mt-2 text-[0.86rem] leading-relaxed text-slate-700">
          {story.who}
        </p>
      ) : (
        // Nothing on the record yet.
        //
        // "Nothing here yet" is true and it is also the least interesting
        // thing this column could say to the person who most needs a reason
        // to stay. So it shows somebody else's story instead - labelled as
        // somebody else's, the same way the signed-out job fit check and the
        // profile builder do - because a worked example answers "what is
        // this for" in one read, and a blank one answers nothing.
        <div className="mt-2 rounded-xl border border-slate-200 bg-brand-mist p-3">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
            An example, not yours
          </p>
          <p className="mt-1.5 text-[0.86rem] leading-relaxed text-slate-700">
            Anjali is a final-year B.Com student in Hyderabad. She read six
            roles before choosing Customer Success Associate, sat the readiness
            assessment for it and scored 68, and built a resume aimed at that
            job from the same record.
          </p>
          <p className="mt-2 text-[0.8rem] leading-relaxed text-slate-500">
            That took her about an hour, spread over a week. Yours starts with
            the first thing you do here.
          </p>
        </div>
      )}

      {/* The one place on this page that says what is still missing, in the
          form's own words rather than as a percentage.
          
          Everything Ascend recommends is built from these answers, so a thin
          profile is not a tidiness problem - it is the reason the
          recommendations are thin. Naming the actual questions is what turns
          "your profile is 60% complete" into something somebody can act on in
          the next two minutes. */}
      {story.missing.length > 0 && (
        <div className="mt-3 rounded-xl border border-brand-teal/40 bg-brand-teal/[0.07] p-3">
          <p className="text-[0.82rem] leading-relaxed text-slate-700">
            We still do not know{" "}
            <strong className="font-semibold text-brand-ink">
              {said(story.missing)}
            </strong>
            . Everything we suggest is built from these answers.
          </p>
          <Link
            href="/profile"
            className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-[0.82rem] font-bold text-brand-teal-deep underline underline-offset-2 dark:text-brand-teal-soft"
          >
            Fill in your profile
            <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {live.length > 0 && (
        <>
          <h3 className="mt-5 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-brand-violet-deep">
            {fresh ? "Start here" : "In progress"}
          </h3>
          <ul className="mt-2 grid gap-3">
            {live.map((stage) => (
              <Row key={stage.id} stage={stage} />
            ))}
          </ul>
        </>
      )}

      {done.length > 0 && (
        <>
          <h3 className="mt-5 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-slate-400">
            Completed
          </h3>
          <ul className="mt-2 grid gap-3">
            {done.map((stage) => (
              <Row key={stage.id} stage={stage} />
            ))}
          </ul>
        </>
      )}

      <Link
        href="/journey"
        className="mt-4 inline-flex min-h-11 items-center border-t border-slate-200 pt-3 text-[0.78rem] font-semibold text-slate-500 underline underline-offset-2 transition-colors hover:text-brand-ink"
      >
        See the whole journey
      </Link>
    </aside>
  );
}

/** Three named, then a count. A list of nine questions is a wall, not a nudge. */
function said(missing: string[]): string {
  const shown = missing.slice(0, 3);
  const rest = missing.length - shown.length;
  const list =
    shown.length === 1
      ? shown[0]!
      : `${shown.slice(0, -1).join(", ")} or ${shown[shown.length - 1]}`;
  return rest > 0 ? `${list}, and ${rest} more` : list;
}

function Row({ stage }: { stage: Stage }) {
  const live = stage.state === "live";
  const body = (
    <>
      <span
        aria-hidden
        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[0.62rem] font-bold ${
          live
            ? "bg-brand-violet/15 text-brand-violet-deep"
            : "bg-brand-teal/20 text-brand-teal-deep"
        }`}
      >
        {live ? "→" : <Check size={11} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.86rem] font-semibold text-brand-ink">
          {stage.title}
        </span>
        {/* What they already have from it when it is done; what it gives them
            when it is the one open. Never both - a finished stage does not
            need to be sold. */}
        <span className="block text-[0.78rem] leading-snug text-slate-600">
          {live ? stage.gives : (stage.detail ?? stage.gives)}
        </span>
        {stage.progress && stage.progress.total > 1 && (
          <>
            <span
              aria-hidden
              className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-slate-100"
            >
              <span
                className="block h-full rounded-full bg-brand-teal"
                style={{
                  width: `${Math.round((stage.progress.done / stage.progress.total) * 100)}%`,
                }}
              />
            </span>
            <span className="mt-1 block text-[0.72rem] text-slate-500">
              {stage.progress.label}
            </span>
          </>
        )}
      </span>
    </>
  );

  return (
    <li>
      {stage.href ? (
        <Link
          href={stage.href}
          className="flex gap-2.5 rounded-lg py-1 transition-colors hover:bg-slate-50"
        >
          {body}
        </Link>
      ) : (
        <div className="flex gap-2.5 py-1">{body}</div>
      )}
    </li>
  );
}
