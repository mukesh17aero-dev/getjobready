// Temporary comparison page: three design concepts for REVISING a finished
// resume - the person comments on the draft in plain words, the draft is
// rewritten in place, again and again, and only when it reads right do they
// download it. Static mockups: nothing here revises anything, calls the
// backend or produces a file. Not linked from anywhere; deleted once a
// direction is chosen.
//
// All three frames carry the same story so they can be compared like for
// like: Nithin Kumar's Hub Supervisor resume, built once, then two revisions
// already applied (an untrue bullet removed, the profile shortened) and a
// third one running right now (the college fest moved above the delivery
// job). All three also carry the same honest limit - a revision can reorder
// and reword what the record already holds and nothing else - and concept B
// shows what that refusal looks like when someone asks for more.
//
// The resume sheet is fixed white in every theme, so it uses literal ink
// hexes - exactly as the real ResumeSheet does. Everything around it uses
// the themed tokens.

const ROLE = "Hub Supervisor";

// ---- the sample record ----

const SAMPLE = {
  name: "Nithin Kumar",
  city: "Coimbatore",
  email: "nithin.kumar@example.com",
  summaryLong:
    "Delivery associate with two years at a Coimbatore hub, used to early shifts, load planning and keeping the day moving when a van is short. Comfortable with the scanning app and with the daily count sheet. Handles customer calls in Tamil and English, and steps in at the load bay when the supervisor is on leave. Looking for a Hub Supervisor role where the shift is his to run.",
  summaryShort:
    "Delivery associate with two years at a Coimbatore hub - early shifts, load planning and the daily count sheet. Covers the load bay handover when the supervisor is on leave.",
  skills: [
    {
      group: "Hub operations",
      items: ["Load planning", "Shift handover", "Daily count sheet"],
    },
    {
      group: "Tools",
      items: ["Scanning app", "Google Sheets", "Route sheets"],
    },
  ],
  education: { title: "B.Sc Mathematics, Bharathiar University", period: "2021 - 2024" },
  languages: ["Tamil", "English", "Malayalam"],
};

const JOB = {
  title: "Delivery associate, Sri Vinayaga Logistics",
  period: "2024 - 2026",
  bullets: [
    "Ran a fixed route of 60 to 80 parcels a day and closed the count sheet every evening",
    "Covered load bay handover on the supervisor's off days for six months",
    "Trained two new joiners on the scanning app",
  ],
};

const FEST = {
  title: "Volunteer, logistics desk, Bharathiar University fest",
  period: "2023",
  bullets: [
    "Booked and tracked equipment for 14 events across three days",
    "Sorted out two double bookings on the spot",
  ],
};

// The same revision history in all three concepts: two finished, one running.

const DONE = [
  {
    version: "v3",
    at: "12:19",
    ask: "Make the summary shorter - two lines is plenty.",
    result:
      "Shortened. The profile went from four lines to two and kept the shifts, the load planning and the count sheet. Nothing true was dropped.",
  },
  {
    version: "v2",
    at: "12:14",
    ask: "That bullet about cash collection is not true - I never handled cash.",
    result:
      "Removed. The cash bullet is gone from this resume and off your record, so it will not come back the next time you build.",
  },
];

const RUNNING = {
  version: "v4",
  ask: "Put the college fest before the delivery job.",
  status:
    "Reordering Experience so the fest sits first. Your dates and your own words stay exactly as they are.",
};

const REFUSED = {
  ask: "Add Advanced Excel and team leadership to my skills.",
  reply:
    "I cannot add either one. Your record has Google Sheets from the daily count sheet, and it says you covered handover on the supervisor's off days - it does not say you led anyone or used Excel. If both are true, add them to your profile with where you did them and I will use them here.",
};

const TRUTH_NOTE =
  "A revision reorders and rewords what your record already holds. It never invents a job, a number or a skill. Ask for something your record cannot back and you get told so, plus what to add to your profile if it is true.";

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

