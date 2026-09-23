"use client";

// The read-out progress strip, the interviewers, and how audio is recorded.

import { useEffect, useState } from "react";
import { READOUT_STEPS } from "./interview-stages";
export function ReadOutProgress() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setStep((s) => Math.min(s + 1, READOUT_STEPS.length - 1)),
      2200,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mt-5 w-full max-w-sm">
      <ul aria-hidden className="grid gap-2.5 text-left">
        {READOUT_STEPS.map((label, i) => {
          const done = i < step;
          const now = i === step;
          return (
            <li key={label} className="flex items-start gap-2.5">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center">
                {done ? (
                  <span className="text-[0.9rem] font-bold text-teal-700">
                    ✓
                  </span>
                ) : now ? (
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand-teal-deep motion-reduce:animate-none" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                )}
              </span>
              <span
                className={`text-[0.85rem] leading-relaxed ${
                  now ? "font-semibold text-brand-ink" : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ul>
      <p role="status" className="sr-only">
        {READOUT_STEPS[step]}
      </p>
    </div>
  );
}

// Why rehearse here rather than off a list of questions, or with a friend.
// Three claims, each of which the room actually keeps.

// Two interviewers, so nobody rehearses against the same voice every time -
// and so anyone who finds one harder to follow has the other.
export const INTERVIEWERS: Array<{ id: "asha" | "ravi"; title: string }> = [
  { id: "asha", title: "Asha" },
  { id: "ravi", title: "Ravi" },
];

// Recording formats, most widely transcribable first. Safari records mp4.
export function recordingFormat(): { mime: string; filename: string } | null {
  if (typeof MediaRecorder === "undefined") return null;
  if (MediaRecorder.isTypeSupported("audio/webm")) {
    return { mime: "audio/webm", filename: "answer.webm" };
  }
  if (MediaRecorder.isTypeSupported("audio/mp4")) {
    return { mime: "audio/mp4", filename: "answer.mp4" };
  }
  return null;
}
