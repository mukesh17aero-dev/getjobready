"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Pause, Play } from "@/components/icons";

// Temporary comparison page: four ways to frame the live preview panel.
//
// The panel already is a timeline - eight sections on a timer - so the
// question is only how much of that to admit to. Today it advances silently
// and stops for good the moment anybody touches it, which works but gives a
// person no way back and no idea how long the thing is.
//
// A player frame fixes both: the progress is visible, the length is visible,
// and pause is a control rather than a side effect of scrolling. That is the
// real argument for it, more than the look.
//
// Self-contained, not linked, deleted once a direction is chosen.

const SECTIONS = [
  { tab: "What", head: "What you get", body: "A complete resume written for one specific role, in your choice of three layouts, downloadable as Word or PDF." },
  { tab: "Who", head: "Who it is for", body: "Students and early-career applicants writing a first or second resume. No existing work experience needed." },
  { tab: "Why", head: "How it helps", body: "Most applications are filtered by software before a person reads them. This writes content that gets through and still reads well." },
  { tab: "Features", head: "Key features", body: "Four things a downloadable template does not do:", points: ["AI writes each section from your record", "Checked against applicant tracking software", "Written for one named role", "Saved, so a second role takes minutes"] },
  { tab: "Start", head: "How to start", body: "Pick a layout, name the role, say whether you are starting fresh or improving one you have. Fifteen minutes end to end." },
  { tab: "Output", head: "How to read the result", body: "The resume itself, the applicant tracking check, and a written review of where it stands." },
];

const DWELL = 4000;
const TICK = 50;

/** One clock, four frames. Each option below renders the same state. */
function usePlayer() {
  const [at, setAt] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!playing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      setElapsed((e) => {
        if (e + TICK < DWELL) return e + TICK;
        setAt((n) => (n + 1) % SECTIONS.length);
        return 0;
      });
    }, TICK);
    return () => clearInterval(t);
  }, [playing]);

  const go = (i: number) => {
    setAt(i);
    setElapsed(0);
  };

  return { at, go, playing, setPlaying, progress: elapsed / DWELL };
}

