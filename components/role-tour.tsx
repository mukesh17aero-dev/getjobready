"use client";

// The second way into Discovery: browse, rather than answer.
//
// The questions work when someone can react to a choice. They do not work
// for the person who says "I do not even know what jobs exist" - that person
// needs to see the field before they can have a preference about it. So this
// is the same destination reached the other way round: pick an industry, look
// at what is in it, and if looking is not enough, be walked through them one
// at a time with the discovery assistant along.
//
// It adds to Discovery and replaces none of it. Both roads end at the same
// place: a role you can choose, or a set of questions that will check
// what you just said about yourself.
//
// What is recorded is what the person did - which roles they said yes to,
// which part of the day they would least want, what they stopped to ask about.
// Nothing here scores anybody: the notes go back to the caller and the real
// recommendation stays where it belongs, on the server.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "@/components/dialog";
import { RolePreview, payRange } from "@/components/role-preview";
import { DiscoveryAssistant } from "@/components/discovery-assistant";
import type { DiscoveryContent, RoleDetail } from "@/lib/api";
import { ArrowRight, Check, ChevronRight } from "@/components/icons";

/**
 * What one role on the walk-through left behind - in the person's own words.
 *
 * Chips were faster and worth less. "Not sure" tells nobody anything, least of
 * all the person who tapped it; a sentence about what they made of a job is
 * the only artefact of a tour that is still useful a month later, and writing
 * it is itself the moment somebody works out what they think. Hence the floor:
 * fifty characters is roughly one real sentence, and short of that nobody has
 * said anything yet.
 */
export const MIN_ANSWER = 25;

export type TourNote = {
  roleId: string;
  title: string;
  /** What they make of the role, unprompted and in full. May be empty on a
   *  tour stop, where saying whether it interests them is enough to move on. */
  thoughts: string;
  /** Their verdict on the stop: interested, or not for them. */
  reaction?: "curious" | "not-for-me";
  /** Which part of the day they would least want, and why. Only the dialog
   *  walk-through asks this; a tour stop asks one question, not two. */
  leastWanted?: string;
  /** Everything they put to the discovery assistant while this role was open. */
  asked: string[];
};

/**
 * One open question. The counter is not a scold - it is there so the floor is
 * visible before somebody hits it, which is the difference between a form that
 * asks for a sentence and a form that rejects one.
 */
export function OpenAnswer({
  id,
  label,
  hint,
  placeholder,
  value,
  onChange,
  optional = false,
}: {
  id: string;
  label: string;
  hint: string;
  placeholder: string;
  value: string;
  onChange: (next: string) => void;
  /** Nothing has to be written; a reason simply helps. Said under the box. */
  optional?: boolean;
}) {
  const left = MIN_ANSWER - value.trim().length;
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[1rem] font-semibold text-brand-ink"
      >
        {label}
      </label>
      <p className="mt-1 text-[0.8rem] text-slate-500">{hint}</p>
      <textarea
        id={id}
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-slate-300 bg-surface px-3.5 py-2.5 text-[0.9rem] leading-relaxed text-brand-ink outline-none placeholder:text-slate-400 focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/30"
      />
      <p
        className={`mt-1 text-[0.75rem] ${left > 0 ? "text-slate-400" : "text-brand-teal-deep"}`}
      >
        {optional && value.trim() === ""
          ? "Optional. A reason helps us understand you and recommend roles that fit your interests and potential."
          : left > 0
            ? `${left} more character${left === 1 ? "" : "s"} - a sentence is plenty.`
            : "That will do."}
      </p>
    </div>
  );
}

