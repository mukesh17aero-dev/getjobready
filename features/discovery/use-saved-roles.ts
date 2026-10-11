"use client";
import { useEffect, useState } from "react";
import { track } from "@/lib/footprints";
import { getCareerRecord, saveExplorationPreference } from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase-browser";
const KEY = "ascend:discovery-shortlist";
const ids = (value: unknown): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
export function useSavedRoles(signedOut: boolean) {
  const [saved, setSaved] = useState<string[]>([]);
  const [browserSaved, setBrowserSaved] = useState<string[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let alive = true;
    async function restore() {
      try {
        if (signedOut) {
          const values = ids(JSON.parse(localStorage.getItem(KEY) ?? "[]"));
          if (alive) { setSaved(values); setLoaded(true); }
        } else {
          try { if (alive) setBrowserSaved(ids(JSON.parse(localStorage.getItem(KEY) ?? "[]"))); } catch { /* Account saves do not depend on browser storage. */ }
          const { data } = await supabaseBrowser().auth.getSession();
          const record = data.session ? await getCareerRecord(data.session.access_token) : null;
          if (!record) throw Error("Could not load saved roles. Reload to try again; your saved list has not been changed.");
          if (alive) { setSaved(ids(record.profile?.preferences.savedRoleIds)); setLoaded(true); }
        }
      } catch (err) { if (alive) setError(err instanceof Error ? err.message : "Browser storage is unavailable. Saved roles cannot be restored."); }
      finally { if (alive) setBusy(false); }
    }
    void restore();
    return () => { alive = false; };
  }, [signedOut]);
  async function toggleSaved(id: string) {
    if (busy || !loaded) return false;
    const keep = !saved.includes(id);
    const next = keep ? [...saved, id] : saved.filter(value => value !== id);
    setBusy(true); setError("");
    try {
      if (signedOut) { localStorage.setItem(KEY, JSON.stringify(next)); setSaved(next); }
      else {
        const { data } = await supabaseBrowser().auth.getSession();
        const profile = data.session ? await saveExplorationPreference(data.session.access_token, {roleId:id,saved:keep}) : null;
        if (!profile) throw Error("Not saved. Your previous list is safe. Try the save button again.");
        setSaved(ids(profile.preferences.savedRoleIds));
        if (keep) track({family:"decision",event:"role_saved",module:"discovery",target:id});
      }
      return true;
    } catch (err) { setError(err instanceof Error ? err.message : "Not saved. Try again."); return false; }
    finally { setBusy(false); }
  }
  async function moveBrowserRoles() {
    if (busy || !loaded || signedOut) return;
    setBusy(true); setError("");
    try {
      const {data} = await supabaseBrowser().auth.getSession();
      if (!data.session) throw Error("Sign in again to move these roles. The browser list is unchanged.");
      for (const roleId of browserSaved) {
        const profile = await saveExplorationPreference(data.session.access_token, {roleId,saved:true});
        if (!profile) throw Error("Some roles could not be moved. Your browser list is safe; retry to finish.");
        setSaved(ids(profile.preferences.savedRoleIds));
      }
      localStorage.removeItem(KEY); setBrowserSaved([]);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not finish moving roles. Try again."); }
    finally { setBusy(false); }
  }
  return {saved,toggleSaved,busy:busy || !loaded,error,browserSaved,moveBrowserRoles};
}
