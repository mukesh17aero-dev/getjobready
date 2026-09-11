"use client";

import { useEffect, useState } from "react";

// Screenshot deterrence, and an honest account of what that can mean.
//
// There is no way to prevent a screenshot from a web page. No browser exposes
// the capability — Android's FLAG_SECURE and the iOS screenshot notification
// are native-app APIs with no web equivalent — and on iOS the capture is
// already complete before any event a page could listen for. Anyone selling
// browser-based screenshot blocking is selling a CSS trick that a long-press
// or a second phone walks straight through.
//
// So this does the two things that actually change behaviour:
//
//   It makes a leak attributable. Every screenshot carries the sitter's own
//   identity across it. That is how financial terminals and pre-release
//   screeners have handled this for years: you do not stop the copy, you make
//   sharing it a thing the sharer can be traced by. The deterrent is social,
//   and it is the only one here that survives a second device.
//
//   It covers the content when the page is not being looked at. This does
//   nothing against a screenshot — the capture beats the event — but it does
//   defeat screen recording left running in the background, and a shoulder
//   glance after somebody walks away.
//
// The watermark is aria-hidden and never takes pointer events, so it is
// invisible to a screen reader and cannot be clicked through. It is also kept
// faint enough not to disturb text contrast underneath it.

function watermarkUrl(identity: string): string {
  // Two rotated repetitions per tile so a crop of any corner still carries it.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180">
    <text x="12" y="60" transform="rotate(-24 12 60)"
      font-family="system-ui, sans-serif" font-size="13" fill="#0f172a"
      fill-opacity="0.075">${identity}</text>
    <text x="150" y="150" transform="rotate(-24 150 150)"
      font-family="system-ui, sans-serif" font-size="13" fill="#0f172a"
      fill-opacity="0.075">${identity}</text>
  </svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function ScreenGuard({
  /** Who is sitting this. Shown across the page, so it must be theirs. */
  identity,
  /**
   * When this sitting began. Passed in rather than read from the browser
   * clock: the mark should say when the run started, which is a fact the
   * server owns, and a device clock is both wrong and editable.
   */
  stamp,
  /** Fires on each hide, so a sitting can record that it happened. */
  onConcealed,
  children,
}: {
  identity: string;
  stamp?: string;
  onConcealed?: () => void;
  children: React.ReactNode;
}) {
  const [concealed, setConcealed] = useState(false);

  useEffect(() => {
    const hide = () => {
      setConcealed(true);
      onConcealed?.();
    };
    const show = () => setConcealed(false);
    const onVisibility = () => (document.hidden ? hide() : show());

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", hide);
    window.addEventListener("focus", show);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", hide);
      window.removeEventListener("focus", show);
    };
  }, [onConcealed]);

  const mark = stamp ? `${identity} · ${stamp}` : identity;

  return (
    <div className="screen-guard relative">
      {/* The content. Blurred rather than unmounted, so nothing is lost and
          scroll position survives. */}
      <div
        className={
          concealed
            ? "pointer-events-none select-none blur-lg transition-[filter] duration-150 motion-reduce:transition-none"
            : ""
        }
        aria-hidden={concealed}
      >
        {children}
      </div>

      {/* Identity, across everything. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10"
        style={{ backgroundImage: watermarkUrl(mark) }}
      />

      {/* Printing and "save to PDF" are capture routes that no blur catches
          — and unlike a screenshot, they are genuinely blockable. */}
      <p className="screen-guard-print hidden text-[0.9rem] text-slate-700">
        This sitting cannot be printed. It is on screen only.
      </p>

      {concealed && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-slate-900/70 p-6 text-center">
          <p className="max-w-xs text-[0.88rem] font-medium leading-relaxed text-white">
            Paused while you are away. Come back to the tab and it picks up
            where you left it.
          </p>
        </div>
      )}
    </div>
  );
}
