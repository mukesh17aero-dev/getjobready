"use client";

import { Dialog } from "@/components/ui/dialog";
import { PayProgression } from "./pay-progression";
import { WorkMix } from "./work-mix";
import type { RoleDetail } from "@/lib/api";
import { Check } from "@/components/ui/icons";
import { Blurred, LockedNote } from "@/components/ui/locked-blur";
import { WhyThisRole } from "./why-this-role";

const money = (n: number) => `₹${Math.round(n / 1000)}K`;
export const payRange = (p: { min: number; max: number }) =>
  `${money(p.min)}–${money(p.max)}/mo`;

function Section({
  title,
  hint,
  locked = false,
  children,
}: {
  title: string;
  hint?: string;
  /** Heading readable, contents blurred. See RoleBody's note on why. */
  locked?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5 border-t border-slate-200 pt-4 first:mt-0">
      <h3 className="flex items-baseline gap-2 text-[0.95rem] font-semibold tracking-tight text-slate-900">
        <span aria-hidden className="h-3.5 w-1 rounded-full bg-brand-violet" />
        {title}
        {hint && (
          <span className="text-[0.75rem] font-normal text-slate-500">
            {hint}
          </span>
        )}
      </h3>
      <div className="mt-2.5">
        {locked ? <Blurred>{children}</Blurred> : children}
      </div>
    </section>
  );
}

// Blueprint Screen 11 — "Role Detail and Reality Check", shown as a preview
// over the matches rather than a separate page: tasks, work context, pay,
// growth and the honest costs.
export function RolePreview({
  role,
  matchLine,
  onClose,
  onChoose,
  choosing = false,
  chosen = false,
  assistant,
  bodyRef,
  signedOut = false,
  tour = false,
}: {
  role: RoleDetail;
  signedOut?: boolean;
  /** Passed straight to RoleBody - see the note there. */
  tour?: boolean;
  matchLine?: string;
  onClose: () => void;
  onChoose?: () => void;
  choosing?: boolean;
  chosen?: boolean;
  /** The discovery assistant, docked between the role and the footer. */
  assistant?: React.ReactNode;
  /** Exposes the scrolling body so the assistant can read attention. */
  bodyRef?: React.RefObject<HTMLElement | null>;
}) {
  return (
    <Dialog
      title={role.roleId
        .split("_")
        .map((w) => w[0]?.toUpperCase() + w.slice(1))
        .join(" ")
        .replace("Associate", "Associate")}
      subtitle={`${role.sector}${matchLine ? ` · ${matchLine}` : ""}`}
      onClose={onClose}
      assistant={assistant}
      bodyRef={bodyRef}
      footer={
        onChoose && (
          <>
            <button
              type="button"
              disabled={choosing || chosen}
              onClick={onChoose}
              className={`rounded-lg px-5 py-2 text-sm font-bold text-white transition-colors disabled:opacity-70 ${
                chosen
                  ? "bg-brand-teal"
                  : "bg-brand-violet hover:bg-brand-violet-deep"
              }`}
            >
              {chosen ? (
                <span className="inline-flex items-center gap-1.5">
                  <Check size={15} /> Your selected role
                </span>
              ) : choosing ? (
                "Saving…"
              ) : (
                "Choose this role"
              )}
            </button>
          </>
        )
      }
    >
      <RoleBody role={role} signedOut={signedOut} tour={tour} />
    </Dialog>
  );
}

/**
 * The role itself - everything Blueprint Screen 11 asks for, with no shell
 * around it. Extracted from the dialog so the same sections can stand on a
 * page: on a guided tour each role gets a screen of its own, and a dialog is
 * the wrong container for something you are meant to sit with.
 */
export type RolePart = "all" | "work" | "reality" | "growth";

