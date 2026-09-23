"use client";

// The assistant panel on the discovery workspace.

import { NO_KNOWLEDGE } from "./assistant-knowledge";
import { assistantAnswers, replyTo } from "./assistant-answers";
import { assistantHooks } from "./assistant-tour";
import type { RoleDetail, RoleKnowledge } from "@/lib/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { SignUpPrompt, type GatedAction } from "@/components/auth/signup-gate";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { askAboutRole } from "@/lib/api";
import { ASKED_QUESTIONS, type Line, NOTHING_TO_SAY, type Nudge, filled } from "./assistant-knowledge";
import { behindAll, sectorName } from "./assistant-answers";
import { Face, Spoken, tourOpening } from "./assistant-tour";
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
