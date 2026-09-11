"use client";

// A role, on a page of its own.
//
// Role detail used to be a dialog over the list. That was fine when it was a
// glance and wrong once the discovery assistant moved in: a modal gives the thing
// you came to read a box in the middle of the screen and the assistant a strip
// at the bottom, and it puts a scrim over the only context that made the role
// mean anything. A page gives the work a column and the assistant a column,
// and going back is a link rather than a dismissal.
//
// Same body as the tour's stops - both use RoleBody - so a role reads
// identically whether you walked into it or were taken there.
//
// The assistant is a bubble rather than a column. A column costs a fifth of
// the page whether or not anybody uses it, and this screen belongs to the job
// description. What stops the bubble reading as a support widget is that it
// says what it is for - "Ask about this role" - instead of being an icon in a
// corner. It volunteers nothing; the briefing is what a tour is for.

import { useEffect, useRef, useState } from "react";
import { RoleBody, type RolePart } from "@/components/role-preview";
import type { RoleDetail } from "@/lib/api";
import ws from "@/components/discovery-workspace.module.css";

// The shortlist the roles list keeps in this browser - the same key, so a
// heart pressed here shows on the list and the other way round.
const SHORTLIST_KEY = "ascend:discovery-shortlist";
// A reaction and a note, kept in this browser. They are for the person
// deciding, not for the record: nothing here is read by anything else.
const REACTIONS_KEY = "ascend:discovery-reactions";
type Reaction = "curious" | "unsure" | "not-for-me";
const REACTIONS: Array<{ id: Reaction; label: string }> = [
  { id: "curious", label: "Curious" },
  { id: "unsure", label: "Not sure yet" },
  { id: "not-for-me", label: "Not for me" },
];
function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeStore(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}

