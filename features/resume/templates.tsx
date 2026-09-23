"use client";

// The resume templates on offer.

// ---- Templates ----
//
// Three ATS-safe looks for the same data: single column, no tables or
// graphics, standard headings in all three. Only spacing, alignment and type
// change - a screener parses them identically, a person sees three styles.

import { type ResumeTemplate } from "./resume-api";
export const TEMPLATES: Array<{ id: ResumeTemplate; name: string; blurb: string }> = [
  {
    id: "classic",
    name: "Basic",
    blurb: "Serif and traditional - the trusted look.",
  },
  {
    id: "compact",
    name: "Compact",
    blurb: "Tight sans type - fits more on two pages.",
  },
  {
    id: "sidebar",
    name: "Sidebar",
    blurb: "Designed two-column look - best for human readers.",
  },
  {
    id: "minimal",
    name: "Minimal",
    blurb: "Airy sans type with quiet headings - single column.",
  },
  {
    id: "graduate",
    name: "Graduate",
    blurb: "Centred serif header - suits a first resume.",
  },
  {
    id: "professional",
    name: "Professional",
    blurb: "Bold heading bars, single column - reads fast.",
  },
];

// Ledger entries written before this look existed said "modern"; they map to
// the sidebar look rather than silently reverting to Classic.
export const asTemplate = (value: unknown): ResumeTemplate =>
  value === "compact" || value === "minimal" || value === "graduate" || value === "professional"
    ? value
    : value === "sidebar" || value === "modern"
      ? "sidebar"
      : "classic";

// Each picker card shows the real sheet, rendered at one-third scale with
// obviously-generic sample data - so what you pick is exactly what you get,
// and a template tweak updates its own preview for free.
