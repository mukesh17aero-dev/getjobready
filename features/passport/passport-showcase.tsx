"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { setPassportShowcase, type PassportAchievement, type PassportShowcaseItem, type ShowcaseAction } from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase-browser";

// The proof, at the top of the Passport: the best of each kind of marked work
// toward the role, then every achievement. The candidate decides what leads -
// Ascend suggests the highest score, they can pin a different one or hide any.
// Hidden work never reaches an employer's copy.

const KIND_LABEL: Record<PassportAchievement["kind"], string> = {
  assessment: "Readiness assessment", interview: "Interview practice", training: "Simulation missions", roleplay: "AI roleplay",
};
const SHOWCASE_LABEL: Record<PassportAchievement["kind"], string> = {
  assessment: "Top assessment", interview: "Top interview", training: "Simulation work", roleplay: "Top roleplay",
};

const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Where the full report for an achievement lives. */
function reportHref(a: PassportAchievement): string {
  const id = a.id.slice(a.id.indexOf(":") + 1);
  if (a.kind === "assessment") return `/practice/readiness/results/${id}`;
  if (a.kind === "interview") return `/interview/report/${id}`;
  if (a.kind === "roleplay") return `/roleplay/report/${id}`;
  return "/practice/missions";
}

function ScoreBadge({ a, large = false }: { a: PassportAchievement; large?: boolean }) {
  const size = large ? "h-16 w-16" : "h-12 w-12";
  return (
    <span className={`grid ${size} shrink-0 place-items-center rounded-full bg-brand-mist text-brand-teal-deep`}>
      {a.score !== null ? (
        <span className="text-center leading-none">
          <span className={`block font-bold tabular-nums ${large ? "text-[1.35rem]" : "text-[1.05rem]"}`}>{a.score}</span>
          <span className="text-[0.55rem] font-semibold">/ 100</span>
        </span>
      ) : (
        <span aria-hidden className="text-[1.2rem] font-bold">✓</span>
      )}
    </span>
  );
}

export function PassportShowcase({
  showcase,
  achievements,
  editable,
  roleTitle,
}: {
  showcase: PassportShowcaseItem[];
  achievements: PassportAchievement[];
  /** The candidate's own view: reports open and choices can be changed. */
  editable: boolean;
  roleTitle: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const shown = editable ? achievements : achievements.filter((a) => !a.hidden);
  const leading = new Set(showcase.map((s) => s.item.id));

  async function change(action: ShowcaseAction, a: PassportAchievement) {
    setBusy(a.id);
    setFailed(false);
    const { data } = await supabaseBrowser().auth.getSession();
    const ok = data.session ? await setPassportShowcase(data.session.access_token, { action, kind: a.kind, id: a.id }) : false;
    setBusy(null);
    if (!ok) { setFailed(true); return; }
    router.refresh();
  }

  return (
    <>
      <section aria-labelledby="showcase" className="mt-4">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="showcase" className="text-[1.05rem] font-bold tracking-tight text-brand-ink">
            {editable ? "Your showcase" : "Showcase"}
          </h2>
          <span className="text-[0.72rem] text-slate-500">
            {editable ? "Your best marked work leads. Pin a different one below, or hide any." : `Best marked work${roleTitle ? ` toward ${roleTitle}` : ""}.`}
          </span>
        </div>
        {showcase.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-brand-mist p-4 text-[0.82rem] leading-relaxed text-slate-600">
            Nothing to showcase yet. A scored readiness assessment, a marked practice interview, an AI roleplay or submitted
            simulation missions{roleTitle ? ` for ${roleTitle}` : ""} each earn a place here.
          </p>
        ) : (
          <ol className="grid gap-3 sm:grid-cols-2">
            {showcase.map(({ kind, pinned, item }) => (
              <li key={kind} className="flex flex-col gap-2 rounded-2xl border border-teal-200 bg-white p-4 shadow-[0_12px_28px_-22px_rgba(15,95,88,0.6)]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[0.66rem] font-bold uppercase tracking-[0.12em] text-teal-800">{SHOWCASE_LABEL[kind]}</span>
                  {editable && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.62rem] font-semibold text-slate-600">
                      {pinned ? "Your pick" : "Suggested"}
                    </span>
                  )}
                </div>
                <div className="flex items-start gap-3">
                  <ScoreBadge a={item} large />
                  <div className="min-w-0">
                    <h3 className="text-[0.92rem] font-semibold leading-snug text-brand-ink">{item.title}</h3>
                    <p className="mt-0.5 text-[0.78rem] leading-relaxed text-slate-600">{item.detail}</p>
                    <p className="mt-0.5 text-[0.68rem] text-slate-500">{formatDate(item.at)}</p>
                  </div>
                </div>
                {editable && (
                  <Link href={reportHref(item)} className="mt-auto inline-flex min-h-11 items-center text-[0.8rem] font-semibold text-teal-700 underline-offset-2 hover:underline">
                    Open the full report →
                  </Link>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="achievements" className="mt-4">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="achievements" className="text-[1.05rem] font-bold tracking-tight text-brand-ink">
            {editable ? "Everything you have achieved" : "Achievements"}
          </h2>
          {roleTitle && <span className="rounded-full bg-brand-mist px-2.5 py-0.5 text-[0.65rem] font-semibold text-brand-teal-deep">Toward {roleTitle}</span>}
        </div>
        {shown.length === 0 ? (
          <p className="text-[0.8rem] text-slate-600">Marked work toward this role appears here as you complete it.</p>
        ) : (
          <ol className="grid gap-2">
            {shown.map((a) => (
              <li key={a.id} className={`flex flex-wrap items-start gap-3 rounded-xl border bg-white p-3 ${a.hidden ? "border-dashed border-slate-300 opacity-70" : "border-slate-200"}`}>
                <ScoreBadge a={a} />
                <div className="min-w-0 flex-1">
                  <p className="text-[0.62rem] font-semibold uppercase tracking-wide text-slate-500">
                    {KIND_LABEL[a.kind]} · {formatDate(a.at)}
                    {a.hidden && " · Hidden from employers"}
                    {leading.has(a.id) && " · In your showcase"}
                  </p>
                  <h3 className="text-[0.86rem] font-semibold text-brand-ink">{a.title}</h3>
                  <p className="text-[0.78rem] leading-relaxed text-slate-600">{a.detail}</p>
                  {editable && (
                    <div className="mt-1 flex flex-wrap gap-x-4">
                      <Link href={reportHref(a)} className="inline-flex min-h-11 items-center text-[0.78rem] font-semibold text-teal-700 hover:underline">
                        Open report
                      </Link>
                      {!a.hidden && !leading.has(a.id) && (
                        <button type="button" disabled={busy !== null} onClick={() => void change("pin", a)} className="min-h-11 cursor-pointer text-[0.78rem] font-semibold text-slate-700 hover:underline disabled:cursor-wait">
                          {busy === a.id ? "Saving…" : "Show in my showcase"}
                        </button>
                      )}
                      <button type="button" disabled={busy !== null} onClick={() => void change(a.hidden ? "show" : "hide", a)} className="min-h-11 cursor-pointer text-[0.78rem] font-semibold text-slate-700 hover:underline disabled:cursor-wait">
                        {busy === a.id ? "Saving…" : a.hidden ? "Show to employers again" : "Hide from employers"}
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
        {failed && <p role="alert" className="mt-2 text-[0.8rem] text-orange-800">That change did not save. Check your connection and try again.</p>}
      </section>
    </>
  );
}