export function RolePage({
  role,
  signedOut = false,
  title,
  /** Where this sits in the person's results, when it sits anywhere. */
  note: listNote,
  why,
  backLabel,
  onBack,
  chosen,
  choosing,
  onChoose,
  onUnchoose,
  /** How long they stayed, in seconds - reported once, on the way out. */
  onDwell,
  onSectionRead,
  onReaction,
  onNote,
}: {
  role: RoleDetail;
  /**
   * Signed out, the first section reads in full and the rest keep their
   * headings with the text blurred - the same rule the tour follows, so a
   * role reads the same wherever it is opened.
   */
  signedOut?: boolean;
  title: string;
  note?: string;
  /**
   * The engine's whole result for this role, where it matched one - every
   * reason it gave and its own caveat. The tile that opened this page has room
   * for the size of the claim and one line of it; this is where the rest goes,
   * because a recommendation somebody cannot interrogate is an instruction.
   */
  why?: {
    why: string[];
    band: "strong" | "adjacent" | "stretch";
    score: number;
    uncertainty: string | null;
  } | null;
  backLabel: string;
  onBack: () => void;
  chosen: boolean;
  choosing: boolean;
  onChoose: () => void;
  /** Take the chosen direction back. The caller confirms first. */
  onUnchoose?: () => void;
  onDwell?: (seconds: number) => void;
  /** Seconds spent on one tab of the body, reported when they leave it. */
  onSectionRead?: (section: Exclude<RolePart, "all">, seconds: number) => void;
  /** Their verdict on the page; null when they clear it. */
  onReaction?: (reaction: Reaction | null) => void;
  /** The note under the verdict, reported when they leave the box. */
  onNote?: (thoughts: string) => void;
}) {
  const body = useRef<HTMLElement | null>(null);

  // Time on a role is the quietest signal there is and the hardest to fake:
  // reported once, on the way out, so nothing is sent for a page bounced off.
  const dwell = useRef(onDwell);
  useEffect(() => {
    dwell.current = onDwell;
  }, [onDwell]);
  useEffect(() => {
    const since = performance.now();
    return () => {
      const seconds = Math.round((performance.now() - since) / 1000);
      if (seconds >= 3) dwell.current?.(seconds);
    };
  }, [role.roleId]);
  // The body in three tabs rather than one long sheet: the work, the
  // reality check, and skills and growth. The tab resets with the role, so
  // the next role opens on the work again.
  const [tab, setTab] = useState<Exclude<RolePart, "all">>("work");
  // Time on each tab, reported when they leave it - the rule reads a fuller
  // look (two or three parts) as more than one tab left open.
  const sectionSince = useRef(0);
  const sectionRead = useRef(onSectionRead);
  useEffect(() => { sectionRead.current = onSectionRead; }, [onSectionRead]);
  const leaveSection = (from: Exclude<RolePart, "all">) => {
    const seconds = Math.round((performance.now() - sectionSince.current) / 1000);
    sectionSince.current = performance.now();
    if (seconds >= 2) sectionRead.current?.(from, seconds);
  };
  const tabRef = useRef(tab);
  useEffect(() => { tabRef.current = tab; }, [tab]);
  useEffect(() => {
    sectionSince.current = performance.now();
    return () => leaveSection(tabRef.current);
  }, [role.roleId]);
  const openTab = (next: Exclude<RolePart, "all">) => {
    if (next === tab) return;
    leaveSection(tab);
    setTab(next);
  };
  const [kept, setKept] = useState(false);
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [note, setNote] = useState("");
  useEffect(() => {
    // After the first paint, so the server-rendered page and the browser
    // agree on what they showed first.
    const id = setTimeout(() => {
      setTab("work");
      setKept(readStore<string[]>(SHORTLIST_KEY, []).includes(role.roleId));
      const mine = readStore<Record<string, { reaction?: Reaction; note?: string }>>(REACTIONS_KEY, {})[role.roleId];
      setReaction(mine?.reaction ?? null);
      setNote(mine?.note ?? "");
    }, 0);
    return () => clearTimeout(id);
  }, [role.roleId]);
  function toggleKept() {
    const list = readStore<string[]>(SHORTLIST_KEY, []);
    const next = list.includes(role.roleId) ? list.filter((x) => x !== role.roleId) : [...list, role.roleId];
    writeStore(SHORTLIST_KEY, next);
    setKept(next.includes(role.roleId));
  }
  function remember(next: { reaction?: Reaction | null; note?: string }) {
    const all = readStore<Record<string, { reaction?: Reaction; note?: string }>>(REACTIONS_KEY, {});
    const current = all[role.roleId] ?? {};
    const merged = {
      ...current,
      ...(next.reaction !== undefined ? { reaction: next.reaction ?? undefined } : {}),
      ...(next.note !== undefined ? { note: next.note } : {}),
    };
    writeStore(REACTIONS_KEY, { ...all, [role.roleId]: merged });
  }
  const TABS: Array<{ id: Exclude<RolePart, "all">; label: string }> = [
    { id: "work", label: "The work" },
    { id: "reality", label: "Reality check" },
    { id: "growth", label: "Skills & growth" },
  ];
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-4 sm:px-6">
      <div className={ws.frame}>
        <div ref={body as React.RefObject<HTMLDivElement>}>
          <button type="button" onClick={onBack} className={ws.back}>← {backLabel}</button>
          <header className={ws.heading}>
            <div>
              <p className={ws.eyebrow}>{role.sector.toUpperCase()}{listNote ? ` · ${listNote.toUpperCase()}` : ""}</p>
              <h1>{title}</h1>
              <p>{role.pitch}</p>
            </div>
            <button
              type="button"
              className={ws.textButton}
              aria-pressed={kept}
              onClick={toggleKept}
            >
              {kept ? "♥ Shortlisted" : "♡ Shortlist"}
            </button>
          </header>

          <div className={ws.twoCol}>
            <section className={ws.panel}>
              <div className={ws.sectionTabs} role="tablist" aria-label="Role details">
                {TABS.map((item, index) => (
                  <button
                    key={item.id}
                    ref={(node) => { tabRefs.current[index] = node; }}
                    type="button"
                    role="tab"
                    id={`role-tab-${item.id}`}
                    aria-selected={tab === item.id}
                    aria-controls="role-tab-panel"
                    tabIndex={tab === item.id ? 0 : -1}
                    onClick={() => openTab(item.id)}
                    onKeyDown={(event) => {
                      if (!["ArrowRight", "ArrowLeft"].includes(event.key)) return;
                      event.preventDefault();
                      const next = (index + (event.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length;
                      openTab(TABS[next]!.id);
                      tabRefs.current[next]?.focus();
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div id="role-tab-panel" role="tabpanel" aria-labelledby={`role-tab-${tab}`}>
                {tab === "work" && (
                  <p className="mb-4 text-[0.88rem] leading-relaxed text-slate-600">{role.description}</p>
                )}
                {tab === "work" && why && why.why.length > 0 && (
                  <div className={ws.soft}>
                    <strong>Why this one is on your list</strong>
                    <ul>{why.why.map((line) => <li key={line}>{line}</li>)}</ul>
                    {/* Said before somebody finds out the hard way. A recommendation
                        that never admits doubt is the one nobody should trust. */}
                    {why.uncertainty && <p style={{ marginTop: 8 }}>{why.uncertainty}</p>}
                  </div>
                )}
                <RoleBody role={role} signedOut={signedOut} part={tab} />
              </div>
            </section>

            <aside className={`${ws.panel} ${ws.decision}`} aria-label="Make it your own">
              <p className={ws.eyebrow}>MAKE IT YOUR OWN</p>
              <h2>Could this be your kind of work?</h2>
              {role.suitsYouIf[0] && <p>{role.suitsYouIf[0].replace(/[.?]$/, "")}?</p>}
              <div className={ws.feelings} role="group" aria-label="Your reaction to this role">
                {REACTIONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={reaction === item.id}
                    onClick={() => {
                      const next = reaction === item.id ? null : item.id;
                      setReaction(next);
                      remember({ reaction: next });
                      onReaction?.(next);
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <label className={ws.field}>
                What draws you in, or gives you pause?
                <textarea
                  rows={3}
                  value={note}
                  maxLength={600}
                  placeholder="An optional thought in your own words…"
                  onChange={(e) => { setNote(e.target.value); remember({ note: e.target.value }); }}
                  onBlur={() => onNote?.(note.trim())}
                />
              </label>
              <button
                type="button"
                className={ws.primary}
                disabled={choosing || chosen}
                onClick={onChoose}
              >
                {chosen ? "✓ Your chosen direction" : choosing ? "Saving…" : "Choose this direction →"}
              </button>
              {chosen && onUnchoose && (
                <button type="button" className={ws.textButton} disabled={choosing} onClick={onUnchoose} style={{ marginTop: 8 }}>
                  Unselect this direction
                </button>
              )}
              <p className={`${ws.quiet}`}>Your interest helps you choose. Readiness comes from a separate assessment.</p>
            </aside>
          </div>
        </div>
      </div>

    </main>
  );
}