function Body({ at, small = false }: { at: number; small?: boolean }) {
  const s = SECTIONS[at];
  return (
    <div className={small ? "p-3" : "p-4"}>
      <h3 className={`font-display font-bold leading-tight text-brand-ink ${small ? "text-[0.95rem]" : "text-[1.1rem]"}`}>
        {s.head}
      </h3>
      <p className={`mt-1.5 leading-relaxed text-slate-600 ${small ? "text-[0.78rem]" : "text-[0.85rem]"}`}>
        {s.body}
      </p>
      {s.points && (
        <ul className="mt-2.5 space-y-1">
          {s.points.map((p) => (
            <li key={p} className="flex gap-1.5 text-[0.76rem] text-slate-600">
              <span className="mt-1 grid h-3 w-3 shrink-0 place-items-center rounded-full bg-teal-100 text-teal-700">
                <Check size={7} />
              </span>
              {p}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ------------------------------------------------------------ A · player

function PlayerFrame() {
  const { at, go, playing, setPlaying, progress } = usePlayer();
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-brand-mist">
      <div className="min-h-[13rem]">
        <Body at={at} />
      </div>

      {/* Chapter bar: one segment per section, the live one filling. It is the
          progress indicator and the scrubber at once. */}
      <div className="flex gap-1 px-3">
        {SECTIONS.map((s, i) => (
          <button
            key={s.tab}
            type="button"
            onClick={() => go(i)}
            aria-label={`${i + 1}. ${s.tab}`}
            className="group h-4 flex-1 cursor-pointer"
          >
            <span className="block h-1 overflow-hidden rounded-full bg-slate-300 group-hover:bg-slate-400">
              <span
                className="block h-full rounded-full bg-brand-teal-deep"
                style={{
                  width: i < at ? "100%" : i === at ? `${progress * 100}%` : "0%",
                }}
              />
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2.5 px-3 pb-2.5 pt-1">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause" : "Play"}
          className="grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-brand-teal-deep text-white"
        >
          {playing ? <Pause size={13} /> : <Play size={13} />}
        </button>
        <span className="text-[0.72rem] font-semibold text-brand-ink">
          {SECTIONS[at].tab}
        </span>
        <span className="ml-auto text-[0.72rem] text-slate-400">
          {at + 1} / {SECTIONS.length}
        </span>
      </div>
    </div>
  );
}

// ------------------------------------------------------------ B · device

function DeviceFrame() {
  const { at, go, playing, setPlaying, progress } = usePlayer();
  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-[17rem] rounded-[2rem] border-[8px] border-slate-800 bg-slate-800 shadow-xl">
        <span className="mx-auto mb-1 block h-1 w-14 rounded-full bg-slate-600" />
        <div className="overflow-hidden rounded-[1.4rem] bg-surface">
          <div className="min-h-[15rem]">
            <Body at={at} small />
          </div>
          <div className="flex gap-1 px-2.5 pb-2.5">
            {SECTIONS.map((s, i) => (
              <button
                key={s.tab}
                type="button"
                onClick={() => go(i)}
                aria-label={s.tab}
                className="h-1 flex-1 cursor-pointer overflow-hidden rounded-full bg-slate-200"
              >
                <span
                  className="block h-full rounded-full bg-brand-teal-deep"
                  style={{ width: i < at ? "100%" : i === at ? `${progress * 100}%` : "0%" }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setPlaying((p) => !p)}
        className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-surface px-3 py-1.5 text-[0.75rem] font-bold text-slate-600"
      >
        {playing ? <Pause size={11} /> : <Play size={11} />}
        {playing ? "Pause" : "Play"}
      </button>
    </div>
  );
}

// ----------------------------------------------------------- C · browser

function BrowserFrame() {
  const { at, go, playing, setPlaying, progress } = usePlayer();
  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-surface shadow-md">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100 px-3 py-2">
        <span className="flex gap-1">
          {["#f87171", "#fbbf24", "#34d399"].map((c) => (
            <span key={c} className="h-2 w-2 rounded-full" style={{ background: c }} />
          ))}
        </span>
        <span className="ml-1 flex-1 truncate rounded-md bg-surface px-2 py-0.5 font-mono text-[0.62rem] text-slate-400">
          ascend.app/resume/build
        </span>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause" : "Play"}
          className="grid h-5 w-5 cursor-pointer place-items-center rounded text-slate-500"
        >
          {playing ? <Pause size={11} /> : <Play size={11} />}
        </button>
      </div>
      <div className="min-h-[13rem] bg-brand-mist">
        <Body at={at} />
      </div>
      <div className="flex gap-1 bg-brand-mist px-3 pb-3">
        {SECTIONS.map((s, i) => (
          <button
            key={s.tab}
            type="button"
            onClick={() => go(i)}
            aria-label={s.tab}
            className="h-1 flex-1 cursor-pointer overflow-hidden rounded-full bg-slate-300"
          >
            <span
              className="block h-full rounded-full bg-brand-teal-deep"
              style={{ width: i < at ? "100%" : i === at ? `${progress * 100}%` : "0%" }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------- D · filmstrip

function FilmstripFrame() {
  const { at, go, playing, setPlaying } = usePlayer();
  const strip = useRef<HTMLDivElement | null>(null);
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-brand-mist">
      <div className="min-h-[12rem]">
        <Body at={at} />
      </div>
      <div
        ref={strip}
        className="flex gap-1.5 overflow-x-auto border-t border-slate-200 p-2.5"
      >
        {SECTIONS.map((s, i) => (
          <button
            key={s.tab}
            type="button"
            onClick={() => go(i)}
            aria-current={i === at ? "true" : undefined}
            className={`w-24 shrink-0 rounded-lg border p-2 text-left transition-colors ${
              i === at
                ? "border-brand-teal bg-surface"
                : "border-slate-200 bg-surface/60 hover:border-slate-300"
            }`}
          >
            <span className="block text-[0.55rem] font-bold uppercase tracking-wide text-slate-400">
              {i + 1}
            </span>
            <span className="mt-0.5 block truncate text-[0.72rem] font-bold text-brand-ink">
              {s.tab}
            </span>
          </button>
        ))}
      </div>
      <div className="border-t border-slate-200 px-3 py-2">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="inline-flex cursor-pointer items-center gap-1.5 text-[0.74rem] font-bold text-slate-600"
        >
          {playing ? <Pause size={11} /> : <Play size={11} />}
          {playing ? "Pause walkthrough" : "Play walkthrough"}
        </button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------- page

function Block({ n, title, what, cost, children }: {
  n: string; title: string; what: string; cost: string; children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-[1.1rem] font-bold text-brand-ink">
        {n} · {title}
      </h2>
      <p className="mt-1.5 max-w-2xl text-[0.87rem] leading-relaxed text-slate-600">{what}</p>
      <p className="mt-2 max-w-2xl border-l-2 border-slate-300 pl-3 text-[0.81rem] leading-relaxed text-slate-500">
        <strong className="font-semibold text-brand-ink">Trade-off:</strong> {cost}
      </p>
      <div className="mt-4 max-w-md">{children}</div>
    </section>
  );
}

export default function PreviewPanelFrames() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.2em] text-slate-400">
        Preview · not linked · all four are playing
      </p>
      <h1 className="mt-2 font-display text-[2rem] font-bold leading-tight tracking-tight text-brand-ink">
        Four frames for the live preview
      </h1>
      <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-slate-600">
        Same content and the same clock in each — only the frame changes. The
        thing worth judging is whether the frame makes the walkthrough easier
        to follow or just decorates it.
      </p>
      <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-slate-600">
        All four fix a real problem with what is live today: the panel advances
        silently, gives no sense of how long it is, and stops for good the
        moment you touch it. A play control makes pausing deliberate and
        resuming possible.
      </p>

      <div className="mt-9 grid gap-10 sm:grid-cols-2">
        <Block
          n="A"
          title="Player chrome"
          what="A chapter bar of six segments — completed ones filled, the live one filling in real time — with play/pause and a position count."
          cost="Reads as a video, which sets an expectation of motion the content does not have. Best of the four for making length and progress obvious."
        >
          <PlayerFrame />
        </Block>

        <Block
          n="B"
          title="Device frame"
          what="The same panel inside a phone. Says 'this is the product' before a word is read, and matches the phone already on the welcome screen."
          cost="Costs about 60px of width to bezel, and implies a mobile experience for something people will mostly do on a laptop."
        >
          <DeviceFrame />
        </Block>

        <Block
          n="C"
          title="Browser chrome"
          what="A window with a URL bar. The strongest claim that what you are looking at is a real screen from the real app."
          cost="A fake URL bar is a small lie if the panel is not actually showing that screen. Only honest once the output sections render real components — which they now do."
        >
          <BrowserFrame />
        </Block>

        <Block
          n="D"
          title="Filmstrip"
          what="Named thumbnails along the bottom. Every section is visible at once, so somebody can jump straight to the one they came for."
          cost="Takes the most vertical space, and the strip scrolls on narrow screens. Weakest sense of it being a single walkthrough."
        >
          <FilmstripFrame />
        </Block>
      </div>

      <section className="mt-12 rounded-2xl border border-slate-200 bg-brand-mist p-5">
        <h2 className="font-display text-[1.05rem] font-bold text-brand-ink">
          What I would take from this
        </h2>
        <ul className="mt-3 space-y-2.5 text-[0.86rem] leading-relaxed text-slate-600">
          <li>
            <strong className="font-semibold text-brand-ink">A, for the controls rather than the look.</strong>{" "}
            The chapter bar answers &ldquo;how long is this&rdquo; and &ldquo;where
            am I&rdquo; without a word, and play/pause makes stopping a decision
            instead of an accident. Those are real gains over what is live now.
          </li>
          <li>
            <strong className="font-semibold text-brand-ink">Keep the tab rail as well.</strong>{" "}
            A chapter bar shows position; it does not show what the sections are
            called. Somebody who wants &ldquo;how do I read the output&rdquo;
            should be able to see that word and click it, so A works best with
            the named rail above it rather than instead of it.
          </li>
          <li>
            <strong className="font-semibold text-brand-ink">C is the strongest sell and the easiest to abuse.</strong>{" "}
            A URL bar says &ldquo;this is the real screen&rdquo;. That is fair
            for the output sections, which now render the app&rsquo;s own
            components — and unfair for the six that are prose about a feature.
            Mixed together it overclaims.
          </li>
          <li>
            <strong className="font-semibold text-brand-ink">Reduced motion still stops everything.</strong>{" "}
            None of these start a timer when the system asks for less motion;
            the controls stay, so the walkthrough is still fully usable by hand.
          </li>
        </ul>
      </section>
    </main>
  );
}
