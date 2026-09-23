import { StatusChip } from "./feature-landing";
import { ArrowRight } from "@/components/ui/icons";
import Link from "next/link";
import { isOpen, type FeatureCategory } from "./marketing-features";

// A category drawn the way the student home draws its doors: a grid of cards
// on the mist panel, one per feature.
//
// The College and Employer tabs use this so all three audiences get the same
// home, not a different kind of page each. Card dressing is positional - a
// tint and a glyph by index, aria-hidden, exactly as the student grid does it.
// The glyph is never the meaning; the sentence beside it is.
const LOOKS = [
  { tint: "#0d9488", glyph: "\u{1F4CA}" },
  { tint: "#0369a1", glyph: "\u{1F50D}" },
  { tint: "#047857", glyph: "\u{1F4CB}" },
  { tint: "#b45309", glyph: "\u{1F3AF}" },
  { tint: "#be185d", glyph: "\u{1F4C8}" },
  { tint: "#0f766e", glyph: "\u{1F48E}" },
];

export function FeatureGrid({ category }: { category: FeatureCategory }) {
  const openCount = category.features.filter(isOpen).length;

  return (
    <section className="animate-fade-up overflow-hidden rounded-3xl border border-slate-200">
      {/* ---- the stake, on the same dark band the student banner uses ---- */}
      <div className="bg-gradient-to-r from-[#0d3b3f] via-[#0f766e] to-[#059669] px-5 py-5 text-white sm:px-6">
        <h2 className="font-display text-xl font-bold">{category.title}</h2>
        <p className="mt-1 max-w-2xl text-[0.88rem] leading-snug text-white/90">
          {category.stake}
        </p>
        {openCount === 0 && (
          // Said once, up front. Somebody who reads five cards before working
          // out that none of them opens has been wasted.
          <p className="mt-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-[0.74rem] font-semibold ring-1 ring-white/30">
            None of this is released yet — it is here so you can see what is
            coming.
          </p>
        )}
      </div>

      {/* ---- the cards ---- */}
      <div className="grid gap-4 bg-brand-mist p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
        {category.features.map((feature, i) => {
          const look = LOOKS[i % LOOKS.length];
          const open = isOpen(feature);
          return (
            <div
              key={feature.id}
              style={{ animationDelay: `${80 + i * 55}ms` }}
              className={`animate-fade-up flex flex-col rounded-2xl border border-slate-200 bg-surface p-4 ${
                open ? "" : "opacity-90"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  aria-hidden
                  className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-[1.8rem]"
                  style={{ background: `${look.tint}18` }}
                >
                  {look.glyph}
                </span>
                <StatusChip status={feature.status} />
              </div>

              <h3 className="mt-3 font-display text-[0.98rem] font-bold leading-snug text-brand-ink">
                {feature.title}
              </h3>
              <p className="mt-1 text-[0.78rem] leading-snug text-slate-500">
                {feature.blurb}
              </p>
              <p className="mt-2 flex-1 text-[0.74rem] leading-snug text-slate-400">
                <span className="font-semibold uppercase tracking-wide">
                  For
                </span>{" "}
                {feature.forWho}
              </p>

              {open ? (
                <Link
                  href={feature.href!}
                  className="mt-3 inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-lg bg-brand-teal-deep px-3.5 py-2 text-[0.78rem] font-bold text-white transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-brand-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal motion-reduce:hover:translate-y-0"
                >
                  Open
                  <ArrowRight size={13} />
                </Link>
              ) : (
                // No button, because there is nothing to press. The card says
                // what it will do and stops there.
                <p className="mt-3 text-[0.72rem] font-semibold text-slate-400">
                  Not available yet
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
