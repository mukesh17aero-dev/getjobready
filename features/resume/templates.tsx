"use client";

// The resume templates on offer.

// Layout descriptions are guidance, not a guarantee of parser compatibility.

import { type ResumeTemplate } from "./resume-api";
export const TEMPLATES: Array<{ id: ResumeTemplate; name: string; blurb: string }> = [
  {
    id: "classic",
    name: "Basic",
    blurb: "Recommended for applications: simple, single column.",
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
