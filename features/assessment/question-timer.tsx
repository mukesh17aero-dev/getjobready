"use client";

import { useEffect, useState } from "react";
import { playQuestionTick } from "./completion-chime";

// A purely decorative pacing ring - not a real countdown. It loops forever
// on a fixed cycle with zero consequence: nothing locks, nothing auto-
// submits, nothing is scored by speed. Fixed duration rather than
// scene.minutes, so no question's ring implies it was allotted more or
// less time than another.
//
// aria-hidden, no role="timer", no numeric announcement - unlike
// features/interview/interview-timer.tsx, whose countdown is real. Exposing
// a fake countdown to assistive tech as if it were real would itself be a
// fabricated-urgency claim, specifically for screen-reader users.

const CYCLE_SECONDS = 90;
const TICK_WINDOW = 5;
const RADIUS = 16;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// The caller must render this keyed by scene.id (e.g. `<QuestionTimer key={scene.id} />`)
// so a fresh mount, not an internal reset, is what starts the ring over each question.
export function QuestionTimer() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed((prev) => {
        const next = (prev + 1) % CYCLE_SECONDS;
        const remaining = CYCLE_SECONDS - next;
        if (remaining > 0 && remaining <= TICK_WINDOW) playQuestionTick();
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const share = 1 - elapsed / CYCLE_SECONDS;
  const easing = CYCLE_SECONDS - elapsed <= TICK_WINDOW;

  return (
    <div className="assessment-question-timer" aria-hidden="true">
      <svg viewBox="0 0 40 40" className="assessment-question-timer-ring">
        <circle cx="20" cy="20" r={RADIUS} className="assessment-question-timer-track" />
        <circle
          cx="20"
          cy="20"
          r={RADIUS}
          className={`assessment-question-timer-fill${easing ? " is-easing" : ""}`}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - share)}
        />
      </svg>
    </div>
  );
}
