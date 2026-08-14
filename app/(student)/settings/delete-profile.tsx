"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { eraseMyData } from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase-browser";

// Deleting a profile has to reach every stored version, so this is a real
// operation with a real confirmation: the person types the word, and the
// button stays dead until they do.
export function DeleteProfile() {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function erase() {
    setBusy(true);
    setError(null);
    const { data } = await supabaseBrowser().auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setBusy(false);
      router.push("/login?next=/settings");
      return;
    }
    const report = await eraseMyData(token);
    if (!report) {
      setBusy(false);
      setError("We could not delete your profile just now. Please try again.");
      return;
    }
    await supabaseBrowser().auth.signOut();
    router.push("/?erased=1");
  }

  return (
    <section className="mt-6 rounded-xl border border-rose-200 bg-rose-50/40 p-4 sm:p-5">
      <h2 className="text-[0.95rem] font-semibold text-slate-900">
        Delete my profile
      </h2>
      <p className="mt-1.5 text-[0.85rem] leading-snug text-slate-600">
        Deletes your profile, your Discovery results and your activity — every
        saved version. You will be signed out. This cannot be undone.
      </p>

      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="confirm-delete">
          Type DELETE to confirm
        </label>
        <input
          id="confirm-delete"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Type DELETE to confirm"
          autoComplete="off"
          className="w-56 rounded-lg border border-slate-300 bg-surface px-3 py-2.5 text-[0.85rem] text-slate-900 outline-none focus:border-rose-500"
        />
        <button
          type="button"
          disabled={busy || confirm !== "DELETE"}
          onClick={() => void erase()}
          className="rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Deleting…" : "Delete my profile"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-[0.82rem] font-medium text-rose-700">
          {error}
        </p>
      )}
    </section>
  );
}