export function RoleBody({
  role,
  signedOut = false,
  tour = false,
  part = "all",
}: {
  role: RoleDetail;
  /**
   * Which part of the role to show. The role page splits the body into
   * tabs - the work, the reality check, skills and growth - and the pitch
   * and description are its own header. The tour still reads it whole.
   */
  part?: RolePart;
  /**
   * True on a tour stop, false on the role description.
   *
   * The two surfaces show the same job and are meant to read identically -
   * except for the sections that only make sense to somebody mid-decision.
   * See the note at the call site below.
   */
  tour?: boolean;
  /**
   * Signed out, the pitch, the description and the first section read in
   * full - enough to know what the job is and whether to care - and every
   * section after it keeps its heading with its contents blurred. The
   * headings stay because what is behind the account should be nameable:
   * hiding the list as well would make the ask look bigger than it is.
   */
  signedOut?: boolean;
}) {
  const show = (which: Exclude<RolePart, "all">) => part === "all" || part === which;
  return (
    <>
      {/* Full width, like every rule and section below it. Capping these two at
      prose width left the section rules running past the text they belong to,
      which reads as a mistake even when it is deliberate. */}
      {part === "all" && (
        <>
          <p className="text-[0.95rem] font-medium leading-snug text-slate-900">
            {role.pitch}
          </p>
          <p className="mt-2 text-[0.88rem] leading-relaxed text-slate-600">
            {role.description}
          </p>
        </>
      )}

      {show("work") && (
      <Section title="How the day is spent" hint="share of working hours">
        <WorkMix mix={role.workMix} />
      </Section>
      )}

      {signedOut && part === "all" && (
        <LockedNote label="The rest of this role - the work itself, what it pays, the hard parts and who it suits - is behind an account." />
      )}

      {show("work") && (
      <Section locked={signedOut} title="What you'll do" hint="the work itself">
        <ul className="grid gap-1.5 text-[0.85rem] text-slate-600">
          {role.responsibilities.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden className="text-slate-500">
                ▪
              </span>
              {item}
            </li>
          ))}
        </ul>
      </Section>
      )}

      {show("work") && (
      <Section locked={signedOut} title="This suits you if…">
        <ul className="grid gap-1.5 text-[0.85rem] text-slate-600">
          {role.suitsYouIf.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-brand-teal-deep">
                <Check size={14} />
              </span>
              {line}
            </li>
          ))}
        </ul>
      </Section>
      )}

      {show("growth") && (
      <Section locked={signedOut} title="Required Skills">
        <ul className="grid gap-2 sm:grid-cols-2">
          {role.skills.map((skill) => (
            <li
              key={skill.name}
              className="rounded-lg border border-slate-200 px-3 py-2"
            >
              <span className="block text-[0.82rem] font-semibold text-slate-900">
                {skill.name}
              </span>
              <span className="text-[0.76rem] leading-snug text-slate-500">
                {skill.why}
              </span>
            </li>
          ))}
        </ul>
      </Section>
      )}

      {show("growth") && (
      <Section
        locked={signedOut}
        title="Pay and career growth"
        hint="monthly, indicative"
      >
        <PayProgression growth={role.growth} />
        <p className="mt-2 text-[0.75rem] leading-snug text-slate-500">
          {role.payNote}
        </p>
      </Section>
      )}

      {show("reality") && (
      <Section locked={signedOut} title="Working conditions">
        <dl className="grid gap-x-6 gap-y-2 text-[0.82rem] sm:grid-cols-2">
          {[
            ["Environment", role.workContext.environment],
            ["Hours", role.workContext.hours],
            ["Pace", role.workContext.pace],
            ["Team", role.workContext.team],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-slate-500">
                {label}
              </dt>
              <dd className="mt-0.5 text-slate-600">{value}</dd>
            </div>
          ))}
        </dl>
      </Section>
      )}

      {show("reality") && (
      <Section locked={signedOut} title="The hard parts, honestly">
        <ul className="grid gap-1.5 rounded-xl bg-amber-50/70 p-3.5 text-[0.82rem] text-amber-900">
          {role.hardTruths.map((truth) => (
            <li key={truth} className="flex gap-2">
              <span aria-hidden>·</span>
              {truth}
            </li>
          ))}
        </ul>
      </Section>
      )}

      {/* Only on the tour. Reading a role is someone asking "what is this
      job?"; the tour is the walk they agreed to take, and these are the
      questions worth putting in front of somebody who is weighing it up
      rather than looking it up. On the description they would push the work
      itself down the page to answer a question nobody had asked yet. */}
      {tour && <StudentQuestions role={role} signedOut={signedOut} />}

      {show("reality") && role.voices.length > 0 && (
        <Section locked={signedOut} title="People doing this job">
          {role.voicesIllustrative && (
            <p className="mb-2.5 rounded-lg bg-slate-100 px-3 py-2 text-[0.75rem] leading-snug text-slate-600">
              <strong className="font-semibold">Illustrative:</strong> these are
              composite stories written from the pay and progression data above,
              not real individuals. Real, named and consented quotes replace
              them as pilot employers supply them.
            </p>
          )}
          <ul className="grid gap-3">
            {role.voices.map((voice) => (
              <li key={voice.name} className="rounded-xl bg-slate-50 p-3.5">
                <p className="text-[0.85rem] italic leading-relaxed text-slate-700">
                  &ldquo;{voice.quote}&rdquo;
                </p>
                <p className="mt-1.5 text-[0.75rem] font-semibold text-slate-700">
                  {voice.name} &middot;{" "}
                  <span className="font-normal text-slate-500">
                    {voice.title}
                  </span>
                </p>
                <p className="text-[0.75rem] text-slate-500">{voice.journey}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

  {/* The last thing on a role, signed out: why it is in front of them. */}
  {signedOut && part === "all" && <WhyThisRole />}
    </>
  );
}

/**
 * The questions themselves are the product's structure, like every other
 * section heading here. The answers are published content, and a question
 * nobody has answered for this role does not appear - an empty heading would
 * advertise a gap rather than close one.
 *
 * Asked as questions rather than labelled as topics because that is the
 * difference between a platform and a companion: "Eligibility" is a field on
 * a form, "Would they take someone like me?" is what the person is thinking.
 */
function StudentQuestions({
  role,
  signedOut,
}: {
  role: RoleDetail;
  signedOut: boolean;
}) {
  const q = role.studentQuestions;
  const answered = (
    [
      ["Would they take someone like me?", q?.entry],
      ["Where are these jobs - would I have to move?", q?.where],
      ["If I leave after a year, what do I take with me?", q?.transfers],
      ["Will this job still exist?", q?.changing],
    ] as const
  ).filter(([, answer]) => answer && answer.trim() !== "");

  const industries = (role.acrossIndustries ?? []).filter(
    (row) => row.industry.trim() !== "" && row.difference.trim() !== "",
  );

  if (answered.length === 0 && industries.length === 0) return null;

  return (
    <>
      {answered.length > 0 && (
        <Section
          locked={signedOut}
          title="What you're actually wondering"
          hint="the questions nobody answers"
        >
          <dl className="grid gap-3">
            {answered.map(([question, answer]) => (
              <div key={question}>
                <dt className="text-[0.82rem] font-semibold text-slate-900">
                  {question}
                </dt>
                <dd className="mt-0.5 text-[0.82rem] leading-relaxed text-slate-600">
                  {answer}
                </dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      {industries.length > 0 && (
        <Section
          locked={signedOut}
          title="The same job, different industries"
          hint="what changes"
        >
          <ul className="grid gap-2.5">
            {industries.map((row) => (
              <li
                key={row.industry}
                className="border-l-2 border-slate-200 pl-3"
              >
                <span className="block text-[0.8rem] font-semibold text-slate-900">
                  {row.industry}
                </span>
                <span className="text-[0.82rem] leading-relaxed text-slate-600">
                  {row.difference}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}
