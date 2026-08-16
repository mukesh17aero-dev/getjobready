// Temporary comparison page: three design concepts for the interview SETUP
// (pre-call) screen. Static mockups - nothing here starts an interview or
// touches a microphone. Not linked from anywhere; deleted once a direction
// is chosen.
//
// All three frames show the same facts: Customer Success Associate locked
// from Discovery, an HR/Managerial choice with HR picked, the honest
// 10-minute timebox, interviewer Asha, and two past interviews.

const ROLE = "Customer Success Associate";

const PAST = [
  {
    role: ROLE,
    round: "HR",
    date: "9 Aug 2026",
    focus: "Focus next: structure answers as situation, action, result.",
  },
  {
    role: ROLE,
    round: "Managerial",
    date: "2 Aug 2026",
    focus: "Focus next: one concrete example beats three vague ones.",
  },
];

// ---- small inline icons (stroke inherits currentColor) ----

function MicIcon({ className }: { className?: string }) {
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
      <path d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3Z" />
      <path d="M6 11a6 6 0 0 0 12 0" />
      <path d="M12 17v4" />
      <path d="M9 21h6" />
    </svg>
  );
}

function PersonIcon({ className }: { className?: string }) {
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
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M4.5 20c1.4-3.3 4.2-5 7.5-5s6.1 1.7 7.5 5" />
    </svg>
  );
}

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

function ClockIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

// The HR/Managerial choice as a segmented control, HR picked - shared look
// across the three concepts.
function RoundSegments() {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
      <span className="flex min-h-11 items-center justify-center rounded-lg bg-brand-teal-deep px-2 text-center text-[0.8rem] font-bold text-white">
        HR round
      </span>
      <span className="flex min-h-11 items-center justify-center rounded-lg px-2 text-center text-[0.8rem] font-semibold text-slate-600">
        Managerial
      </span>
    </div>
  );
}

// A static mic-level meter: the first bars lit, one breathing.
function MicMeter({ onDark }: { onDark?: boolean }) {
  const lit = onDark ? "bg-brand-teal-soft" : "bg-brand-teal-deep";
  const dim = onDark ? "bg-white/20" : "bg-slate-200";
  return (
    <span aria-hidden className="flex h-5 items-end gap-1">
      {[8, 12, 16, 10, 18, 14, 9, 6, 5, 4, 4, 4].map((h, i) => (
        <span
          key={i}
          className={`w-1.5 rounded-full ${i < 7 ? lit : dim} ${
            i === 4 ? "motion-safe:animate-pulse" : ""
          }`}
          style={{ height: `${h}px` }}
        />
      ))}
    </span>
  );
}

// Past interviews as quiet rows - concepts A and C reuse this.
function PastRows() {
  return (
    <div className="grid gap-2">
      {PAST.map((past) => (
        <div
          key={past.date}
          className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-surface px-4 py-3"
        >
          <span className="min-w-0">
            <span className="block truncate text-[0.85rem] font-semibold text-brand-ink">
              {past.role}
            </span>
            <span className="mt-0.5 flex flex-wrap items-center gap-2 text-[0.72rem] text-slate-400">
              <span className="rounded-full bg-brand-teal-deep/10 px-2 py-0.5 font-semibold text-teal-700">
                {past.round} round
              </span>
              {past.date}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-[0.78rem] font-semibold text-teal-700">
            View read-out <ChevronIcon className="h-3.5 w-3.5" />
          </span>
        </div>
      ))}
    </div>
  );
}

// ---- Concept A - the briefing card ----

