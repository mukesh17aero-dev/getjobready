"use client";

import { createContext, useContext, useState } from "react";
import { createPortal } from "react-dom";
import { HelpSheet } from "@/components/ui/help-sheet";
import { Info } from "@/components/ui/icons";
import styles from "./field-help.module.css";
import { examplesFor, FAMILY_LABEL, FIELD_GUIDES, type FieldGuide, type GuideKey, type GuideTrack } from "./field-guidance";

// The ⓘ beside a resume field, and the side panel it opens: what to write,
// examples for this person's track and target role, what to leave out, and
// the field's limits. Replaces the one-line hints that sat under every input.
//
// The examples are there to show the shape of a good line, not to be pasted:
// the same sentence on hundreds of resumes reads as a template to a recruiter.
// So they cannot be selected, copied or dragged out of the panel.
//
// The panel is portalled to <body>: many of these buttons sit inside a field's
// <label>, where a click anywhere in the panel would otherwise also focus that
// field or tick its checkbox.

type GuideContext = { track: GuideTrack; role: string | null };

const Guide = createContext<GuideContext>({ track: "student", role: null });

/** Tells every ⓘ inside it whose resume this is: student or working, and the role it is for. */
export function GuideProvider({ track, role, children }: { track?: GuideTrack; role?: string | null; children: React.ReactNode }) {
  return <Guide.Provider value={{ track: track ?? "student", role: role?.trim() || null }}>{children}</Guide.Provider>;
}

const TRACK_LABEL: Record<GuideTrack, string> = { student: "Student / first job", early_career: "Early professional" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-2">
      <h3 className="text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-slate-600">{title}</h3>
      {children}
    </section>
  );
}

export function FieldHelp({ field, label }: { field: GuideKey; label?: string }) {
  const context = useContext(Guide);
  const [open, setOpen] = useState(false);
  const [track, setTrack] = useState<GuideTrack>(context.track);
  const guide: FieldGuide = FIELD_GUIDES[field];
  const name = label ?? guide.title;
  const { family, lines } = examplesFor(field, track, context.role);
  const block = (event: React.ClipboardEvent | React.DragEvent) => event.preventDefault();

  return (
    <>
      {/* A small mark, with a 44px target around it. */}
      <button
        type="button"
        onClick={() => { setTrack(context.track); setOpen(true); }}
        aria-label={`How to write: ${name}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={`Writing tips: ${name}`}
        className={styles.trigger}
      >
        <span className={styles.badge} aria-hidden="true">
          <Info size={18} />
        </span>
      </button>
      {open && createPortal(
        <HelpSheet title={name} onClose={() => setOpen(false)}>
          <div className="grid gap-6 text-[0.92rem] leading-relaxed text-slate-700">
            <Section title="What to write">
              <ul className="grid list-disc gap-1.5 pl-5">{guide.expected.map((line) => <li key={line}>{line}</li>)}</ul>
            </Section>

            <Section title="Example">
              <div role="group" aria-label="Show the example for" className="inline-flex w-fit overflow-hidden rounded-full border border-slate-400">
                {(["student", "early_career"] as const).map((option, i) => (
                  <button key={option} type="button" aria-pressed={track === option} onClick={() => setTrack(option)} className={`min-h-10 px-4 text-[0.82rem] font-medium ${i > 0 ? "border-l border-slate-400" : ""} ${track === option ? "bg-slate-100 text-slate-900" : "text-slate-600"}`}>
                    {TRACK_LABEL[option]}
                  </button>
                ))}
              </div>
              <p className="text-[0.8rem] text-slate-600">{family === "general" ? "For any role" : `For ${FAMILY_LABEL[family].toLowerCase()} roles`} · names and numbers are samples</p>
              {/* Not copyable: write your own facts in this shape. */}
              <div data-example onCopy={block} onCut={block} onDragStart={block} className="grid select-none gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 [-webkit-touch-callout:none]">
                {lines.map((line) => <p key={line} className="text-slate-900">{line}</p>)}
              </div>
              <p className="text-[0.8rem] text-slate-600">Use the shape, not the words: your own facts and numbers make it yours.</p>
            </Section>

            {guide.avoid && (
              <Section title="Avoid">
                <ul className="grid list-disc gap-1.5 pl-5">{guide.avoid.map((line) => <li key={line}>{line}</li>)}</ul>
              </Section>
            )}

            {guide.limits && (
              <Section title="Limits">
                <p>{guide.limits}</p>
              </Section>
            )}
          </div>
        </HelpSheet>,
        document.body,
      )}
    </>
  );
}