function UndoIcon({ className }: { className?: string }) {
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
      <path d="M4 9h11a5 5 0 0 1 0 10h-4" />
      <path d="M8 5 4 9l4 4" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
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
      <path d="M5 12h13" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

// ---- the resume sheet ----
//
// A static stand-in for the real ResumeSheet in the Classic look: fixed white
// paper, literal ink hexes, single column. It takes the two things a revision
// can change - how long the profile is, and what order Experience runs in -
// plus the annotation state concept B needs.

type SectionKey =
  | "profile"
  | "skills"
  | "experience"
  | "education"
  | "languages";

type MarkerState = "applied" | "open" | "refused";

type Marker = { n: number; state: MarkerState };

// Marker colours live on the paper, so they are literal too.
const MARKER_INK: Record<MarkerState, string> = {
  applied: "border-[#0f766e] bg-[#e2f3f0] text-[#0f766e]",
  open: "border-[#b45309] bg-[#fbf0d9] text-[#92400e]",
  refused: "border-[#be123c] bg-[#fbe8eb] text-[#9f1239]",
};

const MARKER_WORD: Record<MarkerState, string> = {
  applied: "note applied",
  open: "note applying",
  refused: "note refused",
};

function SheetSection({
  title,
  marker,
  revising,
  addNote,
  children,
}: {
  title: string;
  /** Concept B pins a numbered note to the section it belongs to. */
  marker?: Marker;
  /** The block being rewritten right now. */
  revising?: boolean;
  /** The affordance that says every section can take a note. */
  addNote?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={
        revising
          ? "-mx-2 mt-5 rounded-md border border-dashed border-[#0f766e] bg-[#f1faf8] px-2 pb-2 pt-1"
          : "mt-5"
      }
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 border-b-2 border-[#111827] pb-1">
        <h3 className="text-[0.95rem] font-bold text-[#111827]">{title}</h3>
        {marker ? (
          <span
            className={`inline-flex h-[1.05rem] min-w-[1.05rem] items-center justify-center rounded-full border px-1 font-sans text-[0.6rem] font-bold ${MARKER_INK[marker.state]}`}
          >
            {marker.n}
            <span className="sr-only"> {MARKER_WORD[marker.state]}</span>
          </span>
        ) : null}
        {revising ? (
          <span className="font-sans text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#0f766e]">
            Rewriting now
          </span>
        ) : null}
        {addNote ? (
          <span className="ml-auto rounded-full border border-dashed border-[#9ca3af] px-2 py-0.5 font-sans text-[0.6rem] font-semibold text-[#6b7280]">
            + note
          </span>
        ) : null}
      </div>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function SheetItem({
  title,
  period,
  bullets,
}: {
  title: string;
  period: string;
  bullets?: string[];
}) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
        <p className="text-[0.88rem] font-semibold">{title}</p>
        <p className="shrink-0 text-[0.84rem] text-[#6b7280]">{period}</p>
      </div>
      {bullets && bullets.length > 0 ? (
        <ul className="mt-1 grid gap-0.5 pl-4">
          {bullets.map((point) => (
            <li key={point} className="list-disc text-[0.84rem] leading-relaxed">
              {point}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Sheet({
  summary = "short",
  order = "job-first",
  markers,
  revising,
  addNoteOn,
}: {
  summary?: "long" | "short";
  order?: "job-first" | "fest-first";
  markers?: Partial<Record<SectionKey, Marker>>;
  revising?: SectionKey;
  addNoteOn?: SectionKey;
}) {
  const experience = order === "fest-first" ? [FEST, JOB] : [JOB, FEST];
  const flags = (key: SectionKey) => ({
    marker: markers?.[key],
    revising: revising === key,
    addNote: addNoteOn === key,
  });

  return (
    <div className="break-words bg-white p-6 font-serif text-[#111827] sm:p-9">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1 border-b border-[#d1d5db] pb-3">
        <h2 className="text-[1.5rem] font-bold tracking-tight text-[#111827]">
          {SAMPLE.name}
        </h2>
        <p className="text-[0.76rem] leading-relaxed text-[#6b7280] [overflow-wrap:anywhere] sm:text-right">
          {SAMPLE.city} · {SAMPLE.email}
        </p>
      </div>

      <SheetSection title="Profile" {...flags("profile")}>
        <p className="text-[0.86rem] leading-relaxed">
          {summary === "long" ? SAMPLE.summaryLong : SAMPLE.summaryShort}
        </p>
      </SheetSection>

      <SheetSection title="Skills" {...flags("skills")}>
        <ul className="grid gap-1">
          {SAMPLE.skills.map((group) => (
            <li key={group.group} className="text-[0.86rem] leading-relaxed">
              <strong className="font-semibold">{group.group}:</strong>{" "}
              {group.items.join(", ")}
            </li>
          ))}
        </ul>
      </SheetSection>

      <SheetSection title="Experience" {...flags("experience")}>
        <div className="grid gap-3">
          {experience.map((item) => (
            <SheetItem
              key={item.title}
              title={item.title}
              period={item.period}
              bullets={item.bullets}
            />
          ))}
        </div>
      </SheetSection>

      <SheetSection title="Education" {...flags("education")}>
        <SheetItem
          title={SAMPLE.education.title}
          period={SAMPLE.education.period}
        />
      </SheetSection>

      <SheetSection title="Languages" {...flags("languages")}>
        <p className="text-[0.86rem] leading-relaxed">
          {SAMPLE.languages.join(", ")}
        </p>
      </SheetSection>
    </div>
  );
}

// ---- shared furniture ----

// The honest limit, stated once per concept in the person's line of sight.
function TruthNote() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
      <p className="text-[0.76rem] font-semibold text-amber-900">
        What a revision can and cannot do
      </p>
      <p className="mt-1 text-[0.74rem] leading-relaxed text-amber-800">
        {TRUTH_NOTE}
      </p>
    </div>
  );
}

// The end of the loop, fenced off from it: downloading is not another
// revision control, so it never sits next to one.
function FinishBand({
  heading,
  note,
  quiet = false,
}: {
  heading: string;
  note: string;
  quiet?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
      <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-slate-400">
        Last step
      </p>
      <p className="mt-1 text-[0.85rem] font-bold text-brand-ink">{heading}</p>
      <p className="mt-1 text-[0.74rem] leading-relaxed text-slate-500">
        {note}
      </p>
      <span
        className={`mt-2.5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-bold ${
          quiet
            ? "border border-slate-300 text-slate-600"
            : "bg-brand-teal-deep text-white shadow-sm"
        }`}
      >
        <DownloadIcon className="h-4 w-4" /> Download my resume
      </span>
      <p className="mt-1.5 text-center text-[0.7rem] text-slate-400">
        Word (.docx) or Print / Save as PDF
      </p>
    </div>
  );
}

// A running revision, shown the same way wherever it appears.
function RunningBar() {
  return (
    <span
      aria-hidden
      className="mt-2 block h-1 w-full overflow-hidden rounded-full bg-slate-200"
    >
      <span className="block h-full w-2/5 rounded-full bg-brand-violet motion-safe:animate-pulse" />
    </span>
  );
}

// ---- Concept A - the comment rail ----

function ConceptCommentRail() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-surface p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-[0.95rem] font-bold text-brand-ink">
          Your resume for {ROLE}
        </p>
        <p className="text-[0.72rem] text-slate-500">
          v3 · one change in progress
        </p>
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
        {/* the paper, left, with the block being rewritten marked on it */}
        <div className="min-w-0">
          <div className="rounded-2xl bg-slate-100 p-2 sm:p-4">
            <div className="overflow-hidden rounded-lg shadow-sm">
              <Sheet summary="short" revising="experience" />
            </div>
          </div>
          <p className="mt-2 text-[0.72rem] leading-relaxed text-slate-500">
            The dashed block is the part being rewritten right now. Everything
            else stays exactly as you last read it.
          </p>
        </div>

        {/* the rail: say it, watch it happen, undo it if it reads worse */}
        <aside className="grid content-start gap-3 lg:sticky lg:top-6">
          <div className="rounded-2xl border border-slate-200 bg-surface p-3.5">
            <p className="text-[0.8rem] font-semibold text-slate-800">
              Tell me what to change
            </p>
            <p className="mt-0.5 text-[0.7rem] leading-snug text-slate-400">
              Plain words are enough: shorter, move this up, this one is not
              true.
            </p>
            <div className="mt-1.5 h-14 rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.78rem] text-slate-400">
              Make the profile mention early shifts
            </div>
            <span className="mt-2 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full border border-slate-300 px-4 text-[0.8rem] font-semibold text-slate-700">
              Send instruction <SendIcon className="h-3.5 w-3.5" />
            </span>
          </div>

          <TruthNote />

          <div>
            <p className="text-[0.78rem] font-bold text-brand-ink">
              Your changes so far
            </p>
            <ol className="mt-2 grid gap-2.5">
              <li className="rounded-2xl border border-brand-violet/50 bg-brand-violet/5 p-3">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-brand-violet-deep">
                  Rewriting now · {RUNNING.version}
                </p>
                <p className="mt-1 text-[0.8rem] font-semibold text-brand-ink">
                  &ldquo;{RUNNING.ask}&rdquo;
                </p>
                <p className="mt-1 text-[0.74rem] leading-relaxed text-slate-600">
                  {RUNNING.status}
                </p>
                <RunningBar />
              </li>
              {DONE.map((rev) => (
                <li
                  key={rev.version}
                  className="rounded-2xl border border-slate-200 bg-surface p-3"
                >
                  <p className="flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-teal-700">
                    <CheckIcon className="h-3 w-3" /> {rev.version} · {rev.at}
                  </p>
                  <p className="mt-1 text-[0.8rem] font-semibold text-brand-ink">
                    &ldquo;{rev.ask}&rdquo;
                  </p>
                  <p className="mt-1 text-[0.74rem] leading-relaxed text-slate-600">
                    {rev.result}
                  </p>
                  <span className="mt-1.5 flex min-h-11 items-center gap-1.5 text-[0.74rem] font-semibold text-slate-500 underline underline-offset-2">
                    <UndoIcon className="h-3.5 w-3.5" /> Put it back
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <FinishBand
            heading="When it reads right, take it away"
            note="Nothing leaves Ascend until you download. You can come back and revise this resume any time - it stays on your record."
          />
        </aside>
      </div>
    </div>
  );
}

// ---- Concept B - annotate in place ----

function NoteRow({
  n,
  state,
  section,
  ask,
  reply,
}: {
  n: number;
  state: MarkerState;
  section: string;
  ask: string;
  reply: string;
}) {
  const chrome: Record<MarkerState, string> = {
    applied: "border-slate-200 bg-surface",
    open: "border-brand-violet/50 bg-brand-violet/5",
    refused: "border-amber-200 bg-amber-50",
  };
  const chip: Record<MarkerState, string> = {
    applied: "border-teal-700 bg-brand-teal-deep/10 text-teal-700",
    open: "border-brand-violet bg-brand-violet/10 text-brand-violet-deep",
    refused: "border-amber-700 bg-amber-100 text-amber-900",
  };
  const label: Record<MarkerState, string> = {
    applied: "Applied",
    open: "Applying now",
    refused: "Cannot be done",
  };
  return (
    <li className={`rounded-2xl border p-3.5 ${chrome[state]}`}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span
          className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[0.66rem] font-bold ${chip[state]}`}
        >
          {n}
        </span>
        <span className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-slate-400">
          {section} · {label[state]}
        </span>
      </div>
      <p className="mt-1.5 text-[0.82rem] font-semibold text-brand-ink">
        &ldquo;{ask}&rdquo;
      </p>
      <p
        className={`mt-1 text-[0.76rem] leading-relaxed ${
          state === "refused" ? "text-amber-800" : "text-slate-600"
        }`}
      >
        {reply}
      </p>
      {state === "refused" ? (
        <span className="mt-1.5 flex min-h-11 items-center text-[0.74rem] font-semibold text-teal-700 underline underline-offset-2">
          Open my profile and add it
        </span>
      ) : null}
      {state === "open" ? <RunningBar /> : null}
    </li>
  );
}

function ConceptAnnotate() {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-[0.95rem] font-bold text-brand-ink">
          Your resume for {ROLE}
        </p>
        <p className="text-[0.72rem] text-slate-500">
          v3 · 3 notes on this page
        </p>
      </div>
      <p className="mt-1 text-[0.8rem] leading-relaxed text-slate-600">
        Tap any section of the page to leave a note on it. The numbers are only
        on your screen - they are never in the file you download.
      </p>

      <div className="mt-3 rounded-3xl bg-slate-100 p-2 sm:p-5">
        <div className="mx-auto max-w-2xl overflow-hidden rounded-lg shadow-[0_18px_40px_-18px_rgba(0,0,0,0.35)]">
          <Sheet
            summary="short"
            markers={{
              profile: { n: 1, state: "applied" },
              skills: { n: 3, state: "refused" },
              experience: { n: 2, state: "open" },
            }}
            revising="experience"
            addNoteOn="education"
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
        <div className="min-w-0">
          <p className="text-[0.78rem] font-bold text-brand-ink">
            Your notes on this page
          </p>
          <ol className="mt-2 grid gap-2.5">
            <NoteRow
              n={1}
              state="applied"
              section="Profile"
              ask={DONE[0].ask}
              reply={DONE[0].result}
            />
            <NoteRow
              n={2}
              state="open"
              section="Experience"
              ask={RUNNING.ask}
              reply={RUNNING.status}
            />
            <NoteRow
              n={3}
              state="refused"
              section="Skills"
              ask={REFUSED.ask}
              reply={REFUSED.reply}
            />
          </ol>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-surface p-3.5">
            <p className="min-w-0 text-[0.76rem] text-slate-500">
              1 note applying · 1 note needs an answer from you · 1 done
            </p>
            <span className="flex min-h-12 items-center justify-center rounded-full bg-slate-100 px-5 text-sm font-bold text-slate-400">
              Applying your notes…
            </span>
          </div>
        </div>

        <aside className="grid content-start gap-3">
          <TruthNote />
          <FinishBand
            quiet
            heading="Download when the page is right"
            note="You can take it now - note 3 will simply stay unanswered. Most people clear their notes first."
          />
        </aside>
      </div>
    </div>
  );
}

// ---- Concept C - the chat-first draft desk ----

function VersionChip({
  version,
  what,
  state,
}: {
  version: string;
  what: string;
  state: "past" | "current" | "building";
}) {
  const chrome =
    state === "current"
      ? "border-teal-700 bg-brand-teal-deep/10"
      : state === "building"
        ? "border-brand-violet/60 border-dashed bg-brand-violet/5"
        : "border-slate-200 bg-surface";
  return (
    <span
      className={`flex w-36 shrink-0 flex-col justify-center rounded-xl border px-3 py-2 ${chrome}`}
    >
      <span
        className={`text-[0.72rem] font-bold ${
          state === "current"
            ? "text-teal-700"
            : state === "building"
              ? "text-brand-violet-deep"
              : "text-slate-500"
        }`}
      >
        {version}
        {state === "current" ? " · showing" : ""}
        {state === "building" ? " · building" : ""}
      </span>
      <span className="mt-0.5 text-[0.68rem] leading-snug text-slate-500">
        {what}
      </span>
    </span>
  );
}

function Bubble({
  who,
  children,
}: {
  who: "you" | "writer";
  children: React.ReactNode;
}) {
  if (who === "you") {
    return (
      <li className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-slate-100 px-3.5 py-2.5">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-slate-400">
            You
          </p>
          <div className="mt-0.5 text-[0.82rem] leading-relaxed text-brand-ink">
            {children}
          </div>
        </div>
      </li>
    );
  }
  return (
    <li className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-slate-200 bg-surface px-3.5 py-2.5">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-teal-700">
          Ascend
        </p>
        <div className="mt-0.5 text-[0.82rem] leading-relaxed text-slate-600">
          {children}
        </div>
      </div>
    </li>
  );
}

function ConceptDraftDesk() {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-[0.95rem] font-bold text-brand-ink">
          Your resume for {ROLE}
        </p>
        <p className="text-[0.72rem] text-slate-500">Showing v3 of 3</p>
      </div>

      {/* the paper on the desk, re-rendered after every turn below it */}
      <div className="mt-3 rounded-3xl bg-slate-100 p-2 sm:p-5">
        <div className="mx-auto max-w-2xl overflow-hidden rounded-lg shadow-[0_18px_40px_-18px_rgba(0,0,0,0.35)]">
          <Sheet summary="short" />
        </div>
      </div>

      {/* the version strip: every turn left a page you can go back to */}
      <div className="mt-3">
        <p className="text-[0.74rem] font-semibold text-slate-500">
          Jump back to any version
        </p>
        <div className="-mx-1 mt-1.5 flex gap-2 overflow-x-auto px-1 pb-2">
          <VersionChip version="v1" what="First build" state="past" />
          <VersionChip version="v2" what="Cash bullet removed" state="past" />
          <VersionChip version="v3" what="Profile shortened" state="current" />
          <VersionChip version="v4" what="Fest moved first" state="building" />
        </div>
      </div>

      {/* the conversation with the writer */}
      <div className="mt-2 rounded-3xl border border-slate-200 bg-surface p-3 sm:p-4">
        <ol className="grid gap-2.5">
          <Bubble who="writer">
            <p>
              This is your resume for {ROLE}, built from your record. Tell me
              what to change and I will rewrite the page above.
            </p>
            <p className="mt-1.5 text-[0.76rem] text-slate-500">{TRUTH_NOTE}</p>
          </Bubble>
          <Bubble who="you">{DONE[1].ask}</Bubble>
          <Bubble who="writer">
            <p>{DONE[1].result}</p>
            <p className="mt-1 text-[0.72rem] font-semibold text-teal-700">
              Page above is now v2
            </p>
          </Bubble>
          <Bubble who="you">{DONE[0].ask}</Bubble>
          <Bubble who="writer">
            <p>{DONE[0].result}</p>
            <p className="mt-1 text-[0.72rem] font-semibold text-teal-700">
              Page above is now v3
            </p>
          </Bubble>
          <Bubble who="you">{RUNNING.ask}</Bubble>
          <li className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-brand-violet/50 bg-brand-violet/5 px-3.5 py-2.5">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-brand-violet-deep">
                Ascend is rewriting
              </p>
              <p className="mt-0.5 text-[0.82rem] leading-relaxed text-slate-600">
                {RUNNING.status}
              </p>
              <span aria-hidden className="mt-2 flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-violet motion-safe:animate-pulse" />
                <span className="h-1.5 w-1.5 rounded-full bg-brand-violet motion-safe:animate-pulse [animation-delay:200ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-brand-violet motion-safe:animate-pulse [animation-delay:400ms]" />
              </span>
            </div>
          </li>
        </ol>

        <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-slate-200 pt-3">
          <div className="min-w-0 flex-1 rounded-2xl border border-slate-300 bg-surface px-3.5 py-2.5 text-[0.82rem] text-slate-400">
            Ask for another change
          </div>
          <span className="flex min-h-11 items-center gap-1.5 rounded-full border border-slate-300 px-4 text-[0.8rem] font-semibold text-slate-700">
            Send <SendIcon className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>

      {/* the loop ends here, well below the conversation */}
      <div className="mx-auto mt-4 max-w-sm">
        <FinishBand
          heading="Happy with it? Take it away"
          note="Downloads the version showing above. The conversation stays on your record, so you can pick it up again later."
        />
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

export const metadata = { title: "Revising a resume - three concepts" };

export default function PreviewResumeRefinePage() {
  return (
    <main className="min-h-dvh px-5 pb-24 pt-12">
      <div className="mx-auto max-w-3xl">
        <p className="text-[0.7rem] font-semibold tracking-[0.25em] text-teal-700">
          PREVIEW - NOT LINKED FROM THE SITE
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-brand-ink">
          Revising the resume, three ways
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Static mockups of a capability the builder does not have yet: after
          the resume is built, you say what is wrong with it in your own words
          and it is rewritten in place, as many times as it takes, and only
          then do you download it. Every frame shows the same story - Nithin
          Kumar&rsquo;s {ROLE} resume, two revisions already applied, a third
          running - so only the arrangement differs. Nothing here revises
          anything; the winner gets built into /resume.
        </p>
      </div>

      <Concept
        label="A"
        title="The comment rail"
        rationale="The page on the left, a rail of your instructions on the right: what you asked, what was changed in reply, and a way to put any of it back. The block being rewritten is outlined on the paper itself, so you always know which part is moving."
        tradeoff="The rail costs a third of the width on a laptop and stacks under the page below 1024 px, where the change history sits off screen. It also assumes you can say what is wrong - it offers no suggestions of its own."
      >
        <ConceptCommentRail />
      </Concept>

      <Concept
        label="B"
        title="Annotate in place"
        rationale="Tap the section you have a problem with and the note attaches there, numbered on the page like a proofreader's mark. You leave as many as you like, then one Apply my notes action rewrites them together - and a note that would need something untrue comes back refused, with what to add to your profile if it is real."
        tradeoff="Batching means you wait for everything at once instead of seeing each change land, and a note that spans two sections has nowhere natural to live. The markers also need explaining once - they are screen-only, never in the file."
      >
        <ConceptAnnotate />
      </Concept>

      <Concept
        label="C"
        title="The chat-first draft desk"
        rationale="The page on top, a conversation with the writer underneath, and a version strip between them: every turn produces a version you can jump back to, so trying a change costs nothing. The most familiar shape of the three - anyone who has used a chat app already knows it."
        tradeoff="The conversation grows down the page, so the paper you are judging scrolls out of sight after a few turns, and a chat box invites requests the record cannot back - the refusal has to do more work here than anywhere else."
      >
        <ConceptDraftDesk />
      </Concept>
    </main>
  );
}
