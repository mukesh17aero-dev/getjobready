"use client";

// Inline marks and meters: icons, waveform, avatar and stage dots.

// ---- small inline icons (stroke inherits currentColor) ----

import { type InterviewStage } from "@/features/interview";
import { STAGES } from "./interview-stages";
export function MicIcon({ className }: { className?: string }) {
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

export function StopIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" />
    </svg>
  );
}

export function PlayIcon({ className }: { className?: string }) {
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

export function ChevronIcon({ className }: { className?: string }) {
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

// A static voice-note motif: fixed bar heights, coloured by the parent.
// Decoration only - the transcript beside it is the accessible content.
export function Waveform({ heights }: { heights: number[] }) {
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

export const QUESTION_WAVE = [4, 9, 6, 12, 8, 5, 11, 7];

// The green room's mic check: ten bars that light up with how loudly the
// person is actually speaking, so the microphone question is settled before
// the clock starts. `level` is 0..1.
export function MicMeter({ level, onDark }: { level: number; onDark?: boolean }) {
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

// The interviewer's round face, used beside every bubble on their side.
export function InterviewerAvatar() {
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
export function StageDots({ current }: { current: InterviewStage }) {
  const activeIdx = STAGES.findIndex((s) => s.id === current);
  return (
    <ol className="flex items-center" aria-label="Interview stages">
      {STAGES.map((stage, i) => {
        const state =
          i < activeIdx ? "done" : i === activeIdx ? "now" : "later";
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
                  state === "now"
                    ? "text-teal-700"
                    : "hidden text-slate-400 sm:inline"
                }`}
              >
                {stage.label}
                {state === "now" ? (
                  <span className="sr-only"> (current stage)</span>
                ) : null}
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
