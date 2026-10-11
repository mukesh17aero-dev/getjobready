"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HelpSheet } from "@/components/ui/help-sheet";
import { Info } from "@/components/ui/icons";
import help from "./field-help.module.css";
import { RESUME_SECTIONS } from "./resume-section-editor";
import type { ResumeData } from "./resume-api";
import s from "./draft-requests.module.css";

// The Draft tool. The person reads their resume as it will look, selects any
// words in it and says what should change; each note joins a list, and the
// list goes to the writer in one go to regenerate the resume. A request can
// also be written without selecting anything - which is the way in from a
// keyboard, since text on the page cannot be selected without a pointer.
//
// The writer is the backend's: it changes only what was asked, never adds a
// fact nobody gave, and says plainly what it could not do.

/**
 * One change asked for: the words it is about (if any), where, and what to do.
 * `section` and `entry` are the part of the page the words were picked in, so
 * they can be found again there to stay highlighted until the change is made.
 */
export type DraftRequest = { id: number; quote: string; where: string; ask: string; section?: string; entry?: string; range?: Range; /** Added by the "Show me how" walk-through: shown, never sent. */ demo?: boolean };

/** What the writer did with an instruction: the resume it made, and what it says. */
export type WriterReply = { resume: ResumeData; changed: boolean; message: string; added: string[] };

/** Words picked in the preview, where they sit, and where to show the box. */
export type TextPick = { quote: string; where: string; top: number; left: number; section?: string; entry?: string; range?: Range };

const sectionName = (id: string | undefined) =>
  id === "header" ? "Contact details" : RESUME_SECTIONS.find(([key]) => key === id)?.[1] ?? "Resume";

/**
 * Watches the preview for selected words while the Draft tool is open. The
 * box is placed under the selection, inside the preview column.
 */
export function useTextPick(desk: React.RefObject<HTMLDivElement | null>, enabled: boolean) {
  const [pick, setPick] = useState<TextPick | null>(null);
  useEffect(() => {
    const area = desk.current;
    if (!enabled || !area) return;
    const read = () => {
      // Let the browser finish the selection first.
      setTimeout(() => {
        const selection = window.getSelection();
        const quote = selection?.toString().replace(/\s+/g, " ").trim() ?? "";
        if (!selection || !quote || selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        const start = range.startContainer instanceof Element ? range.startContainer : range.startContainer.parentElement;
        // Only words on the resume page itself - never the hint above it, a
        // button, or the comment box.
        const end = range.endContainer instanceof Element ? range.endContainer : range.endContainer.parentElement;
        if (!start || !area.contains(start) || !start.closest("#resume-sheet") || !end?.closest("#resume-sheet")) return;
        const section = start.closest<HTMLElement>("[data-resume-section]")?.dataset.resumeSection;
        const entry = start.closest<HTMLElement>("[data-resume-entry]")?.dataset.resumeEntry;
        const where = `${sectionName(section)}${entry !== undefined ? ` · entry ${Number(entry) + 1}` : ""}`;
        const box = range.getBoundingClientRect();
        const frame = area.getBoundingClientRect();
        const left = Math.min(Math.max(8, box.left - frame.left), Math.max(8, frame.width - 328));
        setPick({ quote: quote.slice(0, 400), where, top: box.bottom - frame.top + area.scrollTop + 8, left, range: range.cloneRange(), ...(section ? { section } : {}), ...(entry !== undefined ? { entry } : {}) });
      }, 0);
    };
    area.addEventListener("mouseup", read);
    area.addEventListener("touchend", read);
    area.addEventListener("keyup", read);
    return () => {
      area.removeEventListener("mouseup", read);
      area.removeEventListener("touchend", read);
      area.removeEventListener("keyup", read);
    };
  }, [desk, enabled]);
  return { pick: enabled ? pick : null, clear: () => setPick(null) };
}

/** The box beside picked words: what should change about them. */
export function PickBox({ pick, onAdd, onClose, demoText }: { pick: TextPick; onAdd: (ask: string) => void; onClose: () => void; /** What the walk-through is typing. */ demoText?: string }) {
  const [own, setAsk] = useState("");
  const ask = demoText ?? own;
  const id = useId();
  const field = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (demoText === undefined) field.current?.focus({ preventScroll: true }); }, [demoText]);
  return (
    <div data-pick-box className={s.pickBox} style={{ top: pick.top, left: pick.left }} role="dialog" aria-label="Request a change to the selected words"
      onKeyDown={event => { if (event.key === "Escape") onClose(); }}>
      <p className={s.quote}>“{pick.quote.length > 120 ? `${pick.quote.slice(0, 117)}…` : pick.quote}”</p>
      <label htmlFor={id}>What should change?</label>
      <textarea ref={field} id={id} rows={2} value={ask} readOnly={demoText !== undefined} placeholder="For example: say I led the team, or take this out" onChange={event => setAsk(event.target.value)}
        onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && ask.trim()) { event.preventDefault(); onAdd(ask.trim()); } }} />
      <div className={s.actions}>
        <button type="button" data-glimpse="add-pick" className={s.primary} disabled={!ask.trim()} onClick={() => onAdd(ask.trim())}>Add to list</button>
        <button type="button" className={s.quiet} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

