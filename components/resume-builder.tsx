"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { BackLink } from "@/components/back-link";
import { Picker } from "@/components/picker";
import { WorkShelf } from "@/components/work-rail";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { SignUpPrompt, type GatedAction } from "@/components/signup-gate";
import { track as trackEvent } from "@/lib/footprints";
import { whenLabel } from "@/lib/when";
import {
  downloadResumeDocx,
  exportTemplate,
  generateResume,
  readResumeUpload,
  refineResume,
  resumeCompleteness,
  type AtsCheck,
  resumeGapCheck,
  reviewResume,
  saveResumeProfile,
  type GapCheckResult,
  type ResumeCareerProfile,
  type ResumeData,
  type ResumeReview,
  type ResumeTarget,
  type ResumeTemplate,
} from "@/lib/resume-api";

// The AI Resume Builder, in three moves: confirm who the resume is for,
// answer what the record still misses, then read the draft built only from
// what is true. Teal marks what the person has earned or told us; violet
// marks where Ascend is guiding them.

export const splitList = (value: unknown): string[] =>
  typeof value === "string"
    ? value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

// ---- The gap popup ----
//
// Same portal/dialog shape as AuthModal: portal to <body>, backdrop click and
// Escape close it, the page behind cannot scroll. Light panel - this dialog
// lives inside the app, not on the night-themed landing.
/** The send mark. An arrow up, as every chat box has settled on. */
function ArrowUp() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </svg>
  );
}

/** The upload mark. Drawn rather than imported: one shape, used once. */
function UploadMark() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 14.5A3.5 3.5 0 0 1 7 11a5 5 0 0 1 9.6-1.4A4 4 0 0 1 20 13.5a3.5 3.5 0 0 1-3.5 3.5H16" />
      <path d="M12 12v8" />
      <path d="m9 15 3-3 3 3" />
    </svg>
  );
}

