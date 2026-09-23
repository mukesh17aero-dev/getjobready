import { BackLink } from "./back-link";

// Placeholder body for a destination whose module is not built yet. Content
// only — the real page replaces this component entirely.
export function ComingSoon({
  stage,
  title,
  delivers,
  backHref,
  backLabel,
}: {
  stage: string;
  title: string;
  delivers: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <BackLink fallbackHref={backHref} fallbackLabel={backLabel} />

      <p className="mt-7 text-xs font-semibold uppercase tracking-[0.14em] text-brand-violet-deep">
        {stage}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
        {title}
      </h1>
      <p className="mt-4 text-slate-600">{delivers}</p>
      <p className="mt-4 text-sm text-slate-500">
        This part isn&apos;t built yet.
      </p>
    </main>
  );
}