// Tap one to start from it - a person who has never edited a resume does not
// know that "this one is not true" is a thing they are allowed to say.
const PROMPTS = [
  "Make the summary shorter",
  "Make the bullet points clearer without adding facts",
  "Put my most relevant experience first",
];

/** The ⓘ beside the title: every step of changing the draft, in a side panel. */
function StepsHelp({ onShowMe }: { onShowMe?: (() => void) | undefined }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className={help.trigger} aria-label="How to request changes" aria-haspopup="dialog" aria-expanded={open} title="How to request changes" onClick={() => setOpen(true)}>
      <span className={help.badge} aria-hidden="true"><Info size={18} /></span>
    </button>
    {open && createPortal(
      <HelpSheet title="How to request changes" onClose={() => setOpen(false)}>
        <div className="grid gap-5 text-[0.92rem] leading-relaxed text-slate-700">
          <p>Collect every change you want in one list, then regenerate your resume once. Three ways to add to the list:</p>
          <ol className="grid list-decimal gap-3 pl-5">
            <li><strong className="text-slate-900">Select words on your resume.</strong> On the page beside this panel, select any words. A box opens: say what should change and press Add to list. The words stay highlighted, with a number in the margin, until the change is made.</li>
            <li><strong className="text-slate-900">Tap a suggested prompt.</strong> It fills the box below the list. Change it if you like, then press Add to list.</li>
            <li><strong className="text-slate-900">Type anything.</strong> Write any change in your own words, such as &ldquo;put my internship first&rdquo;, and press Enter or Add to list.</li>
          </ol>
          <p>Then:</p>
          <ol className="grid list-decimal gap-3 pl-5" start={4}>
            <li><strong className="text-slate-900">Check your list.</strong> Remove anything you no longer want.</li>
            <li><strong className="text-slate-900">Press Regenerate resume.</strong> Every request is made in one go. Nothing is added that you did not tell us; if a change needs a fact you have not given, you are told instead. Undo puts the draft back.</li>
            <li><strong className="text-slate-900">Continue to suggestions</strong> when you are happy with it.</li>
          </ol>
          {onShowMe && <button type="button" className="justify-self-start min-h-11 rounded-full border border-slate-300 px-5 font-semibold text-slate-800" onClick={() => { setOpen(false); onShowMe(); }}>▶ Show me how to edit</button>}
        </div>
      </HelpSheet>,
      document.body,
    )}
  </>;
}

