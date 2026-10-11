"use client";

import { useEffect, useRef, useState } from "react";
import type { TextPick } from "./draft-requests";
import s from "./draft-demo.module.css";

// A short walk through every way to change a draft, played on the real Draft
// tool and the person's own resume rather than explained in words:
//
//   1. select words on the resume and say what should change;
//   2. or tap a suggested prompt;
//   3. or type anything;
//   4. then regenerate the resume from the list.
//
// The pointer drives the real panel: the comment box opens, requests join
// the real list and their words are highlighted on the page. Those requests
// are marked as examples, are never sent, and are removed when it ends. It
// plays the first time Draft opens in this browser, and on "Show me how".

const SEEN = "ascend.resume.draftGlimpseSeen";

/** Whether this browser has been shown the walk-through. Storage can be missing or refuse. */
export function demoSeen(): boolean {
  try { return window.localStorage.getItem(SEEN) === "1"; } catch { return true; }
}
export function markDemoSeen() {
  try { window.localStorage.setItem(SEEN, "1"); } catch { /* a private window keeps no memory; it simply plays again */ }
}

const STEPS = [
  "Select words on your resume and say what should change",
  "Or tap a suggested prompt",
  "Or type anything you want changed",
  "Then regenerate your resume from your list",
];

/** The first line worth showing it on: a job's first bullet, else any bullet, else the summary. */
function firstLine(sheet: Element): Element | null {
  return sheet.querySelector('[data-resume-section="experience"] li')
    ?? sheet.querySelector("[data-resume-section] li")
    ?? sheet.querySelector('[data-resume-section="summary"] p');
}

type Pointer = { x: number; y: number; pressed: boolean };

export type DraftDemo = {
  running: boolean;
  step: number;
  pointer: Pointer | null;
  /** The words "picked" in the demo, while its comment box is open. */
  pick: TextPick | null;
  /** What the demo has typed into the comment box, and into the request box. */
  pickText: string;
  askText: string | null;
  start: () => void;
  stop: () => void;
};

