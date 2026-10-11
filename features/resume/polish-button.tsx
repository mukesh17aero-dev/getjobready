"use client";

import { createContext, useContext, useId, useState } from "react";
import { Sparkle } from "@/components/ui/icons";
import type { PolishField, PolishResult } from "./resume-api";
import s from "./polish-button.module.css";

// The ✦ after a field a person explains in their own words. A first-time
// writer often types pointers - "billing, 200 customers, stock check" - and
// this turns them into the lines a resume carries. It only ever suggests:
// the rewrite is shown under the field, and nothing replaces their words
// until they press "Use this".
//
// The writer itself lives in the backend, which refuses any rewrite that adds
// a figure, tool or name the person never gave. This component only asks and
// shows; whoever renders the editor supplies the asking.

export type PolishRequest = (field: PolishField, text: string, context?: { title?: string; organisation?: string; period?: string }) => Promise<PolishResult | null>;

const Polish = createContext<PolishRequest | null>(null);

/** Turns on the ✦ for every detailed field inside it. Without it, no ✦ is shown. */
export function PolishProvider({ request, children }: { request: PolishRequest | null; children: React.ReactNode }) {
  return <Polish.Provider value={request}>{children}</Polish.Provider>;
}

type State = { kind: "idle" } | { kind: "busy" } | { kind: "shown"; text: string; note: string } | { kind: "failed"; reason: string };

export function PolishButton({ field, value, context, label, onUse }: {
  field: PolishField;
  value: string;
  context?: { title?: string; organisation?: string; period?: string };
  /** The field's own label, to name what is being rewritten. */
  label: string;
  onUse: (text: string) => void;
}) {
  const request = useContext(Polish);
  const [state, setState] = useState<State>({ kind: "idle" });
  const id = useId();
  if (!request) return null;
  const empty = value.replace(/\W/g, "").length < 3;

  async function ask() {
    setState({ kind: "busy" });
    const result = await request!(field, value, context);
    if (!result) setState({ kind: "failed", reason: "The rewrite could not be written just now. Your words are as you left them - try again in a moment." });
    else if (!result.ok) setState({ kind: "failed", reason: result.reason });
    else setState({ kind: "shown", text: result.text, note: result.note });
  }

  return (
    <div className={s.polish}>
      <div className={s.bar}>
        <button
          type="button"
          className={s.trigger}
          onClick={ask}
          disabled={empty || state.kind === "busy"}
          aria-label={`Rewrite ${label} with AI`}
          aria-controls={id}
          title="Turn your notes into resume wording"
        >
          <Sparkle size={16} />
          <span aria-hidden="true">Improve with AI</span>
        </button>
        {empty && <span className={s.hint}>Write a few words or pointers first</span>}
      </div>
      <div id={id} aria-live="polite">
        {state.kind === "busy" && <p className={s.status}>Writing it as resume lines…</p>}
        {state.kind === "failed" && (
          <div className={s.card} data-tone="failed">
            <p>{state.reason}</p>
            <div className={s.actions}><button type="button" className={s.quiet} onClick={() => setState({ kind: "idle" })}>Close</button></div>
          </div>
        )}
        {state.kind === "shown" && (
          <div className={s.card}>
            <p className={s.heading}>Suggested wording</p>
            <p className={s.text}>{state.text}</p>
            {state.note && <p className={s.note}>{state.note}</p>}
            <p className={s.note}>Built only from what you wrote. Check every line is true before you use it.</p>
            <div className={s.actions}>
              <button type="button" className={s.use} onClick={() => { onUse(state.text); setState({ kind: "idle" }); }}>Use this</button>
              <button type="button" className={s.quiet} onClick={() => setState({ kind: "idle" })}>Keep mine</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