/** The list of requests, the box to ask in, and the one press that regenerates the draft. */
export function DraftRequests({ requests, editing, onEdit, onAdd, onRemove, onRegenerate, onUndo, canUndo, reply, busy, disabled, onContinue, active, onActive, demoAsk, onShowMe, showing = false }: {
  requests: DraftRequest[];
  /** Whether they chose to edit the draft. Until then, only the question shows. */
  editing: boolean;
  onEdit: () => void;
  /** Plays the walk-through of every way to change the draft. */
  onShowMe?: () => void;
  /** Whether it is playing now. */
  showing?: boolean;
  /** What the walk-through is typing into the request box, while it plays. */
  demoAsk?: string | null;
  /** The request whose words are picked out on the page, and setting it. */
  active?: number | null;
  onActive?: (id: number | null) => void;
  onAdd: (ask: string) => void;
  onRemove: (id: number) => void;
  onRegenerate: () => void;
  onUndo: () => void;
  canUndo: boolean;
  /** What the writer said about the last regeneration. */
  reply: string;
  busy: boolean;
  disabled: boolean;
  onContinue: () => void;
}) {
  const [own, setAsk] = useState("");
  const ask = demoAsk ?? own;
  const id = useId();
  const add = () => { if (demoAsk == null && ask.trim()) { onAdd(ask.trim()); setAsk(""); } };
  return (
    <section className={s.panel} aria-labelledby="draft-title">
      <h2 id="draft-title" className={s.label}>REQUEST CHANGES</h2>

      {/* One question first: change it, or move on. The ways to change it
          appear only for someone who wants to. */}
      {!editing && <div className={s.question}>
        <p>Do you want to request changes?</p>
        <div className={s.actions}>
          <button type="button" className={s.quiet} disabled={disabled} onClick={onEdit}>Yes, request changes</button>
          <button type="button" className={s.primary} onClick={onContinue}>Continue to suggestions →</button>
        </div>
      </div>}

      {editing && <>
      <div className={s.titleRow}>
        {onShowMe && <button type="button" className={s.showMe} disabled={showing} onClick={onShowMe}><span aria-hidden="true">▶</span> Show me how to edit</button>}
        <StepsHelp onShowMe={onShowMe} />
      </div>

      <div className={s.chat}>
        <div className={s.suggested}>
          <p className={s.label}>SUGGESTED PROMPTS · TAP TO USE ONE</p>
          <div>{PROMPTS.map((item, i) => <button type="button" key={item} data-glimpse={i === 0 ? "prompt" : undefined} disabled={busy} onClick={() => setAsk(item)}><span aria-hidden="true">+</span>{item}</button>)}</div>
        </div>
        <label htmlFor={id}>Or ask in your own words</label>
        <textarea id={id} data-glimpse="ask" rows={3} value={ask} readOnly={demoAsk != null} disabled={busy} placeholder="Tell us what to change…" onChange={event => setAsk(event.target.value)}
          onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); add(); } }} />
        <button type="button" data-glimpse="add" className={s.quiet} disabled={busy || !ask.trim()} onClick={add}>Add to list →</button>
      </div>

      {requests.length > 0 && <section className={s.requested} aria-labelledby="requested-title">
        <h3 id="requested-title">Your requested edits</h3>
        <ol className={s.list}>{requests.map((item, i) => <li key={item.id} id={`draft-request-${item.id}`} tabIndex={-1} data-active={active === item.id || undefined} data-demo={item.demo || undefined}
            onMouseEnter={() => onActive?.(item.id)} onMouseLeave={() => onActive?.(null)} onFocus={() => onActive?.(item.id)} onBlur={() => onActive?.(null)}>
            <span className={s.where}><span className={s.badge} aria-hidden="true">{i + 1}</span>{item.where}{item.demo && <span className={s.example}>Example</span>}</span>
            {item.quote && <p className={s.quote}>“{item.quote.length > 140 ? `${item.quote.slice(0, 137)}…` : item.quote}”</p>}
            <p className={s.ask}>{item.ask}</p>
            {!item.demo && <button type="button" className={s.remove} disabled={busy} onClick={() => onRemove(item.id)} aria-label={`Remove request ${i + 1}`}>Remove</button>}
          </li>)}</ol>
      </section>}

      <div aria-live="polite">
        {busy && <p className={s.working}><span className={s.spinner} aria-hidden="true" />Regenerating your resume with {requests.length} {requests.length === 1 ? "change" : "changes"}…</p>}
        {!busy && reply && <div className={s.reply}><p>{reply}</p>{canUndo && <button type="button" className={s.quiet} onClick={onUndo}>Undo these changes</button>}</div>}
      </div>

      <div className={s.actions}>
        {requests.length > 0
          ? <button type="button" data-glimpse="regenerate" className={s.primary} disabled={busy || disabled} onClick={onRegenerate}>{busy ? "Regenerating…" : `Regenerate resume · ${requests.length}`}</button>
          : <button type="button" data-glimpse="regenerate" className={s.primary} disabled={busy} onClick={onContinue}>Continue to suggestions →</button>}
        {requests.length > 0 && <button type="button" className={s.quiet} disabled={busy} onClick={onContinue}>Skip to suggestions</button>}
      </div>
      </>}
    </section>
  );
}

