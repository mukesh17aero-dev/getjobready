import Link from "next/link";

// Small capability tiles under the discovery banner. Every tile is a real,
// live destination — a tile for an unbuilt feature is omitted, not greyed out.
export function CapabilityTile({
  icon,
  iconBg,
  title,
  caption,
  href,
}: {
  icon: string;
  iconBg: string;
  title: string;
  caption: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-200 bg-white p-4 text-center transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-violet"
    >
      <span
        aria-hidden
        className="mx-auto mb-2.5 grid h-11 w-11 place-items-center rounded-full text-xl"
        style={{ backgroundColor: iconBg }}
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
