"use client";

import { Dialog } from "@/components/dialog";
import { PayProgression } from "@/components/pay-progression";
import { WorkMix } from "@/components/work-mix";
import type { RoleDetail } from "@/lib/api";
import { Check } from "@/components/icons";

const money = (n: number) => `₹${Math.round(n / 1000)}K`;
export const payRange = (p: { min: number; max: number }) =>
  `${money(p.min)}–${money(p.max)}/mo`;

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5 border-t border-slate-200 pt-4 first:mt-0">
      <h3 className="flex items-baseline gap-2 text-[0.95rem] font-semibold tracking-tight text-slate-900">
        <span aria-hidden className="h-3.5 w-1 rounded-full bg-brand-violet" />
        {title}
        {hint && (
          <span className="text-[0.72rem] font-normal text-slate-400">
            {hint}
          </span>
        )}
      </h3>
      <div className="mt-2.5">{children}</div>
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
}: {
  role: RoleDetail;
  matchLine?: string;
  onClose: () => void;
  onChoose?: () => void;
  choosing?: boolean;
  chosen?: boolean;
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
              ) : (
                choosing
                  ? "Saving…"
                  : "Choose this role"
              )}
            </button>
          </>
        )
      }
    >
      <p className="text-[0.95rem] font-medium leading-snug text-slate-900">
        {role.pitch}
      </p>
      <p className="mt-2 text-[0.88rem] leading-relaxed text-slate-600">
        {role.description}
      </p>

      <Section title="How the day is spent" hint="share of working hours">
        <WorkMix mix={role.workMix} />
      </Section>

      <Section title="What you'll do" hint="the work itself">
        <ul className="grid gap-1.5 text-[0.85rem] text-slate-600">
          {role.responsibilities.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden className="text-slate-300">
                ▪
              </span>
              {item}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Skills you'll be judged on">
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

      <Section title="Pay and career growth" hint="monthly, indicative">
        <PayProgression growth={role.growth} />
        <p className="mt-2 text-[0.7rem] leading-snug text-slate-400">
          {role.payNote}
        </p>
      </Section>

      <Section title="Working conditions">
        <dl className="grid gap-x-6 gap-y-2 text-[0.82rem] sm:grid-cols-2">
          {[
            ["Environment", role.workContext.environment],
            ["Hours", role.workContext.hours],
            ["Pace", role.workContext.pace],
            ["Team", role.workContext.team],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-slate-400">
                {label}
              </dt>
              <dd className="mt-0.5 text-slate-600">{value}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="The hard parts, honestly">
        <ul className="grid gap-1.5 rounded-xl bg-amber-50/70 p-3.5 text-[0.82rem] text-amber-900">
          {role.hardTruths.map((truth) => (
            <li key={truth} className="flex gap-2">
              <span aria-hidden>·</span>
              {truth}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="This suits you if…">
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

      {role.voices.length > 0 && (
        <Section title="People doing this job">
          {role.voicesIllustrative && (
            <p className="mb-2.5 rounded-lg bg-slate-100 px-3 py-2 text-[0.72rem] leading-snug text-slate-600">
              <strong className="font-semibold">Illustrative:</strong> these are
              composite stories written from the pay and progression data above,
              not real individuals. Real, named and consented quotes replace them
              as pilot employers supply them.
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
                  <span className="font-normal text-slate-500">{voice.title}</span>
                </p>
                <p className="text-[0.72rem] text-slate-400">{voice.journey}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </Dialog>
  );
}
