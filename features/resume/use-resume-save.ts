"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { resumeDraftIssue } from "./resume-draft-validation";
import { exportTemplate, saveResumeDraft, type ResumeData, type ResumeTemplate } from "./resume-api";

/** Saves in order so an older slow response cannot overwrite a newer draft. */
export function useResumeSave(result: { resume: ResumeData; targetRole: string } | null, template: ResumeTemplate, signedOut: boolean) {
  const payload = result ? JSON.stringify({ ...result, template: exportTemplate(template), displayTemplate: template }) : "";
  const [saved, setSaved] = useState(payload);
  const issue = result ? resumeDraftIssue(result.resume) : null;
  const [failed, setFailed] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [pending, setPending] = useState(0);
  const queue = useRef(Promise.resolve(true));
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const enqueue = useCallback((snapshot: string) => {
    setPending(value => value + 1);
    const task = queue.current.catch(() => false).then(async () => {
      let success = false;
      try {
        const { data } = await supabaseBrowser().auth.getSession();
        const token = data.session?.access_token;
        success = Boolean(token && await saveResumeDraft(token, JSON.parse(snapshot)));
      } catch { success = false; }
      if (alive.current) {
        if (success) { setSaved(snapshot); setFailed(""); } else setFailed(snapshot);
        setPending(value => value - 1);
      }
      return success;
    });
    queue.current = task;
    return task;
  }, []);
  useEffect(() => {
    if (!payload || signedOut || payload === saved || issue) return;
    const timer = setTimeout(() => { void enqueue(payload); }, 1200);
    return () => clearTimeout(timer);
  }, [payload, signedOut, saved, attempt, issue, enqueue]);
  const dirty = Boolean(payload && !signedOut && (payload !== saved || pending > 0));
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const saveFailed = dirty && !issue && failed === payload;
  return {
    dirty, saveFailed,
    flush: () => issue && dirty ? Promise.resolve(false) : dirty ? enqueue(payload) : Promise.resolve(true),
    acceptSaved: (resume: ResumeData, targetRole: string, look: ResumeTemplate) => setSaved(JSON.stringify({resume, targetRole, template: exportTemplate(look), displayTemplate: look})),
    saveLabel: issue && dirty ? issue : saveFailed ? "Not saved. Check your connection and retry before leaving." : dirty ? "Saving your changes…" : "",
    retry: () => { setFailed(""); setAttempt(value => value + 1); },
  };
}
