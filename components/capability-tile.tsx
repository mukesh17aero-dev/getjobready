import Link from "next/link";

// Small capability tiles under the discovery banner. Every tile is a real,
// live destination — a tile for an unbuilt feature is omitted, not greyed out.
export function CapabilityTile({
  icon,
  tint,
  title,
  caption,
  href,
}: {
  icon: string;
  // A palette token, so the wash follows the theme instead of a fixed hex.
  tint: "violet" | "teal" | "amber" | "indigo";
  title: string;
  caption: string;
  href: string;
}) {
  const wash = {
    violet: "bg-violet-50",
    teal: "bg-teal-50",
    amber: "bg-amber-50",
    indigo: "bg-indigo-50",
  }[tint];
  return (
    <Link
      href={href}
      data-track={`interest|home|tile_open|${href}`}
      className="rounded-2xl border border-slate-200 bg-surface p-3 text-center transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-violet"
    >
      <span
        aria-hidden
        className={`mx-auto mb-2 grid h-9 w-9 place-items-center rounded-full text-lg ${wash}`}
      >
        {icon}
      </span>
      <span className="block text-[0.95rem] font-semibold text-slate-900">
        {title}
      </span>
      <span className="mt-1 block text-xs leading-relaxed text-slate-500">
        {caption}
      </span>
    </Link>
  );
}
