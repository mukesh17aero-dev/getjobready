"use client";

import type { ChapterGroup } from "./assistant-tour";
import type { Chapter } from "./assistant-tour";
import { tourBriefing } from "./assistant-tour";

// The guided tour: the assistant explaining a job, not the job description
// being read at you.
//
// A dialog was the wrong container. It boxes the role, gives the assistant a
// strip at the bottom, and asks somebody to sit inside a modal for five
// minutes - which nobody does. So each stop on the itinerary is a screen: the
// role on the left with room to breathe, the assistant beside it with room to
// actually say something, and the tour driving itself between them.
//
// The tour deliberately does NOT repeat what self-exploring already does. Open
// a role from the mosaic and you get the description with a chat window beside
// it; that is there whenever somebody wants it, including here, behind one
// button. What the tour adds is the half nobody can look up: why the job
// matters where it sits, what it opens up, what the people who do well
// actually do, what an interview is really testing, and what the work is
// turning into. Two minutes of that per role, and questions welcome throughout.
//
// The three moments per stop:
//
//   Arriving   the stop is announced and the whole briefing lands at once -
//              every chapter readable immediately, so nobody is made to wait
//              for text that is already written.
//   Reading    read at your own speed. The only clock is the one deciding
//              when to ask what you made of it.
//   Moving on  the question appears by itself when the two minutes are up.
//              One question, and the stop does not end until it is answered:
//              the sentence somebody writes about a job is the only part of a
//              tour still worth anything a month later.

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { SignUpPrompt, type GatedAction } from "@/components/auth/signup-gate";
import { DiscoveryWorkplace } from "./discovery-workplace";
import { RoleTransit } from "./role-transit";
import { RolePreview, payRange } from "./role-preview";
import {
} from "./discovery-assistant";
import { AssistantBubble } from "./assistant-bubble";
import type { RoleDetail } from "@/lib/api";
import { useSavedRoles } from "./use-saved-roles";
import { MIN_ANSWER, OpenAnswer, type TourNote } from "./role-tour";
import { ArrowRight, Check } from "@/components/ui/icons";
import { Blurred, LockedNote } from "@/components/ui/locked-blur";
import { WhyThisRole } from "./why-this-role";

// About two minutes a stop, scaled to how much there is to read. Nothing is
// hidden behind this clock - the whole briefing is on screen from the first
// frame - it only decides when to ask what they made of it.
const SETTLE_MS = 20000;
const PER_CHAPTER_MS = 12000;
/** How long "moving on" holds before it moves on. Long enough to cancel. */
const HANDOVER_MS = 2200;

type Phase = "arriving" | "reading" | "asking" | "leaving";

