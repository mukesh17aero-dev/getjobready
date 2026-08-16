"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { selectJourneyRoute, type CareerProfile, type JourneyState } from "@/lib/api";
import { progressOf } from "@/lib/next-step";
import { journeyPercent, routeStatus, stages } from "@/lib/stages";
import { ArrowRight, Check, Clock } from "@/components/icons";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { track } from "@/lib/footprints";
import { RememberHub } from "@/components/remember-hub";
import { completeness, toFields } from "@/lib/profile";

// Outcome Router (Blueprint Screen 0) as a plan grid: each outcome is a
// bordered card stating what you walk away with, how long it takes and what
// it costs - the familiar "choose a plan" pattern, which is why it reads
// instantly. Initial state arrives server-rendered; this component handles
// choice, the idempotent select call and navigation.

// Card dressing by position: a tint and a decorative glyph. The glyphs are
// aria-hidden colour, never the meaning - the sentence next to them is.
const CARD_LOOKS = [
  { tint: "#0d9488", glyph: "\u{1F9ED}" },
  { tint: "#0369a1", glyph: "\u{1F4C4}" },
  { tint: "#047857", glyph: "\u{1F3AF}" },
  { tint: "#b45309", glyph: "\u{1F4C8}" },
  { tint: "#be185d", glyph: "\u{1F399}" },
  { tint: "#0f766e", glyph: "\u{1F48E}" },
];

