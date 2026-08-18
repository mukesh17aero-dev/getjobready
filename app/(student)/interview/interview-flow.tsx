"use client";

// The 10-minute practice interview, end to end: confirm the role, meet the
// interviewer, answer by voice or by typing, and leave with a read-out.
//
// The server owns the interview's shape and the clock; this screen renders
// whatever question it is handed and sends back the answer. Voice is the
// preferred path but never the required one — a denied mic, an unsupported
// browser or a failed upload all land on the same typing fallback.
//
// Three faces of one flow: a setup console (confirm the role, pick the
// round, start), an audio-first stage (speech-bubble question, one big mic,
// stage dots, ring timer), and the read-out.

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";
import {
  answerWithAudio,
  answerWithText,
  fetchQuestionAudio,
  finishInterview,
  requestNextTurn,
  startInterview,
  type InterviewHome,
  type InterviewRound,
  type InterviewSessionView,
  type InterviewStage,
  type InterviewSummaryView,
} from "@/lib/interview-api";
import { BackLink } from "@/components/back-link";
import { whenLabel } from "@/lib/when";
import { InterviewTimer } from "@/components/interview-timer";
import { InterviewSummary } from "@/components/interview-summary";

async function token(): Promise<string | null> {
  const { data } = await supabaseBrowser().auth.getSession();
  return data.session?.access_token ?? null;
}

const STAGES: Array<{ id: InterviewStage; label: string }> = [
  { id: "icebreaker", label: "Getting started" },
  { id: "introduction", label: "About you" },
  { id: "assessment", label: "The role" },
  { id: "close", label: "Wrapping up" },
];

const STAGE_LABEL: Record<string, string> = Object.fromEntries(
  STAGES.map((s) => [s.id, s.label]),
);

const ROUNDS: Array<{ id: InterviewRound; title: string; line: string }> = [
  {
    id: "hr",
    title: "HR round",
    line: "Communication and how you work with people.",
  },
  {
    id: "managerial",
    title: "Managerial round",
    line: "Real situations - judgement and pressure.",
  },
];

// Why rehearse here rather than off a list of questions, or with a friend.
// Three claims, each of which the room actually keeps.
const WHY_REHEARSE = [
  {
    head: "You find out what went wrong",
    body: "Question by question: what you did well, and what would have been better. A real interviewer never tells you - which is how people repeat the same mistake for years without knowing.",
  },
  {
    head: "The feedback is specific enough to act on",
    body: 'Not "be more confident". More like: you told the story but never said how it ended, and one sentence on the outcome turns it into evidence.',
  },
  {
    head: "It follows what you are working on",
    body: "What you were told to improve is what the next interviewer checks on, with different questions - so each rehearsal builds on the last instead of starting over.",
  },
];

// Two interviewers, so nobody rehearses against the same voice every time -
// and so anyone who finds one harder to follow has the other.
const INTERVIEWERS: Array<{ id: "asha" | "ravi"; title: string }> = [
  { id: "asha", title: "Asha" },
  { id: "ravi", title: "Ravi" },
];

// Recording formats, most widely transcribable first. Safari records mp4.
function recordingFormat(): { mime: string; filename: string } | null {
  if (typeof MediaRecorder === "undefined") return null;
  if (MediaRecorder.isTypeSupported("audio/webm")) {
    return { mime: "audio/webm", filename: "answer.webm" };
  }
  if (MediaRecorder.isTypeSupported("audio/mp4")) {
    return { mime: "audio/mp4", filename: "answer.mp4" };
  }
  return null;
}

// ---- small inline icons (stroke inherits currentColor) ----

function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3Z" />
      <path d="M6 11a6 6 0 0 0 12 0" />
      <path d="M12 17v4" />
      <path d="M9 21h6" />
    </svg>
  );
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M8 5.5v13l11-6.5-11-6.5Z" fill="currentColor" />
    </svg>
  );
}

function PersonIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M4.5 20c1.4-3.3 4.2-5 7.5-5s6.1 1.7 7.5 5" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

// A static voice-note motif: fixed bar heights, coloured by the parent.
// Decoration only - the transcript beside it is the accessible content.
function Waveform({ heights }: { heights: number[] }) {
  return (
    <span aria-hidden className="flex h-4 items-center gap-[3px]">
      {heights.map((h, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-current opacity-70"
          style={{ height: `${h}px` }}
        />
      ))}
    </span>
  );
}

const QUESTION_WAVE = [4, 9, 6, 12, 8, 5, 11, 7];
const ANSWER_WAVE = [5, 10, 7, 13, 9, 5, 12, 8, 14, 6, 10, 7];

// The green room's mic check: ten bars that light up with how loudly the
// person is actually speaking, so the microphone question is settled before
// the clock starts. `level` is 0..1.
function MicMeter({ level, onDark }: { level: number; onDark?: boolean }) {
  const lit = Math.round(Math.min(1, level) * 10);
  return (
    <span aria-hidden className="flex items-center gap-[3px]">
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className={`h-3.5 w-1 rounded-full transition-[background-color] duration-100 motion-reduce:transition-none ${
            i < lit
              ? onDark
                ? "bg-brand-teal-soft"
                : "bg-brand-teal-deep"
              : onDark
                ? "bg-white/20"
                : "bg-slate-200"
          }`}
        />
      ))}
    </span>
  );
}

// Three things worth knowing before the first question - shown one at a time
// in the green room, the way a call app shows tips while you wait.
const GREEN_ROOM_TIPS = [
  "Answer with one concrete example, not a list of qualities.",
  "Say what you did, not what the team did - the interviewer is listening for you.",
  "A pause to think is fine. Nobody is timing your first sentence.",
];

// The interviewer's round face, used beside every bubble on their side.
function InterviewerAvatar() {
  return (
    <span
      aria-hidden
      className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-violet-deep text-white"
    >
      <PersonIcon className="h-4 w-4" />
    </span>
  );
}

