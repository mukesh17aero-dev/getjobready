import type {
  PassportFeedState,
  PassportJourneyStep,
  PassportOverview as PassportOverviewData,
  PassportSkillComparison,
} from "@/lib/api";
import { PassportShare } from "./passport-share";
import { PassportAchievements, PassportShowcase } from "./passport-showcase";

// The Career Passport, as a private record rather than a certificate.
//
// Nothing here is a self-report: every number traces back to work that was
// watched and marked somewhere else in the product, and a missing feed is
// shown as "not connected yet" rather than folded into a zero. Sharing stays
// visibly off — this is the candidate's own read of their record, not
// something an employer has ever seen.

const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");

/** Same on the server and in the browser — UTC parts, no locale. */
function formatDate(iso: string | null): string {
  if (!iso) return "Awaiting a recorded result";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Awaiting a recorded result";
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** A feed that failed to load reads differently to one nobody has built yet. */
function sourceMessage(state: PassportFeedState, pending: string): string {
  return state === "unavailable"
    ? "This part of your record could not be loaded. Try again later — nothing has been assumed."
    : pending;
}

const STATUS_LABEL: Record<PassportJourneyStep["status"], string> = {
  completed: "Completed",
  in_progress: "In progress",
  not_started: "Not started",
  awaiting_data: "Awaiting data",
};

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span
        aria-hidden
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-mist text-lg text-slate-500"
      >
        +
      </span>
      <div>
        <h3 className="text-[0.85rem] font-semibold text-brand-ink">{title}</h3>
        <p className="mt-0.5 max-w-md text-[0.8rem] leading-relaxed text-slate-600">
          {body}
        </p>
      </div>
    </div>
  );
}

function SectionCard({
  id,
  heading,
  pill,
  children,
}: {
  id?: string;
  heading: string;
  pill?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-4 scroll-mt-6">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-[1.05rem] font-bold tracking-tight text-brand-ink">
          {heading}
        </h2>
        {pill && (
          <span className="rounded-full bg-brand-mist px-2.5 py-0.5 text-[0.65rem] font-semibold text-brand-teal-deep">
            {pill}
          </span>
        )}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-surface p-4">
        {children}
      </div>
    </section>
  );
}

function Stat({
  value,
  label,
  caption,
}: {
  value: string;
  label: string;
  caption: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-surface px-3.5 py-3">
      <strong className="block text-[1.4rem] font-bold text-brand-ink">
        {value}
      </strong>
      <span className="block text-[0.72rem] text-slate-600">{label}</span>
      <span className="block text-[0.62rem] text-slate-400">{caption}</span>
    </div>
  );
}

function Journey({ journey, state }: { journey: PassportJourneyStep[]; state: PassportFeedState }) {
  return (
    <ol className="grid gap-0">
      {journey.map((step, i) => (
        <li key={step.module} className="relative grid grid-cols-[1.8rem_1fr_auto] items-start gap-3 pb-4 last:pb-0">
          {i < journey.length - 1 && (
            <span aria-hidden className="absolute left-[0.85rem] top-7 bottom-0 border-l border-slate-200" />
          )}
          <span
            aria-hidden
            className={`grid h-7 w-7 place-items-center rounded-full border text-[0.68rem] font-bold ${
              step.status === "completed"
                ? "border-brand-teal-deep bg-brand-teal-deep text-white"
                : "border-slate-300 bg-surface text-slate-500"
            }`}
          >
            {step.status === "completed" ? "✓" : i + 1}
          </span>
          <div className="min-w-0">
            <h3 className="text-[0.85rem] font-semibold text-brand-ink">{step.title}</h3>
            <p className="mt-0.5 text-[0.78rem] leading-snug text-slate-600">{step.detail}</p>
            <time className="mt-0.5 block text-[0.68rem] text-slate-400">{formatDate(step.at)}</time>
          </div>
          <span className="justify-self-end rounded-full bg-brand-mist px-2 py-0.5 text-[0.65rem] font-semibold text-slate-600">
            {STATUS_LABEL[step.status]}
          </span>
        </li>
      ))}
      {state === "unavailable" && (
        <p className="mt-2 text-[0.75rem] text-slate-500">
          {sourceMessage(state, "")}
        </p>
      )}
    </ol>
  );
}

