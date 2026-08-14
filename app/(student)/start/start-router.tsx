"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { selectJourneyRoute, type JourneyState } from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { track } from "@/lib/footprints";
import { CARD_BASE, OutcomeCardBody } from "@/components/outcome-card";
import { RememberHub } from "@/components/remember-hub";

// Outcome Router (Blueprint Screen 0) as a plan grid: each outcome is a
// bordered card stating what you walk away with, how long it takes and what
// it costs — the familiar "choose a plan" pattern, which is why it reads
// instantly. Initial state arrives server-rendered; this component handles
// choice, the idempotent select call and navigation.

export function StartRouter({
  initialState,
}: {
  initialState: JourneyState | null;
}) {
  const router = useRouter();
  const [opening, setOpening] = useState<string | null>(null);
  const [failed, setFailed] = useState(initialState === null);
  const state = initialState;

  // Selecting a card is the action: it saves the choice and goes there.
  // No confirm step — prerequisites are shown on the cards themselves.
  async function choose(routeId: string) {
    if (!state || opening) return;
    setOpening(routeId);
    track({
      family: "decision",
      event: "route_selected",
      module: "journey",
      target: routeId,
    });
    const { data } = await supabaseBrowser().auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      router.push("/login?next=/start");
      return;
    }
    const saved = await selectJourneyRoute(token, routeId, crypto.randomUUID());
    if (!saved) {
      setOpening(null);
      setFailed(true);
      return;
    }
    router.push(state.routes.find((r) => r.id === routeId)?.landing ?? "/");
  }

  if (failed || !state) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">
          We couldn&apos;t load your options
        </h1>
        <p className="mt-3 text-slate-600">
          The server may just be waking up — give it a moment and try again.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 rounded-xl bg-brand-violet px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-violet-deep"
        >
          Try again
        </button>
      </main>
    );
  }

  const titles = Object.fromEntries(state.routes.map((r) => [r.id, r.title]));
  const landings = Object.fromEntries(
    state.routes.map((r) => [r.id, r.landing]),
  );
  const currentNote = state.current?.resolved.note ?? null;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-5 sm:px-6">
      <RememberHub path="/start" />
      <nav aria-label="Breadcrumb" className="pt-3 text-xs text-slate-400">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        <span className="px-1.5">›</span>
        <span className="text-slate-500">Start with your goal</span>
      </nav>

      <header className="mt-1.5">
        <h1 className="text-[1.4rem] font-semibold tracking-tight text-slate-900">
          Choose your outcome
        </h1>
      </header>

      {state.current && (
        <section className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-violet-100 bg-violet-50 px-4 py-2.5">
          <span className="min-w-48 flex-1 text-sm text-slate-600">
            Current path:{" "}
            <strong className="text-brand-violet-deep">
              {titles[state.current.route] ?? state.current.route}
            </strong>
            <span className="text-xs text-slate-400">
              {" · "}
              {new Date(state.current.selectedAt).toLocaleDateString()}
            </span>
            {currentNote && (
              <span className="block text-xs leading-snug text-violet-900/80">
                {currentNote}
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={() => router.push(landings[state.current!.route] ?? "/")}
            className="rounded-lg bg-brand-violet px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-violet-deep"
          >
            Continue path ›
          </button>
        </section>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {state.routes.map((route, i) => {
          const busy = opening === route.id;
          return (
            <button
              key={route.id}
              type="button"
              disabled={opening !== null}
              onClick={() => void choose(route.id)}
              style={{ animationDelay: `${i * 45}ms` }}
              className={`${CARD_BASE} animate-fade-up ${
                busy
                  ? "border-brand-violet ring-3 ring-brand-violet/15"
                  : route.recommended
                    ? "border-amber-400 hover:border-amber-500"
                    : "border-slate-200 hover:border-slate-300"
              } ${opening !== null && !busy ? "opacity-50" : ""}`}
            >
              {route.recommended && (
                <span className="absolute -top-2.5 left-4 rounded-full border border-amber-400 bg-amber-50 px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-amber-700">
                  Recommended
                </span>
              )}

              <OutcomeCardBody
                titleTag="span"
                facts={{
                  title: route.title,
                  need: route.need,
                  output: route.output,
                  time: route.time,
                  price: route.price,
                }}
                footer={
                  <>
                    {route.resolved.note && (
                      <span className="mt-2.5 block rounded-lg bg-violet-50 px-3 py-2 text-[0.74rem] leading-snug text-violet-900">
                        <strong className="font-semibold">First:</strong>{" "}
                        {route.resolved.note}
                      </span>
                    )}
                    <span
                      className={`mt-auto border-t border-slate-100 pt-3 text-[0.82rem] font-bold ${
                        busy ? "text-brand-violet-deep" : "text-slate-400 group-hover:text-brand-violet-deep"
                      }`}
                    >
                      {busy ? "Opening\u2026" : "Start this"}{" "}
                      <span
                        aria-hidden
                        className="inline-block transition-transform duration-200 ease-out group-hover:translate-x-1 motion-reduce:transition-none"
                      >
                        {busy ? "" : "\u2192"}
                      </span>
                    </span>
                  </>
                }
              />
            </button>
          );
        })}
      </div>

    </main>
  );
}
