// Temporary comparison page: three design concepts for the AI Resume
// Builder screen. Static mockups - nothing here reads a record, calls the
// backend or produces a file. Not linked from anywhere; deleted once a
// direction is chosen.
//
// All three frames carry the same real capability that components/
// resume-builder.tsx already ships: a role locked from Discovery (or a
// custom role plus a pasted job description), the gap questions that fill
// what the record misses, the three ATS-safe looks with a readable preview,
// the built sheet, Word and Print downloads, and the ledger of past builds.
//
// The resume sheet is fixed white in every theme, so it uses literal ink
// hexes - exactly as the real ResumeSheet does. Everything around it uses
// the themed tokens.

const ROLE = "Customer Support Executive";

// ---- the sample record, same person as the real template picker ----

const SAMPLE = {
  name: "Aarav Sharma",
  city: "Hyderabad",
  email: "aarav.sharma@example.com",
  summary:
    "Customer-focused commerce graduate with hands-on practice in order handling, billing queries and everyday problem solving. Comfortable working shifts, quick to pick up new tools, and calm with difficult customers.",
  skills: [
    {
      group: "Customer service",
      items: ["Clear phone manner", "Patient listening", "Complaint handling"],
    },
    {
      group: "Tools",
      items: ["Google Sheets", "Billing systems", "Hindi typing"],
    },
  ],
  experience: [
    {
      title: "Store assistant, Sharma General Stores",
      period: "2023 - 2024",
      bullets: [
        "Handled daily billing and customer questions at the counter",
        "Kept stock lists up to date in Google Sheets",
      ],
    },
    {
      title: "Volunteer, registration desk, College fest",
      period: "2023",
      bullets: ["Managed sign-ins and sorted out schedule clashes on the day"],
    },
  ],
  education: [{ title: "B.Com, Osmania University", period: "2021 - 2024" }],
  languages: ["English", "Hindi", "Telugu"],
  activities: ["College cricket team", "Peer study group"],
};

type Template = "classic" | "compact" | "sidebar";

const TEMPLATES: Array<{ id: Template; name: string; blurb: string }> = [
  { id: "classic", name: "Classic", blurb: "Serif and traditional." },
  { id: "compact", name: "Compact", blurb: "Tight sans, fits more." },
  { id: "sidebar", name: "Sidebar", blurb: "Two columns for people." },
];

const LEDGER = [
  {
    role: ROLE,
    date: "11 Aug 2026",
    template: "sidebar" as Template,
    skills: ["Complaint handling", "Billing systems"],
  },
  {
    role: "Back Office Executive",
    date: "2 Aug 2026",
    template: "classic" as Template,
    skills: ["Google Sheets", "Hindi typing"],
  },
  {
    role: "Retail Sales Associate",
    date: "24 Jul 2026",
    template: "compact" as Template,
    skills: ["Clear phone manner"],
  },
];

// ---- small inline icons (stroke inherits currentColor) ----

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
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
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
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
      <path d="M12 4v11" />
      <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
      <path d="M5 19h14" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
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
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20 4v4.5h-4.5" />
    </svg>
  );
}

// ---- the resume sheet ----
//
// A static stand-in for the real ResumeSheet: the same three looks, the same
// single-column-plus-sidebar structure, and the same fixed white paper with
// literal ink hexes so it reads as paper in light and dark theme alike.

type SheetStyle = {
  pad: string;
  font: string;
  headerLayout: "split" | "stack";
  name: string;
  contact: string;
  section: string;
  heading: string;
  body: string;
  item: string;
  itemTitle: string;
  dateRight: boolean;
};

