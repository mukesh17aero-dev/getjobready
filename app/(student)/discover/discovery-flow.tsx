"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  getDiscovery,
  selectDiscoveryRole,
  type DiscoveryState,
} from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { SignUpPrompt, type GatedAction } from "@/components/auth/signup-gate";
import { flushFootprints, track } from "@/lib/footprints";
import { RememberHub } from "@/features/journey";
import { payRange } from "@/features/discovery";
import {
  ItineraryPicker,
  RoleList,
  TOUR_ROLES,
} from "@/features/discovery";
import type { TourNote } from "@/features/discovery";
import { RoleTourStage } from "@/features/discovery";
import { RolePage } from "@/features/discovery";
import { RoleCompare } from "@/features/discovery";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IndustryBriefPanel } from "@/features/discovery";
import { Check, ChevronRight } from "@/components/ui/icons";

// The 3–5 minute Discovery flow (MVP deliverable 4). The server chooses each
// question from the published bank based on what has been answered so far, so
// no two people walk the same path and the run ends as soon as one role is
// clearly ahead. This screen holds no questions of its own — it renders
// whatever it is handed and sends back the answer.

// Dressing per world position: a tint and a decorative glyph. The meaning is
// always the world's own title and caption, never the glyph - these only make
// the industries tellable apart at a glance.
const LOOKS = [
  { tint: "244 114 182", glyph: "\u{1F6CD}" },
  { tint: "56 189 248", glyph: "\u{1F3E6}" },
  { tint: "45 212 191", glyph: "\u{1F4E6}" },
  { tint: "251 191 36", glyph: "\u{1F37D}" },
  { tint: "139 92 246", glyph: "\u{1F3A7}" },
];

/** Where the picked industries are remembered between visits. */
const INDUSTRY_KEY = "discovery-industries";

type Stage =
  | "roles"
  | "itinerary"
  | "role"
  | "tour"
  | "tour-done";

async function token(): Promise<string | null> {
  const { data } = await supabaseBrowser().auth.getSession();
  return data.session?.access_token ?? null;
}

