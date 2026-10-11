"use client";

// One instruction, several roles.
//
// The per-role boxes elsewhere are for the careful pass: read this role, fix
// this line. This is for the other kind of work - "give all six a hard-truths
// section", "draft questions for everything that has none" - where typing the
// same sentence six times is the only thing standing between you and the job
// being done.
//
// It runs the roles ONE AT A TIME on purpose. A batch that fires six calls at
// once finishes marginally sooner, buys a rate-limit error on a bad day, and
// tells you nothing while it waits. Sequential means you watch it work, a
// failure is attributable to a role rather than to the batch, and the roles
// that already succeeded keep their result.

import { useCallback, useMemo, useState } from "react";

export type BatchOutcome =
  | { ok: true; warnings: string[] }
  | { ok: false; reason: string };

type Status =
  | { state: "waiting" }
  | { state: "running" }
  | { state: "done"; warnings: string[] }
  | { state: "failed"; reason: string };

export function RoleBatch({
  roles,
  hint,
  placeholder,
  actionLabel,
  aiConfigured,
  run,
}: {
  roles: Array<{ id: string; title: string }>;
  hint: string;
  placeholder: string;
  /** Verb for the button, e.g. "Write them" or "Draft questions". */
  actionLabel: string;
  aiConfigured: boolean;
  /** Applied to one role. Resolve with what happened; never throw. */
  run: (roleId: string, instruction: string) => Promise<BatchOutcome>;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Record<string, Status>>({});

  const chosen = useMemo(
    () => roles.filter((r) => selected.includes(r.id)),
    [roles, selected],
  );

  const toggle = (id: string) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );

  const go = useCallback(async () => {
    setBusy(true);
    setStatus(
      Object.fromEntries(chosen.map((r) => [r.id, { state: "waiting" }])),
    );
    for (const role of chosen) {
      setStatus((s) => ({ ...s, [role.id]: { state: "running" } }));
      const outcome = await run(role.id, instruction);
      setStatus((s) => ({
        ...s,
        [role.id]: outcome.ok
          ? { state: "done", warnings: outcome.warnings }
          : { state: "failed", reason: outcome.reason },
      }));
    }
    setBusy(false);
  }, [chosen, instruction, run]);

  const done = Object.values(status).filter(
    (s) => s.state === "done" || s.state === "failed",
  ).length;

  if (roles.length === 0) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-slate-500">
          Do several roles at once
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="text-[0.75rem] font-semibold text-brand-violet-deep hover:underline"
        >
          {open ? "Close" : "Open"}
        </button>
      </div>

      {open && (
        <>
          <p className="mt-1 text-[0.75rem] leading-snug text-slate-500">
            {hint} One instruction, applied to each role you tick. They run one
            after another so you can see where it got to.
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => setSelected(roles.map((r) => r.id))}
              className="rounded-lg border border-slate-300 px-2.5 py-1 text-[0.75rem] font-semibold text-slate-600 hover:bg-surface disabled:opacity-50"
            >
              Select all {roles.length}
            </button>
            <button
              type="button"
              disabled={busy || selected.length === 0}
              onClick={() => setSelected([])}
              className="rounded-lg border border-slate-300 px-2.5 py-1 text-[0.75rem] font-semibold text-slate-600 hover:bg-surface disabled:opacity-50"
            >
              Clear
            </button>
          </div>

          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {roles.map((role) => {
              const s = status[role.id];
              return (
                <li key={role.id}>
                  <label className="flex items-start gap-2 rounded-lg px-1.5 py-1 text-[0.82rem] text-slate-700 hover:bg-surface">
                    <input
                      type="checkbox"
                      checked={selected.includes(role.id)}
                      disabled={busy}
                      onChange={() => toggle(role.id)}
                      className="mt-0.5 h-4 w-4 shrink-0"
                    />
                    <span className="min-w-0 flex-1">
                      {role.title || "Untitled role"}
                      {s && (
                        <span
                          className={`ml-1.5 text-[0.75rem] ${
                            s.state === "failed"
                              ? "text-rose-700"
                              : s.state === "done"
                                ? "text-brand-teal-deep"
                                : "text-slate-500"
                          }`}
                        >
                          {s.state === "waiting" && "queued"}
                          {s.state === "running" && "working…"}
                          {s.state === "done" &&
                            (s.warnings.length > 0
                              ? `done, ${s.warnings.length} to check`
                              : "done")}
                          {s.state === "failed" && "failed"}
                        </span>
                      )}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          <textarea
            rows={3}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            disabled={busy}
            placeholder={placeholder}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.85rem] outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20 disabled:opacity-60"
          />

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={
                busy ||
                !aiConfigured ||
                chosen.length === 0 ||
                instruction.trim() === ""
              }
              onClick={() => void go()}
              className="rounded-lg bg-brand-violet px-3.5 py-1.5 text-[0.8rem] font-bold text-white transition-colors hover:bg-brand-violet-deep disabled:opacity-60"
            >
              {busy
                ? `${actionLabel} — ${done} of ${chosen.length}`
                : `${actionLabel} (${chosen.length})`}
            </button>
            {!aiConfigured && (
              <span className="text-[0.75rem] text-slate-500">
                No AI key configured.
              </span>
            )}
            {busy && (
              <span className="text-[0.75rem] text-slate-500">
                Leave this tab open until it finishes.
              </span>
            )}
          </div>

          {/* Failures and warnings named per role: a batch that says "3 of 6
              had something to check" without saying which is a batch you have
              to redo by hand. */}
          {roles.map((role) => {
            const s = status[role.id];
            if (!s) return null;
            if (s.state === "failed") {
              return (
                <p
                  key={role.id}
                  className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-[0.78rem] leading-snug text-rose-800"
                >
                  <strong className="font-semibold">{role.title}:</strong>{" "}
                  {s.reason}
                </p>
              );
            }
            if (s.state === "done" && s.warnings.length > 0) {
              return (
                <p
                  key={role.id}
                  className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[0.78rem] leading-snug text-amber-900"
                >
                  <strong className="font-semibold">{role.title}:</strong>{" "}
                  {s.warnings.join(" ")}
                </p>
              );
            }
            return null;
          })}

          {done > 0 && !busy && (
            <p className="mt-2 text-[0.78rem] text-slate-500">
              Nothing is published yet — read what came back, then Save draft
              and Publish.
            </p>
          )}
        </>
      )}
    </section>
  );
}