const SHEET_STYLES: Record<Template, SheetStyle> = {
  classic: {
    pad: "p-6 sm:p-9",
    font: "font-serif",
    headerLayout: "split",
    name: "text-[1.6rem] font-bold tracking-tight",
    contact: "text-[0.78rem] leading-relaxed",
    section: "mt-5",
    heading: "border-b-2 border-[#111827] pb-1 text-[0.95rem] font-bold",
    body: "text-[0.86rem] leading-relaxed",
    item: "text-[0.84rem] leading-relaxed",
    itemTitle: "text-[0.88rem] font-semibold",
    dateRight: true,
  },
  compact: {
    pad: "p-5 sm:p-8",
    font: "font-sans",
    headerLayout: "stack",
    name: "text-2xl font-bold tracking-tight",
    contact: "mt-0.5 text-[0.75rem]",
    section: "mt-3.5",
    heading:
      "border-b border-[#9ca3af] pb-0.5 text-[0.66rem] font-bold uppercase tracking-[0.14em]",
    body: "text-[0.8rem] leading-snug",
    item: "text-[0.78rem] leading-snug",
    itemTitle: "text-[0.82rem] font-semibold",
    dateRight: false,
  },
  sidebar: {
    pad: "p-6 sm:p-9",
    font: "font-sans",
    headerLayout: "stack",
    name: "text-[1.85rem] font-bold uppercase leading-[1.1] tracking-[0.02em]",
    contact: "mt-1 text-[0.8rem]",
    section: "mt-5",
    heading:
      "text-[0.86rem] font-bold uppercase tracking-[0.1em] after:mt-1 after:block after:h-[3px] after:w-8 after:bg-[#111827]",
    body: "text-[0.82rem] leading-relaxed",
    item: "text-[0.8rem] leading-relaxed",
    itemTitle: "text-[0.86rem] font-semibold",
    dateRight: true,
  },
};