/** Whether this person has asked their system for less movement. */
const stillness = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function RoleTourStage({
  roles,
  signedOut = false,
  titleOf,
  at,
  chosenRoleId,
  choosing,
  onChoose,
  onNote, initialNote, onDraftNote,
  onAdvance,
  onLeave,
}: {
  /** Guests can complete the tour; account-only actions keep their own gates. */
  signedOut?: boolean;
  /** The itinerary, in order. */
  roles: RoleDetail[];
  titleOf: (roleId: string) => string;
  at: number;
  chosenRoleId: string | null;
  choosing: boolean;
  onChoose: (roleId: string) => void;
  /** What they made of this stop, handed up as they leave it. */
  onNote: (note: TourNote) => void;
  initialNote?: TourNote; onDraftNote?: (note: TourNote) => void;
  /** Move to the next stop, or finish when this was the last. */
  onAdvance: () => void;
  onLeave: () => void;
}) {
  const {saved, toggleSaved, busy: savingRole, error: saveError} = useSavedRoles(signedOut);
  const role = roles[at];
  const total = roles.length;
  const last = at >= total - 1;

  const [phase, setPhase] = useState<Phase>("arriving");
  // The pass plays on ARRIVAL rather than departure. Departure was the tidier
  // idea and the wrong one in practice: it sat behind two minutes of reading
  // and a written note, so it fired once per completed stop and never at all
  // for somebody signed out. Arrival fires the moment the tour opens, and
  // again at every stop - the caller keys this component on the role, so a new
  // stop is a fresh mount and this runs again with no coordination needed.
  //
  // Somebody who asked their system for less movement never sees it, and waits
  // no longer for the stop because of it.
  const [arriving, setArriving] = useState(() => !stillness());
  const landed = useCallback(() => setArriving(false), []);
  const [percent, setPercent] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  // The conventional description, on demand.
  const [reading, setReading] = useState(false);
  const [noteAdded, setNoteAdded] = useState(false);
  const [thoughts, setThoughts] = useState(initialNote?.thoughts ?? "");
  // Their verdict per stop, kept by role so moving on starts the next stop
  // clean without resetting state in an effect.
  const [verdicts, setVerdicts] = useState<Record<string, "curious" | "not-for-me">>(initialNote?.reaction?{[initialNote.roleId]:initialNote.reaction}:{});
  const asked = useRef<string[]>(initialNote?.asked ?? []);
  const card = useRef<HTMLDivElement>(null);

  // Arriving. Top of the page, nothing moving, for as long as it takes to read
  // the stop's own name. Every other per-stop value is initialised above and
  // reset by the remount: the caller keys this component on the role, which is
  // React's own answer to "start again for a new thing".
  useEffect(() => {
    window.scrollTo({ top: 0 });
    const t = setTimeout(() => setPhase("reading"), 1400);
    return () => clearTimeout(t);
  }, []);

  // Reading. Nothing moves. The clock is only there so the tour knows when to
  // ask its question, and so the stop bar can show that time is passing.
  // Memoised, and it matters: this is handed to the assistant as the list it
  // works through on a timer, and a new array on every render would cancel
  // that timer on every render - which is exactly the bug this had.
  const chapters = useMemo(() => tourBriefing(role, role.knowledge), [role]);

  // The stop in tabs rather than one column.
  //
  // The chapters are not one kind of thing - what the job is, what a posting
  // leaves out, how the title differs by industry, and the questions somebody
  // is turning over about themselves. Stacked, the last of those were read by
  // nobody, and they are the ones a posting cannot give you.
  //
  // Each tab says what is behind it, not just its name: "Deeper insight" on
  // its own asks somebody to gamble a click.
  const tabs = useMemo(() => {
    const of = (g: ChapterGroup) => chapters.filter((c) => c.group === g);
    const count = (n: number, one: string, many: string) =>
      `${n} ${n === 1 ? one : many}`;
    return (
      [
        ["role", "The role", of("role"), "What the day is"],
        [
          "deeper",
          "Deeper insight",
          of("deeper"),
          count(of("deeper").length, "thing a posting leaves out", "things a posting leaves out"),
        ],
        [
          "industries",
          "By industry",
          of("industries"),
          count(of("industries")[0]?.items?.length ?? 0, "version of it", "versions of it"),
        ],
      ] as const
    )
      .filter(([, , list]) => list.length > 0)
      .map(([id, label, list, note]) => ({ id, label, list, note }));
  }, [chapters]);

  const [tab, setTab] = useState(0);
  // Which tabs have actually been opened. It is what unlocks the question
  // below - see the note there - and it resets with the stop, because this
  // component is remounted per role.
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const readMs = SETTLE_MS + chapters.length * PER_CHAPTER_MS;
  useEffect(() => {
    if (phase !== "reading") return;
    const started = performance.now();
    const id = setInterval(() => {
      const gone = performance.now() - started;
      const byTabs = tabs.length > 1 ? (opened.size / 2) * 100 : 0;
      setPercent(
        Math.min(100, Math.round(Math.max((gone / readMs) * 100, byTabs))),
      );
      if (gone >= readMs) setPhase("asking");
    }, 700);
    return () => clearInterval(id);
  }, [phase, readMs, chapters.length, opened, tabs.length]);

  // The question arrives on its own, and brings the page to it.
  useEffect(() => {
    if (phase !== "asking") return;
    const t = setTimeout(() => {
      const box = card.current?.getBoundingClientRect();
      // Only if it arrived out of sight. If they are already looking at it,
      // moving the page would be the same rudeness by a different route.
      if (box && (box.top < 0 || box.bottom > window.innerHeight)) {
        card.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 200);
    return () => clearTimeout(t);
  }, [phase]);

  // Guests can finish the itinerary they were promised; saving a direction still asks for an account.
  const [gate, setGate] = useState<GatedAction | null>(null);
  const advance = useCallback(() => onAdvance(), [onAdvance]);

  // Moving on. A beat, cancellable, then the next stop.
  useEffect(() => {
    if (phase !== "leaving") return;
    const t = setTimeout(advance, HANDOVER_MS);
    return () => clearTimeout(t);
  }, [phase, advance]);

  if (!role) return null;

  const title = titleOf(role.roleId);
  const verdict = verdicts[role.roleId] ?? null;
  // Either is enough to move on: a verdict, or a sentence of their own.
  const ready = verdict !== null || thoughts.trim().length >= MIN_ANSWER;
  const remember = (patch: Partial<TourNote> = {}) => onDraftNote?.({roleId:role.roleId,title,thoughts,reaction:verdict??undefined,asked:asked.current,...patch});
  const setVerdict = async (next: "curious" | "not-for-me") => {
    if (next === "curious" && !await toggleSaved(role.roleId)) return;
    const reaction = next === "curious"
      ? (saved.includes(role.roleId) ? undefined : next)
      : (verdict === next ? undefined : next);
    remember({reaction});
    setVerdicts(all => ({ ...all, [role.roleId]: reaction } as Record<string, "curious" | "not-for-me">));
  };

  const leave = () => {
    onNote({
      roleId: role.roleId,
      title,
      thoughts: thoughts.trim(),
      ...(verdict ? { reaction: verdict } : {}),
      asked: asked.current,
    });
    setPhase("leaving");
  };

  return (
    <>
      {arriving && (
        <RoleTransit
          title={title}
          sector={role.sector}
          stop={at + 1}
          total={total}
          onDone={landed}
        />
      )}
      {gate && <SignUpPrompt action={gate} onClose={() => setGate(null)} />}
      <main
        // Open, the panel needs a lane of its own: side by side only where
        // there is width for it, and otherwise below the content rather than
        // on top of it.
        className={`mx-auto max-w-6xl px-4 pt-6 transition-[padding] sm:px-6 ${
          chatOpen
            ? "pb-[34rem] xl:mx-0 xl:ml-8 xl:mr-[27rem] xl:pb-24"
            : "pb-24"
        }`}
      >
        {/* Where you are on the itinerary, always. A tour you cannot see the
          shape of is just a series of surprises. */}
        <div className="sticky top-[6.4rem] z-20 -mx-4 mb-4 border-b border-slate-200 bg-surface/90 px-4 py-2.5 backdrop-blur sm:top-[4.2rem] sm:-mx-6 sm:px-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="text-[0.75rem] font-bold uppercase tracking-[0.08em] text-brand-violet-deep">
              Stop {at + 1} of {total}
            </span>
            <span aria-hidden className="flex flex-1 items-center gap-1">
              {roles.map((r, i) => (
                <span
                  key={r.roleId}
                  className={`h-1 flex-1 rounded-full ${
                    i < at
                      ? "bg-brand-teal"
                      : i === at
                        ? "bg-slate-200"
                        : "bg-slate-200/60"
                  }`}
                >
                  {i === at && (
                    <span
                      className="block h-full rounded-full bg-brand-teal"
                      style={{ width: `${percent}%` }}
                    />
                  )}
                </span>
              ))}
            </span>
            <button
              type="button"
              onClick={onLeave}
              className="min-h-9 shrink-0 text-[0.78rem] font-semibold text-slate-500"
            >
              Leave the tour
            </button>
          </div>
        </div>

        <DiscoveryWorkplace role={role} title={title} />

        {/* Split: the role pinned on the left so it never leaves the screen
          while the assistant is talking about it, the briefing on the right. */}
        {/* Both columns give, not just the middle: a fixed 19rem sidebar made
          the briefing carry the whole cost of opening the chat. */}
        {/* Two columns only while both can be read. Opening the chat takes a
          screen's worth of width away, so below xl the card goes above the
          briefing instead of being squeezed into a ribbon beside it. */}
        <div
          className={`grid gap-6 ${
            chatOpen
              ? "xl:grid-cols-[minmax(15rem,19rem)_minmax(0,1fr)]"
              : "lg:grid-cols-[minmax(15rem,19rem)_minmax(0,1fr)]"
          }`}
        >
          <aside className="lg:sticky lg:top-[7.5rem] lg:self-start">
            <div className="rounded-2xl border border-slate-200 bg-surface p-4">
              <p className="text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-slate-500">
                {role.sector}
              </p>
              <h1 className="mt-0.5 font-display text-[1.3rem] font-bold leading-tight tracking-tight text-brand-ink">
                {title}
              </h1>

              <p className="mt-1.5 text-[0.86rem] leading-snug text-slate-600">
                {role.pitch}
              </p>

              {role.knowledge?.illustrative && (
                <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-[0.75rem] leading-snug text-slate-600">
                  <strong className="font-semibold">Illustrative:</strong> what
                  the assistant says about this role is sample text written to
                  show the shape of a briefing. A written and checked version
                  replaces it before anyone relies on it.
                </p>
              )}

              {/* The description is one button away, not the thing you are sat in
              front of. Somebody who wants the tasks and the pay can have them
              at any moment; the tour is not those. */}
              <button
                type="button"
                onClick={() => setReading(true)}
                className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 text-[0.84rem] font-bold text-brand-ink transition-colors hover:border-brand-violet/60"
              >
                Read the role description
              </button>

              {/* The shape of the day, kept in view: the assistant refers to it. */}
              <dl className="mt-4 grid gap-1.5 border-t border-slate-200 pt-3 text-[0.8rem]">
                {role.workMix.map((m) => (
                  <div
                    key={m.label}
                    className="flex items-baseline justify-between gap-2"
                  >
                    <dt className="min-w-0 truncate text-slate-500">
                      {m.label}
                    </dt>
                    <dd className="shrink-0 font-semibold text-brand-ink">
                      {m.share}%
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 border-t border-slate-200 pt-3 text-[0.84rem] font-bold text-brand-ink">
                {payRange(role.payMonthly)}
                <span className="font-normal text-slate-500"> to start</span>
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={choosing || chosenRoleId === role.roleId}
                  onClick={() => {remember();onChoose(role.roleId);}}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-5 text-[0.88rem] font-bold text-white transition-colors disabled:opacity-70 ${
                    chosenRoleId === role.roleId
                      ? "bg-brand-teal"
                      : "bg-brand-violet hover:bg-brand-violet-deep"
                  }`}
                >
                  {chosenRoleId === role.roleId ? (
                    <>
                      <Check size={15} /> Your selected role
                    </>
                  ) : (
                    "Choose this role"
                  )}
                </button>
                {phase === "reading" && (
                  <button
                    type="button"
                    onClick={() => setPhase("asking")}
                    className="min-h-11 text-[0.82rem] font-semibold text-brand-violet-deep"
                  >
                    I have seen enough →
                  </button>
                )}
              </div>
            </div>
          </aside>

          {/* The briefing: titled blocks, revealed as the assistant works
            through them, so the shape of what is coming is visible from the
            start and nothing scrolls out of reach. */}
          <div className="min-w-0">
            {/* Signed out, the first chapter reads in full and the rest keep
                their headings with the text blurred. The headings stay
                because what is behind the account should be nameable -
                hiding the list as well would make the ask look bigger than
                it is - and the ask itself is made once, below. */}
            {/* The strip carries what is behind each tab, so opening one is
                not a gamble. Signed out, everything past the first tab keeps
                its heading and blurs its text: what is behind the account
                should be nameable, or the ask looks bigger than it is. */}
            <div
              role="tablist"
              aria-label={`${title}: what we know`}
              onKeyDown={event => {
                if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
                const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
                const current = buttons.indexOf(event.target as HTMLButtonElement);
                if (current < 0) return;
                event.preventDefault();
                const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (current + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
                buttons[next]?.focus(); buttons[next]?.click();
              }}
              className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1.5"
            >
              {tabs.map((t, i) => {
                const on = i === tab;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    id={`tour-tab-${t.id}`}
                    aria-controls="tour-panel"
                    tabIndex={on ? 0 : -1}
                    aria-selected={on}
                    onClick={() => {
                      setTab(i);
                      setOpened((was) => {
                        if (was.has(t.id)) return was;
                        const now = new Set(was).add(t.id);
                        // A second tab opened is somebody going past the
                        // description. That is what the two-minute clock was
                        // standing in for, and it is the better signal: a
                        // timer only ever measured that the window had not
                        // been closed. Set here, on the click, rather than
                        // derived inside the reading effect - a phase that
                        // changes itself while an effect is looking at it is
                        // how a render loop starts.
                        if (now.size >= 2) setPhase("asking");
                        return now;
                      });
                    }}
                    className={`min-h-14 shrink-0 rounded-lg px-3.5 text-left transition-colors ${
                      on
                        ? "bg-surface text-brand-violet-deep shadow-sm dark:text-brand-violet-soft"
                        : "text-slate-600 hover:bg-surface/60"
                    }`}
                  >
                    <span className="block text-[0.86rem] font-bold">
                      {t.label}
                    </span>
                    <span
                      className={`block text-[0.75rem] ${on ? "opacity-80" : "text-slate-500"}`}
                    >
                      {t.note}
                    </span>
                  </button>
                );
              })}
            </div>

            <div id="tour-panel" role="tabpanel" tabIndex={0} aria-labelledby={`tour-tab-${tabs[tab]?.id}`}><ol className="mt-5 grid gap-5">
              {(tabs[tab]?.list ?? []).map((c) => {
                const locked = signedOut && tab > 0;
                return (
                  <li key={c.title}>
                    <h2 className="flex items-baseline gap-2.5 text-[0.95rem] font-bold text-brand-ink">
                      <span
                        aria-hidden
                        className="h-3.5 w-1 shrink-0 rounded-full bg-brand-teal"
                      />
                      {c.title}
                    </h2>
                    <div className="mt-1 pl-3.5">
                      {locked ? (
                        <Blurred>
                          <ChapterBody chapter={c} />
                        </Blurred>
                      ) : (
                        <ChapterBody chapter={c} />
                      )}
                    </div>
                  </li>
                );
              })}
            </ol></div>

            {signedOut && chapters.length > 1 && (
              <LockedNote label="The rest of this briefing - what decides who moves up, where the role leads, and what the work is turning into - is behind an account." />
            )}

            {/* The question, arriving by itself when the two minutes are up. */}
            {(phase === "asking" || phase === "leaving") && (
              <div
                ref={card}
                className="mt-8 scroll-mt-28 rounded-2xl border border-brand-violet/30 bg-brand-violet/5 p-5"
              >
                {phase === "leaving" ? (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                    <p className="min-w-0 flex-1 text-[0.95rem] font-semibold text-brand-ink">
                      {last
                        ? "That is the last one. Putting together what you said…"
                        : `Moving on to ${titleOf(roles[at + 1]!.roleId)}…`}
                    </p>
                    <button
                      type="button"
                      onClick={() => setPhase("asking")}
                      className="min-h-11 text-[0.84rem] font-semibold text-slate-500"
                    >
                      Wait, stay here
                    </button>
                    <button
                      type="button"
                      onClick={advance}
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-violet px-5 text-[0.86rem] font-bold text-white"
                    >
                      {last ? "See what I said" : "Go now"}
                      <ArrowRight size={15} />
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-[0.75rem] font-bold uppercase tracking-[0.08em] text-brand-violet-deep">
                      Before we move on
                    </p>
                    {/* One question, and the stop does not end without it. Two
                      questions per role over five roles is a form; one is a
                      thought somebody actually has. */}
                    {saveError && <p role="alert">{saveError}</p>}
                    <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Is this role for you?">
                      {([
                        { id: "curious", label: "Save this role" },
                        { id: "not-for-me", label: "Not interested" },
                      ] as const).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          aria-pressed={item.id === "curious" ? saved.includes(role.roleId) : verdict === item.id}
                          disabled={savingRole}
                          onClick={() => void setVerdict(item.id)}
                          className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[0.84rem] font-bold transition-colors motion-reduce:transition-none ${
                            (item.id === "curious" ? saved.includes(role.roleId) : verdict === item.id)
                              ? "border-teal-700 bg-teal-50 text-teal-700"
                              : "border-slate-300 bg-surface text-slate-700 hover:border-slate-400"
                          }`}
                        >
                          {item.id === "curious" ? "♡" : "–"} {item.id === "curious" && saved.includes(role.roleId) ? "Saved · remove" : item.label}
                        </button>
                      ))}
                    </div>
                    <div className="mt-4">
                      <OpenAnswer
                        id={`thoughts-${role.roleId}`}
                        label="What do you make of this role?"
                        hint="Not whether it is a good job - whether it is you. In your own words."
                        placeholder="Honestly, what stood out was…"
                        value={thoughts}
                        onChange={value=>{setThoughts(value);setNoteAdded(false);remember({thoughts:value});}}
                        optional
                      />
                    </div>

                    <button type="button" disabled={!thoughts.trim()} className="min-h-11 underline text-sm" onClick={() => { onNote({roleId:role.roleId,title,thoughts:thoughts.trim(),reaction:verdict??undefined,asked:asked.current}); setNoteAdded(true); }}>Add my note</button>{noteAdded && <p role="status" className="text-sm">Note added to this tour. Your draft is kept in this browser while the tour is open.</p>}
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={leave}
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-violet px-5 text-[0.88rem] font-bold text-white transition-colors hover:bg-brand-violet-deep disabled:opacity-40"
                      >
                        {last ? "Finish tour" : "On to the next one"}
                        <ArrowRight size={15} />
                      </button>
                      {!ready && (
                        <span className="text-[0.8rem] text-slate-500">
                          Your reaction and note are optional. Continue whenever you are ready.
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* The fit read-out, after the question and not before it. What
                somebody makes of a role is theirs until they have said it -
                showing them a read-out first tells them what to think, and
                the sentence we get back afterwards is worth less for it. */}
            {signedOut && (phase === "asking" || phase === "leaving") && (
              <WhyThisRole />
            )}
          </div>
        </div>

        {/* Same bubble as the role page: one place to ask, wherever you are. */}
        <AssistantBubble
          openQuestions
          role={role}
          onAsked={(question) => {
            asked.current = [...asked.current, question];remember();
          }}
          onOpenChange={setChatOpen}
        />

        {reading && (
          <RolePreview
            role={role}
            tour
            signedOut={signedOut}
            matchLine={`Stop ${at + 1} of ${total}`}
            chosen={chosenRoleId === role.roleId}
            choosing={choosing}
            onClose={() => setReading(false)}
            onChoose={() => {remember();onChoose(role.roleId);}}
          />
        )}
      </main>
    </>
  );
}

/**
 * A chapter's content. Most are a paragraph; one is a set of separate things -
 * the industries this job is done in and what changes about it in each - and
 * those are set out one per line rather than run together into a sentence
 * nobody finishes.
 */
function ChapterBody({ chapter }: { chapter: Chapter }) {
  if (chapter.items && chapter.items.length > 0) {
    return (
      <ul className="grid gap-1.5">
        {chapter.items.map((item) => (
          <li
            key={item.label}
            className="text-[0.88rem] leading-relaxed text-slate-600"
          >
            <span className="font-semibold text-brand-ink">{item.label}</span>
            {" \u2014 "}
            {item.detail}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <p className="text-[0.88rem] leading-relaxed text-slate-600">
      {chapter.text}
    </p>
  );
}
