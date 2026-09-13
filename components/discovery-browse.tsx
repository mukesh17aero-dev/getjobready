"use client";

// Discovery's browsing road, past the industry choice: the roles inside what
// was picked, and the itinerary for a short tour through them.
//
// The industries are chosen on the Discover page itself - see the intro stage
// in app/(student)/discover/discovery-flow.tsx. What is here is everything
// after that choice: the roles inside what was picked, and the plan for a tour
// through them.
//
// Two rules these screens must not break:
//
//   Order is not a score. Roles are grouped by the industries the person
//   picked, in the order they picked them. That is their statement about
//   themselves, not our judgement about them, and it is labelled as such.
//
//   Nothing is "recommended" until something has earned the word. The
//   recommended section is absent - not empty, absent - until Discovery has
//   run far enough to be sure. An empty box captioned "recommended" teaches
//   people that the word means nothing here.
//
// Presentational only: props in, JSX out. Every decision is the caller's.

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import "./discovery-modern.css";
import ws from "./discovery-workspace.module.css";
import { ArrowRight } from "@/components/icons";

export type World = {
  id: string;
  title: string;
  caption: string;
  /** "r g b" - the industry's own colour, for the tile wash. */
  tint: string;
  glyph: string;
};
export type RoleCard = {
  id: string;
  title: string;
  summary: string;
  /** Already formatted by the caller - this file does no arithmetic. */
  pay: string;
  /** The day in three or four parts, for the bar on the tile. */
  mix: Array<{ label: string; share: number }>;
  /** Carried on the tile itself, since the tiles are no longer grouped. */
  world: World;
};

/**
 * Two minutes a role - long enough for the assistant to say the things a job
 * description cannot, short enough that five of them is a coffee break.
 */
export const MINUTES_PER_ROLE = 2;
/** The two lengths offered. Everything else is derived from these. */
export const TOUR_LENGTHS = [
  { minutes: 5, roles: 3, label: "A quick look" },
  { minutes: 10, roles: 5, label: "The full tour" },
] as const;
/** The most a tour ever runs to. */
export const TOUR_ROLES = 5;

/* ----------------------------------------------------------------- roles -- */

// The shortlist lives in this browser. Nothing on the record holds one yet:
// choosing a direction is the decision that is kept, and a shortlist is a
// different, lighter thing - roles worth coming back to. It is said as much
// on the tab so nobody mistakes it for something saved to their account.
const SHORTLIST_KEY = "ascend:discovery-shortlist";
type Tab = "explore" | "saved" | "tour";
const BAND = { strong: "STRONG FIT", adjacent: "CLOSE FIT", stretch: "A STRETCH" } as const;