export function RoleTour({
  worlds,
  catalogue,
  roles,
  onClose,
  onChoose,
  chosenRoleId = null,
  choosing = false,
  initialWorld = null,
  itinerary = null,
  finish,
}: {
  worlds: DiscoveryContent["worlds"];
  catalogue: DiscoveryContent["catalogue"];
  roles: RoleDetail[];
  onClose: () => void;
  /** Opened from an industry the person already picked - skip the picker. */
  initialWorld?: string | null;
  /**
   * A planned walk-through: these roles, in this order, starting immediately.
   * Skips both the industry picker and the roles list, because the caller has
   * already asked for both.
   */
  itinerary?: string[] | null;
  /** Saving a role as the chosen one, where there is somewhere to save it. */
  onChoose?: (roleId: string) => void;
  chosenRoleId?: string | null;
  choosing?: boolean;
  /** The single action at the end. The caller decides what it means. */
  finish: { label: string; onAct: (notes: TourNote[]) => void };
}) {
  const detail = useMemo(
    () => new Map(roles.map((r) => [r.roleId, r])),
    [roles],
  );
  const titles = useMemo(
    () => new Map(catalogue.map((c) => [c.id, c.title])),
    [catalogue],
  );
  // Only roles we can actually show in full. A catalogue entry with no detail
  // behind it would be a door that opens onto nothing.
  const inWorld = useMemo(
    () => (worldId: string) =>
      catalogue.filter((c) => c.world === worldId && detail.has(c.id)),
    [catalogue, detail],
  );

  // A planned tour is the whole component: it opens on the first role of the
  // itinerary rather than on anything to choose.
  const planned = (itinerary ?? []).filter((id) => detail.has(id));
  const [world, setWorld] = useState<string | null>(initialWorld);
  const [openRole, setOpenRole] = useState<string | null>(planned[0] ?? null);
  // A non-empty queue means a walk-through is running.
  const [queue, setQueue] = useState<string[]>(planned);
  const [at, setAt] = useState(0);
  const [verdictFor, setVerdictFor] = useState<string | null>(null);
  const [notes, setNotes] = useState<TourNote[]>([]);
  const [summary, setSummary] = useState(false);
  const asked = useRef<string[]>([]);
  const body = useRef<HTMLElement | null>(null);

  const titleOf = (id: string) => titles.get(id) ?? id.replace(/_/g, " ");
  const worldOf = (id: string) => worlds.find((w) => w.id === id) ?? null;

  function walk(worldId: string) {
    const list = inWorld(worldId).map((c) => c.id);
    if (list.length === 0) return;
    asked.current = [];
    setNotes([]);
    setQueue(list);
    setAt(0);
    setOpenRole(list[0]!);
  }

  function leaveRole() {
    // On a walk-through, closing a role is the moment to ask what they made
    // of it - while it is still in mind, and before the next one crowds it out.
    if (queue.length > 0 && openRole) setVerdictFor(openRole);
    setOpenRole(null);
  }

  function record(thoughts: string, leastWanted: string) {
    const roleId = verdictFor;
    if (!roleId) return;
    setNotes((n) => [
      ...n.filter((x) => x.roleId !== roleId),
      {
        roleId,
        title: titleOf(roleId),
        thoughts,
        leastWanted,
        asked: asked.current,
      },
    ]);
    asked.current = [];
    setVerdictFor(null);
    const next = at + 1;
    if (next < queue.length) {
      setAt(next);
      setOpenRole(queue[next]!);
    } else {
      setQueue([]);
      setSummary(true);
    }
  }

  function stopWalking() {
    setVerdictFor(null);
    setQueue([]);
    setSummary(notes.length > 0);
  }

  /* ---------------------------------------------------------------- role -- */

  if (openRole) {
    const role = detail.get(openRole);
    if (role) {
      const walking = queue.length > 0;
      return (
        <RolePreview
          role={role}
          tour
          matchLine={
            walking
              ? `${at + 1} of ${queue.length} \u00b7 about a minute`
              : undefined
          }
          chosen={chosenRoleId === openRole}
          choosing={choosing}
          onClose={leaveRole}
          onChoose={onChoose ? () => onChoose(openRole) : undefined}
          bodyRef={body}
          assistant={
            <>
              {/* Only on a walk-through: browsing a role on your own should
                  never have the page move under you. */}
              {walking && (
                <TourPacer key={`pace-${openRole}`} scroller={body} onDone={leaveRole} />
              )}
              <DiscoveryAssistant
                key={`assistant-${openRole}`}
                role={role}
                tour={walking}
                scrollRef={body}
                onAsked={(q) => {
                  asked.current = [...asked.current, q];
                }}
              />
            </>
          }
        />
      );
    }
  }

  /* ------------------------------------------------------------- verdict -- */

  if (verdictFor) {
    const role = detail.get(verdictFor);
    if (role) {
      return (
        <VerdictCard
          key={verdictFor}
          role={role}
          title={titleOf(verdictFor)}
          step={at + 1}
          of={queue.length}
          onDone={record}
          onLeave={stopWalking}
        />
      );
    }
  }

  /* ------------------------------------------------------------- summary -- */

  if (summary) {
    const keen = notes;
    const questions = notes.flatMap((n) => n.asked);
    const distinct = Array.from(new Set(questions));
    return (
      <Dialog
        title="What you said"
        subtitle={`${notes.length} role${notes.length === 1 ? "" : "s"} looked at`}
        onClose={onClose}
        footer={
          <button
            type="button"
            onClick={() => finish.onAct(notes)}
            className="rounded-lg bg-brand-violet px-5 py-2 text-sm font-bold text-white hover:bg-brand-violet-deep"
          >
            {finish.label}
          </button>
        }
      >
        {keen.length === 0 ? (
          <>
            <p className="text-[0.95rem] font-medium leading-snug text-slate-900">
              None of those were it.
            </p>
            <p className="mt-2 text-[0.88rem] leading-relaxed text-slate-600">
              That is a real answer and a useful one - it is faster to rule out
              a whole industry in ten minutes than to find out in a first job.
              Try another industry, or let the questions work it out from how
              you answer rather than from what the roles are called.
            </p>
          </>
        ) : (
          <>
            <p className="text-[0.95rem] font-medium leading-snug text-slate-900">
              What you made of {keen.length === 1 ? "it" : "them"}.
            </p>
            <ul className="mt-3 grid gap-2.5">
              {keen.map((n) => (
                <li
                  key={n.roleId}
                  className="rounded-xl border border-slate-200 px-3.5 py-3"
                >
                  <span className="text-[0.88rem] font-bold text-slate-900">
                    {n.title}
                  </span>
                  <p className="mt-1 text-[0.82rem] leading-relaxed text-slate-600">
                    &ldquo;{n.thoughts}&rdquo;
                  </p>
                  {n.leastWanted && (
                    <p className="mt-1 text-[0.78rem] leading-snug text-slate-500">
                      Least keen on: {n.leastWanted}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setOpenRole(n.roleId)}
                    className="mt-1.5 inline-flex min-h-9 items-center gap-1 text-[0.78rem] font-semibold text-brand-violet-deep"
                  >
                    Open it again <ChevronRight size={13} />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {distinct.length > 0 && (
          <div className="mt-4 rounded-xl bg-slate-50 p-3.5">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.08em] text-slate-400">
              What you stopped to ask
            </p>
            <ul className="mt-1.5 grid gap-1 text-[0.82rem] text-slate-600">
              {distinct.slice(0, 5).map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
            <p className="mt-2 text-[0.74rem] leading-snug text-slate-400">
              Worth knowing about yourself: the thing you check first is usually
              the thing you are actually deciding on.
            </p>
          </div>
        )}

        <p className="mt-4 text-[0.78rem] leading-relaxed text-slate-400">
          This is a record of what you said, not a result. Nothing here has
          been scored.
        </p>
      </Dialog>
    );
  }

  /* --------------------------------------------------------------- roles -- */

  if (world) {
    const here = inWorld(world);
    const w = worldOf(world);
    return (
      <Dialog
        title={w?.title ?? "Roles"}
        subtitle={w?.caption}
        onClose={onClose}
        wide
        footer={
          <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setWorld(null)}
              className="min-h-11 text-sm font-semibold text-slate-500"
            >
              ← All industries
            </button>
            <button
              type="button"
              onClick={() => walk(world)}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-violet px-5 text-sm font-bold text-white hover:bg-brand-violet-deep"
            >
              Walk me through {here.length === 1 ? "it" : "all " + here.length}
              <ArrowRight size={15} />
            </button>
          </div>
        }
      >
        <p className="text-[0.88rem] leading-relaxed text-slate-600">
          Open any of them to see the day, the pay and the hard parts. If you
          would rather not choose where to start, take the walk-through and I
          will go through them with you one at a time.
        </p>
        <ul className="mt-3.5 grid gap-2.5 sm:grid-cols-2">
          {here.map((c) => {
            const role = detail.get(c.id)!;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setOpenRole(c.id)}
                  className="flex h-full w-full flex-col items-start gap-1 rounded-xl border border-slate-200 bg-surface px-3.5 py-3 text-left transition-colors hover:border-brand-violet/50"
                >
                  <span className="flex w-full items-baseline justify-between gap-2">
                    <span className="text-[0.88rem] font-bold text-slate-900">
                      {c.title}
                    </span>
                    {chosenRoleId === c.id && (
                      <span className="inline-flex shrink-0 items-center gap-1 text-[0.68rem] font-bold text-brand-teal-deep">
                        <Check size={12} /> Chosen
                      </span>
                    )}
                  </span>
                  <span className="text-[0.78rem] leading-snug text-slate-500">
                    {c.summary}
                  </span>
                  <span className="mt-auto pt-1.5 text-[0.72rem] font-semibold text-slate-400">
                    {payRange(role.payMonthly)} to start
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Dialog>
    );
  }

  /* -------------------------------------------------------------- worlds -- */

  return (
    <Dialog
      title="Browse by industry"
      subtitle="No questions - just look at what the work is"
      onClose={onClose}
      wide
    >
      <p className="text-[0.88rem] leading-relaxed text-slate-600">
        Pick an industry and see every role in it. Nobody can have a preference
        about work they have never seen described, so this comes first for
        plenty of people - and the discovery assistant is on every role to answer
        what the page does not.
      </p>
      <ul className="mt-3.5 grid gap-2.5 sm:grid-cols-2">
        {worlds.map((w) => {
          const count = inWorld(w.id).length;
          return (
            <li key={w.id}>
              <button
                type="button"
                disabled={count === 0}
                onClick={() => setWorld(w.id)}
                className="flex h-full w-full flex-col items-start gap-1 rounded-xl border border-slate-200 bg-surface px-4 py-3.5 text-left transition-colors hover:border-brand-violet/50 disabled:opacity-40 disabled:hover:border-slate-200"
              >
                <span className="text-[0.92rem] font-bold text-slate-900">
                  {w.title}
                </span>
                <span className="text-[0.8rem] leading-snug text-slate-500">
                  {w.caption}
                </span>
                <span className="mt-auto pt-1.5 text-[0.72rem] font-semibold text-brand-violet-deep">
                  {count === 0
                    ? "Nothing published here yet"
                    : `${count} role${count === 1 ? "" : "s"} to look at`}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Dialog>
  );
}

/**
 * The step between two roles on a walk-through. Both answers are required,
 * and deliberately so: the walk-through is worth something only if each role
 * gets a reaction while it is still fresh, and "next, next, next" through
 * eight roles teaches nobody anything about themselves.
 *
 * The second question is built from this role's own day, so it can be asked
 * of any role without inventing anything.
 */
function VerdictCard({
  role,
  title,
  step,
  of,
  onDone,
  onLeave,
}: {
  role: RoleDetail;
  title: string;
  step: number;
  of: number;
  onDone: (thoughts: string, leastWanted: string) => void;
  onLeave: () => void;
}) {
  const [thoughts, setThoughts] = useState("");
  const [least, setLeast] = useState("");
  const ready =
    thoughts.trim().length >= MIN_ANSWER && least.trim().length >= MIN_ANSWER;
  const last = step >= of;

  return (
    <Dialog
      title={title}
      subtitle={`Role ${step} of ${of}`}
      onClose={onLeave}
      footer={
        <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onLeave}
            className="min-h-11 text-sm font-semibold text-slate-500"
          >
            Stop the walk-through
          </button>
          <button
            type="button"
            disabled={!ready}
            onClick={() => onDone(thoughts.trim(), least.trim())}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-violet px-5 text-sm font-bold text-white transition-colors hover:bg-brand-violet-deep disabled:opacity-40"
          >
            {last ? "See what I said" : "Next role"}
            <ArrowRight size={15} />
          </button>
        </div>
      }
    >
      <div className="grid gap-5">
        <OpenAnswer
          id="tour-thoughts"
          label="What do you make of it?"
          hint="Not whether it is good - whether it is you. First reaction, in your own words."
          placeholder="Honestly, the part that stood out was…"
          value={thoughts}
          onChange={setThoughts}
        />
        <OpenAnswer
          id="tour-least"
          label="Which part of that day would you least want, and why?"
          hint={`Every job has one. For this one the day splits into ${role.workMix.map((m) => m.label.toLowerCase()).join(", ")}.`}
          placeholder="The bit I would dread is…"
          value={least}
          onChange={setLeast}
        />
      </div>
    </Dialog>
  );
}

/**
 * The minute. On a walk-through the role scrolls itself, slowly, so somebody
 * can watch a job go past without deciding where to look - which is the whole
 * difference between a tour and a list of links.
 *
 * Three things it must get right, because an auto-scrolling page is infuriating
 * when it gets them wrong:
 *
 *   It yields immediately. One touch of the wheel, one swipe, one arrow key and
 *   it stops - the person is now reading, and reading beats pacing.
 *   It never restarts on its own after that; resuming is a button.
 *
 *   It obeys prefers-reduced-motion by not starting. Someone who has asked the
 *   whole system to hold still has not made an exception for us.
 *
 *   It ends by handing back. Reaching the bottom offers the one thing worth
 *   doing next rather than moving on by itself, because what comes next is a
 *   question only the person can answer.
 */
const PACE_SECONDS = 50;

function TourPacer({
  scroller,
  onDone,
}: {
  scroller: React.RefObject<HTMLElement | null>;
  onDone: () => void;
}) {
  const [state, setState] = useState<"idle" | "running" | "paused" | "done">(
    "idle",
  );
  const [percent, setPercent] = useState(0);

  // A beat at the top before anything moves, so the role's own first line is
  // read by a person rather than swept past.
  useEffect(() => {
    const el = scroller.current;
    // scrollTo, not scrollTop =, so nothing reached through a prop is
    // assigned to.
    el?.scrollTo({ top: 0 });
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const t = setTimeout(() => setState("running"), 900);
    return () => clearTimeout(t);
  }, [scroller]);

  const yield_ = useCallback(() => {
    setState((s) => (s === "running" ? "paused" : s));
  }, []);

  // Anything the person does with their hands wins. Note that our own writes
  // to scrollTop raise "scroll" and never these, so this cannot self-trigger.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const opts = { passive: true } as const;
    el.addEventListener("wheel", yield_, opts);
    el.addEventListener("touchstart", yield_, opts);
    el.addEventListener("keydown", yield_, opts);
    return () => {
      el.removeEventListener("wheel", yield_);
      el.removeEventListener("touchstart", yield_);
      el.removeEventListener("keydown", yield_);
    };
  }, [scroller, yield_]);

  useEffect(() => {
    if (state !== "running") return;
    const el = scroller.current;
    if (!el) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const seconds = (now - last) / 1000;
      last = now;
      const travel = el.scrollHeight - el.clientHeight;
      if (travel <= 8) {
        setState("done");
        return;
      }
      // Speed is set by the content, not by the pixel: a long role and a short
      // one both take about the same minute.
      const next = Math.min(
        el.scrollTop + (travel / PACE_SECONDS) * seconds,
        travel,
      );
      el.scrollTo({ top: next });
      const done = next >= travel - 1;
      setPercent(Math.round((next / travel) * 100));
      if (done) {
        setState("done");
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [state, scroller]);

  return (
    <div className="flex items-center gap-3 border-t border-slate-200 bg-slate-50 px-5 py-2">
      {state === "done" ? (
        <>
          <span className="min-w-0 flex-1 text-[0.78rem] text-slate-500">
            That is the whole of it.
          </span>
          <button
            type="button"
            onClick={onDone}
            className="min-h-10 shrink-0 rounded-full border border-brand-violet/45 px-4 text-[0.78rem] font-bold text-brand-violet-deep"
          >
            Done with this one
          </button>
        </>
      ) : (
        <>
          <span
            aria-hidden
            className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200"
          >
            <span
              className="block h-full rounded-full bg-brand-teal transition-[width] duration-200 ease-linear motion-reduce:transition-none"
              style={{ width: `${percent}%` }}
            />
          </span>
          <span className="shrink-0 text-[0.72rem] text-slate-400">
            about a minute
          </span>
          <button
            type="button"
            onClick={() =>
              setState((s) => (s === "running" ? "paused" : "running"))
            }
            className="min-h-10 shrink-0 px-2 text-[0.78rem] font-bold text-brand-violet-deep"
          >
            {state === "running" ? "Pause" : "Scroll it for me"}
          </button>
        </>
      )}
    </div>
  );
}