/** The writer's instruction for a list of requests: each tied to its words. */
export function requestsInstruction(requests: DraftRequest[]): string {
  const lines = requests.map((item, i) => `(${i + 1}) ${item.quote ? `In ${item.where}, where it says "${item.quote}": ` : ""}${item.ask}`);
  return `Make these changes to my resume, and only these, adding no fact I have not given you: ${lines.join(" ")}`;
}

// ---- Comments on the page, Quip-style ----
//
// Words a request is about stay highlighted in the preview, with a numbered
// marker in the margin, until a regeneration deals with the request. The
// highlight is drawn with the CSS Custom Highlight API, which paints over
// text without touching the page's DOM - the resume stays exactly what React
// rendered, and what prints. Where the API is missing, the markers alone show.

/**
 * Where `quote` sits across a run of text pieces (a page's text nodes, in
 * order), or null. Matched on the letters alone: a selection's text and the
 * page's text disagree about whitespace - a line break between two bullets,
 * a bold label and the colon after it rendered as two pieces - but never
 * about the letters themselves.
 */
export function locateQuote(pieces: string[], quote: string): { start: [number, number]; end: [number, number] } | null {
  const needle = quote.replace(/\s+/g, "");
  if (!needle) return null;
  let text = "";
  const at: Array<[number, number]> = [];
  pieces.forEach((piece, i) => {
    for (let j = 0; j < piece.length; j++) {
      if (/\s/.test(piece[j]!)) continue;
      text += piece[j];
      at.push([i, j]);
    }
  });
  const found = text.indexOf(needle);
  if (found < 0) return null;
  const [endPiece, endChar] = at[found + needle.length - 1]!;
  return { start: at[found]!, end: [endPiece, endChar + 1] };
}

function rangeIn(root: Element, quote: string): Range | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) nodes.push(node);
  const spot = locateQuote(nodes.map(node => node.data), quote);
  if (!spot) return null;
  const range = document.createRange();
  range.setStart(nodes[spot.start[0]]!, spot.start[1]);
  range.setEnd(nodes[spot.end[0]]!, spot.end[1]);
  return range;
}

/** The range on the page holding a request's words, searched in its own part first. */
function findQuote(sheet: Element, request: DraftRequest): Range | null {
  if (!request.quote.trim()) return null;
  const scoped = request.section
    ? sheet.querySelector(`[data-resume-section="${request.section}"]${request.entry !== undefined ? ` [data-resume-entry="${request.entry}"]` : ""}`)
      ?? sheet.querySelector(`[data-resume-section="${request.section}"]`)
    : null;
  const found = (scoped && rangeIn(scoped, request.quote)) || rangeIn(sheet, request.quote);
  if (found) return found;
  // The exact words picked, while that part of the page is still the one
  // they were picked from.
  const kept = request.range;
  return kept && kept.startContainer.isConnected && kept.endContainer.isConnected && sheet.contains(kept.commonAncestorContainer) ? kept : null;
}

