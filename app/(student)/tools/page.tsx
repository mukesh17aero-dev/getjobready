import Link from "next/link";
import { CARD_BASE, OutcomeCardBody, type OutcomeFacts } from "@/components/outcome-card";
import { RememberHub } from "@/components/remember-hub";

export const metadata = { title: "Career tools" };

// The tools hub behind the teal door: standalone tools only, each with a
// real destination and the same three facts as the Outcome Router. A tool
// appears here once its module exists — a door never opens into an empty
// room. Figures stay in step with the journey catalogue in the backend.
const TOOLS: Array<OutcomeFacts & { href: string }> = [
  {
    title: "Resume Studio",
    need: "I need a strong resume now.",
    output: "ATS-safe resume in Word and PDF, plus your career record",
    time: "15–22 min",
    price: "Free during pilot",
    href: "/resume",
  },
  {
    title: "AI Interview Coach",
    need: "I have interviews coming up.",
    output: "Interview readiness report and answer story bank",
    time: "12–15 min",
    price: "Free during pilot",
    href: "/interview",
  },
];

export default function ToolsPage() {
  return (
    // Narrower column than the six-option router: two tools in a five-column
    // grid would leave a dangling gap, so the shelf is sized to what it holds.
    <main className="mx-auto w-full max-w-3xl px-4 pb-20 sm:px-6">
      <RememberHub path="/tools" />
      <nav aria-label="Breadcrumb" className="pt-4 text-xs text-slate-400">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        <span className="px-1.5">›</span>
        <span className="text-slate-500">Career tools</span>
      </nav>

      <header className="mt-3">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Focused career tools
        </h1>
      </header>

      {/* Two columns, and an odd last card stretches across both — so the
          shelf stays balanced whether it holds two tools or five. */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {TOOLS.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className={`${CARD_BASE} group border-slate-200 hover:border-slate-300 sm:[&:nth-child(odd):last-child]:col-span-2`}
          >
            <OutcomeCardBody
              facts={tool}
              footer={
                <span className="mt-auto border-t border-slate-100 pt-3 text-[0.82rem] font-bold text-brand-violet-deep">
                  Open{" "}
                  <span
                    aria-hidden
                    className="inline-block transition-transform group-hover:translate-x-0.5"
                  >
                    →
                  </span>
                </span>
              }
            />
          </Link>
        ))}
      </div>

      {/* A full-width strip closes the shelf: it squares off the grid and
          leads somewhere real, rather than padding the row with a dead tile. */}
      <Link
        href="/start"
        className="group mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-dashed border-slate-300 bg-surface/60 px-5 py-4 transition-colors hover:border-brand-violet hover:bg-surface"
      >
        <span className="min-w-56 flex-1">
          <span className="block text-[0.95rem] font-semibold text-slate-900">
            Prefer the guided path?
          </span>
        </span>
        <span className="text-[0.82rem] font-bold text-brand-violet-deep">
          Start with your goal{" "}
          <span
            aria-hidden
            className="inline-block transition-transform group-hover:translate-x-0.5"
          >
            →
          </span>
        </span>
      </Link>

    </main>
  );
}
