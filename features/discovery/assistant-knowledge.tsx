"use client";

// What the assistant knows about a role before anyone asks.

import type { RoleKnowledge } from "@/lib/api";
export type { RoleKnowledge };

export type Line = { who: "assistant" | "you"; text: string };

// Questions people actually have that no pre-written answer covers. They go
// to the backend assistant, which answers from the published material for
// the role and says plainly when it has nothing on a point - so a question
// about pay in a city it has no figures for gets an honest "not known" rather
// than an invented number.
export const ASKED_QUESTIONS = [
  "Which city pays more for this role?",
  "Which company pays the most?",
  "Do they support working from home?",
  "How is the learning curve in this role?",
];

/** One shared empty list, so the default does not change identity per render. */
export const NOTHING_TO_SAY: string[] = [];
export type Nudge = { id: string; text: string; offer: string };

export const money = (n: number) => `₹${Math.round(n / 1000)}K`;

/**
 * No written depth for this role yet. Not an error state: the backend does not
 * send RoleKnowledge today, so this is the ordinary case. Everything below
 * degrades to what the record itself supports and offers nothing else - the
 * assistant says less rather than filling the gap.
 */
export const NO_KNOWLEDGE: RoleKnowledge = {};

/** Every list present, so the rest of this file can stop checking. */
export function filled(k?: RoleKnowledge | null) {
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