export function useDraftDemo({ bench, desk, onAdd, onEnd }: {
  bench: React.RefObject<HTMLElement | null>;
  desk: React.RefObject<HTMLDivElement | null>;
  /** Adds an example request - with the words it is about, for the first. */
  onAdd: (ask: string, pick?: TextPick) => void;
  /** Takes the example requests away again. */
  onEnd: () => void;
}): DraftDemo {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [pointer, setPointer] = useState<Pointer | null>(null);
  const [pick, setPick] = useState<TextPick | null>(null);
  const [pickText, setPickText] = useState("");
  const [askText, setAskText] = useState<string | null>(null);
  const token = useRef({ cancelled: false });

  const reset = () => { setRunning(false); setStep(0); setPointer(null); setPick(null); setPickText(""); setAskText(null); onEnd(); };

  function stop() { token.current.cancelled = true; reset(); }

  function start() {
    token.current.cancelled = true;
    const run = { cancelled: false };
    token.current = run;
    void play(run);
  }

  // Leaving Draft mid-way stops it cleanly.
  useEffect(() => () => { token.current.cancelled = true; }, []);

  async function play(run: { cancelled: boolean }) {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wait = (ms: number) => new Promise<void>(done => setTimeout(done, still ? ms * 1.6 : ms));
    const live = () => !run.cancelled;
    const area = bench.current, page = desk.current;
    if (!area || !page) return;
    /** Where an element is, inside the workbench, after bringing it into view. */
    const spot = (el: Element | null, at: "start" | "centre" | "end" = "centre") => {
      if (!el) return null;
      el.scrollIntoView({ block: "nearest", behavior: "auto" });
      const box = el.getBoundingClientRect(), frame = area.getBoundingClientRect();
      const x = at === "start" ? box.left + 4 : at === "end" ? box.right - 4 : box.left + box.width / 2;
      return { x: x - frame.left, y: box.top + box.height / 2 - frame.top };
    };
    const moveTo = async (where: { x: number; y: number } | null, ms = 700) => { if (where) setPointer({ ...where, pressed: false }); await wait(ms); };
    const press = async () => { setPointer(p => (p ? { ...p, pressed: true } : p)); await wait(260); setPointer(p => (p ? { ...p, pressed: false } : p)); };
    const type = async (text: string, set: (value: string) => void) => {
      for (let i = 1; i <= text.length && live(); i++) { set(text.slice(0, i)); await wait(40); }
    };
    const panel = (name: string) => area.querySelector(`[data-glimpse="${name}"]`);

    setRunning(true);

    // 1. Select words on the resume, say what should change.
    setStep(1);
    const sheet = page.querySelector("#resume-sheet");
    const target = sheet && firstLine(sheet);
    const text = target && document.createTreeWalker(target, NodeFilter.SHOW_TEXT).nextNode() as Text | null;
    if (target && text) {
      target.scrollIntoView({ block: "center", behavior: "auto" });
      const range = document.createRange();
      range.setStart(text, 0);
      range.setEnd(text, Math.min(text.data.length, 44));
      const line = range.getClientRects()[0] ?? range.getBoundingClientRect();
      const frame = area.getBoundingClientRect(), deskBox = page.getBoundingClientRect();
      await moveTo({ x: line.left - frame.left, y: line.top + line.height / 2 - frame.top }, 800);
      if (!live()) return;
      await moveTo({ x: line.right - frame.left, y: line.top + line.height / 2 - frame.top }, 700);
      if (!live()) return;
      const section = target.closest<HTMLElement>("[data-resume-section]")?.dataset.resumeSection;
      const entry = target.closest<HTMLElement>("[data-resume-entry]")?.dataset.resumeEntry;
      const picked: TextPick = {
        quote: range.toString().replace(/\s+/g, " ").trim(),
        where: section === "experience" ? `Work experience${entry !== undefined ? ` · entry ${Number(entry) + 1}` : ""}` : "Resume",
        top: line.bottom - deskBox.top + page.scrollTop + 8,
        left: Math.max(8, line.left - deskBox.left),
        range,
        ...(section ? { section } : {}),
        ...(entry !== undefined ? { entry } : {}),
      };
      setPick(picked);
      await wait(400);
      await moveTo(spot(page.querySelector("[data-pick-box] textarea")), 500);
      await type("Make this line clearer", setPickText);
      if (!live()) return;
      await moveTo(spot(page.querySelector("[data-pick-box] [data-glimpse=add-pick]")), 500);
      await press();
      onAdd("Make this line clearer", picked);
      setPick(null); setPickText("");
      await wait(700);
    }
    if (!live()) return;

    // 2. Or tap a suggested prompt, and add it.
    setStep(2);
    await moveTo(spot(panel("prompt")), 900);
    await press();
    if (!live()) return;
    setAskText("Make the summary shorter");
    await wait(500);
    await moveTo(spot(panel("add")), 700);
    await press();
    if (!live()) return;
    onAdd("Make the summary shorter");
    setAskText(null);
    await wait(600);

    // 3. Or type anything, and add it.
    setStep(3);
    await moveTo(spot(panel("ask"), "start"), 800);
    setAskText("");
    await type("Put my internship first", value => setAskText(value));
    if (!live()) return;
    await moveTo(spot(panel("add")), 600);
    await press();
    onAdd("Put my internship first");
    setAskText(null);
    await wait(600);
    if (!live()) return;

    // 4. Then regenerate the resume from the list.
    setStep(4);
    await moveTo(spot(panel("regenerate")), 900);
    await press();
    await wait(1800);
    if (!live()) return;
    reset();
  }

  return { running, step, pointer, pick, pickText, askText, start, stop };
}

/** The pointer, and the caption saying which way of changing the draft is being shown. */
export function DemoLayer({ demo }: { demo: DraftDemo }) {
  if (!demo.running) return null;
  return <>
    {demo.pointer && <span className={s.pointer} data-pressed={demo.pointer.pressed || undefined} style={{ left: demo.pointer.x, top: demo.pointer.y }} aria-hidden="true" />}
    <div className={s.caption} role="status">
      <span className={s.count}>{demo.step} of {STEPS.length}</span>
      <span>{STEPS[demo.step - 1]}</span>
      <button type="button" className={s.skip} onClick={demo.stop}>Skip</button>
    </div>
  </>;
}