function SheetSection({
  title,
  styles,
  children,
}: {
  title: string;
  styles: SheetStyle;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.section}>
      <h3 className={`${styles.heading} text-[#111827]`}>{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function SheetItem({
  title,
  period,
  styles,
  bullets,
}: {
  title: string;
  period: string;
  styles: SheetStyle;
  bullets?: string[];
}) {
  return (
    <div>
      {styles.dateRight ? (
        <div className="flex items-baseline justify-between gap-4">
          <p className={styles.itemTitle}>{title}</p>
          <p className={`shrink-0 ${styles.item} text-[#6b7280]`}>{period}</p>
        </div>
      ) : (
        <p className={styles.itemTitle}>
          {title}
          <span className="ml-2 font-normal text-[#6b7280]">· {period}</span>
        </p>
      )}
      {bullets && bullets.length > 0 && (
        <ul className="mt-1 grid gap-0.5 pl-4">
          {bullets.map((point) => (
            <li key={point} className={`list-disc ${styles.item}`}>
              {point}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Sheet({ template }: { template: Template }) {
  const t = SHEET_STYLES[template];

  const profile = (
    <SheetSection title={template === "compact" ? "PROFILE" : "Profile"} styles={t}>
      <p className={t.body}>{SAMPLE.summary}</p>
    </SheetSection>
  );

  const skills = (
    <SheetSection title={template === "compact" ? "SKILLS" : "Skills"} styles={t}>
      <ul className="grid gap-1">
        {SAMPLE.skills.map((group) => (
          <li key={group.group} className={t.body}>
            <strong className="font-semibold">{group.group}:</strong>{" "}
            {group.items.join(", ")}
          </li>
        ))}
      </ul>
    </SheetSection>
  );

  const experience = (
    <SheetSection
      title={template === "compact" ? "EXPERIENCE" : "Experience"}
      styles={t}
    >
      <div className="grid gap-3">
        {SAMPLE.experience.map((job) => (
          <SheetItem
            key={job.title}
            title={job.title}
            period={job.period}
            bullets={job.bullets}
            styles={t}
          />
        ))}
      </div>
    </SheetSection>
  );

  const education = (
    <SheetSection
      title={template === "compact" ? "EDUCATION" : "Education"}
      styles={t}
    >
      <div className="grid gap-2">
        {SAMPLE.education.map((item) => (
          <SheetItem
            key={item.title}
            title={item.title}
            period={item.period}
            styles={t}
          />
        ))}
      </div>
    </SheetSection>
  );

  const languages = (
    <SheetSection
      title={template === "compact" ? "LANGUAGES" : "Languages"}
      styles={t}
    >
      <p className={t.body}>{SAMPLE.languages.join(", ")}</p>
    </SheetSection>
  );

  const activities = (
    <SheetSection
      title={template === "compact" ? "ACTIVITIES" : "Activities"}
      styles={t}
    >
      <ul className="grid gap-0.5 pl-4">
        {SAMPLE.activities.map((activity) => (
          <li key={activity} className={`list-disc ${t.item}`}>
            {activity}
          </li>
        ))}
      </ul>
    </SheetSection>
  );

  const sheetClass = `break-words bg-white text-[#111827] ${t.font} ${t.pad}`;

  if (template === "sidebar") {
    return (
      <div className={sheetClass}>
        <h2 className={`${t.name} text-[#111827]`}>{SAMPLE.name}</h2>
        <p className={`${t.contact} text-[#6b7280]`}>{ROLE}</p>
        <div className="mt-5 grid gap-x-6 gap-y-1 border-t border-[#d1d5db] pt-4 sm:grid-cols-[9rem_1fr]">
          <div className="min-w-0 border-[#e5e7eb] [overflow-wrap:anywhere] sm:border-r sm:pr-5">
            <SheetSection title="INFO" styles={t}>
              <div className="grid gap-1.5">
                <p className={t.item}>{SAMPLE.city}</p>
                <p className={t.item}>{SAMPLE.email}</p>
              </div>
            </SheetSection>
            {skills}
            {languages}
          </div>
          <div className="min-w-0">
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
    <div className={sheetClass}>
      {t.headerLayout === "split" ? (
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1 border-b border-[#d1d5db] pb-3">
          <h2 className={`${t.name} text-[#111827]`}>{SAMPLE.name}</h2>
          <p className={`${t.contact} text-[#6b7280] sm:text-right`}>
            {SAMPLE.city} · {SAMPLE.email}
          </p>
        </div>
      ) : (
        <div>
          <h2 className={`${t.name} text-[#111827]`}>{SAMPLE.name}</h2>
          <p className={`${t.contact} text-[#6b7280]`}>
            {SAMPLE.city} {"  |  "} {SAMPLE.email}
          </p>
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

// An A4-proportioned thumbnail of the real sheet, cropped at one-third
// scale - the same trick the shipped picker uses, so what you pick is what
// you get.
function MiniSheet({ template }: { template: Template }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none aspect-[1/1.414] select-none overflow-hidden rounded-md border border-[#cbd2da] bg-white"
    >
      <div className="w-[300%] origin-top-left scale-[0.3334]">
        <Sheet template={template} />
      </div>
    </div>
  );
}

// The three looks as pickable cards, one chosen. Violet marks the choice -
// Ascend guiding a decision, not a fact the person earned.
function TemplateCards({ chosen }: { chosen: Template }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {TEMPLATES.map((t) => (
        <div
          key={t.id}
          className={`rounded-xl border-2 p-2 ${
            t.id === chosen
              ? "border-brand-violet bg-brand-violet/5"
              : "border-slate-200 bg-surface"
          }`}
        >
          <MiniSheet template={t.id} />
          <span className="mt-1.5 block text-[0.75rem] font-semibold text-brand-ink">
            {t.name}
          </span>
          <span className="mt-0.5 block text-[0.64rem] leading-snug text-slate-500">
            {t.blurb}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---- Concept A - the workbench ----

function ConceptWorkbench() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-surface p-3 shadow-sm sm:p-4">
      <div className="grid gap-4 lg:grid-cols-[17rem_minmax(0,1fr)]">
        {/* the left rail: everything you can change */}
        <div className="grid content-start gap-3">
          <div className="rounded-2xl border border-teal-700/30 bg-teal-50 p-3.5">
            <p className="text-[0.64rem] font-bold uppercase tracking-[0.14em] text-teal-700">
              From your Discovery
            </p>
            <p className="mt-1 text-[0.95rem] font-bold text-brand-ink">{ROLE}</p>
            <p className="mt-1 text-[0.75rem] leading-relaxed text-slate-600">
              Written in the words employers use for this role - only where
              they are true for you.
            </p>
            <p className="mt-1.5 text-[0.72rem] font-semibold text-slate-500 underline underline-offset-2">
              I am aiming at something else
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-surface p-3.5">
            <p className="text-[0.78rem] font-semibold text-slate-800">
              Job posting (optional)
            </p>
            <p className="mt-0.5 text-[0.7rem] text-slate-400">
              Paste it and the resume speaks its language.
            </p>
            <div className="mt-1.5 h-16 rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.75rem] text-slate-400">
              Paste the job description here
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-surface p-3.5">
            <p className="text-[0.78rem] font-semibold text-slate-800">
              Pick a look
            </p>
            <p className="mt-0.5 text-[0.7rem] leading-snug text-slate-400">
              The sheet on the right changes as you pick.
            </p>
            <div className="mt-2">
              <TemplateCards chosen="sidebar" />
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
            <p className="text-[0.78rem] font-semibold text-amber-900">
              2 answers would make this stronger
            </p>
            <p className="mt-0.5 text-[0.72rem] leading-relaxed text-amber-800">
              Shift availability and your typing speed are missing from your
              record for a {ROLE} resume.
            </p>
          </div>

          <span className="flex min-h-12 w-full items-center justify-center rounded-full bg-brand-teal-deep px-5 text-sm font-bold text-white shadow-sm">
            Build my resume
          </span>
        </div>

        {/* the right side: the paper, always in view */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 rounded-t-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
            <p className="text-[0.72rem] font-semibold text-slate-600">
              Preview · Sidebar look
            </p>
            <p className="text-[0.7rem] text-slate-400">
              Sample content until you build
            </p>
          </div>
          {/* A page-shaped live preview: the real sheet at two-thirds scale,
              cropped to one page - the same crop the shipped picker uses for
              its thumbnails. */}
          <div className="rounded-b-2xl border border-t-0 border-slate-200 bg-slate-100 p-2.5 sm:p-4">
            <div className="aspect-[1/1.414] overflow-hidden rounded-lg bg-white shadow-sm">
              <div className="w-[150%] origin-top-left scale-[0.6667]">
                <Sheet template="sidebar" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* the ledger, folded under the workbench */}
      <div className="mt-4 border-t border-slate-200 pt-3.5">
        <p className="text-[0.78rem] font-bold text-brand-ink">
          Your previous resumes
        </p>
        <div className="mt-2 grid gap-2">
          {LEDGER.slice(0, 2).map((entry) => (
            <div
              key={entry.date}
              className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl border border-slate-200 bg-surface px-3.5 py-2.5"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.85rem] font-semibold text-brand-ink">
                  {entry.role}
                </span>
                <span className="text-[0.7rem] text-slate-400">
                  {entry.date} · {entry.template} look
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1 text-[0.76rem] font-semibold text-teal-700">
                View and download <ChevronIcon className="h-3.5 w-3.5" />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- Concept B - the guided flow ----

function FlowStep({
  state,
  marker,
  last,
  children,
}: {
  state: "done" | "now" | "later";
  marker: string;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="relative flex gap-3 pb-4">
      {!last ? (
        <span
          aria-hidden
          className={`absolute left-[13px] top-8 h-[calc(100%-2rem)] w-px ${
            state === "done" ? "bg-brand-teal" : "bg-slate-200"
          }`}
        />
      ) : null}
      <span
        aria-hidden
        className={`z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
          state === "done"
            ? "bg-brand-teal-deep text-white"
            : state === "now"
              ? "bg-surface text-teal-700 ring-2 ring-brand-teal"
              : "bg-slate-100 text-slate-400"
        }`}
      >
        {state === "done" ? <CheckIcon className="h-3.5 w-3.5" /> : marker}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  );
}

function ConceptGuidedFlow() {
  return (
    <div className="mx-auto max-w-xl">
      {/* the slim progress indicator */}
      <div className="flex items-center gap-2">
        {["Who it is for", "What is missing", "Pick a look", "Your resume"].map(
          (label, i) => (
            <span key={label} className="min-w-0 flex-1">
              <span
                aria-hidden
                className={`block h-1 rounded-full ${
                  i === 0
                    ? "bg-brand-teal-deep"
                    : i === 1
                      ? "bg-brand-teal"
                      : "bg-slate-200"
                }`}
              />
              <span
                className={`mt-1.5 block truncate text-[0.66rem] font-semibold ${
                  i <= 1 ? "text-teal-700" : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </span>
          ),
        )}
      </div>

      <ol className="mt-5">
        {/* 1 - who it is for, answered and collapsed */}
        <FlowStep state="done" marker="1">
          <div className="flex min-h-7 flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="text-sm font-semibold text-brand-ink">
              For <span className="text-teal-700">{ROLE}</span>
            </p>
            <p className="text-[0.72rem] text-slate-400">
              locked from Discovery ·{" "}
              <span className="font-semibold text-slate-500 underline underline-offset-2">
                change
              </span>
            </p>
          </div>
        </FlowStep>

        {/* 2 - the gap questions, inline instead of a popup */}
        <FlowStep state="now" marker="2">
          <div className="rounded-2xl border border-brand-teal/40 bg-surface p-4">
            <p className="text-sm font-bold text-brand-ink">
              Two things your record does not answer yet
            </p>
            <p className="mt-1 text-[0.78rem] leading-relaxed text-slate-600">
              Your record covers the rest. These two are what a {ROLE} resume
              still misses - skip either if it does not apply.
            </p>

            <div className="mt-3.5 grid gap-3">
              <div>
                <p className="text-[0.78rem] font-semibold text-slate-800">
                  Which shifts can you work?
                </p>
                <div className="mt-1 rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.82rem] text-brand-ink">
                  Any shift including nights, six days a week
                </div>
              </div>
              <div>
                <p className="text-[0.78rem] font-semibold text-slate-800">
                  Roughly how fast do you type?
                </p>
                <div className="mt-1 h-14 rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.82rem] text-slate-400">
                  Your answer
                </div>
              </div>
              <div>
                <p className="text-[0.78rem] font-semibold text-slate-800">
                  Any other skills this resume should show?
                </p>
                <div className="mt-1 rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.82rem] text-brand-ink">
                  Zoho Desk
                </div>
              </div>
            </div>

            {/* the deviation guard, in the flow rather than over it */}
            <div className="mt-3.5 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-[0.76rem] font-semibold text-amber-900">
                This is not in your record yet
              </p>
              <p className="mt-1.5 flex items-start gap-2.5 text-[0.76rem] leading-snug text-amber-900">
                <span
                  aria-hidden
                  className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border border-amber-700 bg-brand-teal-deep text-white"
                >
                  <CheckIcon className="h-2.5 w-2.5" />
                </span>
                <span>
                  <strong className="font-semibold">Zoho Desk</strong> -
                  confirmed true and backable in an interview, so it joins your
                  record.
                </span>
              </p>
            </div>

            <span className="mt-4 flex min-h-12 w-full items-center justify-center rounded-full bg-brand-teal-deep px-5 text-sm font-bold text-white">
              Save and continue
            </span>
          </div>
        </FlowStep>

        {/* 3 - the look, waiting its turn */}
        <FlowStep state="later" marker="3">
          <div className="flex min-h-7 flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="text-sm font-semibold text-slate-400">Pick a look</p>
            <p className="text-[0.72rem] text-slate-400">
              three ATS-safe styles, previewed full size
            </p>
          </div>
        </FlowStep>

        {/* 4 - the resume itself */}
        <FlowStep state="later" marker="4" last>
          <div className="flex min-h-7 flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="text-sm font-semibold text-slate-400">Your resume</p>
            <p className="text-[0.72rem] text-slate-400">
              read it, then download Word or save as PDF
            </p>
          </div>
        </FlowStep>
      </ol>

      <p className="border-t border-slate-200 pt-3 text-[0.76rem] text-slate-500">
        3 resumes already on your record ·{" "}
        <span className="font-semibold text-teal-700 underline underline-offset-2">
          view and download them
        </span>
      </p>
    </div>
  );
}

// ---- Concept C - the document desk ----

function ConceptDocumentDesk() {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h4 className="text-base font-bold text-brand-ink">
          Your resume for {ROLE}
        </h4>
        <p className="text-[0.74rem] text-slate-500">
          Built 11 Aug 2026 from your record
        </p>
      </div>
      <p className="mt-1 text-[0.8rem] leading-relaxed text-slate-600">
        Every line comes from what you told us - nothing invented. Role words
        your record could truthfully carry:{" "}
        <span className="text-teal-700">
          complaint handling, billing queries, shift work
        </span>
        .
      </p>

      {/* the floating toolbar: the look switcher on the left, the actions on
          the right, sitting over the paper */}
      <div className="relative z-10 mt-3.5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-surface p-2 shadow-lg sm:rounded-full">
        <div className="flex min-w-0 items-center gap-1 rounded-full bg-slate-100 p-1">
          {TEMPLATES.map((t) => (
            <span
              key={t.id}
              className={`flex min-h-9 items-center rounded-full px-3 text-[0.76rem] font-semibold ${
                t.id === "sidebar"
                  ? "bg-brand-violet text-white"
                  : "text-slate-600"
              }`}
            >
              {t.name}
            </span>
          ))}
        </div>
        <div className="relative flex items-center gap-1.5">
          <span className="flex min-h-11 items-center gap-1.5 rounded-full px-3 text-[0.78rem] font-semibold text-slate-600">
            <RefreshIcon className="h-4 w-4" /> Rebuild
          </span>
          <span className="flex min-h-11 items-center gap-1.5 rounded-full bg-brand-teal-deep px-4 text-[0.82rem] font-bold text-white">
            <DownloadIcon className="h-4 w-4" /> Download
          </span>
          {/* the download menu, shown open */}
          <div className="absolute right-0 top-full mt-1.5 w-48 overflow-hidden rounded-xl border border-slate-200 bg-surface shadow-lg">
            <span className="block px-4 py-2.5 text-sm font-semibold text-brand-ink">
              Word (.docx)
            </span>
            <span className="block border-t border-slate-100 px-4 py-2.5 text-sm font-semibold text-brand-ink">
              Print / Save as PDF
            </span>
          </div>
        </div>
      </div>

      {/* the desk: the paper, centred and dominant */}
      <div className="mt-3 rounded-3xl bg-slate-100 p-2.5 sm:p-6">
        <div className="mx-auto max-w-2xl overflow-hidden rounded-lg shadow-[0_18px_40px_-18px_rgba(0,0,0,0.35)]">
          <Sheet template="sidebar" />
        </div>
      </div>

      {/* the ledger as a quiet strip */}
      <div className="mt-4">
        <p className="text-[0.78rem] font-bold text-brand-ink">
          Your previous resumes
        </p>
        <p className="mt-0.5 text-[0.74rem] text-slate-500">
          Each build stays on your record. Open one to read or download it
          again.
        </p>
        <div className="-mx-1 mt-2.5 flex gap-2.5 overflow-x-auto px-1 pb-2">
          {LEDGER.map((entry) => (
            <div
              key={entry.date}
              className="w-40 shrink-0 rounded-2xl border border-slate-200 bg-surface p-2"
            >
              <MiniSheet template={entry.template} />
              <p className="mt-1.5 truncate text-[0.76rem] font-semibold text-brand-ink">
                {entry.role}
              </p>
              <p className="text-[0.68rem] text-slate-400">{entry.date}</p>
              <p className="mt-1 truncate text-[0.66rem] text-teal-700">
                {entry.skills.join(", ")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- the page ----

function Concept({
  label,
  title,
  rationale,
  tradeoff,
  children,
}: {
  label: string;
  title: string;
  rationale: string;
  tradeoff: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto mt-14 max-w-3xl first:mt-10">
      <p className="text-sm font-bold text-teal-700">
        {label} · {title}
      </p>
      <p className="mt-1 text-[0.85rem] text-slate-600">{rationale}</p>
      <p className="mt-1.5 text-[0.8rem] text-slate-500">
        <span className="font-semibold text-slate-600">Trade-off:</span>{" "}
        {tradeoff}
      </p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export const metadata = { title: "Resume builder - three concepts" };

export default function PreviewResumePage() {
  return (
    <main className="min-h-dvh px-5 pb-24 pt-12">
      <div className="mx-auto max-w-3xl">
        <p className="text-[0.7rem] font-semibold tracking-[0.25em] text-teal-700">
          PREVIEW - NOT LINKED FROM THE SITE
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-brand-ink">
          The resume builder, three ways
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Static mockups of the same capability the builder already ships -{" "}
          {ROLE} locked from Discovery, the questions that fill what the record
          misses, the three ATS-safe looks, the built sheet, Word and PDF
          downloads, and the ledger of past builds. Nothing here builds
          anything; the winner gets built into /resume.
        </p>
      </div>

      <Concept
        label="A"
        title="The workbench"
        rationale="Controls on the left, paper on the right: the role, the job posting, the look and the missing answers all sit in one rail, and the sheet beside them shows the look you have picked before you spend a build on it."
        tradeoff="It needs a wide screen to be itself. Below 1024 px the rail stacks above the sheet and the side-by-side promise disappears, and until you build, the paper can only show sample content - not your own words."
      >
        <ConceptWorkbench />
      </Concept>

      <Concept
        label="B"
        title="The guided flow"
        rationale="One thing at a time, in the order the resume is actually made: who it is for, what your record is missing, the look, then your resume. The gap questions stop being a popup and become the step you are on, so nothing is ever hidden behind a dialog."
        tradeoff="It is the slowest route for someone who just wants the same resume again - four steps to reach a rebuild - and the ledger of past resumes has to live at the bottom as a link rather than in reach."
      >
        <ConceptGuidedFlow />
      </Concept>

      <Concept
        label="C"
        title="The document desk"
        rationale="The resume is the page. It sits centred on a desk like real paper, with one floating toolbar carrying the look switcher, Rebuild and Download, and past builds resting underneath as a strip of thumbnails you can scroll."
        tradeoff="This is the after state only - the first-ever build still needs the role and gap screens before there is any paper to show, so the screen has two faces. The toolbar also carries a lot in one bar, and on a 360 px phone it wraps to two rows."
      >
        <ConceptDocumentDesk />
      </Concept>
    </main>
  );
}
