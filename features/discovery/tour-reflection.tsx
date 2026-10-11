"use client";

import type { TourNote } from "./role-tour";
import type { RoleDetail } from "@/lib/api";

export function TourReflection({ notes, roles, selectedRole, busy, onChoose, onOpen, onBrowse }: {
  notes: TourNote[]; roles: RoleDetail[]; selectedRole: string | null; busy: boolean;
  onChoose: (id: string) => void; onOpen: (id: string) => void; onBrowse: () => void;
}) {
  const curious = notes.filter(note => note.reaction === "curious");
  const declined = notes.filter(note => note.reaction === "not-for-me");
  const button = "min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-brand-violet";
  return <section>
    <h1 className="text-2xl font-semibold text-brand-ink">What did you learn about the work you like?</h1>
    <p className="mt-3 text-slate-700">{curious.length ? `You marked ${curious.map(n => n.title).join(" and ")} as interesting.` : "You have not marked a role as interesting yet. That is useful: you can keep exploring without choosing one."} {declined.length ? `You marked ${declined.map(n => n.title).join(" and ")} as not for you.` : ""}</p>
    <p className="mt-2 text-sm text-slate-600">These are your stated preferences, not an ability assessment. Check the working conditions before choosing a direction; you can change it later.</p>
    <ul className="mt-5 grid gap-4">{notes.map(note => {
      const role = roles.find(r => r.roleId === note.roleId);
      return <li key={note.roleId} className="rounded-xl border border-slate-200 bg-surface p-5">
        <h2 className="font-semibold">{note.title} · {note.reaction === "curious" ? "Worth exploring" : note.reaction === "not-for-me" ? "Not for you" : "Still considering"}</h2>
        {note.thoughts && <blockquote className="my-3 text-slate-700">Your reflection: “{note.thoughts}”</blockquote>}
        {role && <p className="my-3 text-sm text-slate-600"><strong>A trade-off to check:</strong> {role.hardTruths[0] || role.workContext.hours}</p>}
        <div className="flex flex-wrap gap-3"><button type="button" className={button} onClick={() => onOpen(note.roleId)}>Review the work and conditions</button><button type="button" className={button} disabled={busy || selectedRole === note.roleId} onClick={() => onChoose(note.roleId)}>{selectedRole === note.roleId ? "Your saved direction" : "Save as my direction"}</button></div>
      </li>;
    })}</ul>
    <button type="button" className="mt-5 min-h-11 rounded-lg bg-brand-panel px-5 text-white" onClick={curious.length ? () => onOpen(curious[0].roleId) : onBrowse}>{curious.length ? `Explore ${curious[0].title} next` : "Explore other roles"}</button>
  </section>;
}
