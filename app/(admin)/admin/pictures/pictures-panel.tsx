"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminDrawRoleIllustration } from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { roleIllustrationUrl } from "@/features/discovery";

// Pick a role, draw its Discover picture, see it. Drawn with the server's own
// OpenAI key in the Ascend illustration style; saved by role id, so the card
// shows it straight away and a redraw replaces it.

type Role = { id: string; title: string; scene: string };

export function PicturesPanel({ roles }: { roles: Role[] }) {
  const [roleId, setRoleId] = useState(roles[0]?.id ?? "");
  const role = roles.find((r) => r.id === roleId) ?? null;
  const [scene, setScene] = useState(role?.scene ?? "");
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [shown, setShown] = useState<string | null>(null);

  useEffect(() => {
    if (!busy) return;
    const started = Date.now();
    const id = setInterval(() => setSeconds(Math.round((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(id);
  }, [busy]);

  function pick(id: string) {
    setRoleId(id);
    setScene(roles.find((r) => r.id === id)?.scene ?? "");
    setShown(null);
    setError(null);
  }

  async function draw() {
    if (!role) return;
    setBusy(true);
    setSeconds(0);
    setError(null);
    const { data } = await supabaseBrowser().auth.getSession();
    const token = data.session?.access_token;
    if (!token) { setBusy(false); setError("Your session expired. Sign in again."); return; }
    const result = await adminDrawRoleIllustration(token, role.id, scene.trim());
    setBusy(false);
    if (!result.ok) { setError(result.reason); return; }
    setShown(result.imageUrl);
  }

  const current = shown ?? (role ? roleIllustrationUrl(role.id) : null);

  return (
    <main className="mx-auto max-w-(--page-max-width) px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold text-slate-900">Role pictures</h1>
      <p className="mt-1 text-[0.9rem] text-slate-600">
        One picture per role, shown at the top of its card in Discover. Drawn in the Ascend style: polished anime-inspired illustration, fine line art, teal and violet, no text. Framed wide so nobody&apos;s head is cut off on the card.
      </p>

      <label className="mt-5 block text-[0.82rem] font-semibold text-slate-700">
        Role
        <select value={roleId} disabled={busy} onChange={(e) => pick(e.target.value)} className="mt-1 block min-h-11 w-full max-w-sm rounded-lg border border-slate-300 bg-surface px-2.5 text-[0.9rem]">
          {roles.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
        </select>
      </label>

      <label className="mt-4 block text-[0.82rem] font-semibold text-slate-700">
        What the picture shows
        <textarea rows={4} maxLength={800} value={scene} disabled={busy} onChange={(e) => setScene(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.88rem] leading-relaxed" />
        <span className="mt-1 block text-[0.76rem] font-normal text-slate-500">One moment of the job, with who is there and what is in their hands. The style is added for you.</span>
      </label>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" disabled={busy || scene.trim().length < 10} onClick={() => void draw()} className="min-h-11 rounded-lg bg-brand-violet px-5 text-[0.9rem] font-bold text-white hover:bg-brand-violet-deep disabled:opacity-40">
          {busy ? `Drawing… ${seconds}s` : "Draw picture"}
        </button>
        {busy && <span className="text-[0.8rem] text-slate-500">Takes about a minute. Keep this tab open.</span>}
      </div>
      {error && <p role="alert" className="mt-4 rounded-lg bg-amber-50 px-3.5 py-2.5 text-[0.85rem] text-amber-900">{error}</p>}

      {current && (
        <figure className="mt-6">
          {/* A plain img: a picture that does not exist yet simply hides, and a redraw shows at once. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={current} src={current} alt={`Picture for ${role?.title ?? "this role"}`} className="w-full rounded-xl border border-slate-200" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <p className="mt-4 text-[0.78rem] font-semibold text-slate-700">How it looks on the Discover card</p>
          <div className="mt-1 h-[190px] w-full max-w-[380px] overflow-hidden rounded-xl border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={`${current}-card`} src={current} alt="" className="h-full w-full object-cover object-[center_45%]" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          </div>
          <figcaption className="mt-2 text-[0.8rem] text-slate-500">
            {shown ? "Just drawn. It is live on the role's Discover card now." : "The current picture, if there is one."}{" "}
            <Link href="/discover" className="font-semibold text-brand-teal-deep underline">See it in Discover</Link>
          </figcaption>
        </figure>
      )}
    </main>
  );
}
