"use client";

// Onboarding a college: add the institution, then give its first person access
// by email. That person must already have an Ascend account (the API says so
// plainly if not). Once they are in, they invite their own students from the
// cohort portal at /college.

import { useCallback, useEffect, useState } from "react";
import { adminCreateInstitution, adminGrantInstitutionMember, adminInstitutions, type AdminInstitution } from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";

const input = "min-h-11 w-full rounded-lg border border-slate-300 bg-surface px-3 text-sm";
const button = "inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-violet px-5 text-sm font-bold text-white transition-colors hover:bg-brand-violet-deep disabled:opacity-50";

async function token(): Promise<string | null> {
  const { data } = await supabaseBrowser().auth.getSession();
  return data.session?.access_token ?? null;
}

export function InstitutionsAdmin() {
  const [list, setList] = useState<AdminInstitution[] | null>(null);
  const [name, setName] = useState("");
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    const t = await token();
    const res = t ? await adminInstitutions(t) : null;
    if (!res) return setMessage({ tone: "error", text: "Sign in again to use this page." });
    if (!res.ok) return setMessage({ tone: "error", text: res.reason });
    setList(res.data.institutions);
  }, []);

  useEffect(() => {
    let live = true;
    void token()
      .then((t) => (t ? adminInstitutions(t) : null))
      .then((res) => {
        if (!live) return;
        if (!res) setMessage({ tone: "error", text: "Sign in again to use this page." });
        else if (!res.ok) setMessage({ tone: "error", text: res.reason });
        else setList(res.data.institutions);
      });
    return () => { live = false; };
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy("create");
    setMessage(null);
    const t = await token();
    const res = t ? await adminCreateInstitution(t, name) : null;
    setBusy(null);
    if (!res) return setMessage({ tone: "error", text: "Sign in again to use this page." });
    if (!res.ok) return setMessage({ tone: "error", text: res.reason });
    setName("");
    setMessage({ tone: "ok", text: `${res.data.institution.name} added. Now give its first person access below.` });
    await load();
  }

  async function grant(institution: AdminInstitution, e: React.FormEvent) {
    e.preventDefault();
    const email = (emails[institution.id] ?? "").trim();
    setBusy(institution.id);
    setMessage(null);
    const t = await token();
    const res = t ? await adminGrantInstitutionMember(t, institution.id, email) : null;
    setBusy(null);
    if (!res) return setMessage({ tone: "error", text: "Sign in again to use this page." });
    if (!res.ok) return setMessage({ tone: "error", text: res.reason });
    setEmails({ ...emails, [institution.id]: "" });
    setMessage({ tone: "ok", text: `${email} can now open the cohort portal for ${institution.name}.` });
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-16 sm:px-6">
      <nav aria-label="Breadcrumb" className="pt-4 text-xs text-slate-500">
        <Link href="/admin" className="hover:underline">Admin console</Link><span className="px-1.5">›</span><span>Colleges</span>
      </nav>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Colleges</h1>
      <p className="mt-1 text-[0.9rem] text-slate-600">
        Add a college, then give one person there access by email. They must already have an Ascend account. They then invite their own students from the cohort portal, and students choose whether to accept.
      </p>

      {message && (
        <p role={message.tone === "error" ? "alert" : "status"} className={`mt-4 rounded-xl px-4 py-2.5 text-[0.85rem] ${message.tone === "error" ? "bg-red-50 text-red-900" : "bg-violet-50 text-violet-900"}`}>{message.text}</p>
      )}

      <form onSubmit={create} className="mt-5 grid gap-3 rounded-xl border border-slate-200 bg-surface p-4 sm:p-5">
        <h2 className="text-[0.95rem] font-semibold text-slate-900">Add a college</h2>
        <label className="grid gap-1.5 text-sm font-semibold text-slate-700">College name
          <input className={input} required minLength={2} maxLength={200} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. St. Xavier's College, Pune" />
        </label>
        <div><button type="submit" className={button} disabled={busy === "create" || name.trim().length < 2}>{busy === "create" ? "Adding…" : "Add college"}</button></div>
      </form>

      <section className="mt-6" aria-label="Colleges">
        {list === null && !message && <p className="text-sm text-slate-500">Loading…</p>}
        {list?.length === 0 && <p className="text-sm text-slate-600">No colleges yet. Add the first one above.</p>}
        <ul className="grid gap-3">
          {list?.map((c) => (
            <li key={c.id} className="rounded-xl border border-slate-200 bg-surface p-4 sm:p-5">
              <h3 className="font-semibold text-slate-900">{c.name}</h3>
              <form onSubmit={(e) => void grant(c, e)} className="mt-3 flex flex-wrap items-end gap-3">
                <label className="grid min-w-[14rem] flex-1 gap-1.5 text-sm font-semibold text-slate-700">Give access to · their sign-up email
                  <input className={input} type="email" required value={emails[c.id] ?? ""} onChange={(e) => setEmails({ ...emails, [c.id]: e.target.value })} placeholder="placement.officer@college.edu" />
                </label>
                <button type="submit" className={button} disabled={busy === c.id || !(emails[c.id] ?? "").includes("@")}>{busy === c.id ? "Saving…" : "Give access"}</button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
