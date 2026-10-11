"use client";

import Link from "next/link";
import { useState } from "react";
import { writeApplicationReview, type ApplicationReviewStatus, type ReviewPlanTool, type SavedApplicationReview } from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase-browser";

// "How would a hiring manager read your application?" - an AI-guided review
// written only from marked work. Violet: this is Ascend guiding, not
// something earned. It never says whether anyone would be hired.

const DISCLAIMER = "AI-guided application review - not a prediction of an employer's decision.";

const TOOL: Record<ReviewPlanTool, { href: string; label: string }> = {
  readiness: { href: "/practice/readiness", label: "Take another readiness sitting" },
  missions: { href: "/practice/missions", label: "Start a simulation mission" },
  interview: { href: "/interview/practice", label: "Rehearse an interview" },
  roleplay: { href: "/roleplay", label: "Practise a workplace conversation" },
  resume: { href: "/resume/build", label: "Open the resume builder" },
  linkedin: { href: "/profile/professional", label: "Open your LinkedIn profile" },
  stories: { href: "/stories", label: "Open your story bank" },
};

/** The review cites A1, I2, CV...; the student sees what each one is. */
function evidenceName(label: string): string {
  if (label === "missing") return "Not in your application yet";
  if (label === "CV") return "Your resume";
  const kind = { A: "Readiness assessment", I: "Practice interview", M: "Simulation missions", R: "AI roleplay" }[label[0] ?? ""];
  return kind ? `${kind} ${label.slice(1)}` : label;
}

const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
const formatDate = (iso: string) => { const d = new Date(iso); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };

