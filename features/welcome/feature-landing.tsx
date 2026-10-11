"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock } from "@/components/ui/icons";
import { JourneyLine } from "./journey-line";
import { FeaturePanel } from "./feature-panel";
import { BackLink } from "@/components/ui/back-link";
import { RememberHub } from "@/features/journey";
import {
  isOpen,
  STATUS_LABEL,
  type FeatureCategory,
  type FeatureStatus,
} from "./marketing-features";

// The intermediate landing page: a home card opens here rather than dropping
// somebody straight into a tool.
//
// Left, the tools in this category. Right, the one you have selected, in full:
// what it is, who it is for, what you walk away holding. The panel is driven by
// the person rather than by us - they choose what to look at, and nothing moves
// until they do.
//
// The three questions this page has to answer, in order:
//   why should I care  - the stake, stated once at the top
//   why is this for me - their own target role, or a plain admission we have
//                        nothing to go on yet
//   what do I do       - exactly one primary action, always the tool that is
//                        actually built
//
// Presentational: props in, JSX out. The only state is which card is selected,
// which is what "user controlled" means here.

const STATUS_CHIP: Record<FeatureStatus, string> = {
  live: "bg-teal-50 text-teal-700 ring-teal-600/20",
  building: "bg-amber-50 text-amber-800 ring-amber-600/25",
  planned: "bg-slate-100 text-slate-500 ring-slate-400/25",
};

