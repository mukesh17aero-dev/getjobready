"use client";

// What Discovery actually does, shown rather than promised.
//
// The fan of captions that used to sit here was decoration: pretty, and it
// told nobody what would happen if they pressed the button. This is the real
// sequence in miniature - pick the industries that interest you, see the roles
// inside them, be walked through five of them - built from the same shapes and
// colours the screens themselves use, so what somebody sees here is what they
// get.
//
// It plays itself, and the step chips take it over. Reduced motion gets the
// chips without the autoplay, which is the whole feature minus the movement.

import { useEffect, useState } from "react";
import { ArrowRight, Check } from "@/components/icons";

type Look = { title: string; tint: string; glyph: string };

const STEPS = [
  "Pick what interests you",
  "See the roles inside",
  "Be walked through them",
];

export function DiscoveryPreview({ looks }: { looks: Look[] }) {
  const [scene, setScene] = useState(0);

  // One timeout per scene rather than an interval: choosing a chip restarts
  // the clock from that scene instead of cutting it short.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setTimeout(() => setScene((s) => (s + 1) % STEPS.length), 3800);
    return () => clearTimeout(id);
  }, [scene]);

  const three = looks.slice(0, 3);

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm">
        <div className="min-h-[13.5rem]">
          {scene === 0 && <PickScene looks={three} />}
          {scene === 1 && <RolesScene looks={three} />}
          {scene === 2 && <TourScene look={three[0]} />}
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-2">
        {STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setScene(i)}
            aria-pressed={scene === i}
            className={`flex min-h-9 items-center gap-2 rounded-full border px-3 text-[0.72rem] font-semibold transition-colors ${
              scene === i
                ? "border-brand-teal bg-teal-50 text-teal-700"
                : "border-slate-200 text-slate-500 hover:border-slate-300"
            }`}
          >
            <span
              className={`grid h-4.5 w-4.5 place-items-center rounded-full text-[0.6rem] font-bold ${
                scene === i
                  ? "bg-brand-teal-deep text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {i + 1}
            </span>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- scenes -- */

function PickScene({ looks }: { looks: Look[] }) {
  return (
    <div key="s0" className="animate-fade-up">
      <p className="text-[0.78rem] font-bold text-brand-ink">
        Which of these interest you?
      </p>
      <ul className="mt-2.5 grid gap-2">
        {looks.map((w, i) => (
          <li
            key={w.title}
            className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 ${
              i < 2 ? "border-brand-teal bg-teal-50/60" : "border-slate-200"
            }`}
          >
            <span
              aria-hidden
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-base"
              style={{ background: `rgb(${w.tint} / 0.14)` }}
            >
              {w.glyph}
            </span>
            <span className="min-w-0 flex-1 truncate text-[0.76rem] font-semibold text-brand-ink">
              {w.title}
            </span>
            <span
              aria-hidden
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                i < 2
                  ? "border-brand-teal bg-brand-teal text-white"
                  : "border-slate-300 text-transparent"
              }`}
            >
              <Check size={11} />
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2.5 text-[0.7rem] text-slate-400">
        Not sure what one is? Look inside before you pick.
      </p>
    </div>
  );
}

function RolesScene({ looks }: { looks: Look[] }) {
  const roles = [
    { title: "Customer Success Associate", pay: "₹20K–₹30K", look: looks[0] },
    { title: "Relationship Executive", pay: "₹16K–₹26K", look: looks[1] },
    { title: "Hub Supervisor", pay: "₹22K–₹32K", look: looks[2] },
  ];
  return (
    <div key="s1" className="animate-fade-up">
      <p className="text-[0.78rem] font-bold text-brand-ink">
        The roles inside them
      </p>
      <ul className="mt-2.5 grid gap-2 sm:grid-cols-3">
        {roles.map((r) => (
          <li
            key={r.title}
            className="flex h-[7.5rem] flex-col justify-end rounded-xl border border-slate-200 p-2.5"
            style={{
              background: `linear-gradient(160deg, rgb(${r.look?.tint ?? "45 212 191"} / 0.18), rgb(${r.look?.tint ?? "45 212 191"} / 0.04))`,
            }}
          >
            <span aria-hidden className="text-[1.1rem] opacity-70">
              {r.look?.glyph}
            </span>
            <span className="mt-1 text-[0.72rem] font-bold leading-tight text-brand-ink">
              {r.title}
            </span>
            <span className="mt-0.5 text-[0.66rem] font-semibold text-slate-500">
              {r.pay}/mo
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2.5 text-[0.7rem] text-slate-400">
        The day, the pay and the hard parts on every one.
      </p>
    </div>
  );
}

function TourScene({ look }: { look?: Look }) {
  return (
    <div key="s2" className="animate-fade-up">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full ring-1 ring-white/40"
          style={{
            background:
              "radial-gradient(circle at 32% 28%, var(--color-brand-violet-soft) 0%, var(--color-brand-violet) 45%, var(--color-brand-violet-deep) 100%)",
          }}
        >
          <span className="absolute left-[18%] top-[14%] h-1.5 w-1.5 rounded-full bg-white/80 blur-[1px]" />
        </span>
        <span>
          <span className="block text-[0.62rem] font-bold uppercase tracking-[0.08em] text-brand-violet-deep">
            Discovery assistant
          </span>
          <span className="block text-[0.78rem] font-bold text-brand-ink">
            Two minutes a role
          </span>
        </span>
      </div>

      <div className="mt-2.5 grid gap-1.5">
        {[
          "Why this job exists",
          "What it opens up",
          "How they actually hire",
        ].map((title, i) => (
          <div
            key={title}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5"
          >
            <p className="flex items-baseline gap-1.5 text-[0.7rem] font-bold text-brand-ink">
              <span
                aria-hidden
                className="h-2.5 w-0.5 shrink-0 rounded-full"
                style={{ background: `rgb(${look?.tint ?? "45 212 191"})` }}
              />
              {title}
            </p>
            {i === 0 && (
              <p className="mt-0.5 text-[0.66rem] leading-snug text-slate-500">
                The one job whose whole purpose is catching a problem before it
                reaches a manager.
              </p>
            )}
          </div>
        ))}
      </div>

      <p className="mt-2.5 flex items-center gap-1.5 text-[0.7rem] font-semibold text-brand-violet-deep">
        Ask it anything as you go <ArrowRight size={12} />
      </p>
    </div>
  );
}
