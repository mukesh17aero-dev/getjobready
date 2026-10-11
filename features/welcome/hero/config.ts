// Shared audience copy. HeroVisual composes the rendered glass artwork.
// College and employer capabilities describe the network vision, not live access.

import type { Audience } from "@/lib/audience";
export type { Audience };

export const AUDIENCES: Audience[] = ["student", "college", "employer"];

export const asAudience = (value: string | null | undefined): Audience =>
  value === "college" || value === "employer" ? value : "student";

export type AudienceConfig = {
  id: Audience;
  /** The tab label in the header. */
  label: string;
  eyebrow: string;
  headline: string;
  /** The last phrase of the headline, set in the accent face. */
  accent: string;
  body: string;
  cta: { label: string; href: string };
  benefits: Array<{ title: string; detail: string }>;
  /** The card under "What is Ascend?" that lights up for this audience. */
  story: { title: string; text: string };
};

export const audienceConfig: Record<Audience, AudienceConfig> = {
  student: {
    id: "student",
    label: "Students",
    eyebrow: "For students",
    headline: "Turn your potential into a career",
    accent: "you'll do well in.",
    body: "Explore work that fits you. Understand your strengths, practise your answers, and build a clearer path into your career.",
    cta: { label: "Get started", href: "/" },
    benefits: [
      { title: "Real work practice", detail: "Try questions from the job." },
      { title: "See your strengths", detail: "Understand your skill gaps." },
      { title: "Prepare to apply", detail: "Resume and interview tools." },
    ],
    story: {
      title: "Students · find your next step",
      text: "Your career home brings your profile, career options and preparation together. Start with what matters to you and return to where you left off.",
    },
  },
  college: {
    id: "college",
    label: "Colleges",
    eyebrow: "For colleges",
    headline: "Turn education into",
    accent: "workplace readiness.",
    body: "Align learning with industry demand, provide real-world practice, and improve placement and early-career outcomes.",
    cta: { label: "Partner with us", href: "/for/colleges" },
    benefits: [
      { title: "Industry demand insights", detail: "What employers are asking for now." },
      { title: "Better placements", detail: "Readiness measured before the drive." },
      { title: "Continuous employer feedback", detail: "What the first months showed." },
    ],
    story: {
      title: "Colleges · focus your support",
      text: "Student dashboards, employability insights and readiness reports are planned to help placement teams understand the cohort and support each student.",
    },
  },
  employer: {
    id: "employer",
    label: "Employers",
    eyebrow: "For employers",
    headline: "Find talent that is",
    accent: "ready to perform.",
    body: "Discover, evaluate and onboard job-ready talent for frontline white-collar roles.",
    cta: { label: "Explore partnership", href: "/for/employers" },
    benefits: [
      { title: "Validated capability", detail: "Work that was observed and marked." },
      { title: "Faster hiring", detail: "Shortlists built on evidence." },
      { title: "Better productivity", detail: "Ready sooner in the role." },
    ],
    story: {
      title: "Employers · see the evidence",
      text: "Candidate passport reviews, role readiness analytics and pre-hire simulation reports are planned to bring demonstrated work into hiring decisions.",
    },
  },
};