export function StatusChip({ status }: { status: FeatureStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[0.75rem] font-bold uppercase tracking-wide ring-1 ring-inset ${STATUS_CHIP[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

/**
 * The landing content without a page wrapper, so the home tabs can render a
 * category inline without nesting one <main> inside another.
 */
export function FeatureLandingBody({
  category,
  /** The role they chose at the end of Discovery. Null when they have not. */
  targetRole = null,
  /** One number from this person's own record, when the category has one. */
  stat = null,
  /** Draw the stages as a line above the list. Only the journey has one. */
  journeyLine = false,
  /**
   * Start the tool here rather than navigating to it. Given only where the
   * tool has no separate address of its own - Discovery opens in place, on
   * the page you are already on.
   */
  onOpen,
  nextId = null,
  doneIds = [],
}: {
  category: FeatureCategory;
  targetRole?: string | null;
  stat?: { label: string; value: string; note: string } | null;
  journeyLine?: boolean;
  onOpen?: () => void;
  /** This person's next step, from their own progress. Defaults to the first open tool. */
  nextId?: string | null;
  /** Steps they have already finished, shown with a tick and a quiet "Review" link. */
  doneIds?: string[];
}) {
  const [selectedId, setSelectedId] = useState(category.features[0].id);
  const tabs = useRef<Array<HTMLDivElement | null>>([]);
  const selected =
    category.features.find((f) => f.id === selectedId) ?? category.features[0];

  // The one primary action: the first tool in this category that is actually
  // built. Two primary actions is the same as none, so everything else on the
  // page is a selection rather than a call to act.
  const primary = category.features.find(isOpen) ?? null;
  // Only that card gets the filled button; every other open card is a quiet
  // link. Five equal buttons told nobody which one to press.
  const next = category.features.find((f) => f.id === nextId && isOpen(f)) ?? primary;

  // Arrow keys move between cards, because a list that controls a panel is a
  // tab list and people expect it to behave like one.
  function onKey(e: React.KeyboardEvent, i: number) {
    const keys = [
      "ArrowDown",
      "ArrowRight",
      "ArrowUp",
      "ArrowLeft",
      "Home",
      "End",
    ];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const last = category.features.length - 1;
    const next =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? last
          : e.key === "ArrowDown" || e.key === "ArrowRight"
            ? (i + 1) % category.features.length
            : (i - 1 + category.features.length) % category.features.length;
    setSelectedId(category.features[next].id);
    tabs.current[next]?.focus();
  }

  // Placed above the columns normally, and inside the left one when the page
  // has to fit a screen - the walkthrough is then level with the title rather
  // than pushed below the whole header.
  const head = (
    <header className="animate-fade-up mt-4 shrink-0">
      <h1 className="font-display text-[clamp(1.6rem,3.2vw,2.1rem)] font-bold leading-tight tracking-tight text-brand-ink">
        {category.title}
      </h1>
      <p className="mt-1.5 max-w-2xl text-[0.92rem] leading-relaxed text-slate-600">
        {category.stake}
      </p>

      {/* ---- why is this relevant to me ---- */}
      <p className="mt-2 text-[0.84rem] text-slate-500">
        {targetRole ? (
          <>
            Everything here is aimed at{" "}
            <span className="font-semibold text-brand-ink">{targetRole}</span>,
            the role you chose in Discovery.
          </>
        ) : (
          <>
            You have not chosen a role yet, so nothing here is aimed at one.{" "}
            <Link
              href="/discover"
              className="font-semibold text-brand-teal-deep underline underline-offset-2 hover:text-brand-teal"
            >
              Discovery
            </Link>{" "}
            is what makes it specific.
          </>
        )}
      </p>

      {/* ---- one number from their own record, where we have one ---- */}
      {stat && (
        <div className="mt-4 inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-brand-mist px-4 py-2.5">
          <span className="font-display text-[1.35rem] font-bold leading-none text-brand-teal-deep">
            {stat.value}
          </span>
          <span className="min-w-0">
            <span className="block text-[0.75rem] font-bold uppercase tracking-[0.12em] text-slate-500">
              {stat.label}
            </span>
            <span className="block text-[0.8rem] leading-snug text-slate-600">
              {stat.note}
            </span>
          </span>
        </div>
      )}

      {/* No action up here any more.
            
            The panel below carries "Open <feature>" for whichever feature is
            selected, so a second button in the header was the same action
            twice - and the header's version always named the first live
            feature regardless of what somebody was reading about. Two primary
            actions is the same as none. */}
      {!primary && (
        <p className="mt-5 max-w-2xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[0.85rem] leading-relaxed text-amber-900">
          <strong className="font-semibold">Nothing here is open yet.</strong>{" "}
          Every part of this is still being built. The list below says what each
          one will do, so you can see whether it is worth coming back for.
        </p>
      )}
    </header>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Every category hub goes through this component, so recording the hub
          here covers Resume, Practice and Interview at once. Only Discover and
          Start were doing it, which left the hub memory almost always empty -
          so pages had to declare a parent, and a page with two ways in had to
          declare the wrong one for half its visitors. */}
      <RememberHub path={`/${category.id}`} />

      {/* Up from a landing page is home. Every child page under one of these
          already points back at its own parent; without this the chain simply
          stopped one level short. */}
      <BackLink fallbackHref="/" fallbackLabel="Back to Home" />

      {journeyLine && (
        <JourneyLine
          features={category.features}
          selectedId={selected.id}
          onSelect={setSelectedId}
        />
      )}

      <div className="mt-3 grid min-h-0 gap-5 lg:grid-cols-[minmax(0,1fr)_32rem] xl:grid-cols-[minmax(0,1fr)_36rem]">
        {/* ---- the tools in this category ---- */}
        <div
          role="tablist"
          aria-orientation="vertical"
          aria-label={`${category.title}: choose a feature to preview`}
          className="flex min-h-0 flex-col gap-3 lg:overflow-y-auto lg:pr-1"
        >
          {head}
          {category.features.map((feature, i) => {
            const on = feature.id === selected.id;
            const open = isOpen(feature);
            const isNext = feature.id === next?.id;
            const done = doneIds.includes(feature.id);
            const label = done ? `Review ${feature.title}` : `Open ${feature.title}`;
            const look = isNext
              ? "inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-brand-teal-deep px-4 text-[0.8rem] font-bold text-white transition-colors hover:bg-brand-teal"
              : "inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-[0.8rem] font-semibold text-brand-teal-deep underline-offset-4 hover:underline";
            return (
              // A card, not a button: it carries its own "open" link now, and
              // a button cannot contain one. It keeps the tab semantics - the
              // list still drives the panel, and arrow keys still move.
              <div
                key={feature.id}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                role="tab"
                id={`feature-tab-${feature.id}`}
                aria-selected={on}
                aria-controls="feature-detail"
                tabIndex={on ? 0 : -1}
                onClick={() => setSelectedId(feature.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedId(feature.id);
                    return;
                  }
                  onKey(e, i);
                }}
                style={{ animationDelay: `${60 + i * 45}ms` }}
                className={`animate-fade-up cursor-pointer rounded-2xl border bg-surface p-4 text-left transition-[border-color,box-shadow] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${
                  on
                    ? "border-brand-teal shadow-[0_10px_30px_-16px_rgba(13,148,136,0.45)]"
                    : "border-slate-200 hover:border-brand-teal/50"
                } ${open ? "" : "opacity-75"}`}
              >
                {isNext && (
                  <p className="mb-1 text-[0.75rem] font-bold uppercase tracking-[0.12em] text-violet-700">
                    Your next step
                  </p>
                )}
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-[1.02rem] font-bold leading-snug text-brand-ink">
                    {done && <span aria-hidden="true" className="mr-1.5 text-brand-teal-deep">✓</span>}
                    {feature.title}
                    {done && <span className="sr-only"> (done)</span>}
                  </h2>
                  <StatusChip status={feature.status} />
                </div>
                <p className="mt-1.5 text-[0.83rem] leading-snug text-slate-500">
                  {feature.blurb}
                </p>

                <div className="mt-2.5 flex flex-wrap items-center gap-3">
                  {/* The action lives on the card it belongs to. Below the
                      panel it always named whichever feature was selected,
                      which is one step removed from the thing being read. */}
                  {open &&
                    (onOpen ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpen();
                        }}
                        className={look}
                      >
                        {label}
                        <ArrowRight size={13} />
                      </button>
                    ) : (
                      <Link
                        href={feature.href!}
                        onClick={(e) => e.stopPropagation()}
                        className={look}
                      >
                        {label}
                        <ArrowRight size={13} />
                      </Link>
                    ))}

                  {feature.time && (
                    <span className="inline-flex items-center gap-1 text-[0.75rem] text-slate-500">
                      <Clock size={11} />
                      {feature.time}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <aside
          role="tabpanel"
          id="feature-detail"
          aria-labelledby={`feature-tab-${selected.id}`}
          tabIndex={0}
          // The same height on every landing page, and starting level with
          // the title rather than below the header - a window that changes
          // size between categories reads as a different component each time.
          className="animate-fade-up flex max-h-[40rem] min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-brand-mist lg:sticky lg:top-4 lg:h-[40rem] lg:max-h-none lg:self-start"
        >
          <div className="flex items-start justify-between gap-3 px-4 pb-2 pt-3">
            <h2 className="font-display text-[1.1rem] font-bold leading-tight text-brand-ink">
              {selected.title}
            </h2>
            <StatusChip status={selected.status} />
          </div>

          <FeaturePanel key={selected.id} feature={selected} />

          {/* No action down here any more - it lives on the card, next to
              the thing it opens. What stays is the admission, because
              somebody who read the whole panel and found no way in would be
              right to feel misled. */}
          {!isOpen(selected) && (
            <p className="border-t border-slate-200 px-4 py-3 text-[0.8rem] leading-relaxed text-slate-500">
              <strong className="font-semibold text-brand-ink">
                {selected.status === "building"
                  ? "This one is in development."
                  : "This one has not been released yet."}
              </strong>{" "}
              You cannot open it today. Nothing above is a promise about a date.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

/** A whole landing page: the body above, in the app's page frame. */
export function FeatureLanding(
  props: React.ComponentProps<typeof FeatureLandingBody>,
) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col px-4 pb-10 pt-4 sm:px-6">
      <FeatureLandingBody {...props} />
    </main>
  );
}
