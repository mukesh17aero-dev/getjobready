import Link from "next/link";

const VARIANTS = {
  violet: {
    card: "from-brand-violet-soft via-brand-violet to-brand-violet-deep shadow-brand-violet/25",
    arrow: "text-brand-violet-deep",
  },
  teal: {
    card: "from-brand-teal-soft via-brand-teal to-brand-teal-deep shadow-brand-teal/25",
    arrow: "text-brand-teal-deep",
  },
} as const;

// The two gradient "doors" from the shared design. The bottom line carries a
// factual product statement — never invented social proof.
export function DoorCard({
  variant,
  icon,
  title,
  body,
  fact,
  href,
}: {
  variant: keyof typeof VARIANTS;
  icon: string;
  title: string;
  body: string;
  fact: string;
  href: string;
}) {
  const styles = VARIANTS[variant];
  return (
    <Link
      href={href}
      className={`group relative flex min-h-60 flex-col gap-3 rounded-3xl bg-gradient-to-br p-6 text-white shadow-xl transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-violet ${styles.card}`}
    >
      <span
        aria-hidden
        className="grid h-13 w-13 place-items-center rounded-2xl bg-white/20 text-2xl"
      >
        {icon}
      </span>
      <span
        aria-hidden
        className={`absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-white text-lg font-bold transition-transform group-hover:translate-x-1 ${styles.arrow}`}
      >
        →
      </span>
      <span className="text-2xl font-semibold leading-tight [text-wrap:balance]">
        {title}
      </span>
      <span className="max-w-[32ch] text-[0.925rem] leading-relaxed text-white/85">
        {body}
      </span>
      <span className="mt-auto pt-2 text-[0.8rem] font-medium text-white/95">
        {fact}
      </span>
    </Link>
  );
}