export function StartRouter({
  initialState,
  profile = null,
  fallbackName = "",
}: {
  initialState: JourneyState | null;
  profile?: CareerProfile | null;
  fallbackName?: string;
}) {
  const router = useRouter();
  const [opening, setOpening] = useState<string | null>(null);
  const [failed, setFailed] = useState(initialState === null);
  const state = initialState;

  // Selecting a card is the action: it saves the choice and goes there.
  // No confirm step - prerequisites are shown on the cards themselves.
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
          The server may just be waking up - give it a moment and try again.
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
  const name =
    (progressOf(state).name ?? fallbackName ?? "").split(" ")[0] || null;
  // Where this person stands inside each door. Coming back to this page every
  // day, "what can I do" is answered once and "where did I get to" is the
  // question from then on.
  const journey = stages(state);

  // The backend's recommendation, staged as the one thing to do - but only
  // while nothing is in progress. The moment someone has picked a door, the
  // continuation above is the primary action and this screen must not offer
  // a second one; the recommendation goes back to being a badge in the list.
  // Whether the door they last walked through is now behind them - a
  // completed route must never be offered as "continue".
  const currentDone = state.current
    ? routeStatus(state.current.route, state, journey).done
    : false;
  const fields = toFields(profile);
  const percent = completeness(fields);
  const { selectedRole } = progressOf(state);
  // What a step NEEDS before it can honestly be the next step: Discovery
  // wants half a profile to work from; everything role-shaped (readiness,
  // practice, interview) is meaningless before a role is chosen. The doors
  // themselves stay open - only the recommendation is gated.
  const eligibleNext = (routeId: string): boolean => {
    if (routeId === "discovery" || routeId === "full_journey") return percent >= 50;
    if (routeId === "readiness" || routeId === "practice" || routeId === "interview") {
      return Boolean(selectedRole);
    }
    // The resume is a tool, not a journey stage - always available from
    // its card, never pushed as "your next step".
    if (routeId === "resume") return false;
    return true;
  };
  // The recommendation follows the journey's own order: after Discovery
  // comes the assessment, then practice, then the interview. The backend's
  // static flag (the whole package) is only the fallback when the ladder
  // is fully climbed.
  const LADDER = ["discovery", "readiness", "practice", "interview"];
  const nextOnLadder =
    LADDER.map((id) => state.routes.find((r) => r.id === id))
      .filter((r): r is (typeof state.routes)[number] => Boolean(r))
      .find((r) => !routeStatus(r.id, state, journey).done && eligibleNext(r.id)) ?? null;
  const spotlight =
    !state.current || currentDone || !eligibleNext(state.current.route)
      ? (nextOnLadder ??
        state.routes.find(
          (r) =>
            r.recommended &&
            !routeStatus(r.id, state, journey).done &&
            eligibleNext(r.id),
        ) ??
        null)
      : null;

  const travelled = journeyPercent(journey);
  const role = fields.currentRole || fields.course || null;
  // The role they chose at the end of Discovery - the single most
  // important fact this banner can show.
  const targetRole = state.progress?.role?.title ?? null;
  const spaces = fields.interestedSpaces
    ? fields.interestedSpaces.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 2)
    : [];

  // The banner's one continuation, in priority order: something already
  // started, an incomplete profile, then the recommendation.
  // A person we know nothing about goes to the profile first - always.
  // Only then does an unfinished route reclaim the button.
  const continueTo =
    percent === 0
      ? { label: "Start: tell us about you", act: () => router.push("/profile") }
      : state.current && !currentDone && eligibleNext(state.current.route)
        ? {
            label: `Continue: ${titles[state.current.route] ?? "where you left off"}`,
            act: () => router.push(landings[state.current!.route] ?? "/"),
          }
        : percent < 100
          ? { label: "Continue: finish your profile", act: () => router.push("/profile") }
          : spotlight
            ? { label: `Start: ${spotlight.title}`, act: () => void choose(spotlight.id) }
            : null;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6">
      <RememberHub path="/start" />

      {/* ---- mission control: the banner that knows you ---- */}
      <section className="animate-fade-up overflow-hidden rounded-3xl border border-slate-200">
        <div className="bg-gradient-to-r from-[#0d3b3f] via-[#0f766e] to-[#059669] px-5 py-5 text-white sm:px-6">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full border-4 border-white/30 text-center">
              <span className="font-display text-lg font-bold leading-none">
                {travelled}%
                <span className="mt-0.5 block text-[0.5rem] font-semibold uppercase tracking-wide text-white/80">
                  journey
                </span>
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-xl font-bold">
                {percent === 0
                  ? name
                    ? `Hi ${name} - let\u2019s begin.`
                    : "Welcome to Ascend - let\u2019s begin."
                  : name
                    ? `Hi ${name} - welcome back.`
                    : "Welcome back."}
              </p>
              {role && (
                <p className="mt-0.5 text-[0.9rem] font-medium text-white/95">
                  {role}
                </p>
              )}
            </div>
            {continueTo && (
              <button
                type="button"
                onClick={continueTo.act}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-[0.85rem] font-bold text-[#134e4a] transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
              >
                {continueTo.label}
                <ArrowRight size={15} />
              </button>
            )}
          </div>
          {(targetRole || spaces.length > 0 || (percent > 0 && percent < 100)) && (
            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {targetRole && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[0.74rem] font-bold ring-1 ring-white/40">
                  <span className="text-[0.56rem] font-bold uppercase tracking-wider text-white/70">
                    aiming to be
                  </span>
                  {targetRole}
                </span>
              )}
              {spaces.map((space) => (
                <span
                  key={space}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-[0.74rem] font-medium ring-1 ring-white/20"
                >
                  <span className="text-[0.56rem] font-bold uppercase tracking-wider text-white/60">
                    interested
                  </span>
                  {space}
                </span>
              ))}
              {percent > 0 && percent < 100 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-[0.74rem] font-medium ring-1 ring-white/20">
                  <span className="text-[0.56rem] font-bold uppercase tracking-wider text-white/60">
                    profile
                  </span>
                  {percent}%
                </span>
              )}
            </div>
          )}

          {/* the journey, as a strip of stage bars */}
          <div className="mt-4 flex items-start gap-1.5">
            {journey.map((stage) => (
              <div key={stage.id} className="min-w-0 flex-1">
                <div
                  className={`h-1.5 rounded-full ${
                    stage.state === "done"
                      ? "bg-white/90"
                      : stage.state === "live"
                        ? "bg-white/60"
                        : "bg-white/25"
                  }`}
                />
                <p className="mt-1 hidden truncate text-[0.6rem] font-semibold uppercase tracking-wide text-white/65 sm:block">
                  {stage.title}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ---- the goal grid: every door, status on its sleeve ---- */}
        <div className="grid gap-4 bg-brand-mist p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
          {state.routes.map((route, i) => {
            const busy = opening === route.id;
            const status = routeStatus(route.id, state, journey);
            const started = status.percent !== null && !status.done;
            const look = CARD_LOOKS[i % CARD_LOOKS.length];
            const recommended = spotlight?.id === route.id && !status.done && !started;

            return (
              <div
                key={route.id}
                onClick={() => void choose(route.id)}
                style={{ animationDelay: `${80 + i * 55}ms` }}
                className={`animate-fade-up flex cursor-pointer flex-col rounded-2xl border bg-surface p-4 transition-[box-shadow,border-color] hover:shadow-md ${
                  busy
                    ? "border-brand-teal ring-3 ring-brand-teal/15"
                    : recommended
                      ? "border-teal-700/50 shadow-[0_10px_30px_-14px_rgba(13,148,136,0.4)] hover:border-teal-700"
                      : "border-slate-200 hover:border-brand-teal/50"
                } ${opening !== null && !busy ? "opacity-50" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    aria-hidden
                    className="grid h-14 w-14 place-items-center rounded-2xl text-[1.8rem]"
                    style={{ background: `${look.tint}18` }}
                  >
                    {look.glyph}
                  </span>
                  {status.done ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-teal-700">
                      <Check size={10} /> Done
                    </span>
                  ) : started ? (
                    <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-teal-700">
                      {/* The resume card's status is the record count, which
                          reads as bureaucracy here - a plain label instead. */}
                      {route.id === "resume" ? "In progress" : status.label}
                    </span>
                  ) : recommended ? (
                    <span className="rounded-full bg-brand-teal-deep px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-white">
                      Recommended
                    </span>
                  ) : null}
                </div>

                <p className="mt-3 font-display text-[0.98rem] font-bold leading-snug text-brand-ink">
                  &ldquo;{route.need}&rdquo;
                </p>
                <p className="mt-1 flex-1 text-[0.78rem] leading-snug text-slate-500">
                  {route.output}
                </p>

                {route.resolved.note && (
                  <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[0.72rem] leading-snug text-amber-900">
                    <strong className="font-semibold">First:</strong>{" "}
                    {route.resolved.note}
                  </p>
                )}

                <div className="mt-3 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    disabled={opening !== null}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand-teal-deep px-3.5 py-2 text-[0.78rem] font-bold text-white transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-brand-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal disabled:cursor-default motion-reduce:hover:translate-y-0"
                  >
                    {busy ? "Opening\u2026" : route.title}
                    {!busy && <ArrowRight size={13} />}
                  </button>
                  <span className="inline-flex items-center gap-1 text-[0.7rem] text-slate-400">
                    <Clock size={11} />
                    {route.time}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
