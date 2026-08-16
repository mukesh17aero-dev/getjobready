import Link from "next/link";
import { getServerSession } from "@/lib/supabase-server";
import { getJourneyState } from "@/lib/api";
import { progressOf } from "@/lib/next-step";
import { routeStatus, stages } from "@/lib/stages";
import { BackLink } from "@/components/back-link";
import { RememberHub } from "@/components/remember-hub";

export const metadata = { title: "Practice" };

// Practice as a cockpit (Blueprint §19): the person's target role and
// readiness state anchor the left; the three ways to build and prove role
// capability are working rows beside it, each wearing its live status.
const ROWS = [
  {
    routeId: "readiness",
    glyph: "📋",
    tint: "#0d9488",
    title: "Check role readiness",
    line: "See where you stand, spot your strengths, and know what to improve next.",
    cta: "See my readiness",
    href: "/readiness",
  },
  {
    routeId: "practice",
    glyph: "🎯",
    tint: "#0369a1",
    title: "Role missions",
    line: "Step into real workplace situations, make decisions, and learn by doing.",
    cta: "Start missions",
    href: "/practice/missions",
  },
  {
    routeId: "interview",
    glyph: "🎙",
    tint: "#047857",
    title: "Interview practice",
    line: "Practise role-specific questions and build answers you’ll feel proud to say.",
    cta: "Practise now",
    href: "/interview",
  },
];

const WHY = [
  "Built around real non-tech roles",
  "Personalised to your target role and experience",
  "Progress saved to your record",
];

export default async function PracticePage() {
  const session = await getServerSession();
  const state = session ? await getJourneyState(session.access_token) : null;
  const journey = state ? stages(state) : null;
  const role = state?.progress?.role ?? null;
  const readiness =
    state && journey ? routeStatus("readiness", state, journey) : null;
  const name = state ? (progressOf(state).name?.split(" ")[0] ?? null) : null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <RememberHub path="/practice" />
      <BackLink />
      <h1 className="mt-6 font-display text-[1.7rem] font-bold tracking-tight text-brand-ink">
        Practice that feels real.
      </h1>

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        {/* ---- the cockpit panel: who this practice is for ---- */}
        <aside className="rounded-2xl bg-gradient-to-b from-[#0d3b3f] to-[#0f766e] p-5 text-white">
          <p className="text-[0.66rem] font-bold uppercase tracking-[0.14em] text-white/60">
            {role ? "Practising for" : "Your practice"}
          </p>
          <p className="mt-1 font-display text-[1.2rem] font-bold">
            {role ? role.title : name ? `${name}, pick a role first` : "Pick a role first"}
          </p>
          <div className="mt-4 grid h-20 w-20 place-items-center rounded-full border-4 border-white/25 text-center font-display text-xl font-bold">
            {readiness?.percent != null ? `${readiness.percent}%` : "-"}
          </div>
          <p className="mt-2 text-[0.8rem] leading-snug text-white/70">
            {readiness?.done
              ? "Readiness measured - your practice now closes the gaps it found."
              : readiness?.percent != null
                ? readiness.label
                : role
                  ? "No readiness score yet - your first check sets the baseline everything else improves on."
                  : "Choose your role in Discovery and this panel starts working for you."}
          </p>
          {!role && (
            <Link
              href="/discover"
              className="mt-3 inline-block rounded-lg bg-white/15 px-3.5 py-2 text-[0.78rem] font-bold text-white ring-1 ring-white/30 transition-colors hover:bg-white/25"
            >
              Find your role →
            </Link>
          )}
          <ul className="mt-4 space-y-2 border-t border-white/15 pt-4">
            {WHY.map((why) => (
              <li key={why} className="flex items-start gap-2 text-[0.76rem] leading-snug text-white/75">
                <span aria-hidden className="mt-0.5">✓</span> {why}
              </li>
            ))}
          </ul>
        </aside>

        {/* ---- the working rows ---- */}
        <div className="grid content-start gap-3">
          {ROWS.map((row, i) => {
            const status =
              state && journey ? routeStatus(row.routeId, state, journey) : null;
            const started = status?.percent != null && !status.done;
            const first = i === 0 && !status?.done;
            return (
              <Link
                key={row.routeId}
                href={row.href}
                className={`group flex items-center gap-4 rounded-2xl border p-4 transition-[border-color,box-shadow] hover:shadow-md ${
                  first
                    ? "border-teal-700/50 bg-teal-50/60 hover:border-teal-700"
                    : "border-slate-200 bg-surface hover:border-brand-teal/50"
                }`}
              >
                <span
                  aria-hidden
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-2xl"
                  style={{ background: `${row.tint}14` }}
                >
                  {row.glyph}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2 font-display text-[0.95rem] font-bold text-brand-ink">
                    {row.title}
                    {first && (
                      <span className="rounded-full bg-brand-teal-deep px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-white">
                        Start here
                      </span>
                    )}
                    {status?.done && (
                      <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-teal-700">
                        ✓ Done
                      </span>
                    )}
                    {started && (
                      <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-teal-700">
                        {status.label}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-[0.78rem] leading-snug text-slate-500">
                    {row.line}
                  </span>
                </span>
                <span className="shrink-0 rounded-lg bg-brand-teal-deep px-3.5 py-2 text-[0.78rem] font-bold text-white transition-transform group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-y-0">
                  {row.cta} →
                </span>
              </Link>
            );
          })}
          <p className="rounded-xl bg-slate-50 px-4 py-2.5 text-[0.78rem] text-slate-500">
            ⚡ Short on time? Each row delivers something real in about
            15 minutes.
          </p>
        </div>
      </div>
    </main>
  );
}