function ConceptBriefing() {
  return (
    <div className="mx-auto max-w-md">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-surface shadow-sm">
        {/* the invite header: who you are meeting */}
        <div className="flex items-center gap-3 border-b border-slate-200 bg-violet-50 px-5 py-4">
          <span
            aria-hidden
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-violet-deep text-white"
          >
            <PersonIcon className="h-5.5 w-5.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[0.68rem] font-bold uppercase tracking-wide text-brand-violet-deep">
              Practice interview
            </p>
            <p className="truncate text-sm font-bold text-brand-ink">
              Asha - your interviewer
            </p>
          </div>
        </div>

        <div className="space-y-4 px-5 py-4">
          {/* the role, locked from Discovery */}
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-wide text-slate-400">
              Role
            </p>
            <p className="mt-0.5 text-base font-bold text-brand-ink">{ROLE}</p>
            <p className="mt-0.5 text-[0.78rem] text-slate-500">
              The direction you chose in Discovery ·{" "}
              <span className="font-semibold text-slate-600 underline underline-offset-2">
                practise for a different role
              </span>
            </p>
          </div>

          {/* the round */}
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-wide text-slate-400">
              Round
            </p>
            <div className="mt-1.5">
              <RoundSegments />
            </div>
            <p className="mt-1.5 text-[0.78rem] text-slate-500">
              Motivation, communication and how you work with people.
            </p>
          </div>

          {/* the honest timebox */}
          <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 px-3.5 py-3">
            <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <p className="text-[0.8rem] leading-relaxed text-slate-600">
              10 minutes, timeboxed - six questions at most, and it ends on time.
              Asha speaks; answer out loud or type.
            </p>
          </div>

          {/* the one door in */}
          <span className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-teal-deep text-sm font-bold text-white shadow-sm">
            <MicIcon className="h-4 w-4" /> Start the interview
          </span>
        </div>
      </div>

      <h4 className="mt-6 text-[0.8rem] font-bold uppercase tracking-wide text-brand-ink">
        Your past interviews
      </h4>
      <div className="mt-2.5">
        <PastRows />
      </div>
    </div>
  );
}

// ---- Concept B - the green room ----

function ConceptGreenRoom() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-surface p-4 shadow-sm sm:p-5">
      <div className="grid gap-4 sm:grid-cols-[1.05fr_1fr] sm:gap-5">
        {/* your preview tile, camera-off style */}
        <div className="flex min-h-72 flex-col rounded-2xl bg-brand-panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-white/85">You</p>
            <span className="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wide text-white/60">
              <span aria-hidden className="h-2 w-2 rounded-full bg-emerald-500" />
              Ready
            </span>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-4 text-center">
            <span
              aria-hidden
              className="grid h-16 w-16 place-items-center rounded-full bg-white/10 text-xl font-bold text-white/85"
            >
              P
            </span>
            <p className="text-sm font-semibold text-white/85">Priya</p>
            <div className="mt-2 flex items-center gap-2.5 rounded-full bg-white/10 px-3.5 py-2">
              <MicIcon className="h-4 w-4 text-white/80" />
              <MicMeter onDark />
            </div>
            <p className="text-[0.72rem] text-white/60">
              We can hear you - speak normally.
            </p>
          </div>
          {/* tips carousel, static frame */}
          <div className="rounded-xl bg-white/5 px-3.5 py-2.5">
            <p className="text-[0.72rem] leading-relaxed text-white/75">
              Tip 1 of 3 - answer with one concrete example, not a list of
              qualities.
            </p>
            <span aria-hidden className="mt-2 flex items-center gap-1.5">
              <span className="h-1.5 w-4 rounded-full bg-white/80" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
            </span>
          </div>
        </div>

        {/* what you are joining */}
        <div className="flex flex-col justify-center">
          <p className="text-[0.68rem] font-bold uppercase tracking-wide text-brand-violet-deep">
            You are joining
          </p>
          <h4 className="mt-1 text-lg font-bold leading-snug text-brand-ink">{ROLE}</h4>
          <p className="mt-1 text-[0.78rem] text-slate-500">
            With Asha · locked from your Discovery choice
          </p>
          <div className="mt-4">
            <RoundSegments />
          </div>
          <p className="mt-3 flex items-start gap-2 text-[0.8rem] leading-relaxed text-slate-600">
            <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            10 minutes - six questions at most, ends on time.
          </p>
          <span className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-teal-deep text-sm font-bold text-white shadow-sm">
            <MicIcon className="h-4 w-4" /> Join the interview
          </span>
          <p className="mt-3 text-center text-[0.78rem] font-semibold text-slate-500">
            No mic today?{" "}
            <span className="text-slate-600 underline underline-offset-2">
              Type your answers instead
            </span>
          </p>
          <p className="mt-4 border-t border-slate-200 pt-3 text-[0.78rem] text-slate-500">
            2 past interviews ·{" "}
            <span className="font-semibold text-teal-700 underline underline-offset-2">
              read their read-outs
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ---- Concept C - the checklist runway ----

