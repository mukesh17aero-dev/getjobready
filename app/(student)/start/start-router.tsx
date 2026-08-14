"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { selectJourneyRoute, type JourneyState } from "@/lib/api";
import { progressOf } from "@/lib/next-step";
import { routeStatus, stages } from "@/lib/stages";
import { ArrowRight, Check, ChevronRight, Spark } from "@/components/icons";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { track } from "@/lib/footprints";
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
  const name = progressOf(state).name?.split(" ")[0] ?? null;
  // Where this person stands inside each door. Coming back to this page every
  // day, "what can I do" is answered once and "where did I get to" is the
  // question from then on.
  const journey = stages(state);

  // The backend's recommendation, staged as the one thing to do — but only
  // while nothing is in progress. The moment someone has picked a door, the
  // continuation above is the primary action and this screen must not offer
  // a second one; the recommendation goes back to being a badge in the list.
  const spotlight = !state.current
    ? (state.routes.find(
        (r) => r.recommended && !routeStatus(r.id, state, journey).done,
      ) ?? null)
    : null;
  const rows = spotlight
    ? state.routes.filter((r) => r.id !== spotlight.id)
    : state.routes;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6 sm:px-6">
      <RememberHub path="/start" />

      <header className="animate-fade-up">
        {/* Nobody maps themselves onto "Build my resume". Everybody recognises
            their own sentence, so the page asks them to find it rather than to
            translate themselves into our product names. */}
        <h1 className="text-[1.85rem] font-semibold leading-[1.15] tracking-[-0.025em] text-brand-ink sm:text-[2.3rem]">
          {name ? (
            <>
              Hello, <span className="text-brand-violet-deep">{name}</span>.
              <br />
              Which of these sounds like you?
            </>
          ) : (
            "Which of these sounds like you?"
          )}
        </h1>
        <p className="mt-3 max-w-[52ch] text-[0.98rem] leading-relaxed text-slate-500">
          Pick the one closest to how you would put it — you can change it
          whenever what you need changes.
        </p>
      </header>

      {/* Somewhere you are already going, offered as a continuation rather
          than as a status field. */}
      {state.current && (
        <section
          className="animate-fade-up mt-6 rounded-2xl border border-violet-100 bg-violet-50 px-5 py-4"
          style={{ animationDelay: "60ms" }}
        >
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-brand-violet-deep">
            You already started
          </p>
          <p className="mt-1 text-[1.05rem] font-semibold text-slate-900">
            {titles[state.current.route] ?? state.current.route}
          </p>
          {currentNote && (
            <p className="mt-1 text-[0.85rem] leading-snug text-violet-900/80">
              {currentNote}
            </p>
          )}
          <button
            type="button"
            onClick={() => router.push(landings[state.current!.route] ?? "/")}
            className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand-violet px-5 py-2.5 text-[0.88rem] font-bold text-white transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-brand-violet-deep motion-reduce:hover:translate-y-0"
          >
            Pick up where you left off
            <ArrowRight size={16} />
          </button>
        </section>
      )}

      {/* The recommended door, opened for them: their own sentence as the
          headline, what they walk away with, how it goes, and one button.
          The other doors wait below as quiet rows. */}
      {spotlight && (
        <section
          className={`animate-fade-up mt-6 rounded-3xl border border-brand-violet/40 bg-violet-50 px-5 py-5 transition-opacity sm:px-6 ${
            opening !== null && opening !== spotlight.id ? "opacity-50" : ""
          }`}
          style={{ animationDelay: "60ms" }}
        >
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-brand-violet-deep">
            Recommended for you
          </p>
          <h2 className="mt-1.5 text-[1.3rem] font-semibold leading-snug tracking-[-0.015em] text-slate-900 [text-wrap:balance]">
            &ldquo;{spotlight.need}&rdquo;
          </h2>
          <p className="mt-2.5 flex max-w-[52ch] items-start gap-2.5">
            <span className="mt-1 shrink-0 text-brand-teal-deep">
              <ArrowRight size={15} />
            </span>
            <span className="text-[0.95rem] font-medium leading-relaxed text-slate-800">
              {spotlight.output}
            </span>
          </p>
          {spotlight.steps && spotlight.steps.length > 0 && (
            <ul className="mt-3 grid gap-1.5">
              {spotlight.steps.map((step) => (
                <li key={step} className="flex items-start gap-2.5">
                  <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-violet/35" />
                  <span className="text-[0.88rem] leading-relaxed text-slate-600">
                    {step}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {spotlight.teaser && (
            <p className="mt-3.5 flex items-start gap-2 text-[0.85rem] leading-snug text-violet-900">
              <span className="mt-0.5 shrink-0 text-brand-violet">
                <Spark size={14} />
              </span>
              {spotlight.teaser}
            </p>
          )}
          {spotlight.resolved.note && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[0.82rem] leading-snug text-amber-900">
              <strong className="font-semibold">First:</strong>{" "}
              {spotlight.resolved.note}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <button
              type="button"
              disabled={opening !== null}
              onClick={() => void choose(spotlight.id)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand-violet px-5 py-2.5 text-[0.88rem] font-bold text-white transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-brand-violet-deep disabled:cursor-default disabled:opacity-60 motion-reduce:hover:translate-y-0"
            >
              {opening === spotlight.id ? "Opening…" : "Take me here"}
              {opening !== spotlight.id && <ArrowRight size={15} />}
            </button>
            <span className="text-[0.8rem] text-slate-500">
              {spotlight.time} · {spotlight.price}
            </span>
          </div>
        </section>
      )}

      {/* Six full cards is six screens of scrolling, and a list you have to
          scroll is a list you stop reading. So every option is a row you can
          take in at a glance: resting on a row — pointer or keyboard focus —
          unfolds what it leads to, and clicking the row takes you there. */}
      {spotlight && (
        <p className="mt-7 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-slate-400">
          The other doors
        </p>
      )}
      <div className={`${spotlight ? "mt-2.5" : "mt-7"} grid gap-2.5`}>
        {rows.map((route, i) => {
          const busy = opening === route.id;
          const status = routeStatus(route.id, state, journey);
          const started = status.percent !== null && !status.done;

          return (
            <div
              key={route.id}
              style={{ animationDelay: `${100 + i * 55}ms` }}
              // The whole tile is the target — header and unfolded detail
              // alike. The click handler lives here; the header button stays
              // for keyboard users, and its clicks (real or synthesised by
              // Enter/Space) bubble up to this same handler.
              onClick={() => void choose(route.id)}
              className={`group animate-fade-up cursor-pointer overflow-hidden rounded-2xl border bg-surface transition-colors ${
                busy
                  ? "border-brand-violet ring-3 ring-brand-violet/15"
                  : route.recommended
                    ? "border-brand-violet/40 bg-violet-50/40 hover:border-brand-violet/60"
                    : "border-slate-200 hover:border-brand-violet/40"
              } ${opening !== null && !busy ? "opacity-50" : ""}`}
            >
              <button
                type="button"
                disabled={opening !== null}
                className="flex w-full cursor-pointer items-center gap-4 px-5 py-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-violet disabled:cursor-default"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-slate-400">
                      {route.title}
                    </span>
                    {route.recommended && !status.done && !started && (
                      <span className="rounded-full bg-brand-violet px-2.5 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.1em] text-white">
                        Recommended
                      </span>
                    )}
                    {started && (
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.1em] text-brand-violet-deep">
                        {status.label}
                      </span>
                    )}
                    {status.done && (
                      <span className="inline-flex items-center gap-1 text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-brand-teal-deep">
                        <Check size={11} />
                        Done
                      </span>
                    )}
                  </span>

                  {/* The person's own line — the only thing that has to be
                      readable without opening anything. */}
                  <span className="mt-1 block truncate text-[1.05rem] font-semibold tracking-[-0.01em] text-brand-ink">
                    &ldquo;{route.need}&rdquo;
                  </span>
                </span>

                <span className="hidden shrink-0 text-[0.75rem] text-slate-400 sm:block">
                  {route.time}
                </span>
                <span
                  aria-hidden
                  className="shrink-0 text-slate-300 transition-[transform,color] duration-200 group-hover:translate-x-0.5 group-hover:text-brand-violet motion-reduce:transition-none"
                >
                  {busy ? (
                    <span className="block h-4 w-4 animate-spin rounded-full border-2 border-brand-violet border-t-transparent motion-reduce:animate-none" />
                  ) : (
                    <ChevronRight size={18} />
                  )}
                </span>
              </button>

              {/* What this door leads to, unfolded while the pointer or the
                  keyboard focus rests on the row. The content stays in the
                  page for assistive tech; only its height is collapsed. */}
              <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out group-hover:grid-rows-[1fr] group-focus-within:grid-rows-[1fr] motion-reduce:transition-none">
              <div className="min-h-0 overflow-hidden">
              <div className="border-t border-slate-100 px-5 pb-4 pt-4">
                <p className="flex max-w-[48ch] items-start gap-2.5">
                  <span className="mt-1 shrink-0 text-brand-teal-deep">
                    <ArrowRight size={15} />
                  </span>
                  <span className="text-[0.95rem] font-medium leading-relaxed text-slate-800">
                    {route.output}
                  </span>
                </p>

                {route.steps && route.steps.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[0.8rem] font-semibold text-slate-500">
                      How it goes
                    </p>
                    <ul className="mt-2 grid gap-1.5">
                      {route.steps.map((step) => (
                        <li key={step} className="flex items-start gap-2.5">
                          <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-violet/35" />
                          <span className="text-[0.88rem] leading-relaxed text-slate-600">
                            {step}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {route.teaser && (
                  <p className="mt-4 flex items-start gap-2 rounded-xl bg-violet-50 px-3 py-2.5 text-[0.85rem] leading-snug text-violet-900">
                    <span className="mt-0.5 shrink-0 text-brand-violet">
                      <Spark size={14} />
                    </span>
                    {route.teaser}
                  </p>
                )}

                {route.resolved.note && (
                  <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[0.82rem] leading-snug text-amber-900">
                    <strong className="font-semibold">First:</strong>{" "}
                    {route.resolved.note}
                  </p>
                )}

                <p className="mt-3.5 text-[0.8rem] text-slate-400">
                  {route.time} · {route.price} ·{" "}
                  {busy
                    ? "Opening…"
                    : status.done
                      ? "Click to open it again"
                      : "Click to take this path"}
                </p>
              </div>
              </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
