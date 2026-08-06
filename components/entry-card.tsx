import Link from "next/link";

export function EntryCard({
  index,
  title,
  description,
  href,
  recommended = false,
}: {
  index: number;
  title: string;
  description: string;
  href: string;
  recommended?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
    >
      <span
        aria-hidden
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violet-100 text-sm font-bold text-violet-700"
      >
        {index}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2 font-medium text-slate-900">
          {title}
          {recommended && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-amber-800">
              Recommended
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-sm text-slate-500">{description}</span>
      </span>
      <span
        aria-hidden
        className="text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-violet-600"
      >
        →
      </span>
    </Link>
  );
}