export function RoleList({
  roles,
  signedOut = false,
  previewRoleId = null,
  recommended,
  chosenRoleId,
  choosing,
  compareIds,
  onOpen,
  onChoose,
  onUnchoose,
  onToggleCompare,
  onTour,
  onBack,
  onPickIndustries,
  industriesPicked = 0,
}: {
  /** Guests can explore one fixed sample from the published catalogue. */
  signedOut?: boolean;
  previewRoleId?: string | null;
  /**
   * Every role, already in the person's own order: the industries they picked
   * first. Not grouped - the industry rides on each card instead.
   */
  roles: RoleCard[];
  /**
   * The engine's own result for each role it matched: every reason it gave,
   * how strong the fit is, and its own caveat where it had one. Null means
   * "we have not earned this yet" and the guide card takes its place.
   */
  recommended: Array<{
    roleId: string;
    title: string;
    why: string[];
    band: "strong" | "adjacent" | "stretch";
    score: number;
    uncertainty: string | null;
  }> | null;
  chosenRoleId: string | null;
  choosing: boolean;
  compareIds: string[];
  onOpen: (roleId: string) => void;
  onChoose: (roleId: string) => void;
  /** Take the chosen direction back. The caller confirms first. */
  onUnchoose?: () => void;
  onToggleCompare: (roleId: string) => void;
  onTour: () => void;
  onBack: () => void;
  /** Narrow the list to chosen industries - available, never compulsory. */
  onPickIndustries?: () => void;
  industriesPicked?: number;
}) {
  const [tab, setTab] = useState<Tab>("explore");
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("all");
  const [saved, setSaved] = useState<string[]>([]);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);

  // After the first paint, so the server-rendered list and the browser agree
  // on what they showed first.
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const raw = localStorage.getItem(SHORTLIST_KEY);
        const list: unknown = raw ? JSON.parse(raw) : [];
        if (Array.isArray(list)) setSaved(list.filter((x): x is string => typeof x === "string"));
      } catch {
        // Storage unavailable: the shortlist simply does not persist.
      }
    }, 0);
    return () => clearTimeout(id);
  }, []);
  function toggleSaved(id: string) {
    setSaved((list) => {
      const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
      try { localStorage.setItem(SHORTLIST_KEY, JSON.stringify(next)); } catch { /* fine */ }
      return next;
    });
  }

  const byId = new Map(roles.map((r) => [r.id, r]));
  const worlds = roles
    .map((r) => r.world)
    .filter((w, i, all) => all.findIndex((x) => x.id === w.id) === i);
  // What leads the page: the direction they chose, with the engine's read on
  // it beside it; otherwise the engine's strongest match, once it has earned
  // the word. Either way the next step is the same - find out where they
  // stand on the job's own work.
  type Match = NonNullable<typeof recommended>[number];
  const matchFor = (id: string): Match | null => (recommended ?? []).find((m) => m.roleId === id) ?? null;
  const chosenRole = chosenRoleId ? byId.get(chosenRoleId) : undefined;
  const top = (recommended ?? [])
    .map((match) => ({ match, role: byId.get(match.roleId) }))
    .find((x): x is { match: Match; role: RoleCard } => Boolean(x.role));
  const direction: { kind: "chosen" | "recommended"; role: RoleCard; match: Match | null } | null = chosenRole
    ? { kind: "chosen", role: chosenRole, match: matchFor(chosenRole.id) }
    : top
      ? { kind: "recommended", role: top.role, match: top.match }
      : null;
  const q = search.trim().toLowerCase();
  const list = roles.filter(
    (r) =>
      (tab !== "saved" || saved.includes(r.id)) &&
      (industry === "all" || r.world.id === industry) &&
      (!q || `${r.title} ${r.summary} ${r.world.title}`.toLowerCase().includes(q)),
  );
  // Every role at once: paging hid half the catalogue behind a button.
  const shown = list;
  const TABS: Array<{ id: Tab; label: string }> = [
    { id: "explore", label: "Explore roles" },
    { id: "saved", label: `Shortlist (${saved.length})` },
    { id: "tour", label: "My tour" },
  ];
  function switchTab(next: Tab) { setTab(next); }
  function onTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? TABS.length - 1 : (index + (event.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length;
    switchTab(TABS[next]!.id);
    tabs.current[next]?.focus();
  }
  function clearFilters() { setSearch(""); setIndustry("all"); switchTab("explore"); }

  return (
    <div className={ws.frame}>
      <button type="button" onClick={onBack} className={ws.back}>← Back to home</button>
      <header className={ws.heading}>
        <div>
          {/* One line. The label above it named the page somebody had just
              opened, and the line below described the tabs directly under it. */}
          <h1>Find work you can see yourself doing.</h1>
        </div>
        {onPickIndustries && (
          <button type="button" className={ws.textButton} onClick={onPickIndustries}>
            {industriesPicked > 0 ? "Your industries ↗" : "Choose industries ↗"}
          </button>
        )}
      </header>

      {direction ? (
        <section className={ws.recommendation} aria-label="Your direction">
          <div>
            <span className={ws.chip}>
              {direction.kind === "chosen" ? "YOUR CHOSEN DIRECTION" : `${BAND[direction.match!.band]} · RECOMMENDED FROM WHAT YOU DID HERE`}
            </span>
            <h2>{direction.role.title}</h2>
            <p>
              {direction.kind === "chosen"
                ? direction.match
                  ? `You chose this direction yourself. From what you read, toured, compared and asked here, it also ranks as a ${direction.match.band === "strong" ? "strong" : direction.match.band === "adjacent" ? "close" : "stretch"} fit.`
                  : "You chose this direction yourself. The next step is to find out where you stand on the job's own work."
                : direction.role.summary}
            </p>
            {/* The engine's own reasons, where a sentence saying "this is not
                an assessment result" used to be. Naming what the
                recommendation was actually built from says the same thing and
                is worth reading: the reasons are all "you toured this twice",
                never a claim about ability. Only the engine's words - nothing
                here is written for the occasion. */}
            {/* What this was built from, in terms of what they gave us.
                The engine's own reasons are not shown: every one of them is
                an observation about behaviour - how long a page was open,
                how often they came back, what they compared. We rank with
                those and we do not read them back to the person. What is
                theirs to see is what they chose and what they told us. */}
            {direction.match ? (
              <details className={ws.whySuits}>
                <summary>
                  Why this role suits you
                  <span aria-hidden="true">{"\u2304"}</span>
                </summary>
                <p>
                  Based on what you have told us: the{" "}
                  {industriesPicked > 0 ? `${industriesPicked} ` : ""}industries you chose, the
                  roles you picked out to look at, and the skills and aims on your profile.
                </p>
                {direction.match.uncertainty ? <small>{direction.match.uncertainty}</small> : null}
              </details>
            ) : (
              <small>
                {direction.kind === "chosen"
                  ? "Nothing is recorded yet to rank this by. Reading, touring and comparing roles here builds that up."
                  : "Built from what you read, toured, compared and asked here."}
              </small>
            )}
          </div>
          <div className={ws.directionActions}>
            <Link href={`/practice/readiness?role=${encodeURIComponent(direction.role.id)}`} className={ws.primary}>
              Check your role readiness →
            </Link>
            {/* Going to the role page is an action like the one above it, so
                it looks like one. */}
            <button type="button" className={ws.secondary} onClick={() => onOpen(direction.role.id)}>
              {direction.kind === "chosen" ? "Open the role →" : "See why this role fits →"}
            </button>
            {direction.kind === "chosen" && onUnchoose && (
              <button type="button" className={ws.unselect} disabled={choosing} onClick={onUnchoose}>
                Unselect this direction
              </button>
            )}
          </div>
        </section>
      ) : null}
      {!direction && (
        <section className={ws.guide} aria-label="Not sure where to start">
          <div>
            <span className={ws.compass} aria-hidden="true">✧</span>
            <div>
              <h2>Not sure where to start?</h2>
              <p>A short tour through a few roles, two minutes each, can narrow your direction. What you read, tour, compare and ask here is what the recommendation is built from.</p>
            </div>
          </div>
          <div className={ws.guideAction}>
            <button type="button" className={ws.primary} onClick={onTour}>Start a workplace tour →</button>
            <small>Up to five roles · no test</small>
          </div>
        </section>
      )}

      <div className={ws.sectionTabs} role="tablist" aria-label="Discovery views">
        {TABS.map((item, index) => (
          <button
            key={item.id}
            ref={(node) => { tabs.current[index] = node; }}
            type="button"
            role="tab"
            id={`discovery-tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls="discovery-panel"
            tabIndex={tab === item.id ? 0 : -1}
            onClick={() => switchTab(item.id)}
            onKeyDown={(event) => onTabKey(event, index)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <section id="discovery-panel" role="tabpanel" aria-labelledby={`discovery-tab-${tab}`}>
        {tab === "tour" ? (
          <div className={ws.empty}>
            <div className={ws.emptyIcon} aria-hidden="true">◇</div>
            <h2>A few roles. One stop at a time.</h2>
            <p>Choose up to five roles and get a short briefing on the work, the trade-offs and what a first month asks of you.</p>
            <button type="button" className={ws.secondary} onClick={onTour}>Plan my tour →</button>
          </div>
        ) : (
          <>
            <div className={ws.filterbar}>
              <label className={ws.search}>
                <span aria-hidden="true">⌕</span>
                <span className={ws.srOnly}>Search roles</span>
                <input type="search" value={search} placeholder="Search roles or the work you enjoy" onChange={(e) => setSearch(e.target.value)} />
              </label>
              <label>
                <span className={ws.srOnly}>Filter industry</span>
                <select value={industry} onChange={(e) => setIndustry(e.target.value)}>
                  <option value="all">All industries</option>
                  {worlds.map((w) => <option key={w.id} value={w.id}>{w.title}</option>)}
                </select>
              </label>
              <small>{list.length} {list.length === 1 ? "role" : "roles"}</small>
            </div>

            {shown.length > 0 ? (
              <>
                {signedOut && <p className="mb-4 text-sm text-slate-600">Explore one role for free. Sign in to unlock every role.</p>}
                <ul className={ws.cards}>
                  {shown.map((role) => {
                    const chosen = chosenRoleId === role.id;
                    const kept = saved.includes(role.id);
                    const locked = signedOut && role.id !== previewRoleId;
                    return (
                      <li key={role.id} className="relative overflow-hidden rounded-2xl">
                        {/* The tile as it was before the workspace: the industry's
                            tinted ground and its tilted card on top, the day's mix
                            as a bar, pay, and the decision on the tile. What the
                            workspace added sits with it: the glimpse line, the
                            explore button and the shortlist heart. */}
                        <div
                          inert={locked || undefined}
                          aria-hidden={locked || undefined}
                          style={locked ? { filter: "blur(7px)", pointerEvents: "none", userSelect: "none" } : undefined}
                          className={`discovery-role-card relative flex h-full min-h-[20rem] flex-col justify-end overflow-hidden rounded-2xl border transition-transform hover:-translate-y-0.5 motion-reduce:transition-none ${chosen ? "border-brand-teal" : "border-slate-200"}`}
                          data-chosen={chosen}
                        >
                          <label className="absolute left-4 top-1 z-10 flex min-h-11 cursor-pointer items-center gap-1.5 text-[0.74rem] font-semibold text-slate-600">
                            <input type="checkbox" className="h-4 w-4 accent-teal-700" checked={compareIds.includes(role.id)} onChange={() => onToggleCompare(role.id)} />
                            Compare
                          </label>
                          <button
                            type="button"
                            aria-pressed={kept}
                            aria-label={`${kept ? "Remove" : "Add"} ${role.title} ${kept ? "from" : "to"} shortlist`}
                            onClick={() => toggleSaved(role.id)}
                            className={`absolute right-3 top-2 z-10 grid h-11 w-11 place-items-center rounded-lg border text-[1.1rem] transition-colors motion-reduce:transition-none ${kept ? "border-teal-700 bg-teal-50 text-teal-700" : "border-slate-300 bg-surface text-teal-700"}`}
                          >
                            {kept ? "♥" : "♡"}
                          </button>
                          <span aria-hidden="true" className="discovery-role-object absolute left-1/2 top-9 -translate-x-1/2 text-[2.4rem] leading-none">
                            {role.world.glyph}
                          </span>
                          {role.mix[0] && (
                            <span className="absolute inset-x-6 top-[6.6rem] truncate text-center text-[0.7rem] text-slate-500">
                              <span className="text-[0.62rem] font-bold uppercase tracking-[0.12em]">A glimpse of the work</span> · {role.mix[0].label}
                            </span>
                          )}
                          <div className="relative">
                            <h2 className="text-[1.15rem] font-bold leading-snug text-brand-ink">{role.title}</h2>
                            {role.mix.length > 0 && (
                              <span className="mt-3 block">
                                <span className="flex h-1.5 overflow-hidden rounded-full bg-slate-200">
                                  {role.mix.map((m, i) => (
                                    <span key={m.label} style={{ width: `${m.share}%`, background: `rgb(${role.world.tint} / ${Math.max(0.25, 1 - i * 0.22)})` }} />
                                  ))}
                                </span>
                                <span className="mt-1.5 block truncate text-[0.72rem] text-slate-500">{role.mix[0]!.share}% {role.mix[0]!.label.toLowerCase()}</span>
                              </span>
                            )}
                            <span className="mt-2 flex flex-wrap items-center justify-between gap-2">
                              <span className="text-[0.82rem] font-semibold text-slate-500">{role.pay || "Pay not listed yet"}</span>
                              <button
                                type="button"
                                disabled={choosing || chosen}
                                onClick={() => onChoose(role.id)}
                                className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-[0.74rem] font-bold transition-colors disabled:opacity-80 motion-reduce:transition-none ${chosen ? "border-brand-teal bg-brand-teal text-white" : "border-slate-400/60 text-brand-ink hover:border-teal-700"}`}
                              >
                                {chosen ? "Chosen" : "Choose this role"}
                              </button>
                            </span>
                            <button type="button" onClick={() => onOpen(role.id)} className="mt-3 flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-300 bg-surface text-[0.8rem] font-bold text-teal-700 transition-colors hover:border-teal-700 motion-reduce:transition-none">
                              Explore the role ↗
                            </button>
                          </div>
                        </div>
                        {locked && <div className="absolute inset-0 flex items-center justify-center bg-surface/40 p-5">
                          <div className="w-full rounded-xl border border-slate-300 bg-surface p-5 text-center shadow-sm">
                            <h2 className="text-base font-bold text-brand-ink">Unlock this role</h2>
                            <p className="mt-2 text-sm leading-relaxed text-slate-600">See the work, skills and career path with a free account.</p>
                            <Link href={`/login?next=${encodeURIComponent(`/discover?role=${role.id}`)}`} className="mt-4 flex min-h-11 items-center justify-center rounded-lg bg-brand-violet px-4 text-sm font-bold text-white">Sign in to explore</Link>
                          </div>
                        </div>}
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <div className={ws.empty}>
                <div className={ws.emptyIcon} aria-hidden="true">◇</div>
                <h2>{tab === "saved" && saved.length === 0 ? "Keep the roles you want to revisit." : "No roles match these filters."}</h2>
                <p>{tab === "saved" && saved.length === 0 ? "Tap the heart on a role to put it here. A shortlist is different from choosing a direction." : "Try another industry or a shorter search."}</p>
                <button type="button" className={ws.secondary} onClick={clearFilters}>Browse all roles</button>
              </div>
            )}
            {tab === "saved" && saved.length > 0 && (
              <p className={ws.note}>Your shortlist is kept in this browser{signedOut ? "" : ", not on your record"}. Choosing a direction is what goes on your record.</p>
            )}
          </>
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------- itinerary -- */

export function ItineraryPicker({
  options,
  stops,
  onLength,
  onAdd,
  onRemove,
  onStart,
  onBack,
}: {
  /** Every role available, already in interest order. */
  options: Array<{ id: string; title: string; world: World }>;
  /** The plan, in order. Built for them, then theirs to edit. */
  stops: string[];
  /** Swap the whole plan for one of the two lengths. */
  onLength: (roles: number) => void;
  onAdd: (roleId: string) => void;
  onRemove: (roleId: string) => void;
  onStart: () => void;
  onBack: () => void;
}) {
  const byId = new Map(options.map((o) => [o.id, o]));
  const spare = options.filter((o) => !stops.includes(o.id));

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="min-h-11 text-[0.85rem] font-semibold text-slate-500"
      >
        ← Back to the roles
      </button>
      <h1 className="mt-1 font-display text-[1.8rem] font-bold leading-tight tracking-tight text-brand-ink sm:text-[2.1rem]">
        Your tour
      </h1>
      {/* Built, not demanded. Somebody who has just been handed a plan can
          edit it; somebody handed an empty list has to do the work twice. */}
      <p className="mt-1 text-[0.85rem] text-slate-500">
        About two minutes a role - the assistant talking you through what the
        description does not say, and answering whatever you ask. Put together
        from what you picked; swap anything you like.
      </p>

      <div className="mt-4 flex flex-wrap gap-2.5">
        {TOUR_LENGTHS.map((len) => {
          const on = stops.length === Math.min(len.roles, options.length);
          const fits = Math.min(len.roles, options.length);
          return (
            <button
              key={len.minutes}
              type="button"
              aria-pressed={on}
              onClick={() => onLength(len.roles)}
              className={`min-h-11 rounded-xl border px-4 text-left transition-colors ${
                on
                  ? "border-brand-violet bg-brand-violet/10"
                  : "border-slate-300 hover:border-slate-400"
              }`}
            >
              <span className="block text-[0.86rem] font-bold text-brand-ink">
                {len.label} · {len.minutes} min
              </span>
              <span className="block text-[0.75rem] text-slate-500">
                {fits} role{fits === 1 ? "" : "s"}, about two minutes each
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section>
          <div className="overflow-hidden rounded-2xl border border-brand-violet/30 bg-brand-violet/[0.05]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-violet/20 px-4 py-3">
              <div>
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-brand-violet-deep">
                  The plan
                </p>
                <p className="text-[1.05rem] font-bold text-brand-ink">
                  {stops.length} stop{stops.length === 1 ? "" : "s"} · about{" "}
                  {stops.length * MINUTES_PER_ROLE} minutes
                </p>
              </div>
              <button
                type="button"
                disabled={stops.length === 0}
                onClick={onStart}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-violet px-6 text-[0.88rem] font-bold text-white transition-colors hover:bg-brand-violet-deep disabled:opacity-40"
              >
                Start the tour
                <ArrowRight size={15} />
              </button>
            </div>

            {stops.length === 0 ? (
              <p className="px-4 py-6 text-[0.88rem] text-slate-500">
                Nothing in the plan. Add a few from the right.
              </p>
            ) : (
              <ol className="divide-y divide-brand-violet/15">
                {stops.map((id) => {
                  const o = byId.get(id);
                  if (!o) return null;
                  return (
                    <li key={id} className="flex items-center gap-3 px-4 py-3">
                      <span className="min-w-0 flex-1">
                        <span className="block text-[0.9rem] font-bold leading-tight text-brand-ink">
                          {o.title}
                        </span>
                        <span className="block text-[0.76rem] text-slate-500">
                          {o.world.title}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemove(id)}
                        className="min-h-10 shrink-0 px-2 text-[0.78rem] font-semibold text-slate-400 hover:text-slate-700"
                      >
                        Remove
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
          <p className="mt-2 text-[0.78rem] text-slate-400">
            After every one I will ask what you made of it, in your own words.
          </p>
        </section>

        <section>
          <h2 className="text-[0.95rem] font-bold text-brand-ink">
            {spare.length === 0
              ? "Everything is in the plan"
              : "Swap in another role"}
          </h2>
          <ul className="mt-3 grid gap-2">
            {spare.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => onAdd(o.id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-surface px-3.5 py-2.5 text-left transition-colors hover:border-brand-violet/50"
                >
                  <span
                    aria-hidden
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-base"
                    style={{ background: `rgb(${o.world.tint} / 0.14)` }}
                  >
                    {o.world.glyph}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.85rem] font-bold leading-tight text-brand-ink">
                      {o.title}
                    </span>
                    <span className="block text-[0.74rem] text-slate-500">
                      {o.world.title}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className="shrink-0 text-[1.1rem] font-bold text-brand-violet-deep"
                  >
                    +
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

/**
 * An industry's roles as a field of tiles rather than a list of cards.
 *
 * A list says "choose one of these". A field says "there is a world in here" -
 * which is the honest description of what somebody who has never seen a job
 * described is looking at. Tiles carry the industry's own colour, sit at two
 * weights so the eye has somewhere to go, and open the role when tapped.
 * Comparing stays available in the corner; choosing happens on the role's own
 * page, where there is room to have second thoughts.
 */
/**
 * Why this role is on this person's list.
 *
 * Every reason the engine gave, not the first one - a recommendation somebody
 * cannot interrogate is an instruction. The fit band leads because it is the
 * honest size of the claim: "strong" and "a stretch" are different statements
 * and were being rendered identically. The engine's own caveat is shown where
 * it wrote one, because what makes a recommendation trustworthy is that it
 * says when it is unsure before somebody finds out the hard way.
 */
