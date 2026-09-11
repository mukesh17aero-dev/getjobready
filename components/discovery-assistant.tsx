"use client";

// The discovery assistant that lives on a role's details, not only on a tour.
//
// It sits between the body of the role and the footer: a single quiet line
// that can be ignored for a whole visit, and that speaks first only when it
// has noticed something real - and says what it noticed when it does.
//
// What it knows is the whole point. RoleDetail already carries the work, the
// pay, the conditions and the hard truths. That is enough to describe a job
// and not enough to advise anyone about one, so RoleKnowledge carries the four
// things a person actually asks about: what good looks like, what the industry
// is doing, where the role leads, and what it is not.
//
// Two things it must never do, and they fail differently:
//
//   A false claim is a fact we do not have - a pay figure, a trend, a number.
//   The answer is to say we do not know it. See unanswered().
//
//   A false promise is a future we cannot give - a job, a salary, a promotion
//   by a date, or "you would be great at this". Nobody can hold us to a wrong
//   fact for long, but a young person will arrange their year around a
//   promise. So progression is always described as what happens to people who
//   do this work, never as what will happen to the reader, and the discovery assistant never
//   assesses how good they would be at it. It is an assistant, not a flatterer and
//   not a recruiter.
//
// Banned constructions, checked in tests/unit/discovery-assistant.test.ts:
//   "you will earn/get/become", "guaranteed", "you would be great",
//   "this will land you", "in X months you will".

