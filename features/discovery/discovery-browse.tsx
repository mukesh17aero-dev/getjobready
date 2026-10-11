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

import { exploreIntro, type ExploreIntro } from "./explore-intro";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import "./discovery-modern.css";
import ws from "./discovery-workspace.module.css";
import { ArrowRight } from "@/components/ui/icons";
import { useBrowseFilters } from "./use-browse-filters";
import { useSavedRoles } from "./use-saved-roles";
import { RoleAlignment } from "./role-alignment";
import { BrowseRoleCard } from "./browse-role-card";
import { Picker } from "@/components/ui/picker";

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
  experienceLevels?: Array<"student" | "early_career">;
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
  { minutes: 6, roles: 3, label: "A quick look" },
  { minutes: 10, roles: 5, label: "The full tour" },
] as const;
/** The most a tour ever runs to. */
export const TOUR_ROLES = 5;

/* ----------------------------------------------------------------- roles -- */

type Tab = "explore" | "saved" | "tour";

export function RoleList({
  intro = exploreIntro(),
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
  intro?: ExploreIntro;
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
  useEffect(() => { if (new URLSearchParams(window.location.search).get("saved") !== "1") return; const timer = setTimeout(() => setTab("saved"), 0); return () => clearTimeout(timer); }, []);
  const {search,setSearch,industry,setIndustry,experience,setExperience} = useBrowseFilters();
  const { saved, toggleSaved, busy: savingRoles, error: saveError, browserSaved, moveBrowserRoles } = useSavedRoles(signedOut);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);

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
      (experience === "all" || r.experienceLevels?.includes(experience as "student" | "early_career")) &&
      (!q || `${r.title} ${r.summary} ${r.world.title}`.toLowerCase().includes(q)),
  );
  // Every role at once: paging hid half the catalogue behind a button.
  const shown = list;
  const TABS: Array<{ id: Tab; label: string }> = [
    { id: "explore", label: "Explore roles" },
    { id: "saved", label: `Saved roles (${saved.length})` },
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
  function clearFilters() { setSearch(""); setIndustry("all"); setExperience("all"); switchTab("explore"); }

  return (
    <div className={ws.frame}>
      <button type="button" onClick={onBack} className={ws.browseBack}>← Back to home</button>
      <header className={ws.heading}>
        <div>
          {/* One line. The label above it named the page somebody had just
              opened, and the line below described the tabs directly under it. */}
          <p className={ws.eyebrow}>{intro.eyebrow}</p><h1>{intro.title}</h1><p>{intro.description}</p>
        </div>
        {onPickIndustries && (
          <button type="button" className={ws.textButton} onClick={onPickIndustries}>
            {industriesPicked > 0 ? "Your industries ↗" : "Choose industries ↗"}
          </button>
        )}
      </header>

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

      {(saveError || savingRoles || tab === "saved") && <p className={ws.note} role="status">{saveError || (savingRoles ? "Loading or saving your roles…" : signedOut ? "Saved in this browser. Sign in to keep it across devices." : "Saved to your Ascend profile.")}</p>}
      {!signedOut && browserSaved.length > 0 && <section className={ws.soft}><p>{browserSaved.length} roles were saved only in this browser. Move them to the account you are currently signed into to keep them across devices.</p><button type="button" className={ws.textButton} disabled={savingRoles} onClick={() => void moveBrowserRoles()}>Move to saved roles</button></section>}
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
              {/* Dropdowns that open below their button: on a Mac a built-in
                  select draws its menu over the control instead. */}
              <div className={ws.filterField}>
                <span aria-hidden="true">Industry</span>
                <Picker label="Industry" value={industry} onChange={setIndustry} options={[{ id: "all", label: "All industries" }, ...worlds.map((w) => ({ id: w.id, label: w.title }))]} />
              </div>
              <div className={ws.filterField}>
                <span aria-hidden="true">Experience level</span>
                <Picker label="Experience level" value={experience} onChange={setExperience} options={[{ id: "all", label: "All experience levels" }, { id: "student", label: "Student / first job" }, { id: "early_career", label: "Early professional" }]} />
              </div>
              
            </div>
            {/* Its own line: in the filter row, the count growing with each letter
                typed and the clear button appearing squeezed the search box. */}
            <div className={ws.resultLine}><small>{list.length} {list.length === 1 ? "role" : "roles"}{q ? <> for “<span className={ws.query}>{search}</span>”</> : ""}</small>{(search || industry !== "all" || experience !== "all") && <button type="button" className={ws.textButton} onClick={clearFilters}>Clear all filters</button>}</div>

            {experience !== "all" && <p className={ws.note}>Showing roles with matching published entry requirements. Roles with unspecified experience remain under All experience levels.</p>}
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
                        <div className="h-full" inert={locked || undefined} aria-hidden={locked || undefined} style={locked ? { filter: "blur(7px)", pointerEvents: "none", userSelect: "none" } : undefined}>
                          <BrowseRoleCard role={role} chosen={chosen} saved={kept} comparing={compareIds.includes(role.id)} choosing={choosing} saving={savingRoles} onSave={() => void toggleSaved(role.id)} onCompare={() => onToggleCompare(role.id)} onOpen={() => onOpen(role.id)} onChoose={() => onChoose(role.id)} />
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
                <h2>{tab === "saved" && saved.length === 0 ? "Save roles here while you explore." : "No roles match that search."}</h2>
                <p>{tab === "saved" && saved.length === 0 ? "Use the save button on a role to keep it here. You can choose a direction later." : "Try another phrase or browse all roles."}</p>
                <button type="button" className={ws.secondary} onClick={clearFilters}>Browse all roles</button>
              </div>
            )}
            {tab === "saved" && saved.length > 0 && (
              <p className={ws.note}>{signedOut ? "Saved in this browser. Sign in to keep it across devices." : "Saved to your Ascend profile."}</p>
            )}
          </>
        )}
      </section>
      {direction ? (
        <section className={ws.recommendation} aria-label="Your direction">
          <div>
            <span className={ws.chip}>
              {direction.kind === "chosen" ? "YOUR CHOSEN DIRECTION" : "A ROLE TO EXPLORE"}
            </span>
            <h2>{direction.role.title}</h2>
            <p>
              {direction.kind === "chosen"
                ? "Explore the role before deciding what to practise next."
                : direction.role.summary}
            </p>
            <RoleAlignment key={direction.role.id} roleId={direction.role.id} signedOut={signedOut} />
          </div>
          <div className={ws.directionActions}>
            <Link href={`/practice?role=${encodeURIComponent(direction.role.id)}`} className={ws.primary}>
              See practice options →
            </Link>
            {/* Going to the role page is an action like the one above it, so
                it looks like one. */}
            <button type="button" className={ws.secondary} onClick={() => onOpen(direction.role.id)}>
              Open the role →
            </button>
            {direction.kind === "chosen" && onUnchoose && (
              <button type="button" className={ws.unselect} disabled={choosing} onClick={onUnchoose}>
                Unselect this direction
              </button>
            )}
          </div>
        </section>
      ) : null}
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
                {len.label} · about {fits * MINUTES_PER_ROLE} min
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
                <p className="text-[0.75rem] font-bold uppercase tracking-[0.08em] text-brand-violet-deep">
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
                        className="min-h-10 shrink-0 px-2 text-[0.78rem] font-semibold text-slate-500 hover:text-slate-700"
                      >
                        Remove
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
          <p className="mt-2 text-[0.78rem] text-slate-500">
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
                    <span className="block text-[0.75rem] text-slate-500">
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
