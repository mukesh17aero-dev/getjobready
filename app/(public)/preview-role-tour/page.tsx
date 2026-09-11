"use client";

// The browse-and-walk-through workflow, on its own, without a login.
//
// Discovery's real content needs a token, so this route mounts the same
// RoleTour component against a fixture shaped exactly like the live payload -
// worlds, catalogue and RoleDetail. Everything you click here is the shipped
// component; only the data is local.
//
// The fixture carries no RoleKnowledge on purpose. That is the state the
// backend is in today, so this is what a real walk-through looks like right
// now: the assistant answers what the record supports and offers nothing else.

import { useState } from "react";
import { RoleTour, type TourNote } from "@/components/role-tour";
import { CONTENT, ROLES } from "./fixture";

export default function PreviewRoleTour() {
  const [open, setOpen] = useState(true);
  const [result, setResult] = useState<TourNote[] | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs font-bold uppercase tracking-wide text-brand-violet-deep">
        Preview
      </p>
      <h1 className="mt-1 text-[1.7rem] font-bold leading-tight text-brand-ink">
        Browse by industry, and be walked through it
      </h1>
      <p className="mt-3 text-[0.92rem] leading-relaxed text-slate-600">
        The second way into Discovery, for the person who cannot answer &ldquo;which
        would you rather do&rdquo; because they have never seen either job
        described. Pick an industry, open any role, and the discovery assistant is
        already there. Or take the walk-through and go through them one at a
        time, saying what you made of each.
      </p>

      <button
        type="button"
        onClick={() => {
          setResult(null);
          setOpen(true);
        }}
        className="mt-5 min-h-12 rounded-full bg-brand-violet px-7 text-sm font-bold text-white"
      >
        Open it
      </button>

      {chosen && (
        <p className="mt-4 text-[0.85rem] text-brand-teal-deep">
          Chosen role: {chosen}
        </p>
      )}

      {result && (
        <div className="mt-6 rounded-xl border border-slate-200 p-4">
          <p className="text-[0.8rem] font-bold uppercase tracking-wide text-slate-400">
            What the walk-through handed back
          </p>
          <pre className="mt-2 overflow-x-auto text-[0.72rem] leading-relaxed text-slate-600">
            {JSON.stringify(result, null, 2)}
          </pre>
          <p className="mt-2 text-[0.78rem] text-slate-500">
            On the real screen this goes to the footprint stream, and the
            recommendation stays on the server.
          </p>
        </div>
      )}

      {open && (
        <RoleTour
          worlds={CONTENT.worlds}
          catalogue={CONTENT.catalogue}
          roles={ROLES}
          chosenRoleId={chosen}
          onChoose={(roleId) => setChosen(roleId)}
          onClose={() => setOpen(false)}
          finish={{
            label: "Now answer the questions",
            onAct: (notes) => {
              setResult(notes);
              setOpen(false);
            },
          }}
        />
      )}
    </main>
  );
}