import { useCallback, useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { askAboutRole } from "@/lib/api";
import { SignUpPrompt, type GatedAction } from "@/components/signup-gate";
import type { RoleDetail, RoleKnowledge } from "@/lib/api";
import { RichText } from "@/components/rich-text";

export type { RoleKnowledge };

type Line = { who: "assistant" | "you"; text: string };

// Questions people actually have that no pre-written answer covers. They go
// to the backend assistant, which answers from the published material for
// the role and says plainly when it has nothing on a point - so a question
// about pay in a city it has no figures for gets an honest "not known" rather
// than an invented number.
const ASKED_QUESTIONS = [
  "Which city pays more for this role?",
  "Which company pays the most?",
  "Do they support working from home?",
  "How is the learning curve in this role?",
];

/** One shared empty list, so the default does not change identity per render. */
const NOTHING_TO_SAY: string[] = [];
type Nudge = { id: string; text: string; offer: string };

const money = (n: number) => `₹${Math.round(n / 1000)}K`;

/**
 * No written depth for this role yet. Not an error state: the backend does not
 * send RoleKnowledge today, so this is the ordinary case. Everything below
 * degrades to what the record itself supports and offers nothing else - the
 * assistant says less rather than filling the gap.
 */
export const NO_KNOWLEDGE: RoleKnowledge = {};

/** Every list present, so the rest of this file can stop checking. */
function filled(k?: RoleKnowledge | null) {
  return {
    standards: k?.standards ?? [],
    tools: k?.tools ?? [],
    industry: k?.industry ?? [],
    transfers: k?.transfers ?? [],
    ceilings: k?.ceilings ?? [],
    behind: k?.behind ?? {},
    importance: k?.importance,
    opportunities: k?.opportunities ?? [],
    succeed: k?.succeed ?? [],
    skillsThatMatter: k?.skillsThatMatter ?? [],
    interview: k?.interview,
    withAI: k?.withAI,
    illustrative: k?.illustrative ?? false,
  };
}

export function DiscoveryAssistant({
  role,
  knowledge,
  onTour,
  /** The element that scrolls - the dialog body - so it can read attention. */
  scrollRef,
  /** Every question put to it, so a tour can learn from what was asked. */
  onAsked,
  /**
   * On a walk-through the assistant is not furniture waiting to be noticed -
   * it is the person showing you round. It opens the panel itself, says what
   * this role is in a sentence nobody could get from the page above, and asks
   * something back, because a tour where the guide never speaks is just a
   * slideshow.
   */
  tour = false,
  /** Given a column of its own rather than a strip, it can say more at once. */
  tall = false,
  /**
   * On a tour, what it says while the person reads - one line at a time, so
   * it lands like somebody talking rather than a wall of text. Nothing here
   * is on the page beside it; that is the whole point of saying it.
   */
  drip = NOTHING_TO_SAY,
  /** Open from the first frame - for a shell that is itself the opening. */
  startOpen = false,
  /**
   * When the shell owns the closing - a bubble, a drawer - Close hands back to
   * it instead of collapsing to a resting bar inside something already open.
   */
  onClose,
  /** Offer the open questions (pay by city and company, working from home,
   *  the learning curve). On by the tour, which asks for it explicitly. */
  openQuestions = false,
}: {
  role: RoleDetail;
  knowledge?: RoleKnowledge | null;
  onTour?: () => void;
  scrollRef?: React.RefObject<HTMLElement | null>;
  onAsked?: (question: string) => void;
  tour?: boolean;
  tall?: boolean;
  drip?: string[];
  startOpen?: boolean;
  onClose?: () => void;
  openQuestions?: boolean;
}) {
  const k = filled(knowledge);
  // Whether there is anything to say beyond the page above. It changes what
  // the assistant claims about itself, which is the one thing it must not
  // overstate.
  const deep = k.standards.length > 0 || k.industry.length > 0;
  const [open, setOpen] = useState(tour || startOpen);
  const [said, setSaid] = useState<Line[]>([]);
  const [typed, setTyped] = useState("");
  const [nudge, setNudge] = useState<Nudge | null>(null);
  const [muted, setMuted] = useState(false);
  const fired = useRef<Set<string>>(new Set());
  const lastY = useRef(0);
  const thread = useRef<HTMLDivElement>(null);

  const say = useCallback((lines: Line[]) => {
    setSaid((s) => [...s, ...lines]);
    setTimeout(
      () => thread.current?.scrollTo({ top: 99999, behavior: "smooth" }),
      50,
    );
  }, []);

  const [gate, setGate] = useState<GatedAction | null>(null);

  const ask = useCallback(
    (question: string, answer: string) => {
      setNudge(null);
      setOpen(true);
      onAsked?.(question);
      say([
        { who: "you", text: question },
        { who: "assistant", text: answer },
      ]);
    },
    [say, onAsked],
  );

  // Asking the assistant is where a signed-out visitor stops - however the
  // question was raised. A tap on a prepared question is still a question, so
  // every route in goes through here rather than straight to ask(): the
  // starters, the nudge's offer and the resting bar's hook all call submit.
  //
  // Reading the role is open to anyone; putting a question to the guide is the
  // first thing here that would spend an AI's time on one person, and that is
  // the point the account is asked for. Same shape as withToken() in the
  // resume builder and token() in the interview - the session is checked at
  // the moment of the action, so nothing has to be threaded down to reach it.
  const submit = useCallback(
    async (question: string, answer: string) => {
      const { data } = await supabaseBrowser().auth.getSession();
      if (!data.session?.access_token) {
        setGate({
          what: "the discovery assistant",
          why: "Answering you means reading what you have told us and writing a reply for you - so it needs an account, and it means the conversation is still here next time.",
        });
        return;
      }
      ask(question, answer);
    },
    [ask],
  );

  /**
   * A typed question goes to the backend, which answers only from the
   * published material for this role - the role itself, the other roles, the
   * assessment arc, the practice interview questions, and the notes an admin
   * wrote for the purpose.
   *
   * If it cannot be reached we fall back to the local matcher rather than
   * failing: the pre-written answers are fewer but they are never wrong, which
   * is the right way round to degrade.
   */
  const [asking, setAsking] = useState(false);
  const askTyped = useCallback(
    async (question: string) => {
      const { data } = await supabaseBrowser().auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setGate({
          what: "the discovery assistant",
          why: "Answering you means reading what you have told us and writing a reply for you - so it needs an account, and it means the conversation is still here next time.",
        });
        return;
      }
      // Their words go up the moment they send them, and the reply follows
      // when it arrives. Holding the question back until the answer came made
      // the send look as if it had not happened.
      setNudge(null);
      setOpen(true);
      onAsked?.(question);
      say([{ who: "you", text: question }]);
      setAsking(true);
      const outcome = await askAboutRole(token, role.roleId, question);
      setAsking(false);
      say([
        {
          who: "assistant",
          text: outcome.ok ? outcome.result.answer : replyTo(question, role, knowledge),
        },
      ]);
    },
    [say, onAsked, role, knowledge],
  );

  /* ---- speaking first: only for a reason, only once, never after a no ---- */

  const notice = useCallback(
    (n: Nudge) => {
      // Never on a tour. Two of these three read the person's scrolling, and
      // on a tour the scrolling is ours - "you went back up to read that
      // again" would be us describing our own behaviour as theirs.
      if (tour || muted || open || fired.current.has(n.id)) return;
      fired.current.add(n.id);
      setNudge(n);
    },
    [tour, muted, open],
  );

  // Reading a while without acting. Either absorbed or stuck; worth an offer.
  useEffect(() => {
    const t = setTimeout(
      () =>
        notice(
          deep
            ? {
                id: "dwell",
                text: `This tells you what the job is. It does not tell you what separates good from adequate, or what ${sectorName(role)} is doing to jobs like it. I have both.`,
                offer: "What does good look like here?",
              }
            : {
                id: "dwell",
                text: "This tells you what the job is. It does not tell you where it goes afterwards, or what the pay does past the first step. Ask me either.",
                offer: "Where does it lead?",
              },
        ),
      15000,
    );
    return () => clearTimeout(t);
  }, [notice, role, deep]);

  // Scrolling back up is nearly always a re-read of something that did not land.
  useEffect(() => {
    const el = scrollRef?.current;
    if (!el) return;
    function onScroll() {
      const target = el as HTMLElement;
      const y = target.scrollTop;
      if (lastY.current - y > 180 && y > 80) {
        notice({
          id: "reread",
          text: "You went back up to read something again. Point at any line of the work and I will tell you what it is actually like to do.",
          offer: "Explain the responsibilities",
        });
      }
      lastY.current = y;
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [notice, scrollRef]);

  // Read to the end and not chosen. Interested, unconvinced - the honest gap.
  useEffect(() => {
    const el = scrollRef?.current;
    if (!el) return;
    function onScroll() {
      const target = el as HTMLElement;
      if (target.scrollTop + target.clientHeight >= target.scrollHeight - 24) {
        notice({
          id: "bottom",
          text: "You have read all of it and not chosen. That usually means it sounds reasonable but you cannot tell whether it goes anywhere - which is the one thing a role page never answers.",
          offer: "Where does this lead?",
        });
      }
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [notice, scrollRef]);

  /* ---- what it can answer, all of it from the record or from knowledge ---- */

  const starters = assistantAnswers(role, k);

  /* ---- being noticed, without behaving like a chatbot ----------------- */

  // It arrives a beat after the role does, so it reads as something joining
  // you rather than part of the furniture - and only makes an entrance the
  // first time in a session. After that it is simply there.
  const [entry, setEntry] = useState<"hidden" | "arriving" | "settled">(
    "hidden",
  );
  useEffect(() => {
    let known = false;
    try {
      known = sessionStorage.getItem("assistant-met") === "1";
    } catch {
      // Private browsing: it simply makes its entrance again. No matter.
    }
    const t = setTimeout(
      () => {
        setEntry(known ? "settled" : "arriving");
        try {
          sessionStorage.setItem("assistant-met", "1");
        } catch {
          // As above.
        }
      },
      known ? 0 : 700,
    );
    return () => clearTimeout(t);
  }, []);

  // Showing somebody round. Said once, when the role arrives, and only on a
  // walk-through - it is the difference between being handed a page and being
  // taken through one.
  // No ref guard: the component is keyed by the role, so this runs once per
  // role, and the cleanup is what keeps a remount (Strict Mode does one in
  // development) from either doubling the greeting or losing it.
  useEffect(() => {
    // A briefing opens itself - its first chapter is the greeting. Only a tour
    // with nothing written behind it needs one of these.
    if (!tour || drip.length > 0) return;
    const t = setTimeout(() => {
      setOpen(true);
      say([{ who: "assistant", text: tourOpening(role) }]);
    }, 1100);
    return () => clearTimeout(t);
  }, [tour, drip.length, role, say]);

  // Then it keeps talking, slowly, while they read. One line every so often -
  // never a wall - and it stops the moment they ask something of their own,
  // because being interrupted by a guide who is already answering you is the
  // one thing worse than a guide who says nothing.
  const [dripped, setDripped] = useState(0);
  const theirs = said.some((l) => l.who === "you");
  useEffect(() => {
    if (!tour || theirs || dripped >= drip.length) return;
    const t = setTimeout(
      () => {
        setDripped((n) => n + 1);
        say([{ who: "assistant", text: drip[dripped]! }]);
      },
      dripped === 0 ? 1200 : 14000,
    );
    return () => clearTimeout(t);
  }, [tour, theirs, dripped, drip, say]);

  // And then it asks. A guide that only broadcasts has not understood that the
  // useful half of this is what the person wants to know.
  const [pushed, setPushed] = useState(false);
  useEffect(() => {
    if (!tour || pushed || theirs || drip.length === 0) return;
    if (dripped < drip.length) return;
    const t = setTimeout(() => {
      setPushed(true);
      say([
        {
          who: "assistant",
          text: "That is what I have that the page does not. Your turn - what do you actually want to know about this one? Pick one below or type it, and I will be straight with you about what I do not know.",
        },
      ]);
    }, 9000);
    return () => clearTimeout(t);
  }, [tour, pushed, theirs, dripped, drip.length, say]);

  // The pull is the sentence. Each hook names something specific it can
  // answer, so the promise on the bar is one it can actually keep.
  const hooks = assistantHooks(role, k);
  const [hookAt, setHookAt] = useState(0);
  useEffect(() => {
    if (open || muted) return;
    const t = setInterval(() => setHookAt((i) => (i + 1) % hooks.length), 6500);
    return () => clearInterval(t);
  }, [open, muted, hooks.length]);
  const hook = hooks[hookAt % hooks.length]!;

  return (
    <div className="border-t border-slate-200 bg-surface">
      {gate && <SignUpPrompt action={gate} onClose={() => setGate(null)} />}
      {!open ? (
        nudge && !muted ? (
          <div className="bg-brand-violet/10 px-5 py-3">
            <div className="flex gap-3">
              <Face pulsing />
              <div className="min-w-0 flex-1">
                <p className="text-[0.84rem] leading-relaxed text-slate-800">
                  {nudge.text}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const found = starters.find((s) => s.q === nudge.offer);
                      void submit(
                        nudge.offer,
                        found
                          ? found.a
                          : behindAll(role, knowledge ?? NO_KNOWLEDGE),
                      );
                    }}
                    className="min-h-11 rounded-full bg-brand-violet-deep px-4 text-[0.8rem] font-bold text-white"
                  >
                    {nudge.offer}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNudge(null);
                      setMuted(true);
                    }}
                    className="min-h-11 rounded-full px-3 text-[0.8rem] font-semibold text-slate-500"
                  >
                    Not now
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Resting, and still worth looking at. The pull is the sentence, not
          // the movement: a specific thing it can tell you that the page above
          // cannot. A blinking icon gets dismissed; an interesting question
          // gets read.
          <button
            type="button"
            onClick={() => {
              // It offered something specific; tapping gets that, not a menu.
              const found = starters.find((s) => s.q === hook.q);
              if (muted || !found) setOpen(true);
              else void submit(hook.q, found.a);
            }}
            className={`group flex w-full items-center gap-3.5 bg-brand-violet/10 px-5 py-3 text-left transition-colors hover:bg-brand-violet/20 motion-reduce:transition-none ${
              entry === "hidden" ? "opacity-0" : ""
            }`}
          >
            <Face arriving={entry === "arriving"} />
            <span className="min-w-0 flex-1">
              <span className="block text-[0.7rem] font-bold uppercase tracking-[0.08em] text-brand-violet-deep">
                {muted ? "Still here" : "Discovery assistant"}
              </span>
              <span
                key={hook.teaser}
                className="block text-[0.86rem] font-semibold leading-snug text-slate-800 motion-safe:animate-[fade-in_.4s_ease-out]"
              >
                {muted ? "Ask me whenever you want" : hook.teaser}
              </span>
            </span>
            <span
              aria-hidden
              // Deliberately not filled: "Choose this role" is the primary
              // action on this screen and must stay the only one. This has to
              // look tappable, not important.
              className="shrink-0 rounded-full border border-brand-violet/45 bg-surface px-3.5 py-2 text-[0.76rem] font-bold text-brand-violet transition-transform group-hover:scale-105 motion-reduce:transition-none"
            >
              Ask
            </span>
          </button>
        )
      ) : (
        // A flex column that can shrink: inside the corner panel the thread
        // gives way and scrolls, so the questions and the input are never
        // pushed out of the bottom of the panel on a short screen.
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-2">
            <span className="flex items-center gap-2.5">
              <Face />
              <span className="text-[0.84rem] font-bold text-slate-900">
                About this role
              </span>
            </span>
            <button
              type="button"
              onClick={() => (onClose ? onClose() : setOpen(false))}
              className="min-h-11 px-2 text-[0.8rem] font-semibold text-slate-500"
            >
              Close
            </button>
          </div>

          {/* Shorter on a tour: the role behind it is scrolling past, and the
              assistant taking half the panel would leave a letterbox. */}
          <div
            ref={thread}
            // Tall follows the viewport as well as a ceiling: a tall window
            // gets a tall thread, a short one does not get a panel taller than
            // the screen it is sitting on.
            // A floor as well as a ceiling. A max-height alone left the panel
            // the size of its first sentence, which is not a chat window -
            // it is a tooltip that happens to have an input under it.
            className={`overflow-y-auto px-5 py-3 ${
              tall
                ? "min-h-[7rem] flex-1 max-h-[min(28rem,50vh)]"
                : tour
                  ? "max-h-[8.5rem]"
                  : "max-h-[13rem]"
            }`}
          >
            {said.length === 0 ? (
              <p className="text-[0.84rem] leading-relaxed text-slate-600">
                {deep
                  ? `I know this job past what is written above - what separates good from adequate, what ${sectorName(role)} is doing to jobs like it, where people go afterwards, and what it will not turn into. Where I do not know something for this role, I will say so rather than fill the gap.`
                  : "Ask me about the pay past the first step, where this work leads, or what would put you off it. Where I do not have something for this role, I will say so rather than fill the gap."}
              </p>
            ) : (
              <ol className="grid gap-2.5">
                {said.map((line, i) => (
                  <li
                    key={i}
                    className={
                      line.who === "you" ? "flex justify-end" : "flex gap-2.5"
                    }
                  >
                    {line.who === "assistant" && <Face small />}
                    <div
                      className={`max-w-[30rem] rounded-2xl px-3.5 py-2.5 text-[0.84rem] leading-relaxed ${
                        line.who === "you"
                          ? "rounded-tr-sm bg-teal-50 text-slate-700"
                          : "rounded-tl-sm border border-slate-200 text-slate-800"
                      }`}
                    >
                      <Spoken text={line.text} />
                    </div>
                  </li>
                ))}
                {asking && (
                  <li className="flex gap-2.5" aria-live="polite">
                    <Face small />
                    <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-slate-200 px-3.5 py-3" aria-label="Thinking">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 motion-safe:animate-pulse" />
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 motion-safe:animate-pulse" style={{ animationDelay: "150ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 motion-safe:animate-pulse" style={{ animationDelay: "300ms" }} />
                    </div>
                  </li>
                )}
              </ol>
            )}
          </div>

          <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-5 py-3">
            {/* A few at a time. Each answered question makes room for the
                next, so the list never crowds the input out of the panel. */}
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
              {[
                // The open questions - pay by city and company, working from
                // home, the learning curve - belong to the tour, where the
                // guide is walking somebody through a role they are weighing.
                ...(tour || openQuestions ? ASKED_QUESTIONS.map((q) => ({ q, ask: () => void askTyped(q) })) : []),
                ...starters.map((s) => ({ q: s.q, ask: () => void submit(s.q, s.a) })),
              ]
                .filter((chip) => !said.some((l) => l.text === chip.q))
                .slice(0, tour ? 8 : 6)
                .map((chip) => (
                  <button
                    key={chip.q}
                    type="button"
                    disabled={asking}
                    onClick={chip.ask}
                    className="min-h-10 shrink-0 whitespace-nowrap rounded-full border border-slate-300 bg-surface px-3.5 text-[0.76rem] font-semibold text-slate-700 hover:border-slate-400 disabled:opacity-50"
                  >
                    {chip.q}
                  </button>
                ))}
            </div>
            <div className="mt-2.5 flex gap-2">
              <label htmlFor="assistant-ask" className="sr-only">
                Ask about this role
              </label>
              <input
                id="assistant-ask"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && typed.trim().length > 2 && !asking) {
                    e.preventDefault();
                    void askTyped(typed.trim());
                    setTyped("");
                  }
                }}
                placeholder={asking ? "Thinking…" : "Ask anything…"}
                disabled={asking}
                className="min-h-11 min-w-0 flex-1 rounded-full border border-slate-300 bg-surface px-4 text-[0.84rem] outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/30"
              />
              <button
                type="button"
                disabled={asking}
                onClick={() => {
                  if (typed.trim().length > 2 && !asking) {
                    void askTyped(typed.trim());
                    setTyped("");
                  }
                }}
                // Outlined, like the pill on the resting bar: "Choose this
                // role" is the primary action on this screen and stays the
                // only filled button on it.
                className="min-h-11 shrink-0 rounded-full border border-brand-violet/45 px-4 text-[0.8rem] font-bold text-brand-violet-deep"
              >
                {asking ? "Asking…" : "Ask"}
              </button>
            </div>
            {onTour && (
              <button
                type="button"
                onClick={onTour}
                className="mt-2 w-full text-center text-[0.74rem] font-semibold text-brand-violet-deep"
              >
                Not sure this is the one? Walk me through the others in{" "}
                {sectorName(role)} →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Everything the discovery assistant can say without being asked something new. Exported so
 * the no-promises rule can be tested against the real strings rather than
 * trusted - see tests/unit/discovery-assistant.test.ts.
 */
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

function sectorName(role: RoleDetail) {
  return role.sector.toLowerCase();
}

function declinePromise(role: RoleDetail) {
  return `I am not going to tell you that you would be good at it, or that you would get it - I have no way of knowing either, and a guess from me is the kind of thing someone plans a year around. What I can do is be exact about what the work asks for and what it is like on a bad day in ${sectorName(role)}, and let you be the one who decides.`;
}

function behindAll(role: RoleDetail, knowledge: RoleKnowledge) {
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
function Face({
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
function tourOpening(role: RoleDetail): string {
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
function Spoken({ text }: { text: string }) {
  // One formatter for every piece of written text in the product - see
  // components/rich-text.tsx. This used to be its own copy handling paragraphs
  // and bullets; it gained tables for free the day the shared one did, which
  // is the argument for having one.
  return <RichText text={text} />;
}