// The four beats of the interview as quiet dots; the current one names
// itself so the person always knows where they are in the ten minutes.
function StageDots({ current }: { current: InterviewStage }) {
  const activeIdx = STAGES.findIndex((s) => s.id === current);
  return (
    <ol className="flex items-center" aria-label="Interview stages">
      {STAGES.map((stage, i) => {
        const state = i < activeIdx ? "done" : i === activeIdx ? "now" : "later";
        return (
          <li key={stage.id} className="flex items-center">
            {i > 0 ? (
              <span
                aria-hidden
                className={`mx-1.5 h-px w-3 sm:w-5 ${
                  i <= activeIdx ? "bg-brand-teal" : "bg-slate-200"
                }`}
              />
            ) : null}
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden
                className={`h-2 w-2 rounded-full ${
                  state === "done"
                    ? "bg-brand-teal"
                    : state === "now"
                      ? "bg-brand-teal-deep ring-4 ring-brand-teal/20"
                      : "bg-slate-300"
                }`}
              />
              <span
                className={`text-[0.68rem] font-semibold ${
                  state === "now" ? "text-teal-700" : "hidden text-slate-400 sm:inline"
                }`}
              >
                {stage.label}
                {state === "now" ? <span className="sr-only"> (current stage)</span> : null}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// Completed interviews, newest first. Each row opens into the full
// transcript and the read-out it earned - the same rows on the setup
// console and under a fresh read-out.
function PastInterviews({
  history,
  open,
  onToggle,
}: {
  history: InterviewHome["history"];
  open: number | null;
  onToggle: (index: number) => void;
}) {
  if (history.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="text-[0.8rem] font-bold uppercase tracking-wide text-brand-ink">
        Your past interviews
      </h2>
      <div className="mt-2.5 grid gap-2">
        {history.map((past, i) => (
          <div
            key={`${past.completedAt}-${i}`}
            className="rounded-2xl border border-slate-200 bg-surface"
          >
            <button
              type="button"
              onClick={() => onToggle(i)}
              aria-expanded={open === i}
              className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <span className="min-w-0">
                <span className="block truncate text-[0.9rem] font-semibold text-brand-ink">
                  {past.roleTitle}
                </span>
                <span className="mt-0.5 flex items-center gap-2 text-[0.72rem] text-slate-400">
                  <span className="rounded-full bg-brand-teal-deep/10 px-2 py-0.5 font-semibold text-teal-700">
                    {past.round === "managerial" ? "Managerial" : "HR"} round
                  </span>
                  {whenLabel(past.completedAt)}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1 text-[0.78rem] font-semibold text-teal-700">
                {open === i ? "Hide read-out" : "View read-out"}
                <ChevronIcon
                  className={`h-3.5 w-3.5 transition-transform motion-reduce:transition-none ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </span>
            </button>
            {open === i && (
              <div className="border-t border-slate-100 px-4 pb-4 pt-3">
                {/* The read-out first: it is why anyone opens this. The
                    transcript is underneath and folded away - the questions
                    are already quoted in the feedback, so reading them twice
                    buries the part worth reading. */}
                <InterviewSummary
                  summary={past.summary}
                  roleTitle={past.roleTitle}
                  turns={past.turns}
                />
                <details className="group mt-5 border-t border-slate-200 pt-4">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1.5 text-[0.8rem] font-semibold text-slate-500 [&::-webkit-details-marker]:hidden">
                    Read the whole interview
                    <ChevronIcon className="h-3.5 w-3.5 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
                  </summary>
                  <div className="mt-3 grid gap-3">
                    {past.turns.map((turn, ti) => (
                      <div key={ti}>
                        <p className="text-[0.8rem] font-semibold text-brand-ink">
                          {turn.question}
                        </p>
                        {turn.answer && (
                          <p className="mt-1 whitespace-pre-wrap rounded-xl bg-slate-50 px-3 py-2 text-[0.8rem] leading-relaxed text-slate-600">
                            {turn.answer}
                          </p>
                        )}
                        {turn.closing && (
                          <p className="mt-1 text-[0.8rem] italic text-teal-700">
                            {turn.closing}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </details>

                {/* The last thing on the page is the thing to do next. */}
                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-slate-300 px-5 text-sm font-bold text-brand-ink transition-colors hover:border-slate-400 motion-reduce:transition-none"
                  >
                    Retake interview
                  </button>
                  <p className="text-xs text-slate-500">
                    Your next interview will check on these areas.
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export function InterviewFlow({ initial }: { initial: InterviewHome }) {
  const [view, setView] = useState<"setup" | "room" | "wrapup" | "summary">(
    initial.session && initial.session.status === "in_progress" ? "room" : "setup",
  );
  const [session, setSession] = useState<InterviewSessionView | null>(initial.session);
  const [summary, setSummary] = useState<InterviewSummaryView | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ---- setup state ----
  const [useSelected, setUseSelected] = useState(Boolean(initial.selectedRole));
  const [roleTitle, setRoleTitle] = useState(initial.selectedRole?.title ?? "");
  const [jd, setJd] = useState("");
  // The job description is worth having and rarely to hand. Kept behind a
  // line of its own so the empty box does not push the join button off the
  // screen for everyone who does not have one.
  const [showJd, setShowJd] = useState(false);
  // What they asked to be pushed on - carried into every question this
  // interview asks.
  const [focus, setFocus] = useState("");
  // Behind a line of its own, like the job description: most people join
  // without a request, and an empty box asks them for one anyway.
  const [showFocus, setShowFocus] = useState(false);
  // Who takes the interview. The round sets the default - it is not a rule,
  // and anyone can change it.
  const [interviewer, setInterviewer] = useState<"asha" | "ravi" | null>(null);
  const [round, setRound] = useState<InterviewRound>("hr");
  const [starting, setStarting] = useState(false);
  // The green room's mic check: idle until the person asks for it, so the
  // browser only prompts for the microphone when they chose to test it.
  const [micState, setMicState] = useState<"idle" | "asking" | "live" | "denied">("idle");
  const [micLevel, setMicLevel] = useState(0);
  const [tip, setTip] = useState(0);
  // Chosen in the green room by someone with no mic today: the room opens in
  // typing mode instead of waiting for a recording that will never come.
  const [preferTyping, setPreferTyping] = useState(false);
  const micStopRef = useRef<(() => void) | null>(null);

  // ---- room state ----
  const [secondsLeft, setSecondsLeft] = useState(initial.session?.secondsLeft ?? 600);
  const secondsLeftRef = useRef(initial.session?.secondsLeft ?? 600);
  // Shown once, when the clock stops a recording that was still running.
  const [timeUpNotice, setTimeUpNotice] = useState(false);
  const [typed, setTyped] = useState("");
  const [typing, setTyping] = useState(false);
  const [busy, setBusy] = useState<"sending" | "thinking" | null>(null);
  const [openPast, setOpenPast] = useState<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [micFailed, setMicFailed] = useState(false);
  const [voiceOn] = useState(initial.speechAvailable);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  // Which turn the fetched audio belongs to, so every interviewer bubble can
  // offer its own replay pill.
  const [audioTurn, setAudioTurn] = useState<number | null>(null);
  // The newest turn the room is allowed to show. A question waits here until
  // its voice is ready, so the interviewer is heard and read at once.
  const [revealed, setRevealed] = useState<number>(
    initial.session ? (initial.session.turns.length - 1) : -1,
  );
  const [preparingVoice, setPreparingVoice] = useState(false);
  // Turns answered by voice this session - they wear the waveform motif.
  const [voiceTurns, setVoiceTurns] = useState<ReadonlySet<number>>(new Set());
  // Early end, done gracefully: the interviewer says goodbye in the thread
  // while the read-out is written, instead of the screen jumping away.
  const [endingEarly, setEndingEarly] = useState(false);
  // The read-out is written on the wrap-up screen, or behind them if they
  // chose to carry on elsewhere.
  const [summaryPending, setSummaryPending] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  // Where they are when the write lands decides whether it opens itself.
  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);
  // One answer at a time. Two sends can overlap - a recorder stopped twice,
  // a second tap, a retry racing the first - and the second always loses,
  // because by then the question it answers is closed.
  const sendingRef = useRef(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingCapRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  const openTurn = session?.turns[session.turns.length - 1];
  // Not "answerable" until it has actually been asked: a mic that goes live
  // before the question appears invites an answer to nothing.
  const awaitingAnswer = Boolean(
    openTurn && openTurn.answer === null && openTurn.index <= revealed,
  );

  // The clock is the server's; this just counts it down between renders.
  useEffect(() => {
    if (view !== "room" || !session) return;
    const startedAt = new Date(session.startedAt).getTime();
    const tick = () => {
      const elapsed = Math.round((Date.now() - startedAt) / 1000);
      const left = Math.max(0, session.totalSeconds - elapsed);
      secondsLeftRef.current = left;
      setSecondsLeft(left);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [view, session]);

  // Fetch and play the interviewer's voice for the newest question.
  const speakTurn = useCallback(
    async (turnIndex: number): Promise<boolean> => {
      if (!voiceOn) return false;
      const t = await token();
      if (!t) return false;
      const url = await fetchQuestionAudio(t, turnIndex);
      if (!url) return false;
      setAudioTurn(turnIndex);
      setAudioUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return url;
      });
      return true;
    },
    [voiceOn],
  );

  // A question arrives with its voice, not before it: text appearing while
  // the interviewer is still silent reads as a person who has stopped
  // speaking mid-sentence. Two safeguards, because a question nobody can see
  // is worse than one that arrives unvoiced - if the speech fails, or takes
  // longer than this, the question is shown anyway.
  const VOICE_WAIT_MS = 6000;
  const deliverTurn = useCallback(
    async (next: InterviewSessionView) => {
      setSession(next);
      const newest = next.turns[next.turns.length - 1];
      if (!newest || newest.answer !== null || !voiceOn) {
        setRevealed(newest?.index ?? 0);
        return;
      }
      setPreparingVoice(true);
      await Promise.race([
        speakTurn(newest.index),
        new Promise((resolve) => setTimeout(resolve, VOICE_WAIT_MS)),
      ]);
      setPreparingVoice(false);
      setRevealed(newest.index);
    },
    [speakTurn, voiceOn],
  );

  useEffect(() => {
    if (!audioUrl || !audioRef.current) return;
    audioRef.current.play().catch(() => {
      // Autoplay refused: the replay button is right there.
    });
  }, [audioUrl]);

  // Keep the newest bubble in view as the thread grows - the dock is fixed,
  // so the conversation has to come to the person, not the other way round.
  const turnCount = session?.turns.length ?? 0;
  useEffect(() => {
    if (view !== "room") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    threadEndRef.current?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "end",
    });
  }, [view, turnCount, busy, typing, endingEarly, error]);

  // The tips rotate slowly while the person settles in the green room.
  useEffect(() => {
    if (view !== "setup") return;
    const id = setInterval(
      () => setTip((t) => (t + 1) % GREEN_ROOM_TIPS.length),
      6000,
    );
    return () => clearInterval(id);
  }, [view]);

  // Whatever happens, release the mic when the green room goes away.
  useEffect(() => () => micStopRef.current?.(), []);

  // ---- actions ----

  // The mic check. Live level from an analyser, nothing recorded and nothing
  // sent anywhere - it exists only to answer "will they hear me?".
  const checkMic = async () => {
    if (micState === "live" || micState === "asking") return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicState("denied");
      return;
    }
    setMicState("asking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioCtx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      let frame = 0;
      const loop = () => {
        analyser.getByteTimeDomainData(data);
        let peak = 0;
        for (const v of data) peak = Math.max(peak, Math.abs(v - 128) / 128);
        // Eased so quiet speech still lights several bars.
        setMicLevel(Math.min(1, peak * 2.4));
        frame = requestAnimationFrame(loop);
      };
      frame = requestAnimationFrame(loop);
      micStopRef.current = () => {
        cancelAnimationFrame(frame);
        stream.getTracks().forEach((track) => track.stop());
        void ctx.close();
        micStopRef.current = null;
      };
      setMicState("live");
    } catch {
      setMicState("denied");
    }
  };

  const begin = async () => {
    const title = (useSelected ? initial.selectedRole?.title : roleTitle)?.trim();
    if (!title) {
      setError("Tell us which role you are practising for.");
      return;
    }
    setStarting(true);
    setError(null);
    const t = await token();
    const started = t
      ? await startInterview(t, {
          roleTitle: title,
          ...(useSelected && initial.selectedRole ? { roleId: initial.selectedRole.id } : {}),
          ...(jd.trim() ? { jd: jd.trim() } : {}),
          ...(focus.trim() ? { focus: focus.trim() } : {}),
          interviewer: interviewer ?? (round === "managerial" ? "ravi" : "asha"),
          round,
        })
      : null;
    setStarting(false);
    if (!started) {
      setError("We could not start the interview. Check your connection and try again.");
      return;
    }
    // The mic check has done its job; the room opens its own stream.
    micStopRef.current?.();
    setSecondsLeft(started.secondsLeft);
    setTyping(preferTyping);
    setView("room");
    void deliverTurn(started);
  };

  const fetchNextTurn = useCallback(async () => {
    setBusy("thinking");
    setError(null);
    const t = await token();
    const next = t ? await requestNextTurn(t) : null;
    setBusy(null);
    if (!next) {
      setError("The next question did not arrive. Use Continue to try again.");
      return;
    }
    await deliverTurn(next);
  }, [deliverTurn]);

  const advance = useCallback(
    async (afterAnswer: InterviewSessionView) => {
      setSession(afterAnswer);
      if (afterAnswer.done) return;
      await fetchNextTurn();
    },
    [fetchNextTurn],
  );

  const submitText = async () => {
    const text = typed.trim();
    if (!text || !awaitingAnswer || sendingRef.current) return;
    sendingRef.current = true;
    setBusy("sending");
    setError(null);
    const t = await token();
    const result = t
      ? await answerWithText(t, text)
      : { ok: false as const, error: "Your session expired. Sign in again." };
    sendingRef.current = false;
    setBusy(null);
    if (!result.ok) {
      // The server sends the interview as it really stands when our view has
      // fallen behind - a reload, a retry, a second tap. Catching up quietly
      // is right: the person did answer, and telling them otherwise is a lie
      // about their own interview.
      if (result.session) {
        setTyped("");
        setTyping(false);
        await deliverTurn(result.session);
        return;
      }
      if (result.finished) {
        setTyped("");
        setTyping(false);
        void finish();
        return;
      }
      setError(result.error);
      return;
    }
    setTyped("");
    setTyping(false);
    await advance(result.session);
  };

  const startRecording = async () => {
    const format = recordingFormat();
    if (!format || !navigator.mediaDevices?.getUserMedia) {
      setMicFailed(true);
      setTyping(true);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: format.mime });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        // Stopped by the clock rather than by them: say so, so the cut-off
        // reads as the end of an interview and not as a broken microphone.
        if (secondsLeftRef.current === 0) setTimeUpNotice(true);
        const blob = new Blob(chunksRef.current, { type: format.mime });
        if (blob.size === 0 || sendingRef.current) {
          // Nothing captured. If the clock has run out there is no way back
          // into the interview, so it ends properly here rather than leaving
          // a question open that can never be answered.
          if (secondsLeftRef.current === 0 && !sendingRef.current) void finish();
          return;
        }
        sendingRef.current = true;
        setBusy("sending");
        setError(null);
        const t = await token();
        const result = t
          ? await answerWithAudio(t, blob, format.filename)
          : { ok: false as const, error: "Your session expired. Sign in again." };
        sendingRef.current = false;
        setBusy(null);
        if (!result.ok) {
          if (result.session) {
            await deliverTurn(result.session);
            return;
          }
          if (result.finished) {
            void finish();
            return;
          }
          setError(result.error);
          setTyping(true);
          return;
        }
        const answered = result.session.turns[result.session.turns.length - 1];
        if (answered && answered.answer != null) {
          setVoiceTurns((prev) => new Set(prev).add(answered.index));
        }
        await advance(result.session);
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      // Two minutes is more answer than any question here needs, and it keeps
      // the upload comfortably inside the server's limit.
      recordingCapRef.current = setTimeout(stopRecording, 120_000);
    } catch {
      setMicFailed(true);
      setTyping(true);
    }
  };

  const stopRecording = () => {
    if (recordingCapRef.current) clearTimeout(recordingCapRef.current);
    recordingCapRef.current = null;
    recorderRef.current?.stop();
    recorderRef.current = null;
  };

  // A recording left running when time expires is stopped and submitted -
  // announced, because a microphone that cuts out mid-sentence with no word
  // about why reads as a broken app, not as the end of an interview.
  useEffect(() => {
    if (secondsLeft === 0 && recording) stopRecording();
  }, [secondsLeft, recording]);

  // Ending goes to a wrap-up screen that says plainly what is happening, and
  // the read-out opens itself the moment it exists - the person never has to
  // notice a badge or decide when to look. Leaving early is allowed, and the
  // scheduling screen keeps a card so nothing is lost either way.
  const finish = async () => {
    setError(null);
    setView("wrapup");
    await writeReadOut();
  };

  const writeReadOut = async () => {
    setSummaryPending(true);
    setSummaryError(null);
    const t = await token();
    const result = t
      ? await finishInterview(t)
      : { error: "Your session expired. Sign in again." };
    setSummaryPending(false);
    if ("error" in result) {
      setSummaryError(result.error);
      return;
    }
    setSummary(result.summary);
    if (viewRef.current === "wrapup") {
      // Open it for them: the read-out is the whole point of the ten minutes.
      setView("summary");
    } else {
      // They chose to wait elsewhere - bring the ready card into view rather
      // than leaving it to be spotted.
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    }
  };

  // Ending early, gracefully: the interviewer signs off in the thread, the
  // inputs go quiet, and the existing finish() flow writes the read-out. A
  // recording still running is discarded, not submitted - the person chose
  // to stop, so nothing half-said goes to the server.
  const confirmEarlyEnd = () => {
    if (
      !window.confirm(
        "End the interview now? You will get a read-out of what you have answered so far.",
      )
    )
      return;
    const rec = recorderRef.current;
    if (rec) {
      if (recordingCapRef.current) clearTimeout(recordingCapRef.current);
      recordingCapRef.current = null;
      rec.onstop = () => {
        rec.stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
      };
      rec.stop();
      recorderRef.current = null;
    }
    setEndingEarly(true);
    // A beat for the interviewer's goodbye to be read before the screen
    // hands back - the ending should feel closed, not cut off.
    setTimeout(() => void finish(), 1600);
  };

  const practiseAgain = () => {
    setSummary(null);
    setSession(null);
    setTyped("");
    setError(null);
    setEndingEarly(false);
    setVoiceTurns(new Set());
    setAudioTurn(null);
    setAudioUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    setView("setup");
  };

  // ---- views ----

  // The wrap-up: one screen, one message, no decision to make. It opens the
  // read-out itself when the write lands, so nobody has to watch for a badge.
  if (view === "wrapup") {
    return (
      <main className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-lg flex-col items-center justify-center px-4 py-10 text-center sm:px-6">
        <InterviewerAvatar />
        <p className="mt-4 text-lg font-semibold text-brand-ink">
          {summaryError
            ? "That is the interview - your answers are saved."
            : "Thank you."}
        </p>

        {summaryError ? (
          <>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
              {summaryError}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => void writeReadOut()}
                className="inline-flex min-h-12 cursor-pointer items-center rounded-full bg-brand-teal-deep px-6 text-sm font-bold text-white transition-colors hover:bg-brand-teal motion-reduce:transition-none"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={() => setView("setup")}
                className="min-h-11 cursor-pointer text-sm font-semibold text-slate-500 transition-colors hover:text-brand-ink motion-reduce:transition-none"
              >
                I&rsquo;ll come back to it
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
              Your interviewer is writing up how it went - what you did well,
              what to sharpen, and the one thing to work on next. It usually
              takes a few seconds, and it opens here on its own.
            </p>
            <p
              role="status"
              className="mt-5 inline-flex items-center gap-2.5 rounded-full border border-brand-teal/30 bg-teal-50 px-4 py-2.5 text-sm font-semibold text-teal-700"
            >
              <span aria-hidden className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-700 motion-safe:animate-pulse" />
                <span
                  className="h-1.5 w-1.5 rounded-full bg-teal-700 motion-safe:animate-pulse"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="h-1.5 w-1.5 rounded-full bg-teal-700 motion-safe:animate-pulse"
                  style={{ animationDelay: "300ms" }}
                />
              </span>
              Writing your read-out…
            </p>
            <button
              type="button"
              onClick={() => setView("setup")}
              className="mt-5 min-h-11 cursor-pointer text-sm font-semibold text-slate-500 underline underline-offset-2 transition-colors hover:text-brand-ink motion-reduce:transition-none"
            >
              I&rsquo;ll read it later
            </button>
          </>
        )}
      </main>
    );
  }

  if (view === "summary" && summary && session) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <BackLink fallbackHref="/practice" fallbackLabel="Back to Practice" />
        <div className="mt-4">
          <InterviewSummary
            summary={summary}
            roleTitle={session.roleTitle}
            turns={session.turns}
            onRetake={practiseAgain}
          />
        </div>

        <PastInterviews
          history={initial.history}
          open={openPast}
          onToggle={(i) => setOpenPast(openPast === i ? null : i)}
        />
      </main>
    );
  }

  if (view === "room" && session) {
    const timeUp = secondsLeft === 0;
    const readyToFinish = session.done;
    // A refresh or a failed request can leave the last question answered with
    // nothing open — this is the deterministic way back in.
    // Waiting for a question's voice is not the same as being stranded, so
    // the recovery button stays out of the way while it arrives.
    const needsNextTurn =
      !awaitingAnswer &&
      !readyToFinish &&
      busy === null &&
      !endingEarly &&
      !preparingVoice;
    const stageNow: InterviewStage =
      openTurn?.stage ?? session.turns[session.turns.length - 1]?.stage ?? "icebreaker";
    const cannotEndYet = busy !== null || !session.turns.some((turn) => turn.answer != null);
    const micHint = recording
      ? "Recording - tap to stop and send"
      : busy === "sending"
        ? "Sending your answer…"
        : busy === "thinking"
          ? "Waiting for the next question…"
          : awaitingAnswer
            ? "Tap to answer by voice"
            : "One moment…";

    const endEarlyButton = (className: string) => (
      <button
        type="button"
        onClick={confirmEarlyEnd}
        disabled={cannotEndYet}
        className={`cursor-pointer text-[0.72rem] font-semibold text-slate-400 underline underline-offset-2 transition-colors hover:text-rose-600 disabled:cursor-default disabled:opacity-40 motion-reduce:transition-none ${className}`}
      >
        End interview early
      </button>
    );

    return (
      <main className="min-h-dvh">
        {/* Slim sticky bar: where you are and how much time is left, always
            in view while the thread scrolls underneath. */}
        <div className="sticky top-[54px] z-30 border-b border-slate-200 bg-surface/95 backdrop-blur">
          <div className="mx-auto max-w-2xl px-4 pb-2 pt-2.5 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                {/* Who is taking it, named in view: the voice you hear should
                    never be a surprise, and it settles at the start. */}
                <p className="truncate text-[0.65rem] font-bold uppercase tracking-wide text-brand-violet-deep">
                  Practice interview · {session.round === "hr" ? "HR round" : "Managerial round"}
                  {session.interviewer ? ` · with ${session.interviewer}` : ""}
                </p>
                <h1 className="truncate text-sm font-bold text-brand-ink">{session.roleTitle}</h1>
              </div>
              <InterviewTimer
                compact
                secondsLeft={secondsLeft}
                totalSeconds={session.totalSeconds}
              />
            </div>
            <div className="mt-1.5">
              <StageDots current={stageNow} />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          {timeUp && !readyToFinish ? (
            <p className="mt-4 rounded-xl border border-amber-400/40 bg-amber-50 p-3 text-sm text-amber-800">
              {timeUpNotice
                ? "That is time - we sent what you had said, and the interviewer is wrapping up."
                : "That is time - finish this answer and the interviewer will wrap up."}
            </p>
          ) : null}

          {/* The whole conversation, as the thread it is: interviewer on the
              left, you on the right, newest at the bottom. */}
          <div aria-live="polite">
            <ol className="mt-5 space-y-4" aria-label="Interview conversation">
              {session.turns
                .filter((turn) => turn.index <= revealed)
                .map((turn) => {
                const isOpen = turn.answer === null;
                const hasAudio = audioUrl !== null && audioTurn === turn.index;
                return (
                  <li key={turn.index} className="space-y-2">
                    <div className="flex items-end gap-2">
                      <InterviewerAvatar />
                      <div className="min-w-0 max-w-[85%] rounded-2xl rounded-bl-md border border-slate-200 bg-surface px-4 py-3">
                        <p className="text-[0.68rem] font-bold uppercase tracking-wide text-slate-400">
                          {STAGE_LABEL[turn.stage]} · Question {turn.index + 1}
                        </p>
                        <p
                          className={
                            isOpen
                              ? "mt-1 text-base font-semibold leading-snug text-brand-ink"
                              : "mt-1 text-sm leading-relaxed text-slate-600"
                          }
                        >
                          {turn.question}
                        </p>
                        {voiceOn ? (
                          <button
                            type="button"
                            onClick={() =>
                              hasAudio
                                ? void audioRef.current?.play()
                                : void speakTurn(turn.index)
                            }
                            className="mt-2 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-teal-50 px-3.5 text-xs font-semibold text-teal-700 transition-colors hover:bg-brand-teal-deep/15 motion-reduce:transition-none"
                          >
                            <PlayIcon className="h-3.5 w-3.5" />
                            <Waveform heights={QUESTION_WAVE} />
                            {hasAudio || !isOpen ? "Hear it again" : "Hear the question"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                    {turn.answer ? (
                      <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-teal-50 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[0.68rem] font-bold uppercase tracking-wide text-teal-700">
                            You
                          </p>
                          {voiceTurns.has(turn.index) ? (
                            <span className="flex items-center gap-1.5 text-teal-700">
                              <MicIcon className="h-3 w-3" />
                              <Waveform heights={ANSWER_WAVE} />
                              <span className="sr-only">Answered by voice</span>
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                          {turn.answer}
                        </p>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ol>

            {/* The interviewer thinking, as a typing-indicator bubble. */}
            {preparingVoice ? (
              <div className="mt-4 flex items-end gap-2">
                <InterviewerAvatar />
                <div className="flex w-fit items-center gap-2.5 rounded-2xl rounded-bl-md border border-slate-200 bg-surface px-4 py-3 text-sm text-slate-500">
                  <span aria-hidden className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 motion-safe:animate-pulse" />
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-slate-400 motion-safe:animate-pulse"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-slate-400 motion-safe:animate-pulse"
                      style={{ animationDelay: "300ms" }}
                    />
                  </span>
                  The interviewer is about to speak…
                </div>
              </div>
            ) : busy === "thinking" ? (
              <div className="mt-4 flex items-end gap-2">
                <InterviewerAvatar />
                <div className="flex w-fit items-center gap-2.5 rounded-2xl rounded-bl-md border border-slate-200 bg-surface px-4 py-3 text-sm text-slate-500">
                  <span aria-hidden className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 motion-safe:animate-pulse" />
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-slate-400 motion-safe:animate-pulse"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-slate-400 motion-safe:animate-pulse"
                      style={{ animationDelay: "300ms" }}
                    />
                  </span>
                  The interviewer is listening…
                </div>
              </div>
            ) : null}

            {/* Ending early: the interviewer signs off before the read-out. */}
            {endingEarly ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-end gap-2">
                  <InterviewerAvatar />
                  <div className="min-w-0 max-w-[85%] rounded-2xl rounded-bl-md border border-slate-200 bg-surface px-4 py-3">
                    <p className="text-[0.68rem] font-bold uppercase tracking-wide text-slate-400">
                      Interviewer
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      Thank you - we will stop here. Your read-out is coming right up.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}


            {/* The interviewer's own closing words, kept as the last bubble. */}
            {readyToFinish ? (
              <div className="mt-4 flex items-end gap-2">
                <InterviewerAvatar />
                <div className="min-w-0 max-w-[85%] rounded-2xl rounded-bl-md border border-brand-teal/30 bg-teal-50 px-4 py-3">
                  <p className="text-[0.68rem] font-bold uppercase tracking-wide text-teal-700">
                    {STAGE_LABEL.close}
                  </p>
                  <p className="mt-1 text-base font-semibold leading-relaxed text-teal-700">
                    {session.turns[session.turns.length - 1]?.closing ??
                      "That is the interview - well done for finishing it."}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Your read-out looks only at what you said today: what worked, what to
                    sharpen, and the one thing to focus on next.
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          {audioUrl ? <audio ref={audioRef} src={audioUrl} /> : null}

          {error ? (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-rose-600/40 bg-rose-50 p-3 text-sm text-rose-700"
            >
              {error}
            </p>
          ) : null}
          {/* Spacer doubling as the scroll anchor: tall enough that the fixed
              dock never covers the newest bubble. */}
          <div ref={threadEndRef} aria-hidden className={typing ? "h-64" : "h-44"} />
        </div>

        {/* The dock: the one place your hands live for the whole interview. */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          <div className="mx-auto max-w-2xl px-4 py-3 sm:px-6">
            {endingEarly ? (
              <p className="flex min-h-14 items-center justify-center text-sm font-semibold text-slate-500">
                Wrapping up…
              </p>
            ) : readyToFinish ? (
              <div className="flex min-h-14 items-center justify-center">
                <button
                  type="button"
                  onClick={finish}
                  disabled={busy !== null}
                  className="inline-flex min-h-12 cursor-pointer items-center rounded-full bg-brand-teal-deep px-6 text-sm font-bold text-white transition-colors hover:bg-brand-teal disabled:opacity-50 motion-reduce:transition-none"
                >
                  Get my read-out
                </button>
              </div>
            ) : needsNextTurn ? (
              <div className="relative flex min-h-14 items-center justify-center">
                <button
                  type="button"
                  onClick={fetchNextTurn}
                  className="inline-flex min-h-12 cursor-pointer items-center rounded-full bg-brand-teal-deep px-6 text-sm font-bold text-white transition-colors hover:bg-brand-teal motion-reduce:transition-none"
                >
                  Continue
                </button>
                {endEarlyButton("absolute right-0 top-1/2 max-w-24 -translate-y-1/2 text-right")}
              </div>
            ) : typing ? (
              <div>
                {micFailed ? (
                  <p className="mb-2 text-xs text-slate-500">
                    No microphone this time - typing works just as well.
                  </p>
                ) : null}
                <label htmlFor="typed-answer" className="sr-only">
                  Your answer
                </label>
                <textarea
                  id="typed-answer"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  onKeyDown={(e) => {
                    // Enter sends, Shift+Enter starts a new line.
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (busy === null && typed.trim() && awaitingAnswer) submitText();
                    }
                  }}
                  rows={3}
                  maxLength={6000}
                  placeholder="Say it the way you would say it out loud."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm text-brand-ink outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/30"
                />
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={submitText}
                    disabled={busy !== null || typed.trim().length === 0 || !awaitingAnswer}
                    className="inline-flex min-h-11 cursor-pointer items-center rounded-full bg-brand-teal-deep px-5 text-sm font-bold text-white transition-colors hover:bg-brand-teal disabled:opacity-50 motion-reduce:transition-none"
                  >
                    {busy === "sending" ? "Sending…" : "Send answer"}
                  </button>
                  {!micFailed ? (
                    <button
                      type="button"
                      onClick={() => setTyping(false)}
                      className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-slate-600 transition-colors hover:text-brand-ink motion-reduce:transition-none"
                    >
                      <MicIcon className="h-4 w-4" /> Use voice
                    </button>
                  ) : null}
                  {endEarlyButton("ml-auto text-right")}
                </div>
              </div>
            ) : (
              <div className="relative flex items-center justify-center py-1">
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={recording ? stopRecording : () => void startRecording()}
                    disabled={!recording && (busy !== null || !awaitingAnswer)}
                    aria-label={
                      recording
                        ? "Stop recording and send your answer"
                        : "Start recording your answer"
                    }
                    className="relative h-16 w-16 cursor-pointer rounded-full outline-offset-4 disabled:cursor-default disabled:opacity-50"
                  >
                    {recording ? (
                      <span
                        aria-hidden
                        className="absolute inset-0 rounded-full bg-red-600/30 motion-safe:animate-ping"
                      />
                    ) : busy === null && awaitingAnswer ? (
                      <span
                        aria-hidden
                        className="absolute inset-0 rounded-full bg-brand-teal/20 motion-safe:animate-ping [animation-duration:2.5s]"
                      />
                    ) : null}
                    <span
                      className={`relative grid h-full w-full place-items-center rounded-full text-white shadow-lg transition-colors motion-reduce:transition-none ${
                        recording
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-brand-teal-deep hover:bg-brand-teal"
                      }`}
                    >
                      {recording ? (
                        <StopIcon className="h-7 w-7" />
                      ) : (
                        <MicIcon className="h-7 w-7" />
                      )}
                    </span>
                  </button>
                  <p className="max-w-36 text-center text-xs font-semibold leading-tight text-brand-ink">
                    {micHint}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTyping(true)}
                  disabled={recording}
                  className="absolute left-0 top-1/2 min-h-11 -translate-y-1/2 cursor-pointer rounded-full text-sm font-semibold text-slate-600 transition-colors hover:text-brand-ink disabled:cursor-default disabled:opacity-40 motion-reduce:transition-none"
                >
                  Type instead
                </button>
                {!readyToFinish
                  ? endEarlyButton("absolute right-0 top-1/2 max-w-24 -translate-y-1/2 text-right")
                  : null}
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  // ---- setup ----
  const missingProfile = !initial.profileHints.hasTrack || !initial.profileHints.hasSkills;
  const first = initial.profileHints.firstName;

  return (
    <main className="mx-auto max-w-4xl px-4 pb-6 pt-4 sm:px-6">
      <BackLink fallbackHref="/practice" fallbackLabel="Back to Practice" />

      <header className="mt-2.5">
        <p className="text-xs font-bold uppercase tracking-wide text-brand-violet-deep">
          Interview practice
        </p>
        <h1 className="mt-1 text-[1.6rem] font-bold leading-tight text-brand-ink">
          {first
            ? `${first}, do not let the real interview be your first try`
            : "Do not let the real interview be your first try"}
        </h1>
        <p className="mt-1.5 max-w-prose text-[0.85rem] leading-relaxed text-slate-600">
          Ten minutes with an interviewer who has read your record and asks
          about the role you chose. You answer out loud, the clock runs, and it
          ends on time - the way it will on the day. Then comes the part nobody
          else gives you: an honest read of how it went, answer by answer, and
          what to change before it counts.
        </p>

        {/* Why here rather than a free list of questions, or a friend. Three
            things this does that neither can. */}
        <ul className="mt-3.5 grid gap-2.5 sm:grid-cols-3">
          {WHY_REHEARSE.map((proof) => (
            <li key={proof.head} className="rounded-xl border border-slate-200 bg-surface p-3.5">
              <p className="text-[0.85rem] font-bold text-brand-ink">{proof.head}</p>
              <p className="mt-1 text-[0.75rem] leading-relaxed text-slate-600">{proof.body}</p>
            </li>
          ))}
        </ul>
      </header>

      {/* The interview you just finished, still being written up. It sits at
          the top of the screen you were handed back to, so the read-out is
          never something you have to wait on a blank screen for. */}
      {summaryPending || summaryError || (summary && session) ? (
        <div className="mt-3 rounded-2xl border border-brand-teal/30 bg-teal-50 p-4">
          {summaryPending ? (
            <p className="flex items-center gap-2.5 text-sm font-semibold text-teal-700">
              <span aria-hidden className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-700 motion-safe:animate-pulse" />
                <span
                  className="h-1.5 w-1.5 rounded-full bg-teal-700 motion-safe:animate-pulse"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="h-1.5 w-1.5 rounded-full bg-teal-700 motion-safe:animate-pulse"
                  style={{ animationDelay: "300ms" }}
                />
              </span>
              Writing your read-out from that interview…
            </p>
          ) : summaryError ? (
            <>
              <p className="text-sm text-slate-700">{summaryError}</p>
              <button
                type="button"
                onClick={() => void writeReadOut()}
                className="mt-2.5 inline-flex min-h-11 cursor-pointer items-center rounded-full bg-brand-teal-deep px-5 text-sm font-bold text-white transition-colors hover:bg-brand-teal motion-reduce:transition-none"
              >
                Try again
              </button>
            </>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-teal-700">
                Your read-out is ready.
              </p>
              <button
                type="button"
                onClick={() => setView("summary")}
                className="inline-flex min-h-11 cursor-pointer items-center rounded-full bg-brand-teal-deep px-5 text-sm font-bold text-white transition-colors hover:bg-brand-teal motion-reduce:transition-none"
              >
                Read it
              </button>
            </div>
          )}
        </div>
      ) : null}

      {initial.workingOn.length > 0 ? (
        <p className="mt-3 rounded-2xl border border-brand-violet/30 bg-violet-50 px-3.5 py-2.5 text-[0.82rem] leading-relaxed text-slate-700">
          Last time you were working on{" "}
          <span className="font-semibold">
            {initial.workingOn.map((a) => a.skill.toLowerCase()).join(", ")}
          </span>{" "}
          - your interviewer will check how that is coming along.
        </p>
      ) : null}

      {/* The green room: your side on the left, what you are joining on the
          right. The mic question is settled before the clock starts. */}
      <div className="mt-3.5 rounded-3xl border border-slate-200 bg-surface p-3.5 shadow-sm sm:p-4">
        <div className="grid gap-3.5 sm:grid-cols-[1.05fr_1fr] sm:gap-4">
          {/* Your tile. */}
          {/* Shorter on a phone, where vertical space is the scarce thing. */}
          <div className="flex min-h-52 flex-col rounded-2xl bg-brand-panel p-3.5 sm:min-h-60">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-white/85">You</p>
              <span className="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wide text-white/60">
                <span
                  aria-hidden
                  className={`h-2 w-2 rounded-full ${
                    micState === "live"
                      ? "bg-emerald-400"
                      : micState === "denied"
                        ? "bg-amber-400"
                        : "bg-white/40"
                  }`}
                />
                {micState === "live"
                  ? "Ready"
                  : micState === "denied"
                    ? "No mic"
                    : "Not checked"}
              </span>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-4 text-center">
              <span
                aria-hidden
                className="grid h-16 w-16 place-items-center rounded-full bg-white/10 text-xl font-bold text-white/85"
              >
                {(first ?? "You").charAt(0).toUpperCase()}
              </span>
              <p className="text-sm font-semibold text-white/85">{first ?? "You"}</p>

              {micState === "live" ? (
                <>
                  <div className="mt-2 flex items-center gap-2.5 rounded-full bg-white/10 px-3.5 py-2">
                    <MicIcon className="h-4 w-4 text-white/80" />
                    <MicMeter level={micLevel} onDark />
                  </div>
                  <p className="text-[0.72rem] text-white/60">
                    {micLevel > 0.12
                      ? "We can hear you - that is all we needed."
                      : "Say something - the bars should move."}
                  </p>
                </>
              ) : micState === "denied" ? (
                <p className="max-w-[15rem] text-[0.75rem] leading-relaxed text-white/70">
                  Your browser is not letting us use the microphone. You can
                  still do the whole interview by typing.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => void checkMic()}
                  disabled={micState === "asking"}
                  className="mt-2 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-white/10 px-4 text-[0.8rem] font-semibold text-white/90 transition-colors hover:bg-white/20 disabled:opacity-60 motion-reduce:transition-none"
                >
                  <MicIcon className="h-4 w-4" />
                  {micState === "asking" ? "Waiting for permission…" : "Check my microphone"}
                </button>
              )}
            </div>

            <div className="rounded-xl bg-white/5 px-3.5 py-2.5">
              <p className="text-[0.72rem] leading-relaxed text-white/75">
                Tip {tip + 1} of {GREEN_ROOM_TIPS.length} - {GREEN_ROOM_TIPS[tip]}
              </p>
              <span aria-hidden className="mt-2 flex items-center gap-1.5">
                {GREEN_ROOM_TIPS.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all motion-reduce:transition-none ${
                      i === tip ? "w-4 bg-white/80" : "w-1.5 bg-white/30"
                    }`}
                  />
                ))}
              </span>
            </div>
          </div>

          {/* What you are joining. */}
          <div className="flex flex-col justify-center">
            <p className="text-[0.68rem] font-bold uppercase tracking-wide text-brand-violet-deep">
              You are joining
            </p>
            {initial.selectedRole && useSelected ? (
              <>
                <h2 className="mt-1 text-lg font-bold leading-snug text-brand-ink">
                  {initial.selectedRole.title}
                </h2>
                <p className="mt-1 text-[0.78rem] text-slate-500">
                  The direction you chose in Discovery.{" "}
                  <button
                    type="button"
                    onClick={() => setUseSelected(false)}
                    className="cursor-pointer font-semibold text-slate-600 underline underline-offset-2 transition-colors hover:text-brand-ink motion-reduce:transition-none"
                  >
                    Practise for a different role
                  </button>
                </p>
              </>
            ) : (
              <div className="mt-1 space-y-2">
                <div>
                  <label htmlFor="role-title" className="text-xs font-semibold text-slate-600">
                    Role you are interviewing for
                  </label>
                  <input
                    id="role-title"
                    type="text"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (!starting) begin();
                      }
                    }}
                    maxLength={120}
                    placeholder="e.g. Customer Support Associate"
                    className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-brand-ink outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/30"
                  />
                </div>
                {showJd || jd ? (
                  <div>
                    <label htmlFor="role-jd" className="text-xs font-semibold text-slate-600">
                      Job description - the questions will use it
                    </label>
                    <textarea
                      id="role-jd"
                      value={jd}
                      onChange={(e) => setJd(e.target.value)}
                      rows={3}
                      maxLength={8000}
                      autoFocus
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm text-brand-ink outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/30"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowJd(true)}
                    className="inline-flex min-h-11 cursor-pointer items-center text-[0.78rem] font-semibold text-slate-600 underline underline-offset-2 transition-colors hover:text-brand-ink motion-reduce:transition-none"
                  >
                    Paste the job description (optional)
                  </button>
                )}
                {initial.selectedRole ? (
                  <button
                    type="button"
                    onClick={() => setUseSelected(true)}
                    className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-slate-600 transition-colors hover:text-brand-ink motion-reduce:transition-none"
                  >
                    Back to {initial.selectedRole.title}
                  </button>
                ) : null}
              </div>
            )}


            {/* The round, as two quiet segments. */}
            <fieldset className="mt-3">
              <legend className="text-xs font-semibold text-slate-600">Which round?</legend>
              <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                {ROUNDS.map((option) => {
                  const selected = round === option.id;
                  return (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer flex-col rounded-xl border-2 px-3 py-2.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-teal/40 motion-reduce:transition-none ${
                        selected
                          ? "border-brand-teal bg-teal-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="round"
                        value={option.id}
                        checked={selected}
                        onChange={() => setRound(option.id)}
                        className="sr-only"
                      />
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-[0.82rem] font-bold text-brand-ink">
                          {option.title}
                        </span>
                        <span
                          aria-hidden
                          className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                            selected
                              ? "border-brand-teal-deep bg-brand-teal-deep text-white"
                              : "border-slate-300 text-transparent"
                          }`}
                        >
                          <CheckIcon className="h-3 w-3" />
                        </span>
                      </span>
                      <span className="mt-1 text-[0.72rem] leading-relaxed text-slate-600">
                        {option.line}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* Who takes it, in the same two cards as the round. The round
                moves the choice to its usual person; either name is always
                available, because a default that cannot be changed is a rule
                wearing a default's clothes. */}
            <fieldset className="mt-3">
              <legend className="text-xs font-semibold text-slate-600">Who takes it?</legend>
              {/* Slot-sized, the way a call scheduler offers times: small,
                  side by side, the chosen one filled in. */}
              <div className="mt-1.5 flex flex-wrap gap-2">
                {INTERVIEWERS.map((person) => {
                  const chosen =
                    (interviewer ?? (round === "managerial" ? "ravi" : "asha")) === person.id;
                  return (
                    <label
                      key={person.id}
                      className={`inline-flex min-h-11 min-w-[6.5rem] cursor-pointer items-center justify-center rounded-lg border-2 px-4 text-[0.82rem] font-bold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-teal/40 motion-reduce:transition-none ${
                        chosen
                          ? "border-brand-teal-deep bg-brand-teal-deep text-white"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="interviewer"
                        value={person.id}
                        checked={chosen}
                        onChange={() => setInterviewer(person.id)}
                        className="sr-only"
                      />
                      {person.title}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* Theirs to set: what they want pushed on. Somebody who says
                "ask me about angry customers" has told us where they feel
                weakest, which is exactly what a rehearsal is for. */}
            {showFocus || focus ? (
              <div className="mt-3">
                <label htmlFor="focus" className="text-xs font-semibold text-slate-600">
                  What you want to be pushed on
                </label>
                <input
                  id="focus"
                  type="text"
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (!starting) begin();
                    }
                  }}
                  maxLength={400}
                  autoFocus
                  placeholder="Handling angry customers, or explaining a gap in my studies"
                  className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-brand-ink outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/30"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowFocus(true)}
                className="mt-2 inline-flex min-h-11 cursor-pointer items-center text-[0.78rem] font-semibold text-slate-600 underline underline-offset-2 transition-colors hover:text-brand-ink motion-reduce:transition-none"
              >
                Anything you want to be pushed on? (optional)
              </button>
            )}

            <p className="mt-2.5 text-[0.78rem] leading-relaxed text-slate-600">
              10 minutes, up to ten questions, ends on time.
              {initial.speechAvailable
                ? " Answer out loud, or type."
                : " Questions arrive as text; answer by voice or typing."}
            </p>

            <button
              type="button"
              onClick={begin}
              disabled={starting}
              className="mt-3 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-brand-teal-deep px-6 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-teal disabled:opacity-50 motion-reduce:transition-none"
            >
              <MicIcon className="h-4 w-4" />
              {starting ? "Setting up your interviewer…" : "Join the interview"}
            </button>
            <p className="mt-2.5 text-center text-[0.78rem] text-slate-500">
              No mic today?{" "}
              <button
                type="button"
                onClick={() => {
                  setPreferTyping(true);
                  begin();
                }}
                disabled={starting}
                className="cursor-pointer font-semibold text-slate-600 underline underline-offset-2 transition-colors hover:text-brand-ink disabled:opacity-50 motion-reduce:transition-none"
              >
                Type your answers instead
              </button>
            </p>
          </div>
        </div>
      </div>

      {missingProfile ? (
        <p className="mt-4 rounded-xl border border-slate-200 bg-surface p-3 text-sm text-slate-600">
          Your profile is missing{" "}
          {!initial.profileHints.hasTrack && !initial.profileHints.hasSkills
            ? "your track and your skills"
            : !initial.profileHints.hasTrack
              ? "your track"
              : "your skills"}{" "}
          - the interviewer can still work without them, but{" "}
          <Link href="/profile" className="font-semibold text-teal-700 underline">
            filling them in
          </Link>{" "}
          makes the questions yours.
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-rose-600/40 bg-rose-50 p-3 text-sm text-rose-700"
        >
          {error}
        </p>
      ) : null}

      <PastInterviews
        history={initial.history}
        open={openPast}
        onToggle={(i) => setOpenPast(openPast === i ? null : i)}
      />
    </main>
  );
}