function RunwayStep({
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

function ConceptRunway() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <ol className="mt-1">
        {/* 1 - role, confirmed and collapsed */}
        <RunwayStep state="done" marker="1">
          <div className="flex min-h-7 flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="text-sm font-semibold text-brand-ink">
              Role - <span className="text-teal-700">{ROLE}</span>
            </p>
            <p className="text-[0.72rem] text-slate-400">
              locked from Discovery ·{" "}
              <span className="font-semibold text-slate-500 underline underline-offset-2">
                change
              </span>
            </p>
          </div>
        </RunwayStep>

        {/* 2 - round, chosen and collapsed */}
        <RunwayStep state="done" marker="2">
          <div className="flex min-h-7 flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="text-sm font-semibold text-brand-ink">
              Round - <span className="text-teal-700">HR</span>
            </p>
            <p className="text-[0.72rem] text-slate-400">
              motivation and people skills ·{" "}
              <span className="font-semibold text-slate-500 underline underline-offset-2">
                change
              </span>
            </p>
          </div>
        </RunwayStep>

        {/* 3 - mic check, the open step */}
        <RunwayStep state="now" marker="3">
          <div className="rounded-2xl border border-brand-teal/40 bg-surface p-4">
            <p className="text-sm font-bold text-brand-ink">Mic check</p>
            <div className="mt-2.5 flex items-center gap-2.5 rounded-full bg-slate-50 px-3.5 py-2">
              <MicIcon className="h-4 w-4 text-slate-500" />
              <MicMeter />
            </div>
            <p className="mt-2 text-[0.78rem] text-slate-500">
              Say anything - the meter should move.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="inline-flex min-h-11 items-center rounded-full bg-brand-teal-deep px-5 text-sm font-bold text-white">
                Mic works - continue
              </span>
              <span className="inline-flex min-h-11 items-center text-sm font-semibold text-slate-600 underline underline-offset-2">
                Skip - I will type
              </span>
            </div>
          </div>
        </RunwayStep>

        {/* 4 - start, waiting its turn */}
        <RunwayStep state="later" marker="4" last>
          <div className="flex min-h-7 flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="text-sm font-semibold text-slate-400">Start the interview</p>
            <p className="text-[0.72rem] text-slate-400">
              10 minutes with Asha - unlocks after the mic check
            </p>
          </div>
        </RunwayStep>
      </ol>

      {/* the side rail: past interviews on desktop, stacked below on mobile */}
      <aside>
        <h4 className="text-[0.8rem] font-bold uppercase tracking-wide text-brand-ink">
          Your past interviews
        </h4>
        <div className="mt-2.5 grid gap-2">
          {PAST.map((past) => (
            <div
              key={past.date}
              className="rounded-2xl border border-slate-200 bg-surface px-4 py-3"
            >
              <p className="truncate text-[0.85rem] font-semibold text-brand-ink">
                {past.role}
              </p>
              <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[0.72rem] text-slate-400">
                <span className="rounded-full bg-brand-teal-deep/10 px-2 py-0.5 font-semibold text-teal-700">
                  {past.round} round
                </span>
                {past.date}
              </p>
              <p className="mt-1.5 text-[0.75rem] leading-relaxed text-slate-500">
                {past.focus}
              </p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

// ---- the page ----

function Concept({
  label,
  title,
  rationale,
  children,
}: {
  label: string;
  title: string;
  rationale: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto mt-14 max-w-3xl first:mt-10">
      <p className="text-sm font-bold text-teal-700">
        {label} · {title}
      </p>
      <p className="mt-1 text-[0.85rem] text-slate-600">{rationale}</p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function PreviewInterviewSetupPage() {
  return (
    <main className="min-h-dvh px-5 pb-24 pt-12">
      <div className="mx-auto max-w-3xl">
        <p className="text-[0.7rem] font-semibold tracking-[0.25em] text-teal-700">
          PREVIEW - NOT LINKED FROM THE SITE
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-brand-ink">
          The interview setup, three ways
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Static mockups of the pre-call screen with the same facts everywhere -{" "}
          {ROLE} locked from Discovery, HR or Managerial, the honest 10-minute
          timebox, and two past interviews. Nothing here starts anything; the
          winner gets built into /interview.
        </p>
      </div>

      <Concept
        label="A"
        title="The briefing card"
        rationale="One centred card, read top to bottom like a calendar invite: who you are meeting, the role, the round, the timebox, one Start button. Nothing to learn."
      >
        <ConceptBriefing />
      </Concept>

      <Concept
        label="B"
        title="The green room"
        rationale="The pattern every video-call app uses before joining: your own tile with a live mic check and a tip on the left, what you are joining and the Join button on the right."
      >
        <ConceptGreenRoom />
      </Concept>

      <Concept
        label="C"
        title="The checklist runway"
        rationale="Setup as a runway of steps that collapse as they complete - role, round, mic check, start - so the only thing open is the thing to do next; past interviews ride in a side rail."
      >
        <ConceptRunway />
      </Concept>
    </main>
  );
}
