import { CapabilityTile } from "@/components/capability-tile";
import { DoorCard } from "@/components/door-card";
import { TrustStrip } from "@/components/trust-strip";
import Link from "next/link";
import Image from "next/image";
import { existsSync } from "node:fs";
import path from "node:path";

// Capability tiles from the shared design. "AI guidance" had no destination of
// its own, so its slot carries the role-readiness check instead — every tile
// must lead somewhere real.
const TILES = [
  {
    icon: "🔍",
    tint: "teal" as const,
    title: "Role discovery",
    caption: "Explore roles that match your strengths.",
    href: "/discover",
  },
  {
    icon: "🧭",
    tint: "violet" as const,
    title: "Role readiness",
    caption: "See where you stand — and what to build.",
    href: "/readiness",
  },
  {
    icon: "🎯",
    tint: "indigo" as const,
    title: "Real-world practice",
    caption: "Build skills with projects and challenges.",
    href: "/practice",
  },
  {
    icon: "💬",
    tint: "amber" as const,
    title: "Interview prep",
    caption: "Practise smart. Show up confident.",
    href: "/interview",
  },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ erased?: string }>;
}) {
  const { erased } = await searchParams;
  // The hero artwork is optional: the page renders the gradient panel until
  // the file exists, so a missing asset never shows a broken image.
  const heroImage = existsSync(
    path.join(process.cwd(), "public", "hero-student.png"),
  );

  return (
    <main className="bg-brand-mist pb-5">
      <div className="mx-auto max-w-5xl px-4">
        {/* Confirms the deletion after the person has been signed out. */}
        {erased && (
          <p
            role="status"
            className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[0.85rem] text-emerald-900"
          >
            <strong className="font-semibold">Your data has been deleted.</strong>{" "}
            Every version of your profile, your Discovery results and your
            activity have been removed. You can start again any time.
          </p>
        )}
        {/* Hero */}
        <section className="grid items-center gap-5 pb-0 pt-4 sm:grid-cols-[1.15fr_0.85fr]">
          <div>
            <h1 className="text-[2.1rem] font-semibold leading-[1.08] tracking-[-0.02em] text-brand-ink sm:text-[2.6rem] [text-wrap:balance]">
              Build a career
              <br />
              you&apos;ll be <span className="text-brand-violet">proud</span> of
            </h1>
            <p className="mt-2.5 max-w-[34ch] text-[0.95rem] text-slate-500">
              Discover what fits you. Build real skills. Practise with
              confidence. Become job-ready.
            </p>
          </div>
          <div
            aria-hidden
            className="relative h-24 overflow-hidden rounded-3xl sm:h-36"
            style={
              heroImage
                ? undefined
                : {
                    background:
                      "radial-gradient(80% 90% at 75% 20%, #c9c2f7 0%, transparent 60%), radial-gradient(70% 70% at 30% 90%, #ffd9b8 0%, transparent 55%), linear-gradient(160deg, #eef0ff, #fdf3ff 55%, #eafaf7)",
                  }
            }
          >
            {heroImage ? (
              // Drop the artwork at public/hero-student.png and it appears here.
              <Image
                src="/hero-student.png"
                alt=""
                fill
                priority
                sizes="(max-width: 640px) 100vw, 40vw"
                className="object-cover object-[center_30%]"
              />
            ) : (
              <>
                <span className="absolute -bottom-[6%] left-[12%] h-[82%] w-[76%] rotate-6 rounded-t-full border-14 border-b-0 border-white/65" />
                <span className="absolute left-6 top-4 text-2xl">✨</span>
                <span className="absolute bottom-6 right-7 text-2xl">🏙️</span>
                <span className="absolute left-[46%] top-[46%] text-2xl">🧗</span>
              </>
            )}
          </div>
        </section>

        {/* Doors */}
        <section aria-label="Choose your path" className="mt-3 grid gap-3 sm:grid-cols-2">
          <DoorCard
            variant="violet"
            icon="🚀"
            title="Start your career journey"
            body="For students, freshers & early career (0–3 yrs). Discover roles, build skills, practise, and grow your Passport."
            fact="Tell your story once — one record powers every step"
            href="/start"
          />
          <DoorCard
            variant="teal"
            icon="💼"
            title="Use focused career tools"
            body="Create a strong resume and practise with the AI Interview Coach — each tool works on its own."
            fact="Resume Studio · AI Interview Coach"
            href="/tools"
          />
        </section>

        {/* Discovery banner */}
        <section className="mt-3 flex flex-wrap items-center gap-4 rounded-2xl border border-violet-100 bg-violet-50 px-5 py-3">
          <span aria-hidden className="text-3xl">
            🧭
          </span>
          <span className="min-w-56 flex-1">
            <span className="block text-sm text-slate-500">
              Not sure where to begin?
            </span>
            <span className="text-[1.3rem] font-bold tracking-tight text-brand-violet-deep">
              Discover what fits you.
            </span>
          </span>
          <Link
            href="/discover"
            className="rounded-xl bg-brand-violet px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-violet-deep"
          >
            Start discovering ›
          </Link>
        </section>

        {/* Capability tiles */}
        <section aria-label="Capabilities" className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TILES.map((tile) => (
            <CapabilityTile key={tile.href} {...tile} />
          ))}
        </section>

        {/* Trust strip — factual claims only */}
        <section aria-label="Why trust Ascend" className="mt-3">
          <TrustStrip />
        </section>
      </div>
    </main>
  );
}