export function GapModal({
  gap,
  profileSkills,
  busy,
  onClose,
  onSubmit,
}: {
  gap: GapCheckResult;
  profileSkills: string[];
  busy: boolean;
  onClose: () => void;
  onSubmit: (answers: Record<string, string>, newSkills: string[]) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [extraSkills, setExtraSkills] = useState("");
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // The deviation guard. Anything the person claims here that their record
  // does not already hold is flagged, and only an explicit "yes, this is
  // true" lets it in. Two sources of claims: the skills box itself, and any
  // role keyword that appears in a written answer.
  const known = profileSkills.map((s) => s.toLowerCase());
  const isKnown = (skill: string) => {
    const lower = skill.toLowerCase();
    return known.some((k) => k.includes(lower) || lower.includes(k));
  };
  const typedSkills = splitList(extraSkills);
  const answerText = Object.values(answers).join(" ").toLowerCase();
  const mentioned = gap.keywords.filter(
    (kw) => answerText.includes(kw.toLowerCase()) && !isKnown(kw),
  );
  const flagged = [
    ...typedSkills.filter((s) => !isKnown(s)),
    ...mentioned.filter(
      (kw) => !typedSkills.some((s) => s.toLowerCase() === kw.toLowerCase()),
    ),
  ];
  const unconfirmed = flagged.filter((s) => !acknowledged.has(s.toLowerCase()));

  const toggleAck = (skill: string) => {
    setAcknowledged((prev) => {
      const next = new Set(prev);
      const key = skill.toLowerCase();
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const submit = () => {
    const confirmed = flagged.filter((s) => acknowledged.has(s.toLowerCase()));
    const filled: Record<string, string> = {};
    for (const [key, value] of Object.entries(answers)) {
      if (value.trim()) filled[key] = value.trim();
    }
    onSubmit(filled, confirmed);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="A few details would make this resume stronger"
    >
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-surface p-6 shadow-[0_40px_90px_-20px_rgba(0,0,0,0.4)] outline-none sm:p-7"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          ✕
        </button>
        <h2 className="pr-10 text-lg font-semibold text-brand-ink">
          A few details would make this stronger
        </h2>
        <p className="mt-1 text-[0.85rem] text-slate-600">
          Your record covers a lot already. These questions fill what a{" "}
          {gap.targetRole} resume still misses - skip any that don&rsquo;t
          apply.
        </p>

        <div className="mt-4 grid gap-4">
          {gap.missing.map(({ field, question }) => (
            <label key={field} className="block">
              <span className="text-[0.82rem] font-semibold text-slate-800">
                {question}
              </span>
              <textarea
                rows={2}
                value={answers[field] ?? ""}
                onChange={(e) =>
                  setAnswers((a) => ({ ...a, [field]: e.target.value }))
                }
                className="mt-1 w-full resize-y rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.88rem] outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20"
              />
            </label>
          ))}
          <label className="block">
            <span className="text-[0.82rem] font-semibold text-slate-800">
              Any other skills this resume should show? (optional)
            </span>
            <span className="block text-[0.72rem] text-slate-400">
              Comma separated. Only claim what you could back up in an
              interview.
            </span>
            <input
              value={extraSkills}
              onChange={(e) => setExtraSkills(e.target.value)}
              placeholder="Google Sheets, Hindi typing"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.88rem] outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20"
            />
          </label>
        </div>

        {flagged.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
            <p className="text-[0.8rem] font-semibold text-amber-900">
              Worth a second look
            </p>
            <div className="mt-2 grid gap-2">
              {flagged.map((skill) => (
                <label
                  key={skill}
                  className="flex min-h-11 cursor-pointer items-start gap-2.5"
                >
                  <input
                    type="checkbox"
                    checked={acknowledged.has(skill.toLowerCase())}
                    onChange={() => toggleAck(skill)}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-teal-700"
                  />
                  <span className="text-[0.8rem] leading-snug text-amber-900">
                    <strong className="font-semibold">{skill}</strong> - this is
                    new - confirm it is true and you could back it up in an
                    interview.
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-[0.72rem] text-amber-800">
              Confirmed skills go on the resume; unticked ones stay off it.
            </p>
          </div>
        )}

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            disabled={busy || unconfirmed.length > 0}
            onClick={submit}
            className="rounded-lg bg-brand-teal-deep px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-teal disabled:opacity-50"
          >
            {busy ? "Building…" : "Save and build my resume"}
          </button>
          {unconfirmed.length > 0 && (
            <span className="text-[0.75rem] text-amber-800">
              Tick or clear the flagged skills first.
            </span>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

// How the review's verdict reads on screen, and where its one next step
// leads. Plain words, no score - a resume is not a number.
type Standing = "early" | "competitive" | "strong";

const STANDING_LABEL: Record<Standing, string> = {
  early: "This is an honest start, and thin for the bar this role sets.",
  competitive: "This holds up against what this role usually asks for.",
  strong: "This is strong for the role - it carries real evidence.",
};

// A resume aimed at no role has no role's bar to be measured against, and
// saying "this role" over a resume they deliberately left open is us
// forgetting what they asked for.
const STANDING_LABEL_GENERAL: Record<Standing, string> = {
  early: "This is an honest start, and thin for what most hiring reads like.",
  competitive: "This holds up in front of most people who would read it.",
  strong: "This is strong - it carries real evidence, whoever reads it.",
};

export const standingLabel = (level: Standing, targetRole: string): string =>
  targetRole ? STANDING_LABEL[level] : STANDING_LABEL_GENERAL[level];

/** The three ways this builder is used, said out loud as equals. */
type Making = "role" | "general" | "improve";

const MAKING_OPTIONS: Array<{ id: Making; label: string }> = [
  { id: "general", label: "A general resume - no particular role" },
  { id: "role", label: "A resume for a particular role" },
  { id: "improve", label: "Improve a resume I already have" },
];

export const NEXT_STEP_HREF: Record<string, string> = {
  readiness: "/practice",
  practice: "/practice",
  interview: "/interview",
  profile: "/profile",
};

export const NEXT_STEP_LABEL: Record<string, string> = {
  readiness: "Prove these skills →",
  practice: "Do the real work →",
  interview: "Rehearse for it →",
  profile: "Fill in what is missing →",
};

// What can be asked for, shown one at a time in Scribe's own box - a person
// who has never edited a resume does not know that "this one is not true" is
// a thing they are allowed to say.
export const SCRIBE_EXAMPLES = [
  "Make the profile shorter",
  "Move the college fest above the store job",
  "Add that I handled about 60 customers a day",
  "This bullet is not true - take it out",
  "Say more about the stock work",
];

export type LedgerEntry = {
  role: string;
  at: string;
  skillsHighlighted?: string[];
  resume?: ResumeData;
  template?: ResumeTemplate;
  /** When they took it away, if they have. */
  downloadedAt?: string;
  /** The read-out they were given on the version they downloaded. */
  review?: ResumeReview;
};

// One turn of the revision loop, kept so the change log can show what was
// asked, what happened, and can put any change back.
export type Revision = {
  ask: string;
  /** What Scribe said back - always present. */
  reply: string;
  changed: string[];
  /** Whether the document actually differs from `before`. The model does not
      always describe what it did, but the page can always tell. */
  didChange: boolean;
  /** Facts this instruction brought in, which are the person's own claim. */
  added: string[];
  /** One question that would make the change stronger, if there was one. */
  followUp?: string;
  declined: string | null;
  /** The resume as it was BEFORE this revision, for "Put it back". */
  before: ResumeData;
};

// The read-out takes a few seconds because a model is genuinely reading the
// resume. A single frozen sentence reads as hung, so the wait narrates what
// is being done - and says plainly that it is worth staying for.
const REVIEW_STEPS = [
  "Reading your resume the way a recruiter would…",
  "Checking it against what this role asks for…",
  "Looking for what a screening system would miss…",
  "Weighing it against the usual bar for the role…",
  "Writing your feedback…",
];

export function ReviewProgress() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setStep((s) => Math.min(s + 1, REVIEW_STEPS.length - 1)),
      2600,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <ul aria-hidden className="grid gap-2.5">
        {REVIEW_STEPS.map((label, i) => {
          const done = i < step;
          const now = i === step;
          return (
            <li key={label} className="flex items-center gap-2.5">
              <span className="grid h-5 w-5 shrink-0 place-items-center">
                {done ? (
                  <span className="text-[0.9rem] font-bold text-teal-700">
                    ✓
                  </span>
                ) : now ? (
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand-violet-deep motion-reduce:animate-none" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                )}
              </span>
              <span
                className={`text-[0.85rem] leading-relaxed ${
                  done
                    ? "text-slate-400"
                    : now
                      ? "font-semibold text-brand-ink"
                      : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ul>
      <p role="status" className="sr-only">
        {REVIEW_STEPS[step]}
      </p>
      <p className="mt-4 rounded-xl bg-slate-100 px-3.5 py-2.5 text-[0.8rem] leading-relaxed text-slate-600">
        This takes a few seconds. Stay on this page - your feedback opens here
        as soon as it is ready.
      </p>
    </div>
  );
}

// ---- The first few details ----
//
// Asked here rather than sending someone to the profile page and hoping they
// come back. Every answer is written to the same record the profile page
// reads, so it is filled in there too and never asked twice.

export const ESSENTIALS: Array<{
  key:
    | "fullName"
    | "city"
    | "skills"
    | "institution"
    | "course"
    | "internshipExperience";
  label: string;
  hint?: string;
  placeholder: string;
  required?: boolean;
  lines?: number;
}> = [
  {
    key: "fullName",
    label: "Your full name",
    placeholder: "Aarav Sharma",
    required: true,
  },
  { key: "city", label: "City", placeholder: "Hyderabad" },
  {
    key: "skills",
    label: "What can you do?",
    hint: "Comma separated. Only what you could back up in an interview. Leave it blank and we work from what your record shows.",
    placeholder: "Customer service, Google Sheets, Hindi typing",
  },
  {
    key: "institution",
    label: "Where you studied",
    placeholder: "Osmania University",
  },
  { key: "course", label: "What you studied", placeholder: "B.Com" },
  {
    key: "internshipExperience",
    label: "Any work, internship or project so far (optional)",
    hint: "A line or two is plenty. Anything missing can be added beside the draft.",
    placeholder: "Helped at the family store: billing, stock lists, customers",
    lines: 3,
  },
];

export function EssentialsModal({
  firstName,
  busy,
  onClose,
  onSubmit,
}: {
  firstName: string;
  busy: boolean;
  onClose: () => void;
  onSubmit: (values: Record<string, string>) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const missing = ESSENTIALS.filter(
    (f) => f.required && !(values[f.key] ?? "").trim(),
  );

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="The first few details for your resume"
    >
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-surface p-6 shadow-[0_40px_90px_-20px_rgba(0,0,0,0.4)] outline-none sm:p-7"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          ✕
        </button>
        <h2 className="pr-10 text-lg font-semibold text-brand-ink">
          {firstName
            ? `${firstName}, let's start with you`
            : "Let's start with you"}
        </h2>
        <p className="mt-1 text-[0.85rem] leading-relaxed text-slate-600">
          Your resume can only say what is true about you, so we need a little
          to work from. This is saved to your profile - you will not be asked
          again.
        </p>

        <div className="mt-4 grid gap-4">
          {ESSENTIALS.map((field) => (
            <label key={field.key} className="block">
              <span className="text-[0.82rem] font-semibold text-slate-800">
                {field.label}
              </span>
              {field.hint && (
                <span className="block text-[0.72rem] text-slate-400">
                  {field.hint}
                </span>
              )}
              {field.lines ? (
                <textarea
                  rows={field.lines}
                  value={values[field.key] ?? ""}
                  placeholder={field.placeholder}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [field.key]: e.target.value }))
                  }
                  className="mt-1 w-full resize-y rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.88rem] outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20"
                />
              ) : (
                <input
                  value={values[field.key] ?? ""}
                  placeholder={field.placeholder}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [field.key]: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.9rem] outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20"
                />
              )}
            </label>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={busy || missing.length > 0}
            onClick={() => onSubmit(values)}
            className="rounded-lg bg-brand-teal-deep px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-teal disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save and keep going"}
          </button>
          {missing.length > 0 && (
            <span className="text-[0.75rem] text-slate-500">
              Your name and what you can do are the two we cannot do without.
            </span>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ---- Templates ----
//
// Three ATS-safe looks for the same data: single column, no tables or
// graphics, standard headings in all three. Only spacing, alignment and type
// change - a screener parses them identically, a person sees three styles.

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
export const SAMPLE_RESUME: ResumeData = {
  header: {
    name: "Aarav Sharma",
    city: "Hyderabad",
    email: "aarav.sharma@example.com",
  },
  summary:
    "Customer-focused commerce graduate with hands-on practice in order handling, billing queries and everyday problem solving. Comfortable working shifts, quick to pick up new tools, and calm with difficult customers. Looking for work where the day is measured in problems closed rather than hours sat.",
  skills: [
    {
      group: "Customer service",
      items: [
        "Clear phone manner",
        "Patient listening",
        "Complaint handling",
        "Escalation judgement",
      ],
    },
    {
      group: "Tools",
      items: ["Google Sheets", "Billing systems", "Tally", "Hindi typing"],
    },
    {
      group: "Ways of working",
      items: ["Shift work", "Counter ownership", "Working to daily targets"],
    },
  ],
  experienceHeading: "Work experience",
  summaryHeading: "Summary",
  experience: [
    {
      title: "Store assistant",
      organisation: "Sharma General Stores",
      period: "2023 - 2024",
      bullets: [
        "Handled daily billing and customer questions at the counter, about 60 customers a day",
        "Kept stock lists up to date in Google Sheets so reorders went out before shelves emptied",
        "Settled billing disputes at the counter without calling the owner in",
      ],
    },
    {
      title: "Customer support intern",
      organisation: "Zippy Logistics",
      period: "Jun 2023 - Dec 2023",
      bullets: [
        "Answered 40 delivery queries a day across calls and email",
        "Logged repeat complaints in a shared tracker so the team could see which routes caused them",
        "Covered evening shifts through the festive peak without a missed handover",
      ],
    },
    {
      title: "Volunteer, registration desk",
      organisation: "College fest",
      period: "2023",
      bullets: [
        "Managed sign-ins for 200 students and sorted out schedule clashes on the day",
      ],
    },
  ],
  education: [
    {
      qualification: "B.Com",
      institution: "Osmania University",
      period: "2021 - 2024",
      detail: "72%, specialised in accounting and taxation",
    },
    {
      qualification: "Class XII, Commerce",
      institution: "Kendriya Vidyalaya, Hyderabad",
      period: "2021",
      detail: "78%",
    },
  ],
  languages: ["English", "Hindi", "Telugu"],
  activities: [
    "College cricket team, two seasons",
    "Peer study group - ran weekly accounts revision for eight classmates",
    "NSS volunteer at two blood donation drives",
  ],
  keywordsUsed: [],
};

// The same person, a year earlier and still studying. The two samples exist
// because the answer to "where are you right now?" is the one that changes
// the shape of the page: education and projects first, an objective instead
// of a summary, and the only work is an internship. Showing one sample for
// both answers made the question look decorative.
export const STUDENT_SAMPLE: ResumeData = {
  ...SAMPLE_RESUME,
  summaryHeading: "Career objective",
  summary:
    "Final-year B.Com student looking for a first role in customer support or billing. Ran the counter at a family shop through two exam seasons, and handled 40 delivery queries a day on an internship. Quick with Sheets and billing systems, and calm with people who are not.",
  experienceHeading: "Internships and part-time work",
  experience: SAMPLE_RESUME.experience.slice(1),
  projects: [
    {
      title: "Billing tracker for the shop counter",
      detail:
        "Built a Sheets tracker for daily takings and stock so reorders went out before shelves emptied. Still in use.",
      tools: ["Google Sheets", "Tally"],
    },
    {
      title: "College fest registration desk",
      detail:
        "Signed in 200 students across two days and sorted schedule clashes on the spot.",
      tools: ["Forms", "Rota planning"],
    },
  ],
  achievements: [
    "Second place, inter-college accounts quiz, 2023",
    "Ran weekly revision for eight classmates through final year",
  ],
};

// An A4-proportioned thumbnail: the container crops a full page's worth of
// the one-third-scale sheet, so each card reads as a complete resume page.
/**
 * What the parser found in the file they handed over, said plainly. Somebody
 * who uploads a resume and is told only "uploaded" has no way of knowing
 * whether we could read it at all - and a resume nobody could read is worth
 * saying out loud before they build on it.
 */
export function uploadRead(read: {
  experience: number;
  education: number;
  skills: number;
}): string {
  const parts: string[] = [];
  const plural = (n: number, one: string, many: string) =>
    `${n} ${n === 1 ? one : many}`;
  if (read.experience) parts.push(plural(read.experience, "role", "roles"));
  if (read.education)
    parts.push(plural(read.education, "qualification", "qualifications"));
  if (read.skills) parts.push(plural(read.skills, "skill", "skills"));
  if (parts.length === 0) {
    return "We read the file but could not pick out sections from it - we will work from its words as they are.";
  }
  const last = parts.pop() as string;
  return `We read ${parts.length ? `${parts.join(", ")} and ${last}` : last} from it.`;
}

// A4 at 96dpi: 210mm x 297mm. Everything on the page is laid out in these
// units, so what is on the screen is the page that comes out of the printer.
const A4_WIDTH = "210mm";
const A4_PX = 794; // 210mm at 96dpi, for working out how far to scale it
const A4_PAGE_PX = 297 * (96 / 25.4); // one page, top to bottom
const PAGE_GUTTER_PX = 24; // the gap between two sheets on a desk

/**
 * Holds an A4 page inside whatever space is going, scaled to fit the width.
 * The page keeps its real dimensions - only the viewing scale changes - so
 * line breaks and page breaks are the ones the paper will have.
 */
function Page({
  id,
  className,
  inner,
  children,
  onPages,
  watermark,
}: {
  id?: string;
  className: string;
  /** Padding and font for the content inside the margins. */
  inner: string;
  children: React.ReactNode;
  /** Told how many whole A4 pages this came to. */
  onPages?: (pages: number) => void;
  /** A word stamped across the middle of every sheet - "Draft", "Example". */
  watermark?: string;
}) {
  const content = useRef<HTMLDivElement | null>(null);
  const [pages, setPages] = useState(1);
  // Held in a ref so a new callback identity cannot restart the observer.
  const onPagesRef = useRef(onPages);
  useEffect(() => {
    onPagesRef.current = onPages;
  }, [onPages]);

  useEffect(() => {
    const el = content.current;
    if (!el) return;

    // Sheets of paper, not a roll. Each section is measured against the foot
    // of the page it lands on, and anything that would straddle the fold is
    // pushed down to the top of the next sheet - which is what a printer
    // does, and what a person looking at their own resume expects to see.
    const fit = () => {
      const unit = A4_PAGE_PX + PAGE_GUTTER_PX;
      const pad = parseFloat(getComputedStyle(el).paddingTop) || 0;
      const flows = el.querySelectorAll<HTMLElement>("[data-flow]");
      const columns: HTMLElement[] = flows.length ? [...flows] : [el];

      for (const pushed of el.querySelectorAll<HTMLElement>("[data-pushed]")) {
        pushed.style.paddingTop = "";
        delete pushed.dataset.pushed;
      }

      // The preview shows the page zoomed to fit, and a zoomed element
      // reports zoomed rectangles - so every measurement is converted back
      // to the page's own units first. Comparing visual pixels against a
      // page height in layout pixels is how a fold ends up in the wrong
      // place, or nowhere at all.
      const zoom = el.getBoundingClientRect().width / el.offsetWidth || 1;
      const top = el.getBoundingClientRect().top / zoom;
      const room = A4_PAGE_PX - pad * 2;

      // Walk down until something small enough to move is found. A whole
      // section is moved when it fits on a page; when it does not - a long
      // employment history always outgrows one - the entries inside it are
      // moved instead, so the fold falls between two jobs rather than
      // through the middle of one.
      const clear = (parent: HTMLElement, depth: number): void => {
        for (const child of [...parent.children] as HTMLElement[]) {
          const rect = child.getBoundingClientRect();
          const box = {
            top: rect.top / zoom,
            bottom: rect.bottom / zoom,
            height: rect.height / zoom,
          };
          const from = box.top - top;
          const page = Math.floor(from / unit);
          const foot = page * unit + A4_PAGE_PX - pad;
          if (box.bottom - top <= foot) continue;
          // Small enough to move whole - a heading with two lines under it,
          // one job, the languages block - so move it. Anything bigger gets
          // broken inside instead: pushing a whole employment history to the
          // next page would leave half of this one blank, which is not what
          // a printer does and not what anyone wants to look at.
          const movable = box.height <= Math.min(room, A4_PAGE_PX * 0.35);
          if (movable || child.children.length === 0 || depth >= 3) {
            if (box.height > room) continue;
            child.style.paddingTop = `${(page + 1) * unit + pad - from}px`;
            child.dataset.pushed = "true";
          } else {
            clear(child, depth + 1);
          }
        }
      };

      for (const column of columns) clear(column, 0);

      const deepest = el.getBoundingClientRect().bottom / zoom - top;
      const count = Math.max(1, Math.ceil((deepest + pad) / unit - 0.01));
      setPages(count);
      onPagesRef.current?.(count);
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      id={id}
      className="relative print:block"
      style={{
        width: A4_WIDTH,
        height: `${pages * A4_PAGE_PX + (pages - 1) * PAGE_GUTTER_PX}px`,
      }}
    >
      {/* One white rectangle per sheet, with real space between them, so two
          pages read as two pages. Print drops them: the paper is the paper. */}
      <div aria-hidden className="absolute inset-0 print:hidden">
        {Array.from({ length: pages }, (_, i) => (
          <div
            key={i}
            className={`${className} grid place-items-center overflow-hidden`}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: `${i * (A4_PAGE_PX + PAGE_GUTTER_PX)}px`,
              height: `${A4_PAGE_PX}px`,
            }}
          >
            {watermark ? (
              <span className="select-none text-[6rem] font-bold uppercase tracking-[0.3em] text-[#111827]/[0.06]">
                {watermark}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <div ref={content} className={`relative ${inner}`}>
        {children}
      </div>
    </div>
  );
}

/** Exported with ResumeSheet: it is what scales an A4 page to its box. */
export function A4Frame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const box = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => setScale(Math.min(1, el.clientWidth / A4_PX));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={box} className={className}>
      {/* zoom rather than transform: a transform leaves the layout at full
          size, and there is then nothing sane to scroll. */}
      <div style={{ zoom: scale }}>{children}</div>
    </div>
  );
}

export function MiniPreview({
  id,
  resume,
  roleLine,
  track,
}: {
  id: ResumeTemplate;
  resume: ResumeData;
  roleLine: string;
  track?: "student" | "early_career";
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none aspect-[1/1.414] select-none overflow-hidden rounded-md border border-[#cbd2da] bg-white shadow-sm"
    >
      <A4Frame>
        <ResumeSheet
          resume={resume}
          template={id}
          roleLine={roleLine}
          track={track}
          mini
        />
      </A4Frame>
    </div>
  );
}

// Native radios (visually hidden, cards styled through peer classes) so the
// picker is keyboard-accessible for free: Tab reaches it, arrow keys move
// the choice. Violet marks the selection - Ascend guiding a choice, not an
// earned fact.
function TemplatePicker({
  value,
  onChange,
  track,
  resume,
  roleLine,
}: {
  value: ResumeTemplate;
  onChange: (template: ResumeTemplate) => void;
  /** The preview content - the person's own name where the record has it. */
  resume: ResumeData;
  roleLine: string;
  /** So each thumbnail is ordered the way their own page will be. */
  track?: "student" | "early_career";
}) {
  // No preview dialog here: the workbench keeps a full-size page beside the
  // picker, so the thumbnails only have to say which look is which.
  return (
    <fieldset>
      <legend className="text-[0.8rem] font-semibold text-slate-800">
        Pick a look
      </legend>
      <p className="mt-0.5 text-[0.72rem] text-slate-400">
        Classic and Compact are single column - the safest read for screening
        software. Sidebar is a designed two-column look, best when a person
        reads it. Switch any time.
      </p>
      {/* A row of pages, side by side, the way anybody would lay printed
          samples on a desk to choose between them. It scrolls sideways where
          the rail is too narrow rather than stacking into a list. */}
      {/* Three equal columns, spanning the rail: fixed-width cards left half
          the row empty. Below sm they stack. */}
      <ul className="mt-2.5 grid grid-cols-3 gap-2.5 max-sm:grid-cols-1">
        {TEMPLATES.map((t) => (
          <li key={t.id} className="min-w-0">
            <label className="block cursor-pointer">
              <input
                type="radio"
                name="resume-template"
                value={t.id}
                checked={value === t.id}
                onChange={() => onChange(t.id)}
                className="peer sr-only"
              />
              <span className="block rounded-xl border-2 border-slate-200 bg-surface p-1.5 transition-colors peer-checked:border-brand-violet peer-checked:bg-brand-violet/5 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-violet/40">
                <span className="block overflow-hidden rounded-md">
                  <MiniPreview
                    id={t.id}
                    resume={resume}
                    roleLine={roleLine}
                    track={track}
                  />
                </span>
                <span className="mt-1.5 block text-center text-[0.78rem] font-semibold text-brand-ink">
                  {t.name}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

// ---- The rendered resume ----
//
// The sheet is fixed white in every theme, so it keeps literal ink hexes
// instead of app theme tokens - in all three templates.

// The three looks follow resume.io's ATS set: Classic wears the serif
// "Traditional" suit, Compact the tight sans "Simple ATS", and Sidebar the
// two-column "Stockholm" arrangement. Classic and Compact stay single
// column, so a screener reads them exactly alike.
type SheetStyles = {
  pad: string;
  /** Root font family for the whole sheet. */
  font: string;
  /** "split" = contact flush right of the name; "stack" = beneath it; "center" = both centred. */
  headerLayout: "split" | "stack" | "center";
  name: string;
  contact: string;
  section: string;
  heading: string;
  body: string;
  item: string;
  itemTitle: string;
  stack: string;
  /** Dates sit flush right of the item title line. */
  dateRight: boolean;
};

const SHEET_STYLES: Record<ResumeTemplate, SheetStyles> = {
  // Sizes are in points, because the page is now a real A4 page and points
  // are what a printed resume is set in. They are also what makes an
  // ordinary record fill the sheet: type meant for a fluid column left a
  // third of the paper white, and white space at the foot of a resume reads
  // as a person with little to say.
  classic: {
    pad: "p-[15mm]",
    font: "font-serif",
    headerLayout: "split",
    name: "text-[24pt] font-bold tracking-tight text-[#111827]",
    contact: "text-[10pt] leading-relaxed",
    section: "mt-[6mm]",
    heading: "border-b-2 border-[#111827] pb-1 text-[12pt] font-bold",
    body: "text-[11pt] leading-[1.45]",
    item: "text-[11pt] leading-[1.45]",
    itemTitle: "text-[11.5pt] font-semibold",
    stack: "grid gap-[4mm]",
    dateRight: true,
  },
  compact: {
    pad: "p-[14mm]",
    font: "font-sans",
    headerLayout: "stack",
    name: "text-[23pt] font-bold tracking-tight text-[#111827]",
    contact: "mt-1 text-[10pt]",
    section: "mt-[6mm]",
    heading:
      "border-b border-[#9ca3af] pb-0.5 text-[9pt] font-bold uppercase tracking-[0.14em]",
    body: "text-[11pt] leading-[1.45]",
    item: "text-[11pt] leading-[1.45]",
    itemTitle: "text-[11.5pt] font-semibold",
    stack: "grid gap-[3.5mm]",
    dateRight: false,
  },
  sidebar: {
    pad: "p-[15mm]",
    font: "font-sans",
    headerLayout: "stack",
    name: "text-[26pt] font-bold uppercase leading-[1.1] tracking-[0.02em] text-[#111827]",
    contact: "mt-1 text-[10pt]",
    section: "mt-[6.5mm]",
    heading:
      "text-[11pt] font-bold uppercase tracking-[0.1em] after:mt-1 after:block after:h-[3px] after:w-8 after:bg-[#111827]",
    body: "text-[11pt] leading-[1.5]",
    item: "text-[11pt] leading-[1.5]",
    itemTitle: "text-[11.5pt] font-semibold",
    stack: "grid gap-[4mm]",
    dateRight: true,
  },
  // Three more single-column looks. Like Classic and Compact they use no
  // tables, columns or graphics, so a screener reads them exactly alike.
  minimal: {
    pad: "p-[16mm]",
    font: "font-sans",
    headerLayout: "stack",
    name: "text-[22pt] font-semibold tracking-tight text-[#111827]",
    contact: "mt-1 text-[10pt]",
    section: "mt-[7mm]",
    heading: "text-[9pt] font-semibold uppercase tracking-[0.2em] text-[#6b7280]",
    body: "text-[11pt] leading-[1.5]",
    item: "text-[11pt] leading-[1.5]",
    itemTitle: "text-[11.5pt] font-semibold",
    stack: "grid gap-[4mm]",
    dateRight: true,
  },
  graduate: {
    pad: "p-[15mm]",
    font: "font-serif",
    headerLayout: "center",
    name: "text-[24pt] font-bold uppercase tracking-[0.08em] text-[#111827]",
    contact: "mt-1 text-[10pt]",
    section: "mt-[6mm]",
    heading: "border-b border-[#111827] pb-1 text-center text-[11pt] font-bold uppercase tracking-[0.14em]",
    body: "text-[11pt] leading-[1.45]",
    item: "text-[11pt] leading-[1.45]",
    itemTitle: "text-[11.5pt] font-semibold",
    stack: "grid gap-[4mm]",
    dateRight: true,
  },
  professional: {
    pad: "p-[14mm]",
    font: "font-sans",
    headerLayout: "split",
    name: "text-[26pt] font-bold tracking-tight text-[#111827]",
    contact: "text-[10pt] leading-relaxed",
    section: "mt-[6mm]",
    heading: "bg-[#111827] px-2 py-0.5 text-[9.5pt] font-bold uppercase tracking-[0.12em] !text-white",
    body: "text-[11pt] leading-[1.45]",
    item: "text-[11pt] leading-[1.45]",
    itemTitle: "text-[11.5pt] font-semibold",
    stack: "grid gap-[4mm]",
    dateRight: true,
  },
};

// "EMPLOYMENT HISTORY" -> "Employment history": headings can arrive
// pre-uppercased, so the non-caps templates sentence-case them.
const sentenceCase = (text: string) =>
  text.toLowerCase().replace(/^./, (c) => c.toUpperCase());

function Section({
  title,
  styles,
  children,
}: {
  title: string;
  styles: SheetStyles;
  children: React.ReactNode;
}) {
  const caps = styles.heading.includes("uppercase");
  return (
    <section className={styles.section}>
      <h3 className={`${styles.heading} text-[#111827]`}>
        {caps ? title : sentenceCase(title)}
      </h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

// The item title line: role and organisation on the left, dates either
// flush right (Classic, Modern) or trailing the title (Compact).
function ItemLine({
  title,
  period,
  styles,
}: {
  title: string;
  period: string;
  styles: SheetStyles;
}) {
  if (styles.dateRight) {
    return (
      <div className="flex items-baseline justify-between gap-4">
        <p className={styles.itemTitle}>{title}</p>
        {period && (
          <p className={`shrink-0 ${styles.item} text-[#6b7280]`}>{period}</p>
        )}
      </div>
    );
  }
  return (
    <p className={styles.itemTitle}>
      {title}
      {period && (
        <span className="ml-2 font-normal text-[#6b7280]">· {period}</span>
      )}
    </p>
  );
}

/**
 * Exported so a landing page can show the real thing.
 *
 * Anything that renders a resume anywhere in the product renders it through
 * here. A hand-drawn approximation on a marketing surface is a promise the
 * app then has to keep, and it starts drifting the first time either side
 * changes - so there is one renderer and the preview uses it.
 */
export function ResumeSheet({
  resume,
  template,
  roleLine,
  mini = false,
  onPages,
  watermark,
  track = "early_career",
}: {
  resume: ResumeData;
  template: ResumeTemplate;
  /** The role this resume targets - sits under the name in the sidebar look. */
  roleLine?: string;
  /** Scaled-down picker preview: no print id, the card supplies the frame. */
  mini?: boolean;
  /** Told how many A4 pages the finished sheet came to. */
  onPages?: (pages: number) => void;
  /** Stamped across the middle of every sheet; never printed. */
  watermark?: string;
  /**
   * Who the page is for, which decides what a recruiter meets first.
   *
   * A student leads with education and projects because that is the evidence
   * they have; somebody with a job leads with the job. The backend already
   * writes to this rule, but order lives here, in the layout - so without
   * this the written page came back in the wrong order whatever it said.
   */
  track?: "student" | "early_career";
}) {
  const t = SHEET_STYLES[template];
  const student = track === "student";

  // The sections, built once and arranged differently per layout.
  const profile = resume.summary ? (
    <Section title={resume.summaryHeading || "Summary"} styles={t}>
      <p className={`whitespace-pre-line ${t.body}`}>{resume.summary}</p>
    </Section>
  ) : null;

  const skills = resume.skills.length > 0 && (
    <Section title="Skills" styles={t}>
      <ul className="grid gap-1">
        {resume.skills.map((group) => (
          <li key={group.group} className={t.body}>
            <strong className="font-semibold">{group.group}:</strong>{" "}
            {group.items.join(", ")}
          </li>
        ))}
      </ul>
    </Section>
  );

  const experience = resume.experience.length > 0 && (
    <Section
      title={resume.experienceHeading || "Employment history"}
      styles={t}
    >
      <div className={t.stack}>
        {resume.experience.map((item, i) => (
          <div key={`${item.title}-${i}`}>
            <ItemLine
              title={[item.title, item.organisation].filter(Boolean).join(", ")}
              period={item.period}
              styles={t}
            />
            <ul className="mt-1 grid gap-0.5 pl-4">
              {item.bullets.map((point) => (
                <li key={point} className={`list-disc ${t.item}`}>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );

  const education = resume.education.length > 0 && (
    <Section title="Education" styles={t}>
      <div className="grid gap-2">
        {resume.education.map((item, i) => (
          <div key={`${item.qualification}-${i}`}>
            <ItemLine
              title={[item.qualification, item.institution]
                .filter(Boolean)
                .join(", ")}
              period={item.period}
              styles={t}
            />
            {item.detail && (
              <p className={`${t.item} text-[#4b5563]`}>{item.detail}</p>
            )}
          </div>
        ))}
      </div>
    </Section>
  );

  // The sections a fresher's resume is mostly made of. Each is absent rather
  // than empty: a heading with nothing under it advertises a gap.
  const projects = (resume.projects?.length ?? 0) > 0 && (
    <Section title="Projects" styles={t}>
      <div className={t.stack}>
        {resume.projects!.map((project) => (
          <div key={project.title}>
            <p className={t.itemTitle}>{project.title}</p>
            {project.detail && <p className={t.item}>{project.detail}</p>}
            {project.tools.length > 0 && (
              <p className={`${t.item} text-[#4b5563]`}>
                {project.tools.join(", ")}
              </p>
            )}
          </div>
        ))}
      </div>
    </Section>
  );

  const certifications = (resume.certifications?.length ?? 0) > 0 && (
    <Section title="Certifications" styles={t}>
      <ul className="grid gap-0.5 pl-4">
        {resume.certifications!.map((c) => (
          <li key={c.title} className={`list-disc ${t.item}`}>
            {c.title}
            {c.issuer ? `, ${c.issuer}` : ""}
            {c.year ? ` (${c.year})` : ""}
          </li>
        ))}
      </ul>
    </Section>
  );

  const achievements = (resume.achievements?.length ?? 0) > 0 && (
    <Section title="Achievements" styles={t}>
      <ul className="grid gap-0.5 pl-4">
        {resume.achievements!.map((line) => (
          <li key={line} className={`list-disc ${t.item}`}>
            {line}
          </li>
        ))}
      </ul>
    </Section>
  );

  const interests = (resume.interests?.length ?? 0) > 0 && (
    <Section title="Interests" styles={t}>
      <p className={t.body}>{resume.interests!.join(", ")}</p>
    </Section>
  );

  const languages = resume.languages.length > 0 && (
    <Section title="Languages" styles={t}>
      <p className={t.body}>{resume.languages.join(", ")}</p>
    </Section>
  );

  const activities = resume.activities.length > 0 && (
    <Section title="Activities" styles={t}>
      <ul className="grid gap-0.5 pl-4">
        {resume.activities.map((activity) => (
          <li key={activity} className={`list-disc ${t.item}`}>
            {activity}
          </li>
        ))}
      </ul>
    </Section>
  );

  // A4, in millimetres, because that is what it is. The page is 210mm wide
  // and at least one 297mm page tall; content longer than that rolls onto a
  // second page rather than stretching the first, and a hairline is drawn
  // where each page ends so nobody is surprised by page two at the printer.
  const paperClass = `bg-white ${
    mini ? "" : "rounded-xl border border-slate-200 shadow-sm"
  }`;
  const inkClass = `break-words text-[#111827] ${t.font} ${t.pad}`;

  if (template === "sidebar") {
    const info = (resume.header.city ||
      resume.header.email ||
      resume.header.phone ||
      resume.header.link) && (
      <Section title="Info" styles={t}>
        <div className="grid gap-1.5">
          {resume.header.city && <p className={t.item}>{resume.header.city}</p>}
          {resume.header.phone && (
            <p className={t.item}>{resume.header.phone}</p>
          )}
          {resume.header.email && (
            <p className={t.item}>{resume.header.email}</p>
          )}
          {resume.header.link && <p className={t.item}>{resume.header.link}</p>}
        </div>
      </Section>
    );
    return (
      <Page
        id={mini ? undefined : "resume-sheet"}
        className={paperClass}
        inner={inkClass}
        onPages={onPages}
        watermark={watermark}
      >
        <h2 className={t.name}>{resume.header.name}</h2>
        {roleLine && (
          <p className={`${t.contact} text-[#6b7280]`}>{roleLine}</p>
        )}
        {/* One layout grid, real headings in both columns: reading order is
            the narrow column then the wide one. */}
        {/* min-w-0 lets the narrow column shrink, and overflow-wrap breaks a
            long email or link instead of letting it cross the divider. */}
        <div className="mt-5 grid gap-x-6 gap-y-1 border-t border-[#d1d5db] pt-4 sm:grid-cols-[10rem_1fr]">
          <div
            data-flow
            className="min-w-0 border-[#e5e7eb] [overflow-wrap:anywhere] sm:border-r sm:pr-5"
          >
            {info}
            {skills}
            {languages}
            {certifications}
            {interests}
          </div>
          {/* A hairline between sections, as the reference layout has - the
              first section needs none, so only later siblings carry it. */}
          <div
            data-flow
            className="min-w-0 [&>section+section]:border-t [&>section+section]:border-[#e5e7eb] [&>section+section]:pt-4"
          >
            {profile}
            {student ? education : experience}
            {student ? projects : education}
            {student ? experience : projects}
            {achievements}
            {activities}
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page
      id={mini ? undefined : "resume-sheet"}
      className={paperClass}
      inner={inkClass}
      onPages={onPages}
      watermark={watermark}
    >
      {t.headerLayout === "split" ? (
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1 border-b border-[#d1d5db] pb-3">
          <h2 className={t.name}>{resume.header.name}</h2>
          {(resume.header.city ||
            resume.header.email ||
            resume.header.phone ||
            resume.header.link) && (
            <p className={`${t.contact} text-[#6b7280] sm:text-right`}>
              {[
                resume.header.city,
                resume.header.phone,
                resume.header.email,
                resume.header.link,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>
      ) : (
        <div className={t.headerLayout === "center" ? "border-b border-[#d1d5db] pb-3 text-center" : ""}>
          <h2 className={t.name}>{resume.header.name}</h2>
          {(resume.header.city ||
            resume.header.email ||
            resume.header.phone ||
            resume.header.link) && (
            <p className={`${t.contact} text-[#6b7280]`}>
              {[
                resume.header.city,
                resume.header.phone,
                resume.header.email,
                resume.header.link,
              ]
                .filter(Boolean)
                .join("  |  ")}
            </p>
          )}
        </div>
      )}
      {profile}
      {skills}
      {student ? education : experience}
      {projects}
      {student ? experience : education}
      {certifications}
      {achievements}
      {languages}
      {activities}
      {interests}
    </Page>
  );
}

// ---- The builder ----

export function ResumeBuilder({
  profile: initialProfile,
  target,
  recordAt,
}: {
  profile: ResumeCareerProfile | null;
  target: ResumeTarget | null;
  recordAt?: string;
}) {
  // The record can change from inside this screen - the first few details are
  // asked for here rather than sending someone away to the profile page - so
  // it is state, not just a prop.
  const [profile, setProfile] = useState(initialProfile);
  const ledger = (() => {
    const raw = profile?.preferences?.["resumeLedger"];
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(
        (e): e is LedgerEntry =>
          typeof e === "object" &&
          e !== null &&
          typeof (e as { role?: unknown }).role === "string",
      )
      .slice()
      .reverse()
      .slice(0, 10);
  })();
  const selectedRecord = recordAt ? ledger.find(entry => entry.at === recordAt && entry.resume) : undefined;
  const lockedRole = target?.role ?? null;

  // General for everyone, including somebody who chose a direction in
  // Discovery - choosing a direction is not the same as applying for it
  // today, and the role is one line away when they are.
  const [making, setMaking] = useState<Making>("general");
  // Whether they have actually answered the first question.
  //
  // `making` has always had a valid default, so the preview beside it claimed
  // to be showing a general resume nobody had asked for. Until this is true
  // the control reads as a question and the preview says it is waiting.
  const [picked, setPicked] = useState(false);
  // The rail beside the workbench: build, or the ones already built. The
  // shelf used to be at the foot of this page, below a screen and a half of
  // form, which is where a returning person could not find it.
  const [pane, setPane] = useState<"make" | "keep">("make");
  const [showJd, setShowJd] = useState(false);
  const [roleInput, setRoleInput] = useState(lockedRole?.title ?? "");
  const [jdInput, setJdInput] = useState("");
  // Aimed only when they picked a role and actually named one - an improved
  // resume may carry a role too, which is why this reads the field and not
  // just the dropdown.
  const targeted =
    making === "role" || (making === "improve" && Boolean(roleInput.trim()));
  const general = !targeted;
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Changing what we are making clears what belonged to the old answer, so
  // an abandoned upload cannot ride along with a build that never asked for
  // it.
  function chooseMaking(next: Making) {
    setPicked(true);
    setMaking(next);
    setError(null);
    if (next !== "improve") setUpload(null);
    if (next === "general") {
      setRoleInput("");
      setJdInput("");
      setShowJd(false);
    }
    if (next === "role" && !roleInput.trim() && lockedRole)
      setRoleInput(lockedRole.title);
  }

  const [upload, setUpload] = useState<{
    filename: string;
    text: string;
    read: { experience: number; education: number; skills: number };
    parsed: Record<string, unknown> | null;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState<null | "checking" | "building">(null);
  const [error, setError] = useState<string | null>(null);
  const [gap, setGap] = useState<GapCheckResult | null>(null);
  const [result, setResult] = useState<{
    resume: ResumeData;
    targetRole: string;
  } | null>(selectedRecord?.resume ? { resume: selectedRecord.resume, targetRole: selectedRecord.role } : null);
  const [downloading, setDownloading] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const [essentialsOpen, setEssentialsOpen] = useState(false);
  const [review, setReview] = useState<ResumeReview | null>(selectedRecord?.review ?? null);
  const [reviewing, setReviewing] = useState(false);
  // The read-back is a page of its own, shown once the resume is downloaded.
  const [showFeedback, setShowFeedback] = useState(false);
  // The revision loop: each instruction, what came back, and the resume it
  // replaced - so any change can be put back.
  const [comment, setComment] = useState("");
  // How many A4 pages the built resume actually comes to, measured from the
  // page itself rather than guessed from the word count.
  const [sheetPages, setSheetPages] = useState(1);
  // What a parser found in the file we would hand over, checked on every
  // build and every rewrite.
  const [ats, setAts] = useState<AtsCheck | null>(null);
  // "student" or "early_career", from the profile when it knows.
  const savedTrack = (() => {
    const value = profile?.preferences?.["track"];
    return value === "student" || value === "early_career" ? value : null;
  })();
  const [track, setTrack] = useState<"student" | "early_career" | null>(
    savedTrack,
  );
  const [revising, setRevising] = useState(false);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  // The thread box scrolls itself to the newest exchange, since the box no
  // longer grows to keep it in view.
  const threadRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [revisions.length, revising]);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [template, setTemplate] = useState<ResumeTemplate>(asTemplate(selectedRecord?.template));

  const profileSkills = useMemo(
    () => splitList(profile?.preferences?.["skills"]),
    [profile],
  );

  // The preview wears the person's own name and city where the record has
  // them, so it reads as their page rather than a stranger's. The body stays
  // sample text - the real words only arrive when they build.
  const previewResume = useMemo<ResumeData>(() => {
    const text = (key: string) => {
      const value = profile?.preferences?.[key];
      return typeof value === "string" ? value.trim() : "";
    };
    const name = text("fullName");
    const city = text("city");
    const sample = track === "student" ? STUDENT_SAMPLE : SAMPLE_RESUME;
    return {
      ...sample,
      header: {
        name: name || sample.header.name,
        city: city || sample.header.city,
        // Their real address only appears on the built resume, so the preview
        // wears an obviously-generic one rather than a stranger's.
        email: name ? "your.email@example.com" : sample.header.email,
      },
    };
  }, [profile, track]);

  // Every path that would write a resume passes through here, which makes it
  // the one place the account is asked for. Signed out, the answer is a prompt
  // that keeps the page and the entered details intact - not a redirect that
  // throws the work away and returns them to a blank form.
  async function withToken(): Promise<string | null> {
    const { data } = await supabaseBrowser().auth.getSession();
    const token = data.session?.access_token ?? null;
    if (!token) {
      setGate({
        what: "your resume",
        why: "Writing it takes a couple of minutes of an AI's time and produces a document that is yours - so it needs an account to belong to, and to be waiting for you when you come back to change it.",
      });
    }
    return token;
  }

  const [gate, setGate] = useState<GatedAction | null>(null);

  const chosenRole = () => (targeted ? roleInput.trim() : "");

  // A general resume has no role to name, so the button cannot wait for one -
  // but a ticked box with an empty field is a question still open.
  // A resume cannot be written until we know which kind of person it is for.
  // Both questions on the left, actually answered by them. The first has
  // always had a default, and the second is filled in from the profile when
  // it knows - so neither being set proves anybody chose it.
  const chosen = picked && Boolean(track);
  const readyToBuild =
    chosen &&
    (making === "general" ||
      (making === "role" && Boolean(roleInput.trim())) ||
      (making === "improve" && upload !== null));

  const asText = (key: string) => {
    const value = profile?.preferences?.[key];
    return typeof value === "string" ? value.trim() : "";
  };
  // Two things a truthful resume cannot be written without.
  const needsEssentials = !asText("fullName") || profileSkills.length === 0;

  // Saved straight into the record the profile page reads, so these answers
  // show up there and are never asked for twice.
  async function saveEssentials(values: Record<string, string>) {
    setBusy("checking");
    setError(null);
    const token = await withToken();
    if (!token) return;
    const prefs = profile?.preferences ?? {};
    const typed = (key: string) => (values[key] ?? "").trim();
    const merged: Record<string, unknown> = { ...prefs };
    for (const field of ESSENTIALS) {
      const value = typed(field.key);
      if (!value) continue;
      merged[field.key] =
        field.key === "skills"
          ? [...profileSkills, ...splitList(value)]
              .filter(
                (s, i, all) =>
                  all.findIndex((o) => o.toLowerCase() === s.toLowerCase()) ===
                  i,
              )
              .join(", ")
          : value;
    }
    const saved = await saveResumeProfile(token, {
      education: profile?.education ?? [],
      experience: profile?.experience ?? [],
      projects: profile?.projects ?? [],
      achievements: profile?.achievements ?? [],
      preferences: merged,
    });
    setBusy(null);
    if (!saved) {
      setError("Those details didn't save. Give it another try.");
      return;
    }
    setProfile(saved);
    setEssentialsOpen(false);
    // Straight on with what they asked for - the build. runBuild is called
    // rather than begin so the just-saved details are not re-requested from
    // a stale closure.
    await runBuild();
  }

  // The role line on the preview follows whatever they are aiming at now.
  // The posting, offered wherever a role has been named. Behind a line of
  // its own: most people do not have one to hand, and an empty three-row box
  // on every visit pushes the build button off a laptop screen.
  const jobPostingField =
    showJd || jdInput ? (
      <label className="block">
        <span className="text-[0.78rem] font-semibold text-slate-800">
          Job posting
        </span>
        <span className="block text-[0.7rem] text-slate-400">
          Paste it and the resume speaks its language.
        </span>
        <textarea
          rows={3}
          value={jdInput}
          onChange={(e) => setJdInput(e.target.value)}
          autoFocus
          className="mt-1 w-full resize-y rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.85rem] outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20"
        />
      </label>
    ) : (
      <button
        type="button"
        onClick={() => setShowJd(true)}
        className="inline-flex min-h-11 cursor-pointer items-center text-[0.78rem] font-semibold text-slate-600 underline underline-offset-2 transition-colors hover:text-brand-ink"
      >
        Paste the job posting (optional)
      </button>
    );

  const previewRole = targeted
    ? roleInput.trim() || "The role you are aiming at"
    : "Written for whoever reads it";

  async function readExisting(file: File) {
    setError(null);
    setUploading(true);
    const token = await withToken();
    if (!token) {
      setUploading(false);
      return;
    }
    const read = await readResumeUpload(token, file);
    setUploading(false);
    if (!read.ok) {
      setError(read.error);
      return;
    }
    setUpload({
      filename: read.filename,
      text: read.text,
      read: read.read,
      parsed: read.parsed,
    });
  }

  async function begin() {
    if (!readyToBuild) return;
    setError(null);
    // The account comes before the form.
    //
    // Signed out there is no record at all, so needsEssentials is always true
    // and the essentials dialog fired first - asking somebody to type in their
    // name and skills for a document we were never going to write for them.
    // Ask for the thing that is actually missing.
    const token = await withToken();
    if (!token) return;
    // The record has to hold something true before a resume can be written -
    // but that ask belongs here, at the moment of building, not as a gate on
    // the door.
    if (needsEssentials) {
      setEssentialsOpen(true);
      return;
    }
    void runBuild();
  }

  /**
   * What this build is, in one place. Every path that builds - straight
   * through, after the essentials, after the gap questions - sends this.
   * Assembling it twice is how a general resume once arrived at the server
   * as a resume with no role and no explanation, and was refused.
   */
  function buildBody() {
    return {
      targetRole: chosenRole(),
      ...(general ? { general: true } : {}),
      ...(upload ? { existingResume: upload.text } : {}),
      ...(upload?.parsed ? { existingParsed: upload.parsed } : {}),
      ...(targeted && jdInput.trim() ? { jobDescription: jdInput.trim() } : {}),
    };
  }

  async function runBuild() {
    const targetRole = chosenRole();
    if (!targetRole && !general) return;
    setError(null);
    setBusy("checking");
    const token = await withToken();
    if (!token) return;
    // Where they are is a fact about their life, not a setting for this
    // build - so it goes into the record the profile page reads.
    if (track && track !== savedTrack) {
      const saved = await saveResumeProfile(token, {
        education: profile?.education ?? [],
        experience: profile?.experience ?? [],
        projects: profile?.projects ?? [],
        achievements: profile?.achievements ?? [],
        preferences: { ...(profile?.preferences ?? {}), track },
      });
      if (saved) setProfile(saved);
    }
    const body = buildBody();
    const check = await resumeGapCheck(token, body);
    if (!check) {
      setBusy(null);
      setError("Something went wrong just then. Give it another try.");
      return;
    }
    trackEvent({
      family: "decision",
      event: "resume_target_confirmed",
      module: "resume",
      target: targetRole || "no particular role",
      meta: {
        locked: targeted && roleInput.trim() === lockedRole?.title,
        gaps: check.missing.length,
        general,
        fromUpload: Boolean(upload),
      },
    });
    if (check.missing.length > 0) {
      setBusy(null);
      setGap(check);
      return;
    }
    await build(token, body);
  }

  async function build(
    token: string,
    body: {
      targetRole: string;
      jobDescription?: string;
      general?: boolean;
      existingResume?: string;
    },
  ) {
    setBusy("building");
    // The chosen template rides along so the ledger entry remembers the look
    // this resume was built in.
    const generated = await generateResume(token, { ...body, template });
    setBusy(null);
    if (!generated) {
      setError(
        "The draft didn't come back this time. Nothing was lost - try again.",
      );
      return;
    }
    setResult({ resume: generated.resume, targetRole: generated.targetRole });
    setAts(generated.ats ?? null);
    setShowFeedback(false);
    trackEvent({
      family: "engagement",
      event: "resume_generated",
      module: "resume",
      target: generated.targetRole,
      meta: { keywordsUsed: generated.resume.keywordsUsed.length },
    });
  }

  // The examples cycle only while the box is empty and untouched, and not at
  // all for someone who asked for less motion.
  useEffect(() => {
    if (!result || comment.trim() || revising) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(
      () => setExampleIndex((i) => (i + 1) % SCRIBE_EXAMPLES.length),
      3200,
    );
    return () => clearInterval(id);
  }, [result, comment, revising]);

  // A menu that will not go away is a trap: a click anywhere else, or Escape,
  // closes the download menu.
  useEffect(() => {
    if (!exportOpen) return;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      if (!exportRef.current?.contains(e.target as Node)) setExportOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExportOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [exportOpen]);

  // One revision, in the person's own words. The reply always carries a valid
  // resume, so the page can simply take what comes back; anything Scribe
  // would not do comes back as a plain sentence rather than an error.
  async function reviseResume() {
    const ask = comment.trim();
    if (!ask || !result) return;
    setRevising(true);
    setError(null);
    const token = await withToken();
    if (!token) {
      setRevising(false);
      return;
    }
    const before = result.resume;
    const revised = await refineResume(token, {
      resume: before,
      comment: ask,
      targetRole: result.targetRole,
      // The thread so far, so Scribe can answer a follow-up in context.
      history: revisions.slice(-6).map((r) => ({ ask: r.ask, reply: r.reply })),
    });
    setRevising(false);
    if (!revised) {
      setError("That revision didn't go through. Your resume is unchanged.");
      return;
    }
    const didChange = JSON.stringify(revised.resume) !== JSON.stringify(before);
    setResult({ resume: revised.resume, targetRole: result.targetRole });
    // Anything the person asserted in their instruction is written to their
    // record, so the resume stays backed by the record and the claim is
    // theirs on the profile page too.
    if (revised.added.length > 0) void keepClaims(token, revised.added);
    setRevisions((list) => [
      ...list,
      {
        ask,
        reply: revised.reply,
        changed: revised.changed,
        didChange,
        added: revised.added,
        ...(revised.followUp ? { followUp: revised.followUp } : {}),
        declined: revised.declined,
        before,
      },
    ]);
    setComment("");
    trackEvent({
      family: "engagement",
      event: "resume_revised",
      module: "resume",
      target: result.targetRole,
      meta: { declined: Boolean(revised.declined) },
    });
    // Any read-back already written belongs to an older draft of this page.
    setReview(null);
  }

  // What they told Scribe is now part of their record: kept as their own
  // claims, so nothing on the resume is unbacked and the profile page sees it.
  async function keepClaims(token: string, claims: string[]) {
    const prefs = profile?.preferences ?? {};
    const previous = Array.isArray(prefs["resumeClaims"])
      ? (prefs["resumeClaims"] as string[])
      : [];
    const merged = [...previous, ...claims].filter(
      (claim, i, all) =>
        all.findIndex((o) => o.toLowerCase() === claim.toLowerCase()) === i,
    );
    const saved = await saveResumeProfile(token, {
      education: profile?.education ?? [],
      experience: profile?.experience ?? [],
      projects: profile?.projects ?? [],
      achievements: profile?.achievements ?? [],
      preferences: { ...prefs, resumeClaims: merged.slice(0, 40) },
    });
    if (saved) setProfile(saved);
  }

  // Put one revision back: the resume returns to how it read before that
  // instruction, and the entry leaves the log with it.
  function undoRevision(index: number) {
    const entry = revisions[index];
    if (!entry || !result) return;
    setResult({ resume: entry.before, targetRole: result.targetRole });
    setRevisions((list) => list.filter((_, i) => i !== index));
  }

  // The second read: what this resume already does, what it is still missing,
  // and the one thing that would improve it most. It runs after the draft is
  // on screen, so a slow read never delays the resume itself.
  async function readItBack(
    token: string,
    resume: ResumeData,
    targetRole: string,
  ): Promise<ResumeReview | null> {
    setReview(null);
    setReviewing(true);
    const read = await reviewResume(token, {
      resume,
      targetRole,
      ...(general ? { general: true } : {}),
      ...(targeted && jdInput.trim() ? { jobDescription: jdInput.trim() } : {}),
    });
    setReviewing(false);
    if (!read) return null;
    setReview(read.review);
    return read.review;
  }

  // The popup's answers are saved into the record first (preferences
  // .resumeExtras; confirmed new skills merge into preferences.skills), so
  // the generation - and everything after it - draws from the record, not
  // from this screen's memory.
  async function submitGaps(
    answers: Record<string, string>,
    newSkills: string[],
  ) {
    if (!gap) return;
    setError(null);
    setBusy("building");
    const token = await withToken();
    if (!token) return;
    const prefs = profile?.preferences ?? {};
    const previous =
      prefs["resumeExtras"] && typeof prefs["resumeExtras"] === "object"
        ? (prefs["resumeExtras"] as Record<string, unknown>)
        : {};
    const mergedSkills = [
      ...profileSkills,
      ...newSkills.filter(
        (s) => !profileSkills.some((k) => k.toLowerCase() === s.toLowerCase()),
      ),
    ];
    const saved = await saveResumeProfile(token, {
      education: profile?.education ?? [],
      experience: profile?.experience ?? [],
      projects: profile?.projects ?? [],
      achievements: profile?.achievements ?? [],
      preferences: {
        ...prefs,
        skills: mergedSkills.join(", "),
        resumeExtras: { ...previous, ...answers },
      },
    });
    if (!saved) {
      setBusy(null);
      setError("Your answers didn't save. Give it another try.");
      return;
    }
    setGap(null);
    await build(token, buildBody());
  }

  async function downloadWord() {
    if (!result) return;
    setDownloading(true);
    const token = await withToken();
    if (!token) return;
    const blob = await downloadResumeDocx(
      token,
      result.resume,
      exportTemplate(template),
      result.targetRole,
    );
    setDownloading(false);
    if (!blob) {
      setError("The Word file didn't come through. Try the download again.");
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.resume.header.name.replace(/\s+/g, "-").toLowerCase() || "resume"}-resume.docx`;
    a.click();
    URL.revokeObjectURL(url);
    handOverToFeedback(token);
  }

  // Their resume is on their machine; now the honest part. The read-back runs
  // here rather than beside the draft, so nothing argues with the document
  // while they are still writing it.
  function handOverToFeedback(token: string) {
    if (!result) return;
    const taken = result;
    setShowFeedback(true);
    window.scrollTo({ top: 0 });
    void (async () => {
      const read =
        review ?? (await readItBack(token, taken.resume, taken.targetRole));
      await keepDownloaded(token, taken, read);
    })();
  }

  // The downloaded version and its read-out are stored together, so opening
  // this resume again shows the page they actually took and the feedback
  // they were given on it - not a newer draft, and not a blank.
  async function keepDownloaded(
    token: string,
    taken: { resume: ResumeData; targetRole: string },
    read: ResumeReview | null,
  ) {
    const prefs = profile?.preferences ?? {};
    const raw = Array.isArray(prefs["resumeLedger"])
      ? [...(prefs["resumeLedger"] as LedgerEntry[])]
      : [];
    // The newest entry for this role is the build they have been working on.
    const index = raw.map((e) => e?.role).lastIndexOf(taken.targetRole);
    const entry: LedgerEntry = {
      ...(index >= 0 ? raw[index] : {}),
      role: taken.targetRole,
      at:
        index >= 0
          ? (raw[index]?.at ?? new Date().toISOString())
          : new Date().toISOString(),
      skillsHighlighted:
        (index >= 0 ? raw[index]?.skillsHighlighted : undefined) ??
        taken.resume.skills.flatMap((group) => group.items).slice(0, 30),
      resume: taken.resume,
      template,
      downloadedAt: new Date().toISOString(),
      ...(read ? { review: read } : {}),
    };
    if (index >= 0) raw[index] = entry;
    else raw.push(entry);
    const saved = await saveResumeProfile(token, {
      education: profile?.education ?? [],
      experience: profile?.experience ?? [],
      projects: profile?.projects ?? [],
      achievements: profile?.achievements ?? [],
      preferences: { ...prefs, resumeLedger: raw.slice(-20) },
    });
    if (saved) setProfile(saved);
  }

  // Rendered inside the workbench rail before a build, and under the sheet
  // after one - so it is reachable either way without lengthening the page.
  const ledgerSection = ledger.length > 0 && (
    <section className="rounded-2xl border border-slate-200 bg-surface p-4">
      <h2 className="text-[0.95rem] font-semibold tracking-tight text-brand-ink">
        Your previous resumes
      </h2>
      <p className="mt-1 text-[0.76rem] leading-relaxed text-slate-500">
        Every resume you build is kept here. Come back to any of them, or build
        a fresh one whenever something changes.
      </p>
      <div className="mt-2.5 grid gap-2">
        {ledger.map((entry, i) => (
          <div
            key={`${entry.at}-${i}`}
            className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-2xl border border-slate-200 bg-surface px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.9rem] font-semibold text-brand-ink">
                {entry.role}
                {/* Which of these actually went out into the world. */}
                <span
                  className={`rounded-full px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide ${
                    entry.downloadedAt
                      ? "bg-teal-50 text-teal-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {entry.downloadedAt ? "Downloaded" : "Draft"}
                </span>
              </p>
              <p className="text-[0.72rem] text-slate-400">
                {entry.downloadedAt
                  ? `Downloaded ${whenLabel(entry.downloadedAt)}`
                  : `Built ${whenLabel(entry.at)}`}
              </p>
            </div>
            {entry.resume && (
              <button
                type="button"
                onClick={() => {
                  const past = entry.resume!;
                  setResult({ resume: past, targetRole: entry.role });
                  // Re-render the look it was built in; entries from
                  // before templates existed fall back to classic.
                  setTemplate(asTemplate(entry.template));
                  setRevisions([]);
                  setReview(entry.review ?? null);
                  setShowFeedback(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="shrink-0 rounded-lg bg-brand-teal-deep px-3.5 py-2 text-[0.78rem] font-bold text-white transition-colors hover:bg-brand-teal"
              >
                View and download
              </button>
            )}

            {/* The read-out they were given when they downloaded this
                    one, kept with it. Folded away - it is history, not
                    something to answer now. */}
            {entry.review && (
              <details className="group w-full border-t border-slate-200 pt-2.5">
                <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1.5 text-[0.78rem] font-semibold text-slate-500 [&::-webkit-details-marker]:hidden">
                  The feedback you were given
                  <span
                    aria-hidden
                    className="transition-transform group-open:rotate-180"
                  >
                    ▾
                  </span>
                </summary>
                <div className="mt-2 grid gap-2">
                  <p className="text-[0.82rem] font-semibold text-brand-ink">
                    {standingLabel(
                      entry.review.standing.level,
                      entry.role === "No particular role" ? "" : entry.role,
                    )}
                  </p>
                  <p className="text-[0.8rem] leading-relaxed text-slate-600">
                    {entry.review.standing.why}
                  </p>
                  {entry.review.gaps.length > 0 && (
                    <ul className="grid gap-1.5">
                      {entry.review.gaps.map((gapItem) => (
                        <li
                          key={gapItem.what}
                          className="text-[0.8rem] leading-relaxed text-slate-600"
                        >
                          <span className="font-semibold text-brand-ink">
                            {gapItem.what}
                          </span>{" "}
                          {gapItem.how}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link
                    href={
                      NEXT_STEP_HREF[
                        entry.review.nextStep?.route ?? "readiness"
                      ] ?? "/practice"
                    }
                    className="inline-flex min-h-11 items-center text-[0.8rem] font-semibold text-teal-700 underline underline-offset-2"
                  >
                    {NEXT_STEP_LABEL[
                      entry.review.nextStep?.route ?? "readiness"
                    ] ?? "Prove these skills →"}
                  </Link>
                </div>
              </details>
            )}
          </div>
        ))}
      </div>
    </section>
  );

  // Whether this draft may leave. The same rules run on the server; this is
  // so the button can explain itself before it is pressed.
  const completeness = result
    ? resumeCompleteness(result.resume)
    : { ready: false, missing: [] };

  // ---- The read-out, after the download ----
  //
  // Their resume is on their machine and cannot be changed by anything said
  // here - so this is the moment for the honest read. It is a page of its
  // own, the way the interview read-out is, and it ends with the one thing
  // worth doing next.
  if (result && showFeedback) {
    const step = review?.nextStep;
    // The nearest published role to what this person has actually done. Only
    // ever present on a resume with no role of its own.
    const closestRole = review?.roleIdeas?.[0] ?? null;
    return (
      <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-6 sm:px-6">
        <header>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-violet-deep">
            Honest feedback
          </p>
          <h1 className="mt-1 text-2xl font-bold text-brand-ink">
            {result.targetRole
              ? `Your ${result.targetRole} resume is downloaded`
              : "Your resume is downloaded"}
          </h1>
          <p className="mt-2 text-[0.88rem] leading-relaxed text-slate-600">
            {reviewing
              ? "Someone is reading it now, the way a recruiter would - one moment."
              : result.targetRole
                ? "Here is how it reads against what this role usually asks for - said plainly, because you can still do something about it."
                : "Here is how it reads to someone hiring - said plainly, because you can still do something about it."}
          </p>
        </header>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-surface p-5">
          {reviewing ? (
            <ReviewProgress />
          ) : !review ? (
            <div>
              <p className="text-[0.88rem] leading-relaxed text-slate-600">
                I could not read your resume back just now. Your download is
                safe - this is only the feedback on it.
              </p>
              <button
                type="button"
                onClick={() => {
                  void withToken().then((token) => {
                    if (token)
                      void readItBack(token, result.resume, result.targetRole);
                  });
                }}
                className="mt-3 inline-flex min-h-11 items-center rounded-full bg-brand-teal-deep px-5 text-sm font-bold text-white transition-colors hover:bg-brand-teal"
              >
                Try again
              </button>
            </div>
          ) : (
            <>
              <p className="text-[1rem] font-semibold leading-relaxed text-brand-ink">
                {standingLabel(review.standing.level, result.targetRole)}
              </p>
              <p className="mt-1.5 text-[0.88rem] leading-relaxed text-slate-600">
                {review.standing.why}
              </p>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-[0.7rem] font-bold uppercase tracking-wide text-teal-700">
                    What it already does
                  </p>
                  <ul className="mt-2 grid gap-1.5">
                    {review.strengths.map((point) => (
                      <li
                        key={point}
                        className="text-[0.85rem] leading-relaxed text-slate-700"
                      >
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[0.7rem] font-bold uppercase tracking-wide text-amber-700">
                    What would make it stand out
                  </p>
                  <ul className="mt-2 grid gap-2.5">
                    {review.gaps.map((gapItem) => (
                      <li
                        key={gapItem.what}
                        className="text-[0.85rem] leading-relaxed"
                      >
                        <span className="font-semibold text-brand-ink">
                          {gapItem.what}
                        </span>{" "}
                        <span className="text-slate-600">{gapItem.how}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {review.coverage.missing.length > 0 && (
                <p className="mt-4 text-[0.8rem] leading-relaxed text-slate-500">
                  Words this role is screened for that your resume cannot
                  honestly carry yet:{" "}
                  <span className="text-slate-600">
                    {review.coverage.missing.join(", ")}
                  </span>
                </p>
              )}
            </>
          )}
        </section>

        {/* No role was named, so the read looked at what they have actually
            done and names a couple of directions it points at. Curiosity, not
            a verdict: a resume is not enough to recommend a career on, and
            saying so is what makes the rest of this worth trusting. */}
        {review && (review.roleIdeas?.length ?? 0) > 0 && (
          <section className="mt-4 rounded-2xl border border-slate-200 bg-surface p-5">
            <p className="text-[0.7rem] font-bold uppercase tracking-wide text-brand-violet-deep">
              Where this record points
            </p>
            <p className="mt-1.5 text-[0.85rem] leading-relaxed text-slate-600">
              You did not aim this at a role, so we read what you have already
              done. These are the directions it leans towards - not a verdict on
              you.
            </p>
            <ul className="mt-3 grid gap-2.5">
              {review.roleIdeas?.map((idea) => (
                <li key={idea.role} className="text-[0.86rem] leading-relaxed">
                  <span className="font-semibold text-brand-ink">
                    {idea.role}
                  </span>{" "}
                  <span className="text-slate-600">{idea.why}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[0.82rem] leading-relaxed text-slate-500">
              A real recommendation comes from what you choose, not from what a
              document happens to mention -{" "}
              <Link
                href="/discover"
                className="font-semibold text-brand-violet-deep underline underline-offset-2"
              >
                that is what Discovery is for
              </Link>
              .
            </p>
          </section>
        )}

        {review && (
          <section className="mt-4 rounded-2xl border border-brand-violet/30 bg-violet-50 p-5">
            <p className="text-[0.7rem] font-bold uppercase tracking-wide text-brand-violet-deep">
              What would move it most
            </p>
            {/* A resume with no role has a different best next thing: not a
                generic "prove your skills", but the role their own record
                already leans towards, and the check that would let their
                next resume say they were scored on it rather than that they
                can do it. */}
            {!result.targetRole && closestRole ? (
              <>
                <p className="mt-1.5 text-[0.88rem] leading-relaxed text-slate-700">
                  Of the roles we publish,{" "}
                  <strong className="font-semibold text-brand-ink">
                    {closestRole.role}
                  </strong>{" "}
                  is the closest to what you have already done.{" "}
                  {closestRole.why}
                </p>
                <p className="mt-2 text-[0.88rem] leading-relaxed text-slate-700">
                  The readiness assessment shows where you actually stand
                  against what that role asks for, and names what to work on.
                  Nothing goes on the resume - it tells you what would make the
                  next version of it stronger.
                </p>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  <Link
                    href="/practice"
                    className="inline-flex min-h-12 items-center rounded-full bg-brand-teal-deep px-6 text-sm font-bold text-white transition-colors hover:bg-brand-teal"
                  >
                    Check my readiness for {closestRole.role} →
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMaking("role");
                      setRoleInput(closestRole.role);
                      setShowFeedback(false);
                      setResult(null);
                      setReview(null);
                      window.scrollTo({ top: 0 });
                    }}
                    className="inline-flex min-h-12 cursor-pointer items-center rounded-full border border-slate-300 px-5 text-sm font-bold text-slate-700 transition-colors hover:border-slate-400 hover:text-brand-ink"
                  >
                    Or build this one for {closestRole.role}
                  </button>
                </div>
              </>
            ) : !result.targetRole ? (
              // No role named, and nothing we publish is close to what they
              // have done. Naming one anyway would be the invented match this
              // whole product refuses to make.
              <>
                <p className="mt-1.5 text-[0.88rem] leading-relaxed text-slate-700">
                  {step?.why ??
                    "The surest way to strengthen this resume is to make what you have already done more specific."}
                </p>
                <p className="mt-2 text-[0.88rem] leading-relaxed text-slate-700">
                  We could not match this to one of the roles we publish today -
                  what you have done sits outside them, and pointing you at a
                  near-enough role would help nobody. Discovery works from what
                  you choose rather than from what a document mentions, and it
                  is where a direction worth aiming at comes from.
                </p>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  <Link
                    href="/discover"
                    className="inline-flex min-h-12 items-center rounded-full bg-brand-teal-deep px-6 text-sm font-bold text-white transition-colors hover:bg-brand-teal"
                  >
                    Find the role that fits →
                  </Link>
                  <Link
                    href={
                      NEXT_STEP_HREF[step?.route ?? "practice"] ?? "/practice"
                    }
                    className="inline-flex min-h-12 items-center rounded-full border border-slate-300 px-5 text-sm font-bold text-slate-700 transition-colors hover:border-slate-400 hover:text-brand-ink"
                  >
                    {NEXT_STEP_LABEL[step?.route ?? "practice"] ??
                      "Do the real work →"}
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="mt-1.5 text-[0.88rem] leading-relaxed text-slate-700">
                  {step?.why ??
                    "The surest way to strengthen this resume is to prove the skills on it."}
                </p>
                <Link
                  href={
                    NEXT_STEP_HREF[step?.route ?? "readiness"] ?? "/practice"
                  }
                  className="mt-3 inline-flex min-h-12 items-center rounded-full bg-brand-teal-deep px-6 text-sm font-bold text-white transition-colors hover:bg-brand-teal"
                >
                  {NEXT_STEP_LABEL[step?.route ?? "readiness"] ??
                    "Prove these skills →"}
                </Link>
              </>
            )}
          </section>
        )}

        <button
          type="button"
          onClick={() => setShowFeedback(false)}
          className="mt-5 min-h-11 text-[0.85rem] font-semibold text-slate-500 underline underline-offset-2 transition-colors hover:text-brand-ink"
        >
          Back to my resume
        </button>
      </main>
    );
  }

  return (
    <main
      className={`mx-auto w-full px-4 sm:px-6 ${
        // The workbench holds itself to one screen on a laptop - the rail
        // scrolls inside rather than the whole page growing. The finished
        // resume is a document, so it reads in a single narrow column.
        result ? "max-w-5xl pb-16" : "max-w-[72rem] pb-10"
      }`}
    >
      {/* Print shows the resume sheet alone: no app chrome, no controls. */}
      <style>{`@page { size: A4; margin: 0; }
      @media print {
        body * { visibility: hidden; }
        #resume-sheet, #resume-sheet * { visibility: visible; }
        #resume-sheet {
          position: absolute; inset: 0; margin: 0;
          width: 210mm; min-height: 297mm; height: auto;
          background: #ffffff; color: #111827;
          border: 0; box-shadow: none; border-radius: 0;
        }
        /* A heading marooned at the foot of a page, or two lines of a job
           split across the fold, is how a good resume reads badly. */
        #resume-sheet section { break-inside: avoid; }
        #resume-sheet h3 { break-after: avoid; }
        /* The screen pushes blocks clear of the fold itself; on paper the
           printer does it, and the pushes would only leave gaps. */
        #resume-sheet [data-pushed] { padding-top: 0 !important; }
      }`}</style>

      <div className="pt-4 print:hidden">
        {/* On the draft, back means the builder - the screen this draft came
            from - not the homepage two steps up. */}
        {result ? (
          <button
            type="button"
            onClick={() => {
              setResult(null);
              setError(null);
            }}
            className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-[0.85rem] font-semibold text-slate-500 transition-colors hover:text-brand-ink motion-reduce:transition-none"
          >
            <span aria-hidden>{"\u2190"}</span> Back to the builder
          </button>
        ) : (
          <BackLink
            fallbackHref="/resume"
            fallbackLabel="Back to Professional Presence"
          />
        )}
      </div>

      {!result && (
        <>
          <header className="mt-4">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-brand-ink">
                {pane === "keep" ? "Your resumes" : "Build your resume"}
              </h1>
              {/* Out of the page's flow: a control on one line, and a panel
                  that slides over. The shelf used to be a column beside the
                  workbench, which took the width out of a layout that was
                  already two columns and pushed the live page off screen. */}
              {ledger.length > 0 && (
                <WorkShelf
                  make={{
                    label: "Build a resume",
                    sub: "A new one, for any role",
                  }}
                  keep={{
                    label: "Your resumes",
                    sub: `Newest built ${whenLabel(ledger[0]!.at)}`,
                    count: ledger.length,
                  }}
                  at={pane}
                  onPick={setPane}
                />
              )}
            </div>
            <p className="mt-1.5 max-w-prose text-[0.88rem] leading-relaxed text-slate-600">
              {/* Two sentences. The original said the same thing three ways -
                  software first, a person second, holds up when a recruiter
                  looks - and "the three looks" is our word for templates, and
                  wrong the moment there are more of them. */}
              Most applications are read by screening software before a
              recruiter sees them, so we write yours for both: from what you
              have actually done, in the words the role is screened on.
              {needsEssentials
                ? " Look through the templates first. We only ask about you when you are ready to build."
                : ""}
            </p>
          </header>

          {/* The workbench: everything you can change on the left, the page
              you are about to make on the right, so the look is settled
              before a build is spent on it. On a laptop the rail scrolls
              inside the screen rather than the page growing past it. */}
          {/* The reserve covers the app header, the back link and this page's
              own heading, so the rail's button always lands above the fold. */}
          {/* Two columns sized to their contents - the choices stacked on the
              left, the page beside them - so no empty gutter opens up
              between them on a wide screen. */}
          {pane === "keep" && ledger.length > 0 ? (
            <div className="mt-4">{ledgerSection}</div>
          ) : (
            <div className="mt-4 grid gap-5 lg:h-[calc(100dvh-15.5rem)] lg:grid-cols-[minmax(0,1fr)_28rem]">
              {/* The rail scrolls, the button does not: whatever is in the
                record above it, the one action stays on screen. */}
              <div className="grid gap-3 lg:min-h-0 lg:grid-rows-[minmax(0,1fr)_auto]">
                <div className="grid content-start gap-3 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
                  {/* One question, in the order most people actually stand in:
                  a resume by default, aimed at a role only if they say so.
                  Somebody who chose a direction in Discovery has already
                  said so, which is why theirs opens ticked. */}
                  {/* Numbered, because three decisions in one unlabelled card
                  reads as a form; numbered it reads as a short sequence with
                  an end in sight. */}
                  <section className="rounded-2xl border border-slate-200 bg-surface p-4">
                    <h2 className="text-[0.95rem] font-semibold text-brand-ink">
                      What are we building?
                    </h2>

                    {/* One question, one control. The three ways to use this are
                    equals and are named as such - a general resume was the
                    absence of a tick before, and the upload hid inside a link
                    doing a second job. */}
                    <div className="mt-2.5">
                      <Picker
                        label="What are we building?"
                        value={making}
                        options={MAKING_OPTIONS}
                        onChange={chooseMaking}
                        placeholder={picked ? undefined : "Choose one to begin"}
                      />
                    </div>

                    {/* Always shown, already answered when the profile knows -
                    a choice they can see and change beats a sentence about a
                    setting made somewhere else. */}
                    <fieldset className="mt-4 border-t border-slate-200 pt-3.5">
                      <legend className="text-[0.85rem] font-semibold text-brand-ink">
                        Where are you right now?
                      </legend>
                      <p className="mt-0.5 text-[0.72rem] leading-relaxed text-slate-500">
                        A student&rsquo;s resume leads with education and
                        projects; a working person&rsquo;s leads with the job.
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {[
                          {
                            id: "student" as const,
                            label: "Still studying",
                          },
                          {
                            id: "early_career" as const,
                            label: "Working, or have worked",
                          },
                        ].map((option) => {
                          const on = track === option.id;
                          return (
                            <label
                              key={option.id}
                              className={`inline-flex min-h-11 cursor-pointer items-center rounded-lg border-2 px-4 text-[0.82rem] font-bold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-teal/40 ${
                                on
                                  ? "border-brand-teal-deep bg-brand-teal-deep text-white"
                                  : "border-slate-200 text-slate-600 hover:border-slate-300"
                              }`}
                            >
                              <input
                                type="radio"
                                name="resume-track"
                                value={option.id}
                                checked={on}
                                onChange={() => setTrack(option.id)}
                                className="sr-only"
                              />
                              {option.label}
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>

                    {making === "general" && (
                      <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[0.76rem] leading-relaxed text-slate-600">
                        We lead with your strongest evidence rather than a
                        role&rsquo;s words. Aimed at a role it will always land
                        harder - and you can build that version from the same
                        record in two minutes.
                      </p>
                    )}

                    {making === "improve" && (
                      <div className="mt-4 border-t border-slate-200 pt-3.5">
                        <p className="mb-2 text-[0.85rem] font-semibold text-brand-ink">
                          Your resume
                        </p>
                        {upload ? (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="min-w-0 text-[0.8rem] text-slate-600">
                                Working from{" "}
                                <span className="font-semibold text-brand-ink">
                                  {upload.filename}
                                </span>
                              </p>
                              <button
                                type="button"
                                onClick={() => setUpload(null)}
                                className="min-h-11 cursor-pointer text-[0.78rem] font-semibold text-slate-500 underline underline-offset-2 transition-colors hover:text-slate-800"
                              >
                                Remove
                              </button>
                            </div>
                            <p className="mt-1 text-[0.72rem] leading-relaxed text-slate-500">
                              {uploadRead(upload.read)} We keep what you wrote
                              and work on how it reads - nothing is added that
                              your resume and your record do not already hold.
                            </p>
                          </div>
                        ) : (
                          <>
                            <input
                              ref={fileRef}
                              type="file"
                              accept=".pdf,.docx,.doc,.txt,.md"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                e.target.value = "";
                                if (file) void readExisting(file);
                              }}
                            />
                            {/* A drop target as well as a button: most people
                            arrive with the file already in a window next to
                            this one. */}
                            <button
                              type="button"
                              disabled={uploading}
                              onClick={() => fileRef.current?.click()}
                              onDragOver={(e) => {
                                e.preventDefault();
                                setDragging(true);
                              }}
                              onDragLeave={() => setDragging(false)}
                              onDrop={(e) => {
                                e.preventDefault();
                                setDragging(false);
                                const file = e.dataTransfer.files?.[0];
                                if (file) void readExisting(file);
                              }}
                              className={`w-full cursor-pointer rounded-xl border border-dashed p-5 text-center transition-colors disabled:opacity-60 ${
                                dragging
                                  ? "border-brand-teal bg-brand-teal/10"
                                  : "border-slate-300 bg-slate-50 hover:border-slate-400"
                              }`}
                            >
                              <span
                                aria-hidden
                                className="mx-auto mb-2 block w-fit text-brand-teal-deep"
                              >
                                <UploadMark />
                              </span>
                              <span className="block text-[0.84rem] font-semibold text-brand-ink">
                                {uploading
                                  ? "Reading your resume…"
                                  : dragging
                                    ? "Drop it there"
                                    : "Drag and drop your resume or LinkedIn PDF here"}
                              </span>
                              <span className="mt-1 block text-[0.72rem] text-slate-500">
                                {uploading
                                  ? "This takes a few seconds."
                                  : "Or browse files. We read it, keep what you wrote, and say what is missing."}
                              </span>
                            </button>
                          </>
                        )}
                        {/* An uploaded resume can still be aimed, without a
                        second trip through the dropdown. */}
                        <label className="mt-3 block">
                          <span className="text-[0.78rem] font-semibold text-slate-800">
                            Aim it at a role (optional)
                          </span>
                          <input
                            value={roleInput}
                            onChange={(e) => setRoleInput(e.target.value)}
                            placeholder="Customer Support Executive"
                            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-surface px-3 text-[0.86rem] outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20"
                          />
                        </label>
                        {roleInput.trim() ? (
                          <div className="mt-3">{jobPostingField}</div>
                        ) : null}
                      </div>
                    )}

                    {making === "role" && (
                      <div className="mt-4 grid gap-3 border-t border-slate-200 pt-3.5">
                        <p className="text-[0.85rem] font-semibold text-brand-ink">
                          The role you are aiming at
                        </p>
                        <label className="block">
                          <span className="text-[0.78rem] font-semibold text-slate-800">
                            Target role
                          </span>
                          <input
                            value={roleInput}
                            onChange={(e) => setRoleInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                if (busy === null) void begin();
                              }
                            }}
                            placeholder="Customer Support Executive"
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.88rem] outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20"
                          />
                          {lockedRole &&
                            roleInput.trim() !== lockedRole.title && (
                              <button
                                type="button"
                                onClick={() => setRoleInput(lockedRole.title)}
                                className="mt-1.5 min-h-11 cursor-pointer text-[0.74rem] font-semibold text-slate-500 underline underline-offset-2 transition-colors hover:text-slate-800"
                              >
                                Use {lockedRole.title}, from your Discovery
                              </button>
                            )}
                          {lockedRole &&
                            roleInput.trim() === lockedRole.title &&
                            (target?.keywords.length ?? 0) > 0 && (
                              <span className="mt-1.5 block text-[0.72rem] leading-relaxed text-slate-500">
                                Words we&rsquo;ll weave in:{" "}
                                {target?.keywords.slice(0, 4).join(", ")}
                                {(target?.keywords.length ?? 0) > 4 &&
                                  ` and ${(target?.keywords.length ?? 0) - 4} more`}
                              </span>
                            )}
                        </label>
                        {jobPostingField}
                      </div>
                    )}
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-surface p-4">
                    <TemplatePicker
                      value={template}
                      onChange={setTemplate}
                      resume={previewResume}
                      roleLine={previewRole}
                      track={track ?? undefined}
                    />
                  </section>
                </div>

                {/* The one primary action, held at the foot of the rail - with
                  anything that went wrong right above it, where the person is
                  already looking. */}
                <div>
                  {error && (
                    <p
                      role="alert"
                      className="mb-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-[0.85rem] leading-relaxed text-rose-700"
                    >
                      {error}
                    </p>
                  )}
                  <button
                    type="button"
                    disabled={busy !== null || !readyToBuild}
                    onClick={() => void begin()}
                    className="inline-flex min-h-12 w-full max-w-sm items-center justify-center rounded-full bg-brand-teal-deep px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-teal disabled:opacity-50"
                  >
                    {busy === "checking"
                      ? "Getting your details together…"
                      : busy === "building"
                        ? "Building…"
                        : making === "improve"
                          ? "Work on my resume"
                          : "Build my resume"}
                  </button>
                </div>
              </div>

              {/* The paper, always in view. The panel hugs the page rather than
                stretching, so no dark gutter sits either side of it. */}
              <div className="min-w-0 lg:flex lg:min-h-0 lg:flex-col">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-t-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                  <p className="text-[0.74rem] font-semibold text-slate-600">
                    Preview · {TEMPLATES.find((t) => t.id === template)?.name}{" "}
                    look
                  </p>
                  <p className="text-[0.7rem] text-slate-400">
                    {chosen
                      ? "Sample content until you build"
                      : "Waiting for your answers"}
                  </p>
                </div>
                <div className="rounded-b-2xl border border-t-0 border-slate-200 bg-slate-100 p-2.5 sm:p-4 lg:min-h-0 lg:flex-1">
                  {/* Page-shaped, and scrollable: a resume longer than the box
                    can be read to the end rather than cropped. `zoom` rather
                    than a transform, because a transform leaves the layout at
                    full size and there is then nothing sane to scroll. */}
                  <div className="relative mx-auto aspect-[1/1.414] w-full max-w-md overflow-y-auto overscroll-contain rounded-lg bg-white shadow-sm lg:h-full lg:w-auto lg:max-w-none">
                    {/* Blurred until both questions are answered.
                      
                      An unblurred sample here is half a screen of somebody
                      else's resume, presented as though it were the thing
                      being made - which is most of why this page does not say
                      "start here" to a new person. Blurred and captioned, it
                      reads as what it is: the preview, waiting. */}
                    {!chosen && (
                      // Sticky, not absolute: this box scrolls, and an
                      // absolutely-positioned cover is only as tall as the
                      // frame - so the second page of the sample scrolled out
                      // from under it, unblurred. Sticky keeps the message on
                      // screen; the blur below is on the content itself, so
                      // it holds however far the sample is scrolled.
                      <div className="pointer-events-none sticky top-0 z-20 -mb-[100%] flex h-full items-center justify-center px-6 text-center">
                        <p className="rounded-xl bg-white/80 px-4 py-3 text-[0.8rem] font-semibold leading-relaxed text-slate-600 shadow-sm">
                          {picked
                            ? "Tell us where you are right now and your resume appears here."
                            : "Answer the two questions on the left and your resume appears here."}
                        </p>
                      </div>
                    )}
                    <div
                      className={
                        chosen
                          ? ""
                          : "pointer-events-none select-none blur-[3px]"
                      }
                    >
                      {/* Plain enough that nobody has to work out what it
                        means: this page shows the layout, not their content.
                        Sticky, so it stays with the page as it is scrolled. */}
                      <span
                        aria-hidden
                        className="pointer-events-none sticky top-1/3 z-10 flex -rotate-12 select-none items-center justify-center text-[clamp(1.5rem,6vw,2.3rem)] font-bold uppercase tracking-[0.3em] text-[#111827]/[0.09]"
                      >
                        Example
                      </span>
                      <A4Frame className="-mt-[2.6rem]">
                        <ResumeSheet
                          resume={previewResume}
                          template={template}
                          roleLine={previewRole}
                          track={track ?? undefined}
                          mini
                        />
                      </A4Frame>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {error && result && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-rose-50 px-3.5 py-2 text-[0.85rem] text-rose-700 print:hidden"
        >
          {error}
        </p>
      )}

      {result && (
        <>
          <header className="mt-6 print:hidden">
            <h1 className="text-2xl font-semibold tracking-tight text-brand-ink">
              Your resume for {result.targetRole}
            </h1>
            <p className="mt-1.5 max-w-prose text-[0.88rem] leading-relaxed text-slate-600">
              Read it through, tell Scribe anything you want changed, and take
              it away when it reads right.
            </p>
          </header>

          {/* The resume with its actions beside it: Download stays within
              reach of the page it downloads, however far you scroll. */}
          {/* The page on the left, everything you do with it on the right:
              the assistant, the download, and the ones you built before. A
              resume is read in a column and worked on beside it. */}
          <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-start">
            <div className="min-w-0">
              {/* A draft until they take it away. Screen-only: the print
                  stylesheet shows the sheet alone, and the Word export is
                  rendered server-side from the data, so neither carries it. */}
              <div className="relative">
                <A4Frame>
                  <ResumeSheet
                    resume={result.resume}
                    template={template}
                    roleLine={result.targetRole}
                    track={track ?? undefined}
                    onPages={setSheetPages}
                    watermark="Draft"
                  />
                </A4Frame>
              </div>

              {/* Said plainly, because two pages is a decision a recruiter
                  notices and nobody should learn about it at the printer. */}
              <p className="mt-2 text-[0.76rem] text-slate-500 print:hidden">
                {sheetPages === 1
                  ? "One A4 page."
                  : `${sheetPages} A4 pages - the second is part empty. Ask Scribe to tighten it if you would rather it fit one.`}
              </p>

              {/* The draft desk: the page above, then the conversation that
                  shapes it. Scribe - the resume writer - answers every
                  instruction, says when a change would weaken the resume, and
                  asks for the one detail that would make a line stronger
                  rather than inventing it. */}
            </div>

            <aside className="grid min-w-0 gap-4 print:hidden">
              <section className="mt-6 rounded-2xl border border-slate-200 bg-surface p-4 print:hidden sm:p-5">
                <h2 className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-brand-violet-deep">
                  Work on it with Scribe
                </h2>

                {revisions.length === 0 && !revising ? (
                  <p className="mt-2 text-[0.85rem] leading-relaxed text-slate-600">
                    I am Scribe. Tell me what to change in plain words - I will
                    do it, and say when a change would work against you.
                  </p>
                ) : null}

                {/* The thread grows inward, not downward: capped and
                    scrollable, so the download never drifts further away
                    with every message. Pinned to the latest exchange. */}
                <ol
                  ref={threadRef}
                  className="mt-3 grid max-h-[22rem] content-start gap-3 overflow-y-auto overscroll-contain pr-1"
                >
                  {revisions.map((rev, i) => (
                    <li key={`${rev.ask}-${i}`} className="grid gap-2">
                      <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-teal-50 px-3.5 py-2.5 text-[0.84rem] leading-relaxed text-teal-900">
                        {rev.ask}
                      </p>
                      <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-slate-200 bg-surface px-3.5 py-2.5">
                        <p className="text-[0.84rem] leading-relaxed text-slate-700">
                          {rev.reply}
                        </p>
                        {rev.declined && rev.declined !== rev.reply && (
                          <p className="mt-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[0.78rem] leading-relaxed text-amber-900">
                            {rev.declined}
                          </p>
                        )}
                        {rev.added.length > 0 && (
                          <p className="mt-1.5 text-[0.74rem] leading-relaxed text-slate-500">
                            Added from what you told me: {rev.added.join("; ")}{" "}
                            - make sure you can stand behind it in the
                            interview.
                          </p>
                        )}
                        {rev.followUp && (
                          <p className="mt-1.5 text-[0.82rem] font-semibold leading-relaxed text-brand-ink">
                            {rev.followUp}
                          </p>
                        )}
                        {rev.didChange && (
                          <button
                            type="button"
                            onClick={() => undoRevision(i)}
                            aria-label="Undo this change"
                            title="Undo this change"
                            className="mt-1.5 grid h-11 w-11 place-items-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-ink"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden
                              className="h-4 w-4"
                            >
                              <path d="M9 14 4 9l5-5" />
                              <path d="M4 9h10.5A5.5 5.5 0 0 1 20 14.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                  {revising && (
                    <li className="max-w-[92%] rounded-2xl rounded-bl-md border border-slate-200 bg-surface px-3.5 py-2.5 text-[0.84rem] text-slate-500">
                      Rewriting your resume…
                    </li>
                  )}
                </ol>

                {/* The send sits inside the box, bottom right, the way every
                    chat box a nineteen-year-old has ever used does. A button
                    underneath read as a form; this reads as somewhere to talk. */}
                <div className="relative mt-3">
                  <label htmlFor="scribe-ask" className="sr-only">
                    Tell Scribe what to change
                  </label>
                  <textarea
                    id="scribe-ask"
                    rows={5}
                    value={comment}
                    disabled={revising}
                    onChange={(e) => setComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (!revising && comment.trim()) void reviseResume();
                      }
                    }}
                    placeholder={SCRIBE_EXAMPLES[exampleIndex]}
                    className="min-h-[6.5rem] w-full resize-y rounded-xl border border-slate-300 bg-surface py-2.5 pl-3 pr-14 text-[0.85rem] leading-relaxed outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    disabled={revising || !comment.trim()}
                    onClick={() => void reviseResume()}
                    aria-label={
                      revising ? "Rewriting your resume" : "Send to Scribe"
                    }
                    title="Send"
                    className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-brand-violet text-white transition-colors hover:bg-brand-violet-deep disabled:bg-slate-300 disabled:text-slate-500"
                  >
                    {revising ? (
                      <span
                        aria-hidden
                        className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white motion-safe:animate-spin"
                      />
                    ) : (
                      <ArrowUp />
                    )}
                  </button>
                </div>
                <p className="mt-1.5 text-[0.72rem] text-slate-400">
                  Enter to send, Shift + Enter for a new line.
                </p>
              </section>

              {/* Downloading is the last step, so it sits at the end - after
                  the resume, the conversation and the read-back. */}
              <section className="mt-4 rounded-2xl border border-slate-200 bg-surface p-5 print:hidden">
                <h2 className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-teal-700">
                  {completeness.ready
                    ? "When it reads right"
                    : "Not ready to send yet"}
                </h2>
                <p className="mt-1.5 text-[0.85rem] leading-relaxed text-slate-600">
                  {completeness.ready ? (
                    "Nothing leaves Ascend until you download it, and this resume is kept for you."
                  ) : (
                    <>
                      This resume is missing{" "}
                      <span className="font-semibold text-brand-ink">
                        {completeness.missing
                          .map((g) => g.section.toLowerCase())
                          .join(", ")}
                      </span>
                      . Add {completeness.missing.length === 1 ? "it" : "them"}{" "}
                      and the download opens - a resume with a section missing
                      reads as careless, and that is not what your work
                      deserves.
                    </>
                  )}
                </p>

                {!completeness.ready && (
                  <ul className="mt-3 grid gap-2">
                    {completeness.missing.map((gapItem) => (
                      <li
                        key={gapItem.section}
                        className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5"
                      >
                        <span
                          aria-hidden
                          className="mt-0.5 text-[0.9rem] font-bold text-amber-700"
                        >
                          !
                        </span>
                        <span>
                          <span className="block text-[0.82rem] font-semibold text-amber-900">
                            {gapItem.section} is missing
                          </span>
                          <span className="mt-0.5 block text-[0.8rem] leading-relaxed text-amber-800">
                            {gapItem.fix}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {ats && !ats.readable && (
                  <ul className="mt-3 grid gap-2">
                    {ats.problems.map((problem) => (
                      <li
                        key={problem.what}
                        className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5"
                      >
                        <span
                          aria-hidden
                          className="mt-0.5 text-[0.9rem] font-bold text-amber-700"
                        >
                          !
                        </span>
                        <span>
                          <span className="block text-[0.82rem] font-semibold text-amber-900">
                            {problem.what}
                          </span>
                          <span className="mt-0.5 block text-[0.8rem] leading-relaxed text-amber-800">
                            {problem.why}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {ats?.readable && completeness.ready && (
                  <p className="mt-2.5 flex items-start gap-2 text-[0.8rem] leading-relaxed text-teal-800">
                    <span aria-hidden className="mt-0.5 font-bold">
                      ✓
                    </span>
                    <span>
                      We opened your download and read it back the way screening
                      software does. Every section, date and number came
                      through.
                    </span>
                  </p>
                )}

                {!completeness.ready && (
                  <p className="mt-3 text-[0.82rem] leading-relaxed text-slate-600">
                    Tell Scribe above what is missing and it goes straight in -
                    or{" "}
                    <Link
                      href="/profile"
                      className="font-semibold text-teal-700 underline underline-offset-2"
                    >
                      fill it in on your profile
                    </Link>{" "}
                    and build again.
                  </p>
                )}
                <div className="relative mt-3 w-full max-w-xs" ref={exportRef}>
                  <button
                    type="button"
                    disabled={downloading || !completeness.ready}
                    onClick={() => setExportOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={exportOpen}
                    title={
                      completeness.ready
                        ? undefined
                        : "Add what is missing above and this opens"
                    }
                    className="w-full rounded-lg bg-brand-teal-deep px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-teal disabled:opacity-50"
                  >
                    {downloading ? "Preparing…" : "Download ▾"}
                  </button>
                  {exportOpen && (
                    <div
                      role="menu"
                      className="absolute left-0 top-full z-20 mt-1.5 w-full min-w-52 overflow-hidden rounded-xl border border-slate-200 bg-surface shadow-lg"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setExportOpen(false);
                          void downloadWord();
                        }}
                        className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-brand-ink transition-colors hover:bg-teal-50"
                      >
                        Word (.docx)
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setExportOpen(false);
                          const after = () => {
                            window.removeEventListener("afterprint", after);
                            void withToken().then((token) => {
                              if (token) handOverToFeedback(token);
                            });
                          };
                          window.addEventListener("afterprint", after);
                          window.print();
                        }}
                        className="block w-full border-t border-slate-100 px-4 py-2.5 text-left text-sm font-semibold text-brand-ink transition-colors hover:bg-teal-50"
                      >
                        Print / Save as PDF
                      </button>
                    </div>
                  )}
                </div>
              </section>

              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setError(null);
                }}
                className="min-h-11 text-[0.85rem] font-semibold text-slate-500 transition-colors hover:text-slate-800"
              >
                Start over
              </button>
            </aside>
          </div>
        </>
      )}

      {gap && (
        <GapModal
          gap={gap}
          profileSkills={profileSkills}
          busy={busy === "building"}
          onClose={() => {
            if (busy === null) setGap(null);
          }}
          onSubmit={(answers, newSkills) => void submitGaps(answers, newSkills)}
        />
      )}

      {essentialsOpen && (
        <EssentialsModal
          firstName={asText("fullName").split(/\s+/)[0] ?? ""}
          busy={busy !== null}
          onClose={() => {
            if (busy === null) setEssentialsOpen(false);
          }}
          onSubmit={(values) => void saveEssentials(values)}
        />
      )}

      {gate && <SignUpPrompt action={gate} onClose={() => setGate(null)} />}
    </main>
  );
}