// How someone answered, measured in the browser because it is about pace and
// hesitation, which the server cannot see. Kept as a ref: it must never cause
// a re-render, and it is read only when a payload is built.
export function DiscoveryFlow({
  initial,
  signedOut = false,
  /** A role id from the address bar. Opens straight onto it. */
  initialRole = null,
  /** Back out of Discovery, to the walkthrough this was started from. */
  onLeave,
}: {
  initial: DiscoveryState | null;
  /** Nobody is signed in: the questions were never fetched, so say so. */
  signedOut?: boolean;
  initialRole?: string | null;
  onLeave: () => void;
}) {
  const content = initial?.content ?? null;
  const [gate, setGate] = useState<GatedAction | null>(null);
  // A finished attempt arrives with the page itself, so the results screen
  // opens on it directly — the roles must never flash past someone who
  // already has a result while a network round trip confirms it. The
  // adaptive fetch below still runs and replaces this with the engine's
  // fuller state (real rushed and asked counts) when it lands.
  // The matches the backend has on file for this person, if it has any.
  // They used to come from a ten-question survey run in the browser; that
  // survey is gone - Discovery is reading roles and touring them now - so
  // this reads whatever the attempt already holds and shows nothing when it
  // holds nothing. A recommendation with no reason behind it is worse than
  // no recommendation.
  // The attempt is state rather than a prop read once: the ranking behind
  // it moves as this person reads, tours, compares and asks, and the screen
  // asks for it again at the moments that change it - see refreshMatches.
  const [attempt, setAttempt] = useState(initial?.attempt ?? null);
  const matches = attempt?.matches?.matches ?? [];
  // Whether the engine considers this a recommendation, rather than the screen
  // deciding for itself that any match at all is one. Absent - an API one
  // deploy behind - is read as "not yet".
  const recommending = attempt?.matches?.enough === true;
  // Send what has been recorded so far and read the ranking back. Signed
  // out there is nothing recorded and nothing to read, so it is a no-op.
  async function refreshMatches() {
    await flushFootprints();
    const t = await token();
    if (!t) return;
    const state = await getDiscovery(t);
    if (state?.attempt) setAttempt(state.attempt);
  }
  const [stage, setStage] = useState<Stage>(
    initialRole ? "role" : "roles",
  );

  const [selectedRole, setSelectedRole] = useState<string | null>(
    initial?.attempt?.selectedRole ?? null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Role reality and comparison are overlays over the matches, never
  // separate pages: opening one never loses the results behind it.
  const [compareIds, setCompareIds] = useState<string[]>([]);
  // Taking a chosen direction back, and the moment right after choosing one.
  const [unchooseOpen, setUnchooseOpen] = useState(false);
  const [chosenPrompt, setChosenPrompt] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);
  // Browsing by industry: the other way into the same place, for the person
  // who cannot have a preference yet because they have never seen the field.
  // It sits alongside the questions and replaces none of them.
  // The industries this person said interest them, in the order they said it.
  // That order is theirs, and it is the only ordering applied to the roles.
  const [chosenWorlds, setChosenWorlds] = useState<string[]>([]);
  // Kept on the device, so coming back does not mean saying it again. It is a
  // preference rather than a record - the account holds what Discovery makes,
  // this only holds where somebody was looking - so localStorage is the honest
  // home for it, and losing it costs two taps.
  // Asked once, on the first visit. Somebody who has answered it before goes
  // straight to the roles - being asked the same question every time is how a
  // product tells you it was not listening.
  const [industriesOpen, setIndustriesOpen] = useState(false);
  const restored = useRef(false);
  useEffect(() => {
    // Whether the question has EVER been answered, which is a different fact
    // from what was picked. Somebody who answered and chose nothing had stored
    // an empty list, which read as "never asked" - so they were asked again on
    // every visit, which is exactly what this was built not to do.
    let answered = false;
    let saved: string[] = [];
    try {
      const raw = window.localStorage.getItem(INDUSTRY_KEY);
      answered = raw !== null;
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) {
        saved = parsed.filter((x): x is string => typeof x === "string");
      }
    } catch {
      // Private browsing, or something else wrote nonsense here. Start clean.
    }
    // Only industries that still exist: one can be unpublished between visits.
    // Filtered ONLY when there is a live list to filter against - `initial` is
    // null on a page that could not reach the API, and treating that as "none
    // of your industries exist any more" threw the answer away and asked for
    // it again.
    const worlds = initial?.content.worlds ?? [];
    const live = new Set(worlds.map((w) => w.id));
    const keep = worlds.length > 0 ? saved.filter((id) => live.has(id)) : saved;
    // The industry question comes before the roles. The screen that used to
    // ask it is gone, so it is asked here, once, on the first visit - and
    // never again, because being asked the same question every time is how a
    // product tells you it was not listening. Somebody who arrived on a role
    // link or already has a result is not interrupted.
    // Applied a tick later rather than inside the effect body: the server
    // rendered this page with nothing selected and the first client paint has
    // to agree with it, or hydration mismatches.
    const t = setTimeout(() => {
      if (keep.length > 0) setChosenWorlds(keep);
      // Asked once. Not "asked whenever the last answer happened to be empty",
      // and not "asked again because the API was slow this time".
      if (!answered && !initialRole) setIndustriesOpen(true);
      // Only now may the save effect run. It used to be armed before this
      // timeout, so its first pass wrote the still-empty state back over the
      // stored answer - the read had already happened, so it looked harmless,
      // and it was one re-render away from erasing the thing being restored.
      restored.current = true;
    }, 0);
    return () => clearTimeout(t);
  }, [initial, initialRole]);

  useEffect(() => {
    if (!restored.current) return;
    try {
      window.localStorage.setItem(INDUSTRY_KEY, JSON.stringify(chosenWorlds));
    } catch {
      // As above: not being able to remember is not an error worth showing.
    }
  }, [chosenWorlds]);
  // The roles they want walked through, and the planned tour once it starts.
  const [tourPicks, setTourPicks] = useState<string[]>([]);
  const [itinerary, setItinerary] = useState<string[] | null>(null);
  // Where the tour has got to, and what it has been told at each stop.
  const [tourAt, setTourAt] = useState(0);
  const [tourNotes, setTourNotes] = useState<TourNote[]>([]);
  // The role open over the browsing screens.
  // A role is a page, never a dialog: which role, and the screen to return to.
  // A quick look inside one industry, from the Discover page. Not the picking
  // step - just "what is actually in there", which is the question the list of
  // names raises and does not answer.
  const [peekWorld, setPeekWorld] = useState<string | null>(null);
  const [rolePage, setRolePage] = useState<{
    id: string;
    back: Stage;
    label: string;
  } | null>(
    // Read once, at mount: somebody who arrived on a role link is already
    // there, and setting this from an effect would render the wrong screen
    // first and then correct it.
    initialRole
      ? { id: initialRole, back: "roles", label: "Back to the roles" }
      : null,
  );

  // The personal read-out, fetched once the result is on screen. The scores
  // are arithmetic and appear instantly; this is written, so it arrives a
  // moment later rather than holding the whole page back. The server writes it
  // once per recommendation, so every later visit is a database read.
  // Two different silences. Signed out, the questions were never asked for -
  // that is not a failure and must not be dressed as one.
  if (!content && signedOut) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-wide text-brand-violet-deep">
          Discovery
        </p>
        <h1 className="mt-1 text-[1.7rem] font-bold leading-tight text-brand-ink">
          See what the work actually is
        </h1>
        {/* This describes the screen behind it rather than being it, because
            the role catalogue is only served to a signed-in request today.
            The moment the backend serves it openly, this page becomes the
            industry picker itself - browsing is reading, and reading is free. */}
        <p className="mt-3 max-w-prose text-[0.92rem] leading-relaxed text-slate-600">
          Discovery starts with the field, not with a test. You pick an
          industry, see every role in it - what the day is actually spent on,
          what it pays, what is hard about it - and a discovery assistant sits
          on every role to answer what the page does not. If you would rather
          not choose where to start, it walks you through them one at a time.
        </p>
        <ul className="mt-4 grid gap-2 text-[0.88rem] leading-relaxed text-slate-600">
          <li>
            Cannot pick an industry? A few real choices - three to five minutes,
            no right answers - and Discovery suggests roles from how you
            answered instead.
          </li>
          <li>There is no score and no wrong answer to any of it.</li>
          <li>
            What you look at and what you say about it is yours - which is why
            it needs somewhere to be kept.
          </li>
        </ul>
        <button
          type="button"
          onClick={() =>
            setGate({
              what: "your Discovery result",
              why: "Discovery keeps what you looked at, what you said about it and which roles fit you. That record is yours, so it needs an account to live in.",
            })
          }
          className="mt-6 min-h-12 rounded-full bg-brand-violet px-7 text-sm font-bold text-white"
        >
          Start Discovery
        </button>
        {gate && <SignUpPrompt action={gate} onClose={() => setGate(null)} />}
      </main>
    );
  }

  if (!content) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">
          Discovery couldn&apos;t load
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

  // What someone did on a walk-through is behaviour, so it goes where all
  // other behaviour goes — the footprint stream the backend already reads.
  // Nothing is scored here; this screen only reports what happened.
  function recordTour(notes: TourNote[]) {
    for (const note of notes) {
      track({
        family: "interest",
        event: "role_tour_verdict",
        module: "discovery",
        target: note.roleId,
        meta: {
          thoughts: note.thoughts,
          leastWanted: note.leastWanted,
          asked: note.asked,
          reaction: note.reaction ?? null,
        },
      });
    }
  }

  /* ---- what the browsing screens are built from ------------------------ */

  const rolesIn = (worldId: string) =>
    (content.catalogue ?? []).filter(
      (c) =>
        c.world === worldId && content.roles.some((r) => r.roleId === c.id),
    );
  const detailOf = (id: string) =>
    content.roles.find((r) => r.roleId === id) ?? null;
  // Catalogue order stays fixed when visitors sort, search or change industries.
  const previewRoleId = (content.catalogue ?? []).find((c) => detailOf(c.id))?.id ?? null;

  // "Recommended" is a word that has to be earned. The adaptive run ends when
  // it is sure - so a finished run with matches is the confidence signal, and
  // until there is one this stays null and the section is not rendered at all.
  // The whole reason, not the first line of it.
  //
  // This used to hand over `m.why[0] ?? m.summary` - one of the engine's
  // reasons, and if it had none, the role's own description standing in for
  // one. A description under "Recommended for you" reads as a rationale and is
  // not one: it says what the job is, never why this person. The engine always
  // produces at least one real reason, so the fallback was never reached and
  // was one empty array away from putting a claim on screen nobody had made.
  const recommended =
    recommending && matches.length > 0
      ? matches.map((m) => ({
          roleId: m.roleId,
          title: m.title,
          why: m.why,
          band: m.band,
          score: m.score,
          uncertainty: m.uncertainty,
        }))
      : null;

  // Where a role sits in this person's own result, when it sits anywhere.
  const matchNoteFor = (id: string) => {
    const m = matches.find((x) => x.roleId === id);
    return m
      ? `${m.band} fit · ${m.score}% match with your choices`
      : undefined;
  };

  // Grouped by industry, industries in the order they were picked. The only
  // reordering inside a group is to float roles the engine already matched -
  // and that only happens once the engine is sure.
  const matchedIds = new Set((recommended ?? []).map((r) => r.roleId));
  const groupFor = (worldId: string) => {
    const at = content.worlds.findIndex((w) => w.id === worldId);
    const found = content.worlds[at];
    if (!found) return null;
    const look = LOOKS[at % LOOKS.length]!;
    const world = { ...found, tint: look.tint, glyph: look.glyph };
    const roles = rolesIn(worldId)
      .slice()
      .sort(
        (a, b) => Number(matchedIds.has(b.id)) - Number(matchedIds.has(a.id)),
      )
      .map((c) => {
        const detail = detailOf(c.id);
        return {
          id: c.id,
          title: c.title,
          summary: c.summary,
          pay: detail ? `${payRange(detail.payMonthly)} to start` : "",
          mix: detail
            ? detail.workMix.map((m) => ({ label: m.label, share: m.share }))
            : [],
        };
      });
    return { world, roles };
  };
  const asGroups = (ids: string[]) =>
    ids
      .map(groupFor)
      .filter(
        (g): g is NonNullable<typeof g> => g !== null && g.roles.length > 0,
      );

  const groups = asGroups(chosenWorlds);
  // Everything they did not pick, in the catalogue's own order.
  const otherGroups = asGroups(
    content.worlds.map((w) => w.id).filter((id) => !chosenWorlds.includes(id)),
  );

  // Their industries first, so "choose for me" fills the tour from what they
  // asked for - but everything else is on the list, because a tour that can
  // only contain what somebody already named cannot show them anything new.
  // Flat and already ordered - the tiles carry their own industry, so the
  // screen does not need a heading per industry to say where each came from.
  const browseRoles = [...groups, ...otherGroups].flatMap((g) =>
    g.roles.map((r) => ({ ...r, world: g.world })),
  );

  const tourOptions = [...groups, ...otherGroups].flatMap((g) =>
    g.roles.map((r) => ({ id: r.id, title: r.title, world: g.world })),
  );

  // A role is somewhere you can be sent, so it has an address. The flow
  // itself stays on /discover - only the role changes the bar, which is what
  // makes one shareable and the back button behave the way people expect.
  function roleUrl(id: string | null): string {
    return id ? `/discover?role=${encodeURIComponent(id)}` : "/discover";
  }

  function openRole(id: string, back: Stage, label: string) {
    setRolePage({ id, back, label });
    setStage("role");
    window.history.pushState(null, "", roleUrl(id));
    window.scrollTo({ top: 0 });
    track({
      family: "interest",
      event: "role_opened",
      module: "discovery",
      target: id,
    });
  }

  async function choose(roleId: string) {
    setBusy(true);
    setError(null);
    const t = await token();
    // Signed out this used to set busy and return, so the button went dead
    // with no explanation. Choosing a role is the decision the whole module
    // is for and it has to be kept somewhere, so this is the moment the
    // account is worth asking for - said here, at the press, rather than
    // guarded at the door.
    if (!t) {
      setBusy(false);
      setGate({
        what: "the role you just chose",
        why: "Choosing a role is what makes everything after it - your resume, your practice, your interview - about this job rather than jobs in general. It has to be kept somewhere, and that somewhere is an account.",
      });
      return;
    }
    const updated = await selectDiscoveryRole(t, roleId, crypto.randomUUID());
    if (!updated) {
      setError("Could not save your choice — try again.");
      setBusy(false);
      return;
    }
    setSelectedRole(roleId);
    setBusy(false);
    if (roleId !== "none") setChosenPrompt(roleId);
    track({
      family: "decision",
      event: "discovery_role_selected",
      module: "discovery",
      target: roleId,
    });
  }
  const chosenPromptTitle =
    (content?.catalogue ?? []).find((c) => c.id === chosenPrompt)?.title ?? "This role";

  // Undoing the choice. "none" is a first-class answer on the record - a
  // correction, not a deletion - and it is confirmed first because everything
  // downstream (resume, practice, interviews) stops pointing at the role.
  function unchoose() {
    if (!selectedRole || selectedRole === "none") return;
    setUnchooseOpen(true);
  }
  async function confirmUnchoose() {
    setUnchooseOpen(false);
    await choose("none");
    setSelectedRole(null);
    if (stage === "role") leaveRole("roles"); // picking again happens on the list
  }
  function leaveRole(to: Stage) { window.history.pushState(null, "", roleUrl(null)); setStage(to); void refreshMatches(); }
  const unchooseTitle =
    (content?.catalogue ?? []).find((c) => c.id === selectedRole)?.title ?? "this role";

  // The account prompt, rendered by each screen that can raise it. The
  // screens return different trees, so there is no single place to put it -
  // one element, mounted in several.
  const gateEl = (
    <>
      {gate && <SignUpPrompt action={gate} onClose={() => setGate(null)} />}
      {chosenPrompt && (
        <Dialog
          title={`${chosenPromptTitle} is your direction.`}
          subtitle="Your resume, practice and interviews now point at this role."
          onClose={() => setChosenPrompt(null)}
          footer={
            <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setChosenPrompt(null)}
                className="min-h-11 rounded-full border border-slate-300 px-5 text-sm font-bold text-brand-ink transition-colors hover:border-slate-400 motion-reduce:transition-none"
              >
                Keep exploring
              </button>
              <Link
                href={`/practice/readiness?role=${encodeURIComponent(chosenPrompt)}`}
                className="inline-flex min-h-11 items-center rounded-full bg-brand-teal-deep px-5 text-sm font-bold text-white transition-colors hover:bg-brand-teal motion-reduce:transition-none"
              >
                Check my role readiness →
              </Link>
            </div>
          }
        >
          <p className="text-[0.92rem] leading-relaxed text-slate-700">
            The next step is finding out where you stand on the job&apos;s own work: fifteen minutes of real situations from this role, marked skill by skill. Reading about a job and being able to do it are different things, and this is where the second one shows.
          </p>
        </Dialog>
      )}
      {unchooseOpen && (
        <ConfirmDialog
          title={`Unselect ${unchooseTitle} as your direction?`}
          body="Your resume, practice and interview tools stop pointing at it until you choose a role again. Everything you have read, toured and written here stays on your record."
          confirmLabel="Unselect it"
          cancelLabel="Keep my direction"
          busy={busy}
          onConfirm={() => void confirmUnchoose()}
          onClose={() => setUnchooseOpen(false)}
        />
      )}
    </>
  );

  // ---------- the industry question ----------
  // The industry question and the look inside one. They used to belong to an
  // opening screen that said what Discovery is; that screen is gone - the
  // walkthrough on /discover says it now, and saying it twice was the reason
  // people had to press through a page to reach the roles. The dialogs are
  // still needed, so they moved to the screen that uses them.
  const industryDialogs = (
    <>
      {gateEl}
      {industriesOpen && (
        <Dialog
          title="Which of these interest you?"
          subtitle="Pick as many as you like - you can change them whenever"
          onClose={() => setIndustriesOpen(false)}
          wide
          footer={
            <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
              <span className="text-[0.82rem] text-slate-500">
                {chosenWorlds.length === 0
                  ? "Pick at least one."
                  : `${chosenWorlds.length} picked.`}
              </span>
              <button
                type="button"
                disabled={chosenWorlds.length === 0}
                onClick={() => {
                  setIndustriesOpen(false);
                  setStage("roles");
                  for (const id of chosenWorlds) {
                    track({
                      family: "interest",
                      event: "industry_selected",
                      module: "discovery",
                      target: id,
                      meta: { rank: chosenWorlds.indexOf(id) + 1 },
                    });
                  }
                }}
                className="rounded-lg bg-brand-violet px-5 py-2 text-sm font-bold text-white disabled:opacity-40"
              >
                Show me all roles
              </button>
            </div>
          }
        >
          <p className="text-[0.88rem] leading-relaxed text-slate-600">
            Nobody can have a preference about work they have never seen
            described. Not sure what is in one? Open it and look before you
            pick.
          </p>
          <ul className="mt-3.5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {content.worlds.map((w, i) => {
              const count = rolesIn(w.id).length;
              const picked = chosenWorlds.includes(w.id);
              const look = LOOKS[i % LOOKS.length]!;
              return (
                <li key={w.id}>
                  <div
                    role="checkbox"
                    aria-checked={picked}
                    aria-disabled={count === 0}
                    tabIndex={count === 0 ? -1 : 0}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest("button")) return;
                      if (count === 0) return;
                      setChosenWorlds((all) =>
                        all.includes(w.id)
                          ? all.filter((x) => x !== w.id)
                          : [...all, w.id],
                      );
                    }}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter" && e.key !== " ") return;
                      e.preventDefault();
                      if (count === 0) return;
                      setChosenWorlds((all) =>
                        all.includes(w.id)
                          ? all.filter((x) => x !== w.id)
                          : [...all, w.id],
                      );
                    }}
                    className={`flex h-full items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors ${
                      count === 0
                        ? "cursor-not-allowed border-slate-200 opacity-40"
                        : picked
                          ? "cursor-pointer border-brand-teal bg-teal-50/60"
                          : "cursor-pointer border-slate-200 bg-surface hover:border-slate-300"
                    }`}
                  >
                    <span
                      aria-hidden
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-xl"
                      style={{ background: `rgb(${look.tint} / 0.14)` }}
                    >
                      {look.glyph}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.88rem] font-bold leading-tight text-brand-ink">
                        {w.title}
                      </span>
                      <span className="block text-[0.74rem] leading-snug text-slate-500">
                        {w.caption}
                      </span>
                    </span>
                    <span
                      aria-hidden
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border ${
                        picked
                          ? "border-brand-teal bg-brand-teal text-white"
                          : "border-slate-300 text-transparent"
                      }`}
                    >
                      <Check size={13} />
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </Dialog>
      )}

      {peekWorld &&
        (() => {
          const w = content.worlds.find((x) => x.id === peekWorld);
          if (!w) return null;
          return (
            <Dialog
              title={w.title}
              subtitle={w.caption}
              onClose={() => setPeekWorld(null)}
              wide
              footer={
                <button
                  type="button"
                  onClick={() => {
                    setChosenWorlds((picked) =>
                      picked.includes(w.id) ? picked : [...picked, w.id],
                    );
                    setPeekWorld(null);
                  }}
                  className="rounded-lg bg-brand-violet px-5 py-2 text-sm font-bold text-white hover:bg-brand-violet-deep"
                >
                  This interests me
                </button>
              }
            >
              <IndustryBriefPanel
                title={w.title}
                caption={w.caption}
                brief={w.brief}
              />
            </Dialog>
          );
        })()}
    </>
  );

  // ---------- the browsing road: industries, roles, itinerary ----------

  // One role opened over any of the three screens below. The assistant comes
  // with it, because this is where somebody is deciding.
  if (stage === "role" && rolePage) {
    if (signedOut && rolePage.id !== previewRoleId) {
      return <main className="mx-auto max-w-xl px-4 py-10">
        <button type="button" className="mb-6 min-h-11 text-sm font-semibold text-slate-600" onClick={() => { window.history.pushState(null, "", "/discover"); setStage("roles"); }}>← Back to the roles</button>
        <section className="rounded-2xl border border-slate-300 bg-surface p-6">
          <h1 className="text-xl font-bold text-brand-ink">Sign in to explore this role</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">Your free account unlocks every role, including the daily work, skills and career paths.</p>
          <Link href={`/login?next=${encodeURIComponent(roleUrl(rolePage.id))}`} className="mt-5 flex min-h-11 items-center justify-center rounded-lg bg-brand-violet px-4 font-semibold text-white">Sign in to explore</Link>
        </section>
      </main>;
    }
    const role = detailOf(rolePage.id);
    if (role) {
      return (
        <>
          {gateEl}
          <RolePage
            role={role}
            title={
              (content.catalogue ?? []).find((c) => c.id === rolePage.id)
                ?.title ?? rolePage.id.replace(/_/g, " ")
            }
            note={matchNoteFor(rolePage.id)}
            backLabel={rolePage.label}
            onBack={() => leaveRole(rolePage.back)}
            onSectionRead={(section, seconds) =>
              track({
                family: "interest",
                event: "role_section_read",
                module: "discovery",
                target: role.roleId,
                meta: { section, seconds },
              })
            }
            onReaction={(reaction) =>
              track({
                family: "interest",
                event: "role_reaction",
                module: "discovery",
                target: role.roleId,
                meta: { reaction },
              })
            }
            onNote={(thoughts) =>
              track({
                family: "interest",
                event: "role_note",
                module: "discovery",
                target: role.roleId,
                meta: { thoughts },
              })
            }
            chosen={selectedRole === role.roleId}
            choosing={busy}
            onChoose={() => void choose(role.roleId)}
            onUnchoose={unchoose}
            onDwell={(seconds) =>
              track({
                family: "interest",
                event: "role_read",
                module: "discovery",
                target: role.roleId,
                meta: { seconds },
              })
            }
          />
        </>
      );
    }
  }

  if (stage === "roles") {
    return (
      // The roles get the whole page: a field of tiles is the one screen here
      // that gains from width rather than just stretching.
      <main className="w-full px-4 pb-12 pt-6 sm:px-6 lg:px-10">
        <RememberHub path="/discover" />
        <RoleList
          signedOut={signedOut}
          previewRoleId={previewRoleId}
          onPickIndustries={() => setIndustriesOpen(true)}
          industriesPicked={chosenWorlds.length}
          roles={signedOut ? [...browseRoles].sort((a, b) => Number(b.id === previewRoleId) - Number(a.id === previewRoleId)) : browseRoles}
          recommended={recommended}
          chosenRoleId={selectedRole}
          choosing={busy}
          compareIds={compareIds}
          onOpen={(id) => openRole(id, "roles", "Back to the roles")}
          onChoose={(id) => void choose(id)}
          onUnchoose={unchoose}
          onToggleCompare={(id) =>
            setCompareIds((ids) =>
              ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
            )
          }
          onTour={() => {
            // Arrive at a plan, not at an empty list.
            setTourPicks(tourOptions.slice(0, TOUR_ROLES).map((o) => o.id));
            setStage("itinerary");
          }}
          onBack={() => onLeave()}
        />
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

        {compareIds.length >= 2 && (
          <div className="sticky bottom-3 mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-surface/95 px-4 py-2.5 shadow-lg backdrop-blur">
            <span className="flex-1 text-[0.8rem] text-slate-600">
              {compareIds.length} roles selected
            </span>
            <button
              type="button"
              onClick={() => setCompareIds([])}
              className="min-h-10 text-[0.8rem] text-slate-400 hover:text-slate-700"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                setComparing(true);
                // Weighing two roles against each other says more about
                // interest than opening either of them did.
                track({
                  family: "interest",
                  event: "roles_compared",
                  module: "discovery",
                  meta: { roles: compareIds },
                });
                void refreshMatches();
              }}
              className="min-h-10 rounded-lg bg-brand-panel px-4 text-[0.8rem] font-bold text-white"
            >
              Compare
            </button>
          </div>
        )}

        {comparing && compareIds.length >= 2 && (
          <RoleCompare
            roles={compareIds
              .map(detailOf)
              .filter((r): r is NonNullable<typeof r> => Boolean(r))}
            titles={Object.fromEntries(
              (content.catalogue ?? []).map((r) => [r.id, r.title]),
            )}
            chosenRoleId={selectedRole}
            onClose={() => setComparing(false)}
            onChoose={(roleId) => {
              setComparing(false);
              void choose(roleId);
            }}
          />
        )}

        {industryDialogs}
      </main>
    );
  }

  if (stage === "itinerary") {
    // Their own list if they made one; otherwise the first few in the order
    // they said they were interested, matched roles first where the engine
    // has earned an opinion.
    const start = (roleIds: string[]) => {
      if (roleIds.length === 0) return;
      setItinerary(roleIds);
      setTourAt(0);
      setTourNotes([]);
      setStage("tour");
      track({
        family: "engagement",
        event: "role_tour_started",
        module: "discovery",
        meta: { roles: roleIds, chosenByUser: tourPicks.length > 0 },
      });
    };
    return (
      <main className="mx-auto max-w-5xl px-4 pb-12 pt-6">
        <RememberHub path="/discover" />
        <ItineraryPicker
          options={tourOptions}
          stops={tourPicks}
          onAdd={(id) =>
            setTourPicks((picked) =>
              picked.includes(id) ? picked : [...picked, id],
            )
          }
          onRemove={(id) =>
            setTourPicks((picked) => picked.filter((x) => x !== id))
          }
          onLength={(n) =>
            setTourPicks(tourOptions.slice(0, n).map((o) => o.id))
          }
          onStart={() => start(tourPicks)}
          onBack={() => setStage("roles")}
        />
      </main>
    );
  }

  if (stage === "tour" && itinerary) {
    const stops = itinerary
      .map((id) => detailOf(id))
      .filter((r): r is NonNullable<typeof r> => r !== null);
    if (stops.length === 0) return null;
    return (
      <>
        {gateEl}
        <RoleTourStage
          signedOut={signedOut}
          // Keyed on the stop: arriving somewhere new starts it clean.
          key={stops[Math.min(tourAt, stops.length - 1)]!.roleId}
          roles={stops}
          titleOf={(id) =>
            (content.catalogue ?? []).find((c) => c.id === id)?.title ??
            id.replace(/_/g, " ")
          }
          at={Math.min(tourAt, stops.length - 1)}
          chosenRoleId={selectedRole}
          choosing={busy}
          onChoose={(roleId) => void choose(roleId)}
          onNote={(note) => {
            setTourNotes((n) => [
              ...n.filter((x) => x.roleId !== note.roleId),
              note,
            ]);
            recordTour([note]);
          }}
          onAdvance={() => {
            if (tourAt < stops.length - 1) setTourAt(tourAt + 1);
            else {
              setStage("tour-done");
              void refreshMatches();
            }
          }}
          onLeave={() => setStage("roles")}
        />
      </>
    );
  }

  if (stage === "tour-done") {
    // The end of a tour is not a report card - it is a shortlist. These are
    // the roles they have just been walked through, in their own words, with
    // the one decision the whole thing was for.
    return (
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6">
        <RememberHub path="/discover" />
        {gateEl}
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.08em] text-brand-violet-deep">
          Where you have been
        </p>
        <h1 className="mt-1 font-display text-[1.8rem] font-bold leading-tight tracking-tight text-brand-ink sm:text-[2.1rem]">
          Did you find your dream role?
        </h1>

        <ul className="mt-5 grid gap-3">
          {tourNotes.map((n) => {
            const chosen = selectedRole === n.roleId;
            return (
              <li
                key={n.roleId}
                className="rounded-xl border border-slate-200 bg-surface px-4 py-3.5"
              >
                <p className="text-[0.95rem] font-bold text-brand-ink">
                  {n.title}
                </p>
                {n.thoughts && (
                  <p className="mt-1 text-[0.85rem] leading-relaxed text-slate-600">
                    &ldquo;{n.thoughts}&rdquo;
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={busy || chosen}
                    onClick={() => void choose(n.roleId)}
                    className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl px-5 text-[0.85rem] font-bold transition-colors disabled:opacity-80 ${
                      chosen
                        ? "bg-brand-teal text-white"
                        : "border border-slate-300 text-brand-ink hover:border-brand-violet/60"
                    }`}
                  >
                    {chosen ? (
                      <>
                        <Check size={14} /> Your selected role
                      </>
                    ) : (
                      "Choose this role"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      openRole(n.roleId, "tour-done", "Back to the tour")
                    }
                    className="min-h-11 text-[0.84rem] font-semibold text-brand-violet-deep"
                  >
                    Open it again
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 border-t border-slate-200 pt-5">
          <button
            type="button"
            onClick={() => setStage("roles")}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-violet px-6 text-[0.88rem] font-bold text-white transition-colors hover:bg-brand-violet-deep"
          >
            Explore other roles
            <ChevronRight size={15} />
          </button>
        </div>
      </main>
    );
  }

  // Every stage above returns. Discovery ends on a chosen role now, not on a
  // results page: there is no survey to produce one.
  return null;
}
