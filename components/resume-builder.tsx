"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { BackLink } from "@/components/back-link";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { track as trackEvent } from "@/lib/footprints";
import {
  downloadResumeDocx,
  generateResume,
  resumeGapCheck,
  saveResumeProfile,
  type GapCheckResult,
  type ResumeCareerProfile,
  type ResumeData,
  type ResumeTarget,
  type ResumeTemplate,
} from "@/lib/resume-api";

// The AI Resume Builder, in three moves: confirm who the resume is for,
// answer what the record still misses, then read the draft built only from
// what is true. Teal marks what the person has earned or told us; violet
// marks where Ascend is guiding them.

const splitList = (value: unknown): string[] =>
  typeof value === "string"
    ? value.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

// ---- The gap popup ----
//
// Same portal/dialog shape as AuthModal: portal to <body>, backdrop click and
// Escape close it, the page behind cannot scroll. Light panel - this dialog
// lives inside the app, not on the night-themed landing.
function GapModal({
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
              These aren&rsquo;t in your record yet
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
                    <strong className="font-semibold">{skill}</strong> - this
                    isn&rsquo;t in your record yet - confirm it&rsquo;s true
                    and you can back it up in an interview.
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-[0.72rem] text-amber-800">
              Confirmed skills join your record; unticked ones stay out of the
              resume.
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

// ---- Templates ----
//
// Three ATS-safe looks for the same data: single column, no tables or
// graphics, standard headings in all three. Only spacing, alignment and type
// change - a screener parses them identically, a person sees three styles.

const TEMPLATES: Array<{ id: ResumeTemplate; name: string; blurb: string }> = [
  { id: "classic", name: "Classic", blurb: "Serif and traditional - the trusted look." },
  { id: "compact", name: "Compact", blurb: "Tight sans type - fits more on two pages." },
  {
    id: "sidebar",
    name: "Sidebar",
    blurb: "Designed two-column look - best for human readers.",
  },
];

// Ledger entries written before this look existed said "modern"; they map to
// the sidebar look rather than silently reverting to Classic.
const asTemplate = (value: unknown): ResumeTemplate =>
  value === "compact"
    ? "compact"
    : value === "sidebar" || value === "modern"
      ? "sidebar"
      : "classic";

// Each picker card shows the real sheet, rendered at one-third scale with
// obviously-generic sample data - so what you pick is exactly what you get,
// and a template tweak updates its own preview for free.
const SAMPLE_RESUME: ResumeData = {
  header: {
    name: "Aarav Sharma",
    city: "Hyderabad",
    email: "aarav.sharma@example.com",
  },
  summary:
    "Customer-focused commerce graduate with hands-on practice in order handling, billing queries and everyday problem solving. Comfortable working shifts, quick to pick up new tools, and calm with difficult customers.",
  skills: [
    {
      group: "Customer service",
      items: ["Clear phone manner", "Patient listening", "Complaint handling"],
    },
    { group: "Tools", items: ["Google Sheets", "Billing systems", "Hindi typing"] },
  ],
  experienceHeading: "Experience",
  experience: [
    {
      title: "Store assistant",
      organisation: "Sharma General Stores",
      period: "2023 - 2024",
      bullets: [
        "Handled daily billing and customer questions at the counter",
        "Kept stock lists up to date in Google Sheets",
      ],
    },
    {
      title: "Volunteer, registration desk",
      organisation: "College fest",
      period: "2023",
      bullets: ["Managed sign-ins and sorted out schedule clashes on the day"],
    },
  ],
  education: [
    {
      qualification: "B.Com",
      institution: "Osmania University",
      period: "2021 - 2024",
      detail: "",
    },
  ],
  languages: ["English", "Hindi", "Telugu"],
  activities: ["College cricket team", "Peer study group"],
  keywordsUsed: [],
};

// An A4-proportioned thumbnail: the container crops a full page's worth of
// the one-third-scale sheet, so each card reads as a complete resume page.
function MiniPreview({
  id,
  resume,
  roleLine,
}: {
  id: ResumeTemplate;
  resume: ResumeData;
  roleLine: string;
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none aspect-[1/1.414] select-none overflow-hidden rounded-md border border-[#cbd2da] bg-white shadow-sm"
    >
      <div className="w-[300%] origin-top-left scale-[0.3334]">
        <ResumeSheet resume={resume} template={id} roleLine={roleLine} mini />
      </div>
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
  resume,
  roleLine,
}: {
  value: ResumeTemplate;
  onChange: (template: ResumeTemplate) => void;
  /** The preview content - the person's own name where the record has it. */
  resume: ResumeData;
  roleLine: string;
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
      {/* Stacked rows rather than three columns: the picker lives in a narrow
          rail, where side-by-side cards squeeze the names to breaking. */}
      <div className="mt-2.5 grid gap-2">
        {TEMPLATES.map((t) => (
          <label key={t.id} className="block cursor-pointer">
            <input
              type="radio"
              name="resume-template"
              value={t.id}
              checked={value === t.id}
              onChange={() => onChange(t.id)}
              className="peer sr-only"
            />
            <div className="flex items-center gap-2.5 rounded-xl border-2 border-slate-200 bg-surface p-2 transition-colors peer-checked:border-brand-violet peer-checked:bg-brand-violet/5 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-violet/40">
              <span className="w-16 shrink-0">
                <MiniPreview id={t.id} resume={resume} roleLine={roleLine} />
              </span>
              <span className="min-w-0">
                <span className="block text-[0.8rem] font-semibold text-brand-ink">
                  {t.name}
                </span>
                <span className="mt-0.5 block text-[0.68rem] leading-snug text-slate-500">
                  {t.blurb}
                </span>
              </span>
            </div>
          </label>
        ))}
      </div>
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
  /** "split" = contact flush right of the name; "stack" = beneath it. */
  headerLayout: "split" | "stack";
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
  classic: {
    pad: "p-6 sm:p-10",
    font: "font-serif",
    headerLayout: "split",
    name: "text-[1.65rem] font-bold tracking-tight text-[#111827]",
    contact: "text-[0.78rem] leading-relaxed",
    section: "mt-5",
    heading: "border-b-2 border-[#111827] pb-1 text-[0.95rem] font-bold",
    body: "text-[0.88rem] leading-relaxed",
    item: "text-[0.86rem] leading-relaxed",
    itemTitle: "text-[0.9rem] font-semibold",
    stack: "grid gap-3",
    dateRight: true,
  },
  compact: {
    pad: "p-5 sm:p-8",
    font: "font-sans",
    headerLayout: "stack",
    name: "text-2xl font-bold tracking-tight text-[#111827]",
    contact: "mt-0.5 text-[0.75rem]",
    section: "mt-3.5",
    heading:
      "border-b border-[#9ca3af] pb-0.5 text-[0.66rem] font-bold uppercase tracking-[0.14em]",
    body: "text-[0.82rem] leading-snug",
    item: "text-[0.8rem] leading-snug",
    itemTitle: "text-[0.84rem] font-semibold",
    stack: "grid gap-2",
    dateRight: false,
  },
  sidebar: {
    pad: "p-6 sm:p-9",
    font: "font-sans",
    headerLayout: "stack",
    name: "text-[1.9rem] font-bold uppercase leading-[1.1] tracking-[0.02em] text-[#111827]",
    contact: "mt-1 text-[0.8rem]",
    section: "mt-5",
    heading:
      "text-[0.86rem] font-bold uppercase tracking-[0.1em] after:mt-1 after:block after:h-[3px] after:w-8 after:bg-[#111827]",
    body: "text-[0.84rem] leading-relaxed",
    item: "text-[0.82rem] leading-relaxed",
    itemTitle: "text-[0.88rem] font-semibold",
    stack: "grid gap-3.5",
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

function ResumeSheet({
  resume,
  template,
  roleLine,
  mini = false,
}: {
  resume: ResumeData;
  template: ResumeTemplate;
  /** The role this resume targets - sits under the name in the sidebar look. */
  roleLine?: string;
  /** Scaled-down picker preview: no print id, the card supplies the frame. */
  mini?: boolean;
}) {
  const t = SHEET_STYLES[template];

  // The sections, built once and arranged differently per layout.
  const profile = resume.summary ? (
    <Section title="Profile" styles={t}>
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

  const sheetClass = `break-words bg-white text-[#111827] ${t.font} ${
    mini ? "" : "rounded-xl border border-slate-200 shadow-sm"
  } ${t.pad}`;

  if (template === "sidebar") {
    const info = (resume.header.city || resume.header.email) && (
      <Section title="Info" styles={t}>
        <div className="grid gap-1.5">
          {resume.header.city && (
            <p className={t.item}>{resume.header.city}</p>
          )}
          {resume.header.email && (
            <p className={t.item}>{resume.header.email}</p>
          )}
        </div>
      </Section>
    );
    return (
      <div id={mini ? undefined : "resume-sheet"} className={sheetClass}>
        <h2 className={t.name}>{resume.header.name}</h2>
        {roleLine && (
          <p className={`${t.contact} text-[#6b7280]`}>{roleLine}</p>
        )}
        {/* One layout grid, real headings in both columns: reading order is
            the narrow column then the wide one. */}
        {/* min-w-0 lets the narrow column shrink, and overflow-wrap breaks a
            long email or link instead of letting it cross the divider. */}
        <div className="mt-5 grid gap-x-6 gap-y-1 border-t border-[#d1d5db] pt-4 sm:grid-cols-[10rem_1fr]">
          <div className="min-w-0 border-[#e5e7eb] [overflow-wrap:anywhere] sm:border-r sm:pr-5">
            {info}
            {skills}
            {languages}
          </div>
          {/* A hairline between sections, as the reference layout has - the
              first section needs none, so only later siblings carry it. */}
          <div className="min-w-0 [&>section+section]:border-t [&>section+section]:border-[#e5e7eb] [&>section+section]:pt-4">
            {profile}
            {experience}
            {education}
            {activities}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id={mini ? undefined : "resume-sheet"} className={sheetClass}>
      {t.headerLayout === "split" ? (
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1 border-b border-[#d1d5db] pb-3">
          <h2 className={t.name}>{resume.header.name}</h2>
          {(resume.header.city || resume.header.email) && (
            <p className={`${t.contact} text-[#6b7280] sm:text-right`}>
              {[resume.header.city, resume.header.email]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>
      ) : (
        <div>
          <h2 className={t.name}>{resume.header.name}</h2>
          {(resume.header.city || resume.header.email) && (
            <p className={`${t.contact} text-[#6b7280]`}>
              {[resume.header.city, resume.header.email]
                .filter(Boolean)
                .join("  |  ")}
            </p>
          )}
        </div>
      )}
      {profile}
      {skills}
      {experience}
      {education}
      {languages}
      {activities}
    </div>
  );
}

// ---- The builder ----

export function ResumeBuilder({
  profile,
  target,
}: {
  profile: ResumeCareerProfile | null;
  target: ResumeTarget | null;
}) {
  const router = useRouter();
  const ledger = (() => {
    const raw = profile?.preferences?.["resumeLedger"];
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(
        (
          e,
        ): e is {
          role: string;
          at: string;
          skillsHighlighted: string[];
          resume?: ResumeData;
          template?: ResumeTemplate;
        } =>
          typeof e === "object" && e !== null && typeof (e as { role?: unknown }).role === "string",
      )
      .slice()
      .reverse()
      .slice(0, 10);
  })();
  const lockedRole = target?.role ?? null;

  const [customMode, setCustomMode] = useState(!lockedRole);
  const [roleInput, setRoleInput] = useState("");
  const [jdInput, setJdInput] = useState("");
  const [busy, setBusy] = useState<null | "checking" | "building">(null);
  const [error, setError] = useState<string | null>(null);
  const [gap, setGap] = useState<GapCheckResult | null>(null);
  const [result, setResult] = useState<{
    resume: ResumeData;
    targetRole: string;
  } | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [template, setTemplate] = useState<ResumeTemplate>("classic");

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
    return {
      ...SAMPLE_RESUME,
      header: {
        name: name || SAMPLE_RESUME.header.name,
        city: city || SAMPLE_RESUME.header.city,
        // Their real address only appears on the built resume, so the preview
        // wears an obviously-generic one rather than a stranger's.
        email: name ? "your.email@example.com" : SAMPLE_RESUME.header.email,
      },
    };
  }, [profile]);

  async function withToken(): Promise<string | null> {
    const { data } = await supabaseBrowser().auth.getSession();
    const token = data.session?.access_token ?? null;
    if (!token) router.push("/login?next=/resume");
    return token;
  }

  const chosenRole = () =>
    customMode ? roleInput.trim() : (lockedRole?.title ?? "");

  // The role line on the preview follows whatever they are aiming at now.
  const previewRole =
    (customMode || !lockedRole ? roleInput.trim() : lockedRole.title) ||
    "The role you are aiming at";

  async function begin() {
    const targetRole = chosenRole();
    if (!targetRole) return;
    setError(null);
    setBusy("checking");
    const token = await withToken();
    if (!token) return;
    const body = {
      targetRole,
      ...(customMode && jdInput.trim() ? { jobDescription: jdInput.trim() } : {}),
    };
    const check = await resumeGapCheck(token, body);
    if (!check) {
      setBusy(null);
      setError("We couldn't check your record just now. Give it another try.");
      return;
    }
    trackEvent({
      family: "decision",
      event: "resume_target_confirmed",
      module: "resume",
      target: targetRole,
      meta: { locked: !customMode, gaps: check.missing.length },
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
    body: { targetRole: string; jobDescription?: string },
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
    trackEvent({
      family: "engagement",
      event: "resume_generated",
      module: "resume",
      target: generated.targetRole,
      meta: { keywordsUsed: generated.resume.keywordsUsed.length },
    });
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
    await build(token, {
      targetRole: gap.targetRole,
      ...(customMode && jdInput.trim() ? { jobDescription: jdInput.trim() } : {}),
    });
  }

  async function downloadWord() {
    if (!result) return;
    setDownloading(true);
    const token = await withToken();
    if (!token) return;
    const blob = await downloadResumeDocx(
      token,
      result.resume,
      template,
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
  }

  // Rendered inside the workbench rail before a build, and under the sheet
  // after one - so it is reachable either way without lengthening the page.
  const ledgerSection = ledger.length > 0 && (
        <section className="mt-10 border-t border-slate-200 pt-6">
          <h2 className="text-[0.8rem] font-bold text-brand-ink">
            Your previous resumes
          </h2>
          <p className="mt-1 text-[0.78rem] text-slate-500">
            Each build is kept on your record. Rebuild any time - your resume
            always reflects the current truth of your record.
          </p>
          <div className="mt-2.5 grid gap-2">
            {ledger.map((entry, i) => (
              <div
                key={`${entry.at}-${i}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-2xl border border-slate-200 bg-surface px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[0.9rem] font-semibold text-brand-ink">
                    {entry.role}
                  </p>
                  <p className="text-[0.72rem] text-slate-400">
                    {new Date(entry.at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                {entry.resume && (
                  <button
                    type="button"
                    onClick={() => {
                      setResult({ resume: entry.resume!, targetRole: entry.role });
                      // Re-render the look it was built in; entries from
                      // before templates existed fall back to classic.
                      setTemplate(asTemplate(entry.template));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="shrink-0 rounded-lg bg-brand-teal-deep px-3.5 py-2 text-[0.78rem] font-bold text-white transition-colors hover:bg-brand-teal"
                  >
                    View and download
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
  );

  // No record yet: the resume has nothing truthful to build from, so the one
  // action is filling the profile - never generating from thin air.
  if (!profile || profileSkills.length === 0) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 pb-16 sm:px-6">
        <div className="pt-4">
          <BackLink fallbackHref="/tools" fallbackLabel="Back to career tools" />
        </div>
        <header className="mt-6">
          <h1 className="text-2xl font-semibold tracking-tight text-brand-ink">
            Your resume starts with your record
          </h1>
          <p className="mt-2 max-w-prose text-[0.9rem] leading-relaxed text-slate-600">
            Everything on an Ascend resume is true because it comes from what
            you&rsquo;ve told us - and right now your record{" "}
            {profile ? "has no skills in it yet" : "is empty"}. Five minutes on
            your profile gives the builder something real to work with.
          </p>
        </header>
        <Link
          href="/profile"
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-brand-teal-deep px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-teal"
        >
          Fill in your profile →
        </Link>
      </main>
    );
  }

  return (
    <main
      className={`mx-auto w-full px-4 sm:px-6 ${
        // The workbench holds itself to one screen on a laptop - the rail
        // scrolls inside rather than the whole page growing. The finished
        // resume is a document, so it reads in a single narrow column.
        result ? "max-w-5xl pb-16" : "max-w-[56rem] pb-10"
      }`}
    >
      {/* Print shows the resume sheet alone: no app chrome, no controls. */}
      <style>{`@media print {
        body * { visibility: hidden; }
        #resume-sheet, #resume-sheet * { visibility: visible; }
        #resume-sheet { position: absolute; inset: 0; border: 0; box-shadow: none; border-radius: 0; padding: 0; }
      }`}</style>

      <div className="pt-4 print:hidden">
        <BackLink fallbackHref="/tools" fallbackLabel="Back to career tools" />
      </div>

      {!result && (
        <>
          <header className="mt-4">
            <h1 className="text-2xl font-semibold tracking-tight text-brand-ink">
              Build your resume
            </h1>
            <p className="mt-1.5 max-w-prose text-[0.88rem] leading-relaxed text-slate-600">
              Most applications are screened by software before a person reads
              them. A resume written in the role&rsquo;s own words - and only
              from what&rsquo;s true in your record - gets through.
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
          <div className="mt-4 grid gap-5 lg:h-[calc(100dvh-15.5rem)] lg:grid-cols-[minmax(0,1fr)_28rem]">
            {/* The rail scrolls, the button does not: whatever is in the
                record above it, the one action stays on screen. */}
            <div className="grid gap-3 lg:min-h-0 lg:grid-rows-[minmax(0,1fr)_auto]">
              <div className="grid content-start gap-3 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
              {lockedRole && !customMode ? (
                <section className="rounded-2xl border border-teal-700/30 bg-teal-50 p-4">
                  <p className="text-[0.66rem] font-bold uppercase tracking-[0.14em] text-teal-700">
                    From your Discovery
                  </p>
                  <h2 className="mt-1 text-[1.05rem] font-semibold text-brand-ink">
                    {lockedRole.title}
                  </h2>
                  <p className="mt-1 text-[0.8rem] leading-relaxed text-slate-600">
                    Written in the words employers use for this role - only
                    where they are true for you.
                  </p>
                  {(target?.keywords.length ?? 0) > 0 && (
                    <p className="mt-2 text-[0.74rem] leading-relaxed text-slate-500">
                      Words we&rsquo;ll weave in:{" "}
                      {target?.keywords.slice(0, 4).join(", ")}
                      {(target?.keywords.length ?? 0) > 4 &&
                        ` and ${(target?.keywords.length ?? 0) - 4} more`}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setCustomMode(true)}
                    className="mt-2 min-h-11 text-[0.78rem] font-semibold text-slate-500 underline underline-offset-2 transition-colors hover:text-slate-800"
                  >
                    I&rsquo;m aiming at something else
                  </button>
                </section>
              ) : (
                <section className="rounded-2xl border border-slate-200 bg-surface p-4">
                  <h2 className="text-[0.95rem] font-semibold text-brand-ink">
                    What role is this resume for?
                  </h2>
                  <div className="mt-3 grid gap-3">
                    <label className="block">
                      <span className="text-[0.78rem] font-semibold text-slate-800">
                        Target role
                      </span>
                      <input
                        value={roleInput}
                        onChange={(e) => setRoleInput(e.target.value)}
                        placeholder="Customer Support Executive"
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.88rem] outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[0.78rem] font-semibold text-slate-800">
                        Job posting (optional)
                      </span>
                      <span className="block text-[0.7rem] text-slate-400">
                        Paste it and the resume speaks its language.
                      </span>
                      <textarea
                        rows={4}
                        value={jdInput}
                        onChange={(e) => setJdInput(e.target.value)}
                        className="mt-1 w-full resize-y rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.85rem] outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20"
                      />
                    </label>
                  </div>
                  {lockedRole && (
                    <button
                      type="button"
                      onClick={() => setCustomMode(false)}
                      className="mt-2 min-h-11 text-[0.78rem] font-semibold text-slate-500 underline underline-offset-2 transition-colors hover:text-slate-800"
                    >
                      Back to {lockedRole.title}
                    </button>
                  )}
                </section>
              )}

                <section className="rounded-2xl border border-slate-200 bg-surface p-4">
                  <TemplatePicker
                    value={template}
                    onChange={setTemplate}
                    resume={previewResume}
                    roleLine={previewRole}
                  />
                </section>
              </div>

              {/* The one primary action, held at the foot of the rail. */}
              <button
                type="button"
                disabled={
                  busy !== null || (customMode && !roleInput.trim()) ||
                  (!lockedRole && !roleInput.trim())
                }
                onClick={() => void begin()}
                className="inline-flex min-h-12 w-full max-w-sm items-center justify-center rounded-full bg-brand-teal-deep px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-teal disabled:opacity-50"
              >
                {busy === "checking"
                  ? "Reading your record…"
                  : busy === "building"
                    ? "Building…"
                    : "Build my resume"}
              </button>
            </div>

            {/* The paper, always in view. The panel hugs the page rather than
                stretching, so no dark gutter sits either side of it. */}
            <div className="min-w-0 lg:flex lg:min-h-0 lg:flex-col">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-t-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                <p className="text-[0.74rem] font-semibold text-slate-600">
                  Preview · {TEMPLATES.find((t) => t.id === template)?.name} look
                </p>
                <p className="text-[0.7rem] text-slate-400">
                  Sample content until you build
                </p>
              </div>
              <div className="rounded-b-2xl border border-t-0 border-slate-200 bg-slate-100 p-2.5 sm:p-4 lg:min-h-0 lg:flex-1">
                {/* Page-shaped: sized by the space it has, so it reads as a
                    page rather than a wall of paper. */}
                <div className="mx-auto aspect-[1/1.414] w-full max-w-md overflow-hidden rounded-lg bg-white shadow-sm lg:h-full lg:w-auto lg:max-w-none">
                  <div className="w-[150%] origin-top-left scale-[0.6667]">
                    <ResumeSheet
                      resume={previewResume}
                      template={template}
                      roleLine={previewRole}
                      mini
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Past builds sit at the foot of the page, full width. */}
          {ledgerSection}
        </>
      )}

      {error && (
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
            <p className="mt-1.5 max-w-prose text-[0.88rem] text-slate-600">
              Every line comes from your record and your answers - nothing
              invented. Read it once before you send it anywhere.
            </p>
            {result.resume.keywordsUsed.length > 0 && (
              <p className="mt-2 text-[0.8rem] text-teal-700">
                Role words your record could truthfully carry:{" "}
                {result.resume.keywordsUsed.join(", ")}
              </p>
            )}
          </header>

          {/* The resume with its actions beside it: Download stays within
              reach of the page it downloads, however far you scroll. */}
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
            <div className="min-w-0">
              <ResumeSheet
                resume={result.resume}
                template={template}
                roleLine={result.targetRole}
              />
              <p className="mt-3 text-[0.75rem] text-slate-500 print:hidden">
                This build is noted in your record - which role it was for and
                which skills it highlighted.
              </p>
            </div>

            <aside className="order-first grid gap-3 lg:sticky lg:top-20 lg:order-none print:hidden">
              <div className="relative">
                <button
                  type="button"
                  disabled={downloading}
                  onClick={() => setExportOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={exportOpen}
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
                        window.print();
                      }}
                      className="block w-full border-t border-slate-100 px-4 py-2.5 text-left text-sm font-semibold text-brand-ink transition-colors hover:bg-teal-50"
                    >
                      Print / Save as PDF
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-surface p-3">
                {/* The thumbnails show the real resume now, so switching looks
                    is a decision about their own page. */}
                <TemplatePicker
                  value={template}
                  onChange={setTemplate}
                  resume={result.resume}
                  roleLine={result.targetRole}
                />
              </div>

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

          <div className="print:hidden">{ledgerSection}</div>
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

    </main>
  );
}