function Skills({ skills, state }: { skills: PassportSkillComparison[]; state: PassportFeedState }) {
  if (skills.length === 0) {
    return (
      <Empty
        title="Skill results will appear here"
        body={sourceMessage(
          state,
          "A starting assessment and a comparable after-training assessment will show progress here. A missing score is never shown as zero.",
        )}
      />
    );
  }
  return (
    <>
      <div className="mb-2 flex flex-wrap gap-4 text-[0.72rem] text-slate-600">
        <span><i aria-hidden className="mr-1 inline-block h-1 w-4 rounded bg-slate-300 align-middle" />Starting assessment</span>
        <span><i aria-hidden className="mr-1 inline-block h-1 w-4 rounded bg-brand-teal-deep align-middle" />After-training assessment</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-left">
          <thead>
            <tr className="text-[0.62rem] font-semibold uppercase tracking-wide text-slate-500">
              <th scope="col" className="pb-2 pr-3">Skill</th>
              <th scope="col" className="pb-2 pr-3">Before</th>
              <th scope="col" className="pb-2 pr-3">After</th>
              <th scope="col" className="pb-2">Change</th>
            </tr>
          </thead>
          <tbody>
            {skills.map((s) => (
              <tr key={s.id} className="border-t border-slate-100 align-top">
                <td className="py-3 pr-3">
                  <strong className="text-[0.85rem] font-semibold text-brand-ink">{s.name}</strong>
                  <div className="mt-1.5 grid max-w-[12rem] gap-1" aria-hidden>
                    <div className="h-1 rounded bg-slate-200"><div className="h-1 rounded bg-slate-400" style={{ width: `${s.before?.score ?? 0}%` }} /></div>
                    <div className="h-1 rounded bg-slate-200"><div className="h-1 rounded bg-brand-teal-deep" style={{ width: `${s.after?.score ?? 0}%` }} /></div>
                  </div>
                  <details className="mt-1.5 text-[0.7rem] text-slate-500">
                    <summary className="cursor-pointer">Basis</summary>
                    <p className="mt-1 leading-relaxed">{s.explanation}</p>
                  </details>
                </td>
                <td className="py-3 pr-3 text-[0.85rem] font-semibold tabular-nums text-brand-ink">
                  {s.before ? s.before.score : "—"}
                  <small className="mt-0.5 block text-[0.62rem] font-normal text-slate-400">
                    {s.before ? formatDate(s.before.at) : "Not yet available"}
                  </small>
                </td>
                <td className="py-3 pr-3 text-[0.85rem] font-semibold tabular-nums text-brand-ink">
                  {s.after ? s.after.score : "—"}
                  <small className="mt-0.5 block text-[0.62rem] font-normal text-slate-400">
                    {s.after ? formatDate(s.after.at) : "Not yet available"}
                  </small>
                </td>
                <td className="py-3 text-[0.8rem] font-semibold text-brand-teal-deep">
                  {s.change === null ? <span className="text-slate-400">Not comparable</span> : `${s.change > 0 ? "+" : ""}${s.change} pts`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 border-t border-slate-100 pt-3 text-[0.72rem] leading-relaxed text-slate-500">
        No overall employability score is inferred here. Scores describe recorded work, and a change is measured in
        percentage points — not percentage improvement.
      </p>
    </>
  );
}

export function PassportOverview({
  overview,
  name,
  photo,
  /**
   * False for the public link an employer opens: the frozen page they see
   * offers no way to create or revoke a share — that control belongs only
   * to the candidate, on their own copy of this same component.
   */
  shareControls = true,
  afterShowcase = null,
}: {
  overview: PassportOverviewData;
  name: string;
  photo?: string | null;
  shareControls?: boolean;
  /** The candidate's own private extras under the showcase, such as the application review. */
  afterShowcase?: React.ReactNode;
}) {
  const candidate = overview.candidate.data;
  const journeyDash = overview.sources.journey === "available" ? `${overview.summary.completedModules} / ${overview.summary.totalModules}` : "—";
  const skillsDash = overview.sources.assessments === "available" ? String(overview.summary.assessedSkills) : "—";
  const achieved = (overview.achievements ?? []).filter((a) => !a.hidden).length || "—";

  return (
    <div>
      <div className="rounded-2xl bg-brand-panel p-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-white/60">
              ASCEND Career Passport
            </p>
            <h2 className="mt-1 truncate text-[1.3rem] font-bold leading-tight">{name}</h2>
            <p className="mt-0.5 text-[0.85rem] text-white/80">
              {overview.role?.title ?? "Choose a target role"}
            </p>
          </div>
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" referrerPolicy="no-referrer" className="h-14 w-14 shrink-0 rounded-full object-cover" />
          ) : null}
        </div>
        {candidate?.summary && (
          <p className="mt-2 max-w-xl text-[0.8rem] leading-relaxed text-white/70">{candidate.summary}</p>
        )}
        {candidate?.location && (
          <p className="mt-1 text-[0.72rem] text-white/60">{candidate.location}</p>
        )}
        <p className="mt-3 inline-block rounded-full border border-white/25 px-2.5 py-0.5 text-[0.62rem] font-semibold tracking-wide text-white/80">
          {overview.sharing.active ? "Shared · Link is live" : "Private · Not shared with employers"}
        </p>
      </div>

      <PassportShowcase showcase={overview.showcase ?? []} editable={shareControls} roleTitle={overview.role?.title ?? null} />
      {afterShowcase}

      <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <Stat value={journeyDash} label="Journey stages completed" caption="Completion, not proficiency" />
        <Stat value={skillsDash} label="Skills with assessments" caption="Evidence-backed observations" />
        <Stat value={String(achieved)} label="Marked achievements" caption="Scored or submitted work" />
      </div>

      <SectionCard id="skills" heading="From starting point to progress" pill="Same-rubric comparison">
        <Skills skills={overview.skills} state={overview.sources.assessments} />
      </SectionCard>

      <PassportAchievements
        showcase={overview.showcase ?? []}
        achievements={overview.achievements ?? []}
        editable={shareControls}
        roleTitle={overview.role?.title ?? null}
      />

      <SectionCard id="journey" heading="The candidate journey" pill="Private record">
        <Journey journey={overview.journey} state={overview.sources.journey} />
      </SectionCard>

      <SectionCard heading="Background & experience" pill="Candidate supplied">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-[0.75rem] font-semibold text-brand-ink">Education</h3>
            {candidate && candidate.education.length > 0 ? (
              <div className="mt-1.5 grid gap-2">
                {candidate.education.map((item, i) => (
                  <div key={i} className="border-b border-slate-100 pb-1.5 text-[0.78rem] last:border-0">
                    <strong className="block font-semibold text-brand-ink">{item.title}</strong>
                    <span className="text-slate-600">{item.organisation}</span>
                    <span className="block text-[0.68rem] text-slate-400">{item.period ?? "Date not supplied"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-[0.78rem] text-slate-500">Education has not been added yet.</p>
            )}
          </div>
          <div>
            <h3 className="text-[0.75rem] font-semibold text-brand-ink">Experience & projects</h3>
            {candidate && candidate.experience.length > 0 ? (
              <div className="mt-1.5 grid gap-2">
                {candidate.experience.map((item, i) => (
                  <div key={i} className="border-b border-slate-100 pb-1.5 text-[0.78rem] last:border-0">
                    <strong className="block font-semibold text-brand-ink">{item.title}</strong>
                    <span className="text-slate-600">{item.organisation}</span>
                    <span className="block text-[0.68rem] text-slate-400">{item.period ?? "Date not supplied"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-[0.78rem] text-slate-500">Experience has not been added yet.</p>
            )}
          </div>
        </div>
      </SectionCard>

      {shareControls ? (
        <PassportShare sharing={overview.sharing} />
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-brand-mist p-4">
          <h3 className="text-[0.85rem] font-semibold text-brand-ink">A private snapshot, shared by the candidate</h3>
          <p className="mt-0.5 max-w-md text-[0.78rem] text-slate-600">
            This is exactly what the candidate approved when they shared this link — it does not update as their record
            changes, and they can revoke it at any time.
          </p>
        </div>
      )}

      <ul className="mt-3 grid gap-0.5 text-[0.68rem] text-slate-400">
        {overview.limitations.map((line) => <li key={line}>{line}</li>)}
      </ul>
    </div>
  );
}
