"use client";

// The student's side of a college link. A college can invite a student by
// email, but nothing of theirs is visible to it until they say yes - so this
// is where that yes (or no) is given, and taken back.
//
//   CollegeInvitations   a banner on Home, only while an invitation waits
//   CollegeLinksSettings the full list in Settings: answer, stop sharing, history

import { useCallback, useEffect, useState } from "react";
import {
  acceptInstitutionLink, declineInstitutionLink, myInstitutionLinks, revokeInstitutionLink,
  type InstitutionLink,
} from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { NOT_SHARED, SHARED, STOP_ANY_TIME, pastLabel, splitLinks } from "./college-links-model";

type Loaded = { links: InstitutionLink[] } | "failed" | null;
type Action = "accept" | "decline" | "revoke";

const primary = "inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-violet px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-violet-deep disabled:opacity-50";
const secondary = "inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 disabled:opacity-50";

async function accessToken(): Promise<string | null> {
  const { data } = await supabaseBrowser().auth.getSession();
  return data.session?.access_token ?? null;
}

function useCollegeLinks() {
  const [state, setState] = useState<Loaded>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const token = await accessToken();
    const res = token ? await myInstitutionLinks(token) : null;
    setState(res ? { links: res.links } : "failed");
  }, []);

  useEffect(() => {
    let live = true;
    void accessToken()
      .then((token) => (token ? myInstitutionLinks(token) : null))
      .then((res) => { if (live) setState(res ? { links: res.links } : "failed"); });
    return () => { live = false; };
  }, []);

  async function act(link: InstitutionLink, action: Action) {
    setBusy(link.id);
    setMessage("");
    const token = await accessToken();
    const done = token
      ? action === "accept" ? await acceptInstitutionLink(token, link.id)
        : action === "decline" ? await declineInstitutionLink(token, link.id)
        : await revokeInstitutionLink(token, link.id)
      : null;
    setBusy(null);
    if (!done) return setMessage("That did not save. Check your connection and try again.");
    setMessage(
      action === "accept" ? `You are now linked to ${link.institutionName}.`
        : action === "decline" ? `You declined ${link.institutionName}'s invitation.`
        : `You stopped sharing with ${link.institutionName}.`,
    );
    await load();
  }

  return { state, busy, message, act, reload: load };
}

function Invitation({ link, busy, onAct }: { link: InstitutionLink; busy: boolean; onAct: (a: Action) => void }) {
  return (
    <div className="grid gap-3">
      <div>
        <h3 className="text-[0.95rem] font-semibold text-slate-900">{link.institutionName} invited you to link your account</h3>
        <p className="mt-1.5 text-[0.85rem] leading-relaxed text-slate-700">{SHARED} {NOT_SHARED}</p>
        <p className="mt-1 text-[0.8rem] text-slate-500">{STOP_ANY_TIME}</p>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <button type="button" className={primary} disabled={busy} onClick={() => onAct("accept")}>{busy ? "Saving…" : "Accept and link"}</button>
        <button type="button" className={secondary} disabled={busy} onClick={() => onAct("decline")}>No thanks</button>
      </div>
    </div>
  );
}

/** Home: shown only while a college is waiting for an answer; nothing otherwise. */
export function CollegeInvitations() {
  const { state, busy, message, act } = useCollegeLinks();
  const pending = state && state !== "failed" ? splitLinks(state.links).pending : [];
  if (pending.length === 0 && !message) return null;
  return (
    <section aria-label="College invitation" className="mx-auto mt-6 max-w-3xl px-4 sm:px-6">
      <div className="grid gap-5 rounded-2xl border border-violet-200 bg-violet-50 p-4 sm:p-5">
        {pending.map((link) => <Invitation key={link.id} link={link} busy={busy === link.id} onAct={(a) => void act(link, a)} />)}
        {message && <p role="status" className="text-[0.85rem] font-semibold text-slate-800">{message}</p>}
      </div>
    </section>
  );
}

/** Settings: every college link, with the answer, the way out, and the history. */
export function CollegeLinksSettings() {
  const { state, busy, message, act, reload } = useCollegeLinks();
  const groups = state && state !== "failed" ? splitLinks(state.links) : null;
  return (
    <section id="colleges" className="mt-6 rounded-xl border border-slate-200 bg-surface p-4 sm:p-5" aria-labelledby="colleges-title">
      <h2 id="colleges-title" className="text-[0.95rem] font-semibold text-slate-900">Your college</h2>
      {/* An open invitation already says this in full; saying it twice is noise. */}
      {(!groups || groups.pending.length === 0) && <p className="mt-1.5 text-[0.85rem] leading-relaxed text-slate-600">{SHARED} {NOT_SHARED}</p>}

      {state === null && <p className="mt-3 text-sm text-slate-500">Loading…</p>}
      {state === "failed" && (
        <p role="alert" className="mt-3 text-sm text-slate-700">
          Your college links could not be loaded. <button type="button" className="font-semibold underline" onClick={() => void reload()}>Try again</button>
        </p>
      )}
      {groups && groups.pending.length + groups.active.length + groups.past.length === 0 && (
        <p className="mt-3 text-sm text-slate-600">No college has invited you. If yours uses Ascend, ask them to invite the email you signed up with, and the invitation will appear here and on Home.</p>
      )}

      {groups && groups.pending.length > 0 && (
        <div className="mt-4 grid gap-5 rounded-xl bg-violet-50 p-4">
          {groups.pending.map((link) => <Invitation key={link.id} link={link} busy={busy === link.id} onAct={(a) => void act(link, a)} />)}
        </div>
      )}

      {groups && groups.active.length > 0 && (
        <ul className="mt-4 grid gap-3">
          {groups.active.map((link) => (
            <li key={link.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3.5">
              <span>
                <strong className="block text-sm text-slate-900">{link.institutionName}</strong>
                <span className="text-[0.8rem] text-teal-700">Linked{link.respondedAt ? ` since ${new Date(link.respondedAt).toLocaleDateString("en-GB", { dateStyle: "medium" })}` : ""}</span>
              </span>
              <button type="button" className={secondary} disabled={busy === link.id} onClick={() => void act(link, "revoke")}>{busy === link.id ? "Saving…" : "Stop sharing"}</button>
            </li>
          ))}
        </ul>
      )}

      {groups && groups.past.length > 0 && (
        <ul className="mt-4 grid gap-1.5 text-[0.82rem] text-slate-500">
          {groups.past.map((link) => <li key={link.id}>{link.institutionName} · {pastLabel(link)}</li>)}
        </ul>
      )}

      {message && <p role="status" className="mt-3 text-[0.85rem] font-semibold text-slate-800">{message}</p>}
    </section>
  );
}