/** A margin marker: which request, and how far down the page its words are. */
export type CommentMark = { id: number; n: number; top: number; left: number };

type HighlightApi = { highlights: Map<string, unknown> };
const highlightApi = (): HighlightApi | null =>
  typeof Highlight !== "undefined" && typeof CSS !== "undefined" && "highlights" in CSS ? (CSS as unknown as HighlightApi) : null;

/**
 * Keeps each request's words highlighted on the page - and the words being
 * picked right now, whose browser selection is lost the moment the comment
 * box takes focus - and says where each margin marker goes.
 */
export function useCommentMarks(desk: React.RefObject<HTMLDivElement | null>, requests: DraftRequest[], pick: TextPick | null, active: number | null, enabled: boolean, page: unknown) {
  const [marks, setMarks] = useState<CommentMark[]>([]);
  useEffect(() => {
    const area = desk.current;
    const api = highlightApi();
    const clear = () => { api?.highlights.delete("draft-comment"); api?.highlights.delete("draft-comment-active"); api?.highlights.delete("draft-pick"); };
    if (!enabled || !area) { clear(); return; }
    const place = () => {
      const sheet = area.querySelector("#resume-sheet");
      if (!sheet) return;
      const frame = area.getBoundingClientRect();
      const paper = sheet.getBoundingClientRect();
      const ranges: Range[] = [];
      const activeRanges: Range[] = [];
      const next: CommentMark[] = [];
      requests.forEach((request, i) => {
        const range = findQuote(sheet, request);
        if (!range) return;
        (request.id === active ? activeRanges : ranges).push(range);
        const box = range.getBoundingClientRect();
        next.push({ id: request.id, n: i + 1, top: box.top - frame.top + area.scrollTop - 2, left: Math.min(paper.right - frame.left + 6, frame.width - 34) });
      });
      const picked = pick ? findQuote(sheet, { id: 0, quote: pick.quote, where: pick.where, ask: "", ...(pick.section ? { section: pick.section } : {}), ...(pick.entry !== undefined ? { entry: pick.entry } : {}), ...(pick.range ? { range: pick.range } : {}) }) : null;
      if (api) {
        api.highlights.set("draft-comment", new Highlight(...ranges));
        api.highlights.set("draft-comment-active", new Highlight(...activeRanges));
        api.highlights.set("draft-pick", new Highlight(...(picked ? [picked] : [])));
      }
      setMarks(current => JSON.stringify(current) === JSON.stringify(next) ? current : next);
    };
    // After the page has laid out, and again whenever it changes size.
    const timer = setTimeout(place, 0);
    const observer = new ResizeObserver(place);
    observer.observe(area);
    return () => { clearTimeout(timer); observer.disconnect(); clear(); };
  }, [desk, requests, pick, active, enabled, page]);
  return enabled ? marks : [];
}

/** The numbered markers in the page's margin; each opens its request. */
export function CommentMarkers({ marks, active, onActive }: { marks: CommentMark[]; active: number | null; onActive: (id: number | null) => void }) {
  return <>{marks.map(mark => <button key={mark.id} type="button" className={s.marker} data-active={active === mark.id || undefined} style={{ top: mark.top, left: mark.left }}
    aria-label={`Request ${mark.n}: show it in the list`} onMouseEnter={() => onActive(mark.id)} onMouseLeave={() => onActive(null)}
    onClick={() => { const item = document.getElementById(`draft-request-${mark.id}`); item?.scrollIntoView({ block: "nearest", behavior: "smooth" }); item?.focus({ preventScroll: true }); }}>{mark.n}</button>)}</>;
}