function Points({ title, points, tone }: { title: string; points: Array<{ point: string; evidence: string[] }>; tone: "teal" | "amber" }) {
  return (
    <div>
      <h4 className={`text-[0.75rem] font-bold uppercase tracking-[0.12em] ${tone === "teal" ? "text-teal-800" : "text-amber-800"}`}>{title}</h4>
      <ul className="mt-1.5 grid gap-2">
        {points.map((p) => (
          <li key={p.point} className={`rounded-xl border-l-4 bg-white px-3 py-2 ${tone === "teal" ? "border-teal-500" : "border-amber-400"}`}>
            <p className="text-[0.84rem] leading-relaxed text-slate-700">{p.point}</p>
            <p className="mt-1 flex flex-wrap gap-1">
              {p.evidence.map((e) => <span key={e} className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.75rem] font-semibold text-slate-600">{evidenceName(e)}</span>)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ApplicationReviewCard({ status }: { status: ApplicationReviewStatus }) {
  const [saved, setSaved] = useState<SavedApplicationReview | null>(status.state === "ready" ? status.saved : null);
  const [canWrite, setCanWrite] = useState(status.state === "ready" ? status.canWrite : false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (status.state === "no_role") return null;

  async function write() {
    setBusy(true);
    setError(null);
    const { data } = await supabaseBrowser().auth.getSession();
    const result = data.session ? await writeApplicationReview(data.session.access_token) : { ok: false as const, reason: "Sign in again to continue." };
    setBusy(false);
    if (!result.ok) { setError(result.reason); return; }
    setSaved(result.saved);
    setCanWrite(false);
  }

  const review = saved?.review;
  const first = review?.plan[0];

  return (
    <section aria-labelledby="app-review" className="mt-4 rounded-2xl border border-[#d9d0f7] bg-[linear-gradient(135deg,#f5f1ff_0%,#ffffff_65%)] p-4 sm:p-5">
      <p className="text-[0.75rem] font-bold uppercase tracking-[0.14em] text-[#5b21b6]">Application review · {status.roleTitle}</p>
      <h2 id="app-review" className="mt-1 text-[1.15rem] font-bold tracking-tight text-brand-ink">How would a hiring manager read your application?</h2>
      <p className="mt-1 text-[0.75rem] text-slate-600">{DISCLAIMER}</p>

      {status.state === "locked" ? (
        <div className="mt-3">
          <p className="text-[0.84rem] leading-relaxed text-slate-700">
            A review is only worth reading once there is marked work to read. It opens when you have:
          </p>
          <ul className="mt-2 grid gap-1.5 text-[0.84rem] text-slate-700">
            {status.missing.map((m) => <li key={m} className="flex gap-2"><span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full border-2 border-[#5b21b6]" />{m}</li>)}
          </ul>
          <Link href={status.missing[0]?.startsWith("A scored") ? "/practice/readiness" : "/interview/practice"} className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-[#5b21b6] px-5 text-[0.85rem] font-bold text-white hover:bg-[#4c1d95]">
            {status.missing[0]?.startsWith("A scored") ? "Take the readiness sitting" : "Rehearse an interview"}
          </Link>
        </div>
      ) : !review ? (
        <div className="mt-3">
          <p className="text-[0.84rem] leading-relaxed text-slate-700">
            Read from your scored assessments, missions, practice interviews, roleplays and resume, the way a manager
            for this role would: what stands out, what would give them pause, and what to do before you apply.
          </p>
          <button type="button" onClick={() => void write()} disabled={busy} className="mt-3 inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-[#5b21b6] px-5 text-[0.85rem] font-bold text-white hover:bg-[#4c1d95] disabled:cursor-wait disabled:opacity-70">
            {busy ? "Reading your application… (up to a minute)" : "Get my application review"}
          </button>
        </div>
      ) : (
        <div className="mt-3 grid gap-4">
          <blockquote className="rounded-xl bg-white px-4 py-3 text-[0.92rem] leading-relaxed text-brand-ink shadow-[0_10px_24px_-20px_rgba(76,29,149,0.6)]">
            <span className="mb-1 block text-[0.75rem] font-bold uppercase tracking-[0.12em] text-slate-500">First impression</span>
            {review.firstImpression}
          </blockquote>
          <div className="grid gap-4 sm:grid-cols-2">
            <Points title="What stands out" points={review.standsOut} tone="teal" />
            <Points title="What would give them pause" points={review.pause} tone="amber" />
          </div>
          <div>
            <h4 className="text-[0.75rem] font-bold uppercase tracking-[0.12em] text-slate-600">Questions they would likely ask you</h4>
            <ol className="mt-1.5 grid list-decimal gap-1 pl-5 text-[0.84rem] leading-relaxed text-slate-700">
              {review.questions.map((q) => <li key={q}>{q}</li>)}
            </ol>
          </div>
          <div>
            <h4 className="text-[0.75rem] font-bold uppercase tracking-[0.12em] text-[#5b21b6]">Before you apply</h4>
            <ol className="mt-1.5 grid gap-1.5 text-[0.84rem] leading-relaxed text-slate-700">
              {review.plan.map((p, i) => <li key={p.step} className="flex gap-2"><span className="font-bold text-[#5b21b6]">{i + 1}.</span>{p.step}</li>)}
            </ol>
            {first && (
              <Link href={TOOL[first.tool].href} className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-[#5b21b6] px-5 text-[0.85rem] font-bold text-white hover:bg-[#4c1d95]">
                {TOOL[first.tool].label} →
              </Link>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e7e0fb] pt-3 text-[0.75rem] text-slate-600">
            <span>Written {formatDate(saved.createdAt)} from your marked work. Only you can see it.</span>
            {canWrite ? (
              <button type="button" onClick={() => void write()} disabled={busy} className="min-h-11 cursor-pointer font-semibold text-[#5b21b6] hover:underline disabled:cursor-wait">
                {busy ? "Reading your application…" : "Review again with your new work"}
              </button>
            ) : <span>{status.state === "ready" && status.why ? status.why : "Your review is up to date. Finish more marked work and a fresh review opens."}</span>}
          </div>
        </div>
      )}
      {error && <p role="alert" className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[0.8rem] text-amber-900">{error}</p>}
    </section>
  );
}
