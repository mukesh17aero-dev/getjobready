"use client";

// The stages and rounds an interview moves through.

import { supabaseBrowser } from "@/lib/supabase-browser";
import { type InterviewRound, type InterviewStage } from "@/features/interview";
export async function token(): Promise<string | null> {
  const { data } = await supabaseBrowser().auth.getSession();
  return data.session?.access_token ?? null;
}

export const STAGES: Array<{ id: InterviewStage; label: string }> = [
  { id: "icebreaker", label: "Getting started" },
  { id: "introduction", label: "About you" },
  { id: "assessment", label: "The role" },
  { id: "close", label: "Wrapping up" },
];

export const STAGE_LABEL: Record<string, string> = Object.fromEntries(
  STAGES.map((s) => [s.id, s.label]),
);

export const ROUNDS: Array<{ id: InterviewRound; title: string; line: string }> = [
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

// The read-out takes the best part of ten seconds to write, and three dots
// for ten seconds reads as a page that has stopped. These are the passes it
// actually makes, in the order it makes them, so the wait shows work rather
// than just time.
export const READOUT_STEPS = [
  "Reading back everything you said…",
  "Checking each answer against what the question was really asking…",
  "Looking for what landed, and where you talked around it…",
  "Comparing this with your last interview…",
  "Writing your read-out…",
];

// The one setup answer an interview cannot start without. Named rather than
// written inline so the alert above the form can tell it apart from a network
// failure and offer a shortcut to the field itself.
export const MISSING_ROLE = "Tell us which role you are practising for.";
