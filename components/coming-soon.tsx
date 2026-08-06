import Link from "next/link";

// Placeholder body for a destination whose module is not built yet. Content
// only — the real page replaces this component entirely.
export function ComingSoon({
  stage,
  title,
  delivers,
}: {
  stage: string;
  title: string;
  delivers: string;
}) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
        {stage}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
        {title}
      </h1>
      <p className="mt-4 text-slate-600">{delivers}</p>
      <p className="mt-4 text-sm text-slate-500">
        This module is not built yet — the page exists so the journey&apos;s
        navigation is real from day one.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-700"
      >
        ← Back to home
      </Link>
    </main>
  );
}
