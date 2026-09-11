"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { SignUpPrompt, type GatedAction } from "@/components/signup-gate";
import { track as trackEvent } from "@/lib/footprints";
import { whenLabel } from "@/lib/when";
import { SAMPLE_ATS, SAMPLE_RESUME as EXAMPLE_RESUME, SAMPLE_REVIEW } from "@/lib/samples";
import {
  A4Frame,
  EssentialsModal,
  MiniPreview,
  NEXT_STEP_HREF,
  NEXT_STEP_LABEL,
  ResumeSheet,
  ReviewProgress,
  SAMPLE_RESUME,
  SCRIBE_EXAMPLES,
  STUDENT_SAMPLE,
  TEMPLATES,
  asTemplate,
  splitList,
  standingLabel,
  uploadRead,
  type LedgerEntry,
  type Revision,
} from "@/components/resume-builder";
import {
  downloadResumeDocx,
  exportTemplate,
  generateResume,
  readResumeUpload,
  refineResume,
  resumeCompleteness,
  resumeGapCheck,
  reviewResume,
  saveResumeProfile,
  type AtsCheck,
  type GapCheckResult,
  type ResumeCareerProfile,
  type ResumeData,
  type ResumeReview,
  type ResumeTarget,
  type ResumeTemplate,
} from "@/lib/resume-api";
import { previewTemplate, previewTemplates } from "@/lib/resume-template-access";
import { PLANS, PLAN_KEY, isPlan, type PlanId } from "@/lib/plans";
import s from "./resume-studio.module.css";

// Resume Studio, as approved in public/previews/ascend-resume-complete.html:
// six stages - start, choose a plan, details, your draft, feedback, export -
// on top of the same API the builder has always used. Nothing here writes,
// reads, revises, reviews or exports a resume except through that API.
//
// Two things the founder asked for on top of the preview:
//
//   The plan is asked for after Continue on the Start stage, not before it,
//   and signing in comes with it. Somebody signed out can set the whole build
//   up first and is asked for an account only at the moment it would cost us
//   something to go on.
//
//   Somebody signed out can still see what they would get: the draft,
//   feedback and export stages show a worked example, labelled as somebody
//   else's, so the part that is hard to picture - the read-back - is there to
//   look at before they decide.

type Stage = "start" | "plan" | "details" | "draft" | "review" | "export";
const STAGES: Array<{ id: Stage; name: string }> = [
  { id: "start", name: "Start" },
  { id: "plan", name: "Choose a plan" },
  { id: "details", name: "Details" },
  { id: "draft", name: "Your draft" },
  { id: "review", name: "Feedback" },
  { id: "export", name: "Export" },
];
// The plans live in lib/plans.ts, shared with the account menu.
type Purpose = "role" | "general" | "improve";
type Track = "student" | "early_career";
const EXAMPLE_ROLE = "Customer Success Associate";
const EXAMPLE_QUESTIONS = [
  ["Your experience", "What did you take responsibility for in your latest role or project?", "Focus on what you did yourself."],
  ["Customer situations", "Describe a customer issue you resolved and how it ended.", "One real example helps more than a general claim."],
  ["Your impact", "What did you track or measure in your work?", "Use numbers only when you can support them."],
];
const HEADINGS: Record<Stage, [string, string]> = {
  start: ["Start", "Start with what you have. Shape it for where you want to go."],
  plan: ["Choose a plan", "One payment. 30 days to build and refine. No automatic renewal."],
  details: ["Details", "Your saved record is enough to start. Add only what helps."],
  draft: ["Your draft", "Read the draft, check the facts and refine the words."],
  review: ["Feedback", "See the key signals, improve one thing and choose a useful next step."],
  export: ["Export", "Choose a format for the way you plan to use it."],
};
const Arrow = () => <span aria-hidden="true">→</span>;
const Tick = () => <span aria-hidden="true">✓</span>;

async function token(): Promise<string | null> {
  const { data } = await supabaseBrowser().auth.getSession();
  return data.session?.access_token ?? null;
}

export function ResumeStudio({ profile: initialProfile, target, recordAt, signedOut = false }: {
  profile: ResumeCareerProfile | null; target: ResumeTarget | null; recordAt?: string; signedOut?: boolean;
}) {
  const [profile, setProfile] = useState(initialProfile);
  const prefs = useMemo(() => profile?.preferences ?? {}, [profile]);
  const text = (key: string) => { const v = prefs[key]; return typeof v === "string" ? v.trim() : ""; };
  const ledger = useMemo<LedgerEntry[]>(() => {
    const raw = profile?.preferences?.["resumeLedger"];
    if (!Array.isArray(raw)) return [];
    return raw.filter((e): e is LedgerEntry => typeof e === "object" && e !== null && typeof (e as { role?: unknown }).role === "string").slice().reverse().slice(0, 10);
  }, [profile]);
  const opened = recordAt ? ledger.find(entry => entry.at === recordAt && entry.resume) : undefined;
  const lockedRole = target?.role ?? null;
  const savedTrack: Track | null = prefs["track"] === "student" || prefs["track"] === "early_career" ? (prefs["track"] as Track) : null;
  const profileSkills = useMemo(() => splitList(prefs["skills"]), [prefs]);

  const [stage, setStage] = useState<Stage>(opened ? "draft" : "start");
  const [plan, setPlan] = useState<PlanId>(() => (isPlan(prefs["resumePlan"]) ? (prefs["resumePlan"] as PlanId) : "plus"));
  const [planChosen, setPlanChosen] = useState<boolean>(isPlan(prefs["resumePlan"]));
  const [purpose, setPurpose] = useState<Purpose>("general");
  const [roleInput, setRoleInput] = useState(lockedRole?.title ?? "");
  const [jdInput, setJdInput] = useState("");
  const [trackChoice, setTrackChoice] = useState<Track | null>(savedTrack);
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate>(asTemplate(opened?.template));
  const allowedTemplateIds = previewTemplates(planChosen ? plan : null, signedOut);
  const hasAdditionalTemplates = allowedTemplateIds.length > 1;
  const template = previewTemplate(selectedTemplate, allowedTemplateIds);
  const availableTemplates = TEMPLATES.filter(item => allowedTemplateIds.includes(item.id));
  function setTemplate(next: ResumeTemplate) {
    if (!allowedTemplateIds.includes(next)) { go("plan"); return; }
    setSelectedTemplate(next);
  }
  const [upload, setUpload] = useState<{ filename: string; text: string; read: { experience: number; education: number; skills: number }; parsed: Record<string, unknown> | null } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState<null | "checking" | "building" | "reviewing" | "revising" | "exporting" | "saving">(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [gap, setGap] = useState<GapCheckResult | null>(null);
  const [question, setQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [extraSkills, setExtraSkills] = useState("");
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const [essentialsOpen, setEssentialsOpen] = useState(false);
  const [result, setResult] = useState<{ resume: ResumeData; targetRole: string } | null>(opened?.resume ? { resume: opened.resume, targetRole: opened.role } : null);
  const [ats, setAts] = useState<AtsCheck | null>(null);
  const [review, setReview] = useState<ResumeReview | null>(opened?.review ?? null);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [request, setRequest] = useState("");
  const [editor, setEditor] = useState<"scribe" | "summary">("scribe");
  const [summaryDraft, setSummaryDraft] = useState("");
  const [pane, setPane] = useState<"document" | "edit">("document");
  const [format, setFormat] = useState<"docx" | "pdf">("docx");
  const [exported, setExported] = useState(false);
  const [sheetPages, setSheetPages] = useState(1);
  const [gate, setGate] = useState<GatedAction | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // A plan chosen before signing up is kept in the browser, so it is still
  // there when they come back from the sign-up page.
  useEffect(() => {
    if (!signedOut) return;
    // After the first paint, so the server-rendered page and the browser agree
    // on what they showed first.
    const id = setTimeout(() => {
      try {
        const stored = localStorage.getItem(PLAN_KEY);
        if (isPlan(stored)) { setPlan(stored); setPlanChosen(true); }
      } catch { /* storage unavailable: the choice simply does not persist */ }
    }, 0);
    return () => clearTimeout(id);
  }, [signedOut]);

  const targeted = purpose === "role" || (purpose === "improve" && Boolean(roleInput.trim()));
  const general = !targeted;
  const chosenRole = () => (targeted ? roleInput.trim() : "");
  const readyToBuild = Boolean(trackChoice) && (purpose === "general" || (purpose === "role" && Boolean(roleInput.trim())) || (purpose === "improve" && upload !== null));
  const needsEssentials = !text("fullName") || profileSkills.length === 0;
  const isExample = !result;
  const shown = result ?? { resume: EXAMPLE_RESUME, targetRole: EXAMPLE_ROLE };
  const shownReview = result ? review : SAMPLE_REVIEW;
  const shownAts = result ? ats : SAMPLE_ATS;
  const completeness = result ? resumeCompleteness(result.resume) : { ready: true, missing: [] };
  const previewResume = useMemo<ResumeData>(() => {
    const sample = trackChoice === "student" ? STUDENT_SAMPLE : SAMPLE_RESUME;
    const name = text("fullName"), city = text("city");
    return { ...sample, header: { name: name || sample.header.name, city: city || sample.header.city, email: name ? "your.email@example.com" : sample.header.email } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, trackChoice]);
  const stageIndex = STAGES.findIndex(item => item.id === stage);
  const chosenPlan = PLANS.find(item => item.id === plan)!;

  function go(next: Stage) {
    setStage(next); setError(null); setStatus("");
    setTimeout(() => { titleRef.current?.focus({ preventScroll: true }); titleRef.current?.scrollIntoView({ block: "start", behavior: "instant" }); }, 0);
  }
  function askForAccount(what: string, why: string) { setGate({ what, why }); }
  async function withToken(): Promise<string | null> {
    const t = await token();
    if (!t) askForAccount("your resume", "Writing it takes a couple of minutes of an AI's time and produces a document that is yours - so it needs an account to belong to, and to be waiting for you when you come back to change it.");
    return t;
  }
  function savePlanLocally(id: PlanId) { try { localStorage.setItem(PLAN_KEY, id); } catch { /* fine */ } }

  // ---- Start ----
  function choosePurpose(next: Purpose) {
    setPurpose(next); setError(null);
    if (next !== "improve") setUpload(null);
    if (next === "general") { setRoleInput(""); setJdInput(""); }
    if (next === "role" && !roleInput.trim() && lockedRole) setRoleInput(lockedRole.title);
  }
  async function readExisting(file: File) {
    if (signedOut) { askForAccount("your uploaded resume", "Reading your file and improving it means keeping both - what you had, and what it became - so there has to be somewhere to keep them."); return; }
    setError(null); setUploading(true);
    const t = await withToken(); if (!t) { setUploading(false); return; }
    const read = await readResumeUpload(t, file);
    setUploading(false);
    if (!read.ok) { setError(read.error); return; }
    setUpload({ filename: read.filename, text: read.text, read: read.read, parsed: read.parsed });
  }
  function continueFromStart() {
    if (!readyToBuild) { setError(!trackChoice ? "Tell us where you are right now first." : purpose === "role" ? "Name the role you are aiming at." : "Choose the resume to improve first."); return; }
    setError(null);
    if (!planChosen) { go("plan"); return; }
    void beginBuild();
  }

  // ---- Plan ----
  async function continueWithPlan() {
    savePlanLocally(plan);
    if (signedOut) {
      askForAccount("your resume", `Your ${chosenPlan.name} choice is kept while you sign in or create an account. Building starts the moment you are back.`);
      return;
    }
    setBusy("saving"); setError(null);
    const t = await withToken(); if (!t) { setBusy(null); return; }
    const saved = await saveResumeProfile(t, { education: profile?.education ?? [], experience: profile?.experience ?? [], projects: profile?.projects ?? [], achievements: profile?.achievements ?? [], preferences: { ...prefs, resumePlan: plan } });
    setBusy(null);
    if (saved) setProfile(saved);
    setPlanChosen(true);
    void beginBuild();
  }

  // ---- Build: the record has to hold enough, then what it still misses ----
  function buildBody() {
    return { targetRole: chosenRole(), ...(general ? { general: true } : {}), ...(upload ? { existingResume: upload.text } : {}), ...(upload?.parsed ? { existingParsed: upload.parsed } : {}), ...(targeted && jdInput.trim() ? { jobDescription: jdInput.trim() } : {}) };
  }
  async function beginBuild() {
    if (!readyToBuild) { go("start"); return; }
    setError(null);
    const t = await withToken(); if (!t) return;
    if (needsEssentials) { setEssentialsOpen(true); return; }
    await runBuild(t);
  }
  async function saveEssentials(values: Record<string, string>) {
    setBusy("checking"); setError(null);
    const t = await withToken(); if (!t) { setBusy(null); return; }
    const merged: Record<string, unknown> = { ...prefs };
    for (const [key, raw] of Object.entries(values)) {
      const value = raw.trim(); if (!value) continue;
      merged[key] = key === "skills" ? [...profileSkills, ...splitList(value)].filter((item, i, all) => all.findIndex(o => o.toLowerCase() === item.toLowerCase()) === i).join(", ") : value;
    }
    const saved = await saveResumeProfile(t, { education: profile?.education ?? [], experience: profile?.experience ?? [], projects: profile?.projects ?? [], achievements: profile?.achievements ?? [], preferences: merged });
    setBusy(null);
    if (!saved) { setError("Those details didn't save. Give it another try."); return; }
    setProfile(saved); setEssentialsOpen(false);
    await runBuild(t);
  }
  async function runBuild(t: string) {
    setError(null); setBusy("checking");
    if (trackChoice && trackChoice !== savedTrack) {
      const saved = await saveResumeProfile(t, { education: profile?.education ?? [], experience: profile?.experience ?? [], projects: profile?.projects ?? [], achievements: profile?.achievements ?? [], preferences: { ...prefs, track: trackChoice } });
      if (saved) setProfile(saved);
    }
    const body = buildBody();
    const check = await resumeGapCheck(t, body);
    if (!check) { setBusy(null); setError("Something went wrong just then. Give it another try."); return; }
    trackEvent({ family: "decision", event: "resume_target_confirmed", module: "resume", target: body.targetRole || "no particular role", meta: { locked: targeted && roleInput.trim() === lockedRole?.title, gaps: check.missing.length, general, fromUpload: Boolean(upload) } });
    if (check.missing.length > 0) { setBusy(null); setGap(check); setQuestion(0); setAnswers({}); setExtraSkills(""); setAcknowledged(new Set()); go("details"); return; }
    await build(t, body);
  }
  async function build(t: string, body: ReturnType<typeof buildBody>) {
    setBusy("building");
    const generated = await generateResume(t, { ...body, template: exportTemplate(template) });
    setBusy(null);
    if (!generated) { setError("The draft didn't come back this time. Nothing was lost - try again."); return; }
    setResult({ resume: generated.resume, targetRole: generated.targetRole });
    setAts(generated.ats ?? null); setReview(null); setRevisions([]); setExported(false); setPane("document");
    trackEvent({ family: "engagement", event: "resume_generated", module: "resume", target: generated.targetRole, meta: { keywordsUsed: generated.resume.keywordsUsed.length } });
    go("draft");
  }

  // ---- Details: the deviation guard, as the gap dialog has always had it ----
  const known = profileSkills.map(item => item.toLowerCase());
  const isKnown = (skill: string) => { const lower = skill.toLowerCase(); return known.some(k => k.includes(lower) || lower.includes(k)); };
  const typedSkills = splitList(extraSkills);
  const answerText = Object.values(answers).join(" ").toLowerCase();
  const mentioned = (gap?.keywords ?? []).filter(kw => answerText.includes(kw.toLowerCase()) && !isKnown(kw));
  const flagged = [...typedSkills.filter(item => !isKnown(item)), ...mentioned.filter(kw => !typedSkills.some(item => item.toLowerCase() === kw.toLowerCase()))];
  const unconfirmed = flagged.filter(item => !acknowledged.has(item.toLowerCase()));
  async function submitGaps() {
    if (!gap) { const t = await withToken(); if (t) await runBuild(t); return; }
    if (unconfirmed.length > 0) { setError("Tick or clear the flagged skills first."); return; }
    setError(null); setBusy("building");
    const t = await withToken(); if (!t) { setBusy(null); return; }
    const confirmed = flagged.filter(item => acknowledged.has(item.toLowerCase()));
    const filled: Record<string, string> = {};
    for (const [key, value] of Object.entries(answers)) if (value.trim()) filled[key] = value.trim();
    const previous = prefs["resumeExtras"] && typeof prefs["resumeExtras"] === "object" ? (prefs["resumeExtras"] as Record<string, unknown>) : {};
    const mergedSkills = [...profileSkills, ...confirmed.filter(item => !profileSkills.some(k => k.toLowerCase() === item.toLowerCase()))];
    const saved = await saveResumeProfile(t, { education: profile?.education ?? [], experience: profile?.experience ?? [], projects: profile?.projects ?? [], achievements: profile?.achievements ?? [], preferences: { ...prefs, skills: mergedSkills.join(", "), resumeExtras: { ...previous, ...filled } } });
    if (!saved) { setBusy(null); setError("Your answers didn't save. Give it another try."); return; }
    setProfile(saved); setGap(null);
    await build(t, buildBody());
  }

  // ---- Draft: Scribe, and a summary you can change by hand ----
  async function askScribe(instruction?: string) {
    const ask = (instruction ?? request).trim();
    if (!ask || !result) return;
    setBusy("revising"); setError(null);
    const t = await withToken(); if (!t) { setBusy(null); return; }
    const before = result.resume;
    const revised = await refineResume(t, { resume: before, comment: ask, targetRole: result.targetRole, history: revisions.slice(-6).map(r => ({ ask: r.ask, reply: r.reply })) });
    setBusy(null);
    if (!revised) { setError("That revision didn't go through. Your resume is unchanged."); return; }
    const didChange = JSON.stringify(revised.resume) !== JSON.stringify(before);
    setResult({ resume: revised.resume, targetRole: result.targetRole });
    if (revised.ats) setAts(revised.ats);
    if (revised.added.length > 0) void keepClaims(t, revised.added);
    setRevisions(list => [...list, { ask, reply: revised.reply, changed: revised.changed, didChange, added: revised.added, ...(revised.followUp ? { followUp: revised.followUp } : {}), declined: revised.declined, before }]);
    setRequest(""); setReview(null); setExported(false);
    trackEvent({ family: "engagement", event: "resume_revised", module: "resume", target: result.targetRole, meta: { declined: Boolean(revised.declined) } });
  }
  async function keepClaims(t: string, claims: string[]) {
    const previous = Array.isArray(prefs["resumeClaims"]) ? (prefs["resumeClaims"] as string[]) : [];
    const merged = [...previous, ...claims].filter((claim, i, all) => all.findIndex(o => o.toLowerCase() === claim.toLowerCase()) === i);
    const saved = await saveResumeProfile(t, { education: profile?.education ?? [], experience: profile?.experience ?? [], projects: profile?.projects ?? [], achievements: profile?.achievements ?? [], preferences: { ...prefs, resumeClaims: merged.slice(0, 40) } });
    if (saved) setProfile(saved);
  }
  function applySummary() {
    if (!result) return;
    const next = summaryDraft.trim();
    if (!next) { setStatus("Add a summary before applying it."); return; }
    const before = result.resume;
    setResult({ resume: { ...before, summary: next }, targetRole: result.targetRole });
    setRevisions(list => [...list, { ask: "Edited the summary by hand", reply: "Your summary now reads the way you wrote it.", changed: ["summary"], didChange: true, added: [], declined: null, before }]);
    setReview(null); setExported(false); setStatus("Summary updated. Feedback is refreshed the next time you open it.");
  }
  function undoRevision(index: number) {
    const entry = revisions[index]; if (!entry || !result) return;
    setResult({ resume: entry.before, targetRole: result.targetRole });
    setRevisions(list => list.filter((_, i) => i !== index)); setReview(null); setStatus("Last change undone.");
  }

  // ---- Feedback: read back when the stage opens, never while drafting ----
  useEffect(() => {
    if (stage !== "review" || !result || review || busy === "reviewing" || signedOut) return;
    let cancelled = false;
    void (async () => {
      setBusy("reviewing");
      const t = await withToken(); if (!t) { setBusy(null); return; }
      const read = await reviewResume(t, { resume: result.resume, targetRole: result.targetRole, ...(general ? { general: true } : {}), ...(targeted && jdInput.trim() ? { jobDescription: jdInput.trim() } : {}) });
      if (cancelled) return;
      setBusy(null);
      if (!read) { setError("I could not read your resume back just now. Your draft is safe - this is only the feedback on it."); return; }
      setReview(read.review);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, result, review, signedOut]);

  // ---- Export: the file leaves, and the version is kept with its feedback ----
  async function exportResume() {
    if (!result) { askForAccount("your resume", "This is an example. Yours is written from your own record, which is the point at which it needs an account."); return; }
    if (!completeness.ready) return;
    setBusy("exporting"); setError(null);
    const t = await withToken(); if (!t) { setBusy(null); return; }
    if (format === "docx") {
      const blob = await downloadResumeDocx(t, result.resume, exportTemplate(template), result.targetRole);
      if (!blob) { setBusy(null); setError("The Word file didn't come through. Try the download again."); return; }
      const url = URL.createObjectURL(blob); const a = document.createElement("a");
      a.href = url; a.download = `${result.resume.header.name.replace(/\s+/g, "-").toLowerCase() || "resume"}-resume.docx`; a.click(); URL.revokeObjectURL(url);
    } else {
      await new Promise<void>(resolve => { const after = () => { window.removeEventListener("afterprint", after); resolve(); }; window.addEventListener("afterprint", after); window.print(); });
    }
    setBusy(null); setExported(true);
    void keepDownloaded(t, result, review);
  }
  async function keepDownloaded(t: string, taken: { resume: ResumeData; targetRole: string }, read: ResumeReview | null) {
    const raw = Array.isArray(prefs["resumeLedger"]) ? [...(prefs["resumeLedger"] as LedgerEntry[])] : [];
    const index = raw.map(e => e?.role).lastIndexOf(taken.targetRole);
    const entry: LedgerEntry = { ...(index >= 0 ? raw[index] : {}), role: taken.targetRole, at: index >= 0 ? (raw[index]?.at ?? new Date().toISOString()) : new Date().toISOString(), skillsHighlighted: (index >= 0 ? raw[index]?.skillsHighlighted : undefined) ?? taken.resume.skills.flatMap(group => group.items).slice(0, 30), resume: taken.resume, template, downloadedAt: new Date().toISOString(), ...(read ? { review: read } : {}) };
    if (index >= 0) raw[index] = entry; else raw.push(entry);
    const saved = await saveResumeProfile(t, { education: profile?.education ?? [], experience: profile?.experience ?? [], projects: profile?.projects ?? [], achievements: profile?.achievements ?? [], preferences: { ...prefs, resumeLedger: raw.slice(-20) } });
    if (saved) setProfile(saved);
  }
  function openVersion(entry: LedgerEntry) {
    if (!entry.resume) return;
    setResult({ resume: entry.resume, targetRole: entry.role }); setSelectedTemplate(asTemplate(entry.template)); setRevisions([]); setReview(entry.review ?? null); setAts(null); setExported(false);
    go("draft");
  }

  // ---- Which stages can be opened from the bar ----
  function canOpen(id: Stage) {
    if (signedOut) return true;
    if (id === "start" || id === "plan") return true;
    if (id === "details") return Boolean(gap);
    return Boolean(result);
  }
  const exampleBanner = isExample && <div className={s.exampleBanner}><span><b>This is an example.</b> A finished resume and the feedback it was given, so you can see what you get. Yours is written from your own record.</span><button type="button" onClick={() => go("start")}>Build mine <Arrow /></button></div>;
  const building = busy === "building" || busy === "checking";
  const footer: Record<Stage, [string, string, string]> = {
    start: ["Start with what is already yours.", "You can change the look and add more detail later.", planChosen ? (purpose === "improve" ? "Work on my resume" : "Build my resume") : "Continue"],
    plan: [`${chosenPlan.name} · ₹${chosenPlan.price} total`, "30-day pass · one-time payment · no automatic renewal", signedOut ? `Continue with ${chosenPlan.name}` : `Continue with ${chosenPlan.name}`],
    details: ["No pressure to answer everything.", "Skip anything that does not apply to you.", "Use these details and build my draft"],
    draft: ["Happy with the words?", "See the feedback before you export.", "Review my resume"],
    review: ["You choose what to improve.", "Feedback helps you decide; it is not a hiring score.", "Continue to export"],
    export: ["Your resume stays part of your journey.", "Every version is kept with its feedback.", exported ? "Back to my resume" : format === "docx" ? "Download Word file" : "Print or save as PDF"],
  };
  function primaryAction() {
    if (stage === "start") return continueFromStart();
    if (stage === "plan") return void continueWithPlan();
    if (stage === "details") return signedOut ? go("start") : void submitGaps();
    if (stage === "draft") return go("review");
    if (stage === "review") return go("export");
    if (exported) return go("draft");
    return void exportResume();
  }

  return <div className={s.shell}>
    {gate && <SignUpPrompt action={gate} onClose={() => setGate(null)} />}
    {essentialsOpen && <EssentialsModal firstName={text("fullName").split(/\s+/)[0] ?? ""} busy={busy !== null} onClose={() => { if (busy === null) setEssentialsOpen(false); }} onSubmit={values => void saveEssentials(values)} />}
    <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt,.md" className={s.srOnly} aria-label="Choose the resume to improve" onChange={e => { const file = e.target.files?.[0]; e.target.value = ""; if (file) void readExisting(file); }} />
    <div className={s.canvas}><main className={s.main}>
      <div className={s.breadcrumb}><Link href="/resume">← Professional Presence</Link>{ledger.length > 0 && <button type="button" onClick={() => go("export")}>{ledger.length} saved {ledger.length === 1 ? "version" : "versions"} <Arrow /></button>}</div>
      <nav className={s.journeyNav} aria-label="Resume stages">{STAGES.map(item => <button type="button" key={item.id} aria-current={stage === item.id ? "step" : undefined} disabled={!canOpen(item.id)} onClick={() => go(item.id)}>{item.name}</button>)}</nav>
      <header className={s.heading}><div><h1 ref={titleRef} tabIndex={-1}>Resume Studio</h1><p>{HEADINGS[stage][1]}</p></div><span className={s.stageCount}>{STAGES[stageIndex].name} · {stageIndex + 1} of {STAGES.length}</span></header>

      {building ? <section className={`${s.card} ${s.buildState}`}><div className={s.buildGlyph} aria-hidden="true">✦</div><span className={s.smallLabel} style={{ justifyContent: "center", marginTop: 18 }}>{busy === "checking" ? "GETTING YOUR DETAILS TOGETHER" : "WRITING YOUR DRAFT"}</span><h2>Bringing your story together.</h2><p>Your draft is written from your saved record and nothing else.</p><div className={s.buildRows}><span>Read your experience and skills</span><span>Shape the draft for your direction</span><span>Prepare the document for your review</span></div><p className={s.quiet}>This takes a minute or so. Stay on this page.</p></section> : <>

      {stage === "start" && <div className={s.setupGrid}><div className={s.setupLeft}><section className={s.card}><div className={s.sectionHeading}><h2>What are you making?</h2></div>
        <div className={s.purposes} role="group" aria-label="Resume purpose">{([{ id: "role", name: "For a role", copy: "Give it a clear direction", icon: "◎" }, { id: "general", name: "General resume", copy: "Bring your story together", icon: "▤" }, { id: "improve", name: "Improve existing", copy: "Start with your document", icon: "↥" }] as Array<{ id: Purpose; name: string; copy: string; icon: string }>).map(item => <button type="button" key={item.id} aria-pressed={purpose === item.id} onClick={() => choosePurpose(item.id)}><span className={s.purposeIcon}>{item.icon}</span><strong>{item.name}</strong><small>{item.copy}</small></button>)}</div>
        {purpose === "improve" && (upload ? <div className={s.softBox}><strong>Working from {upload.filename}</strong><p>{uploadRead(upload.read)} We keep what you wrote and work on how it reads.</p><button type="button" className={s.undo} onClick={() => setUpload(null)}>Remove</button></div> : <button type="button" className={s.upload} disabled={uploading} onClick={() => fileRef.current?.click()}><strong>{uploading ? "Reading your resume…" : "Choose an existing resume"}</strong><small>PDF or Word. We read it, keep what you wrote, and say what is missing.</small></button>)}
        {purpose !== "general" ? <><label className={s.field}>Target role {purpose === "improve" ? "(optional)" : ""}<input value={roleInput} onChange={e => setRoleInput(e.target.value)} placeholder="e.g. Customer Success Associate" /></label>{lockedRole && roleInput.trim() !== lockedRole.title && <button type="button" className={s.undo} onClick={() => setRoleInput(lockedRole.title)}>Use {lockedRole.title}, from your Discovery</button>}<details className={s.details}><summary>Add a job posting <span>Optional</span></summary><label className={s.field}>Job description<textarea rows={3} value={jdInput} onChange={e => setJdInput(e.target.value)} /></label></details></> : <p className={s.softBox}>Create a reusable introduction to your experience. The feedback will suggest roles worth exploring.</p>}
        <fieldset className={s.track}><legend>Where are you right now?</legend><div className={s.starterTrack}>{([{ id: "student", label: "Still studying" }, { id: "early_career", label: "Working, or have worked" }] as Array<{ id: Track; label: string }>).map(option => <label key={option.id}><input type="radio" name="resume-track" value={option.id} checked={trackChoice === option.id} onChange={() => setTrackChoice(option.id)} />{option.label}</label>)}</div></fieldset>
      </section>
        <section className={s.card}><div className={s.sectionHeading}><h2>Choose a look</h2><span>{hasAdditionalTemplates ? "Switch any time" : "Basic is free to preview"}</span></div><div className={s.templates} role="group" aria-label="Template selection">{TEMPLATES.map(item => {
            const locked = !allowedTemplateIds.includes(item.id);
            return <button type="button" key={item.id} aria-pressed={!locked && template === item.id} aria-label={locked ? `${item.name} · plan-locked template. View plans to unlock` : `Preview ${item.name}`} data-locked={locked} onClick={() => locked ? go("plan") : setTemplate(item.id)}>
              <span className={s.templatePreview}>
                <span className={s.thumb} aria-hidden={locked || undefined} inert={locked || undefined}><MiniPreview id={item.id} resume={previewResume} roleLine={targeted ? roleInput.trim() || "The role you are aiming at" : "Written for whoever reads it"} track={trackChoice ?? undefined} /></span>
                {locked && <span className={s.templateLock}><span aria-hidden="true">▣</span>Plan required<span>View plans →</span></span>}
              </span>
              <strong>{item.name}</strong><small>{locked ? "View plans to unlock" : item.id === "classic" ? "Free to preview" : item.blurb}</small>
            </button>;
          })}</div>
        </section>
      </div><aside className={s.setupAside}>
        <section className={`${s.card} ${s.lookPreview}`}><div className={s.sectionHeading}><h2>Preview · {TEMPLATES.find(item => item.id === template)?.name}</h2><span>{signedOut ? "Illustration, not your information" : "Your details, in this look"}</span></div><div className={`${s.documentFrame} ${s.lookSheet}`}><A4Frame><ResumeSheet resume={previewResume} template={template} roleLine={targeted ? roleInput.trim() || "The role you are aiming at" : "Written for whoever reads it"} track={trackChoice ?? undefined} /></A4Frame></div></section>
        {ledger.length > 0 && <section className={s.card}><div className={s.sectionHeading}><h2>Your saved resumes</h2><span>{ledger.length} {ledger.length === 1 ? "version" : "versions"}</span></div><div className={s.versions}>{ledger.map((entry, i) => <button type="button" key={`${entry.at}-${i}`} onClick={() => openVersion(entry)}><span><strong>{entry.role}</strong><small>{entry.downloadedAt ? `Downloaded ${whenLabel(entry.downloadedAt)}` : `Built ${whenLabel(entry.at)}`}</small></span><span>Open <Arrow /></span></button>)}</div><p className={s.quiet}>Open one to read it, refine it or export it again. Building below makes a new version.</p></section>}
        <section className={s.recordCard}><span className={s.smallLabel}>{signedOut ? "✓ A HEAD START FROM YOUR RECORD" : text("fullName") ? "✓ A HEAD START FROM YOUR RECORD" : "YOUR RECORD"}</span><h2>{signedOut ? "Your saved details come with you" : text("fullName") || "Nothing saved yet"}</h2><p>{signedOut ? "Once you have an account, your experience, education and skills are written in for you." : `${profile?.experience.length ?? 0} experience, ${profile?.education.length ?? 0} education, ${profileSkills.length} skills on your record.`}</p>{!signedOut && <div className={s.facts}><span><b>{profile?.experience.length ?? 0}</b> experience entries</span><span><b>{profile?.education.length ?? 0}</b> education entries</span><span><b>{profileSkills.length}</b> listed skills</span></div>}<small>{signedOut ? "The resume preview is an illustration, not your information." : "Anything missing is asked for when you build, and saved to your profile."}</small></section>

      </aside></div>}

      {stage === "plan" && <><div className={s.shared}><Tick /><span>Basic is free to preview. Starter includes three layouts; Plus and Pro include all six.</span><span>Tax-inclusive prices · no automatic renewal</span></div>
        <div className={s.cards} role="group" aria-label="Select a plan">{PLANS.map(item => <button type="button" key={item.id} className={s.plan} aria-pressed={plan === item.id} onClick={() => setPlan(item.id)}><div className={s.planTop}><span>{item.tag}</span><i>{plan === item.id && <Tick />}</i></div><h2>{item.name}</h2><p>{item.intro}</p><div className={s.price}><strong>₹{item.price}</strong><span>one-time<br />30-day pass</span></div><p className={s.outcome}>{item.outcome}</p><ul>{item.features.map(feature => <li key={feature}><Tick />{feature}</li>)}</ul><div className={s.planBottom}>{plan === item.id ? "Selected" : "Choose this plan"}<Arrow /></div></button>)}</div>
        <p className={s.usageNote}>One AI draft creates a new resume version; one AI improvement is one successful Scribe revision. Manual edits, switching layouts and downloading saved files do not use AI allowances.</p>
        <div className={s.questions}><details><summary>What happens after 30 days?</summary><p>Your AI allowance expires; existing work remains available to view and download.</p></details><details><summary>Can I upgrade?</summary><p>Pay the difference during your current pass. Keep the original expiry and carry existing usage into the higher plan.</p></details><details><summary>Does Pro mean unlimited?</summary><p>It includes the listed career tools with clear allowances, including two 10-minute AI interviews. It does not include unlimited AI or every future feature.</p></details></div></>}

      {stage === "details" && <div className={s.detailsGrid}><aside className={s.questionRail}><span className={s.smallLabel}>✦ OPTIONAL DETAILS</span><h2>You do not need to start again.</h2><p>Your saved experience, education and skills come with you.</p>{gap && <div className={s.questionGroups}>{gap.missing.map((item, index) => <button type="button" key={item.field} aria-pressed={question === index} onClick={() => setQuestion(index)}>{item.question.length > 38 ? `${item.question.slice(0, 38).trimEnd()}…` : item.question}{answers[item.field]?.trim() && <Tick />}</button>)}</div>}<p className={s.quiet}>{signedOut ? "These are example prompts. A live build asks only what your record needs." : `These fill what a ${gap?.targetRole || "resume"} still misses. Skip any that do not apply.`}</p></aside>
        <section className={s.card}>{signedOut || !gap ? <>{exampleBanner}<div className={s.sectionHeading}><span className={s.eyebrow}>EXAMPLE QUESTIONS</span><span>all optional</span></div>{EXAMPLE_QUESTIONS.map(([group, ask, hint]) => <div key={ask}><h2 className={s.questionTitle}>{ask}</h2><p className={s.quiet}>{group} · {hint}</p></div>)}{!signedOut && !gap && <p className={s.softBox}>Your record already covers what this resume needs. Build it from the Start stage.</p>}</> : <>
          <div className={s.sectionHeading}><span className={s.eyebrow}>QUESTION {question + 1} OF {gap.missing.length}</span><span>{Object.values(answers).filter(v => v.trim()).length} answered · all optional</span></div><div className={s.progress}><span style={{ width: `${((question + 1) / gap.missing.length) * 100}%` }} /></div>
          <h2 className={s.questionTitle}>A little detail can make a difference.</h2>
          <label className={s.field}>{gap.missing[question].question}<textarea rows={5} value={answers[gap.missing[question].field] ?? ""} placeholder="Your own words are enough…" onChange={e => setAnswers(a => ({ ...a, [gap.missing[question].field]: e.target.value }))} /></label>
          <div className={s.questionActions}><button type="button" disabled={question === 0} onClick={() => setQuestion(q => Math.max(0, q - 1))}>← Previous</button>{question < gap.missing.length - 1 ? <button type="button" onClick={() => setQuestion(q => q + 1)}>Next or skip <Arrow /></button> : <span className={s.quiet}>Last question. Use the button below when you are ready.</span>}</div>
          <label className={s.field}>Any other skills this resume should show? (optional)<input value={extraSkills} onChange={e => setExtraSkills(e.target.value)} placeholder="Google Sheets, Hindi typing" /></label><p className={s.quiet}>Comma separated. Only claim what you could back up in an interview.</p>
          {flagged.length > 0 && <div className={s.flagged}><strong>Worth a second look</strong>{flagged.map(skill => <label key={skill}><input type="checkbox" checked={acknowledged.has(skill.toLowerCase())} onChange={() => setAcknowledged(prev => { const next = new Set(prev); const key = skill.toLowerCase(); if (next.has(key)) next.delete(key); else next.add(key); return next; })} /><span><b>{skill}</b> is new. Confirm it is true and you could back it up in an interview.</span></label>)}<p>Confirmed skills go on the resume; unticked ones stay off it.</p></div>}
        </>}</section></div>}

      {stage === "draft" && <>{exampleBanner}<div className={s.documentToolbar}><span><i />{isExample ? "Example resume" : revisions.length ? `Your draft · ${revisions.length} ${revisions.length === 1 ? "change" : "changes"}` : "Your draft · ready to review"}</span><label>Layout<select value={template} onChange={e => setTemplate(asTemplate(e.target.value))}>{availableTemplates.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>
        <div className={s.mobileTabs} role="group" aria-label="Workspace view"><button type="button" aria-pressed={pane === "document"} onClick={() => setPane("document")}>Document</button><button type="button" aria-pressed={pane === "edit"} onClick={() => setPane("edit")}>Edit with Scribe</button></div>
        <div className={s.editorGrid} data-pane={pane}><div className={s.document}><div className={`${s.documentFrame} ${s.sheetScroll}`}><A4Frame><ResumeSheet resume={shown.resume} template={template} roleLine={shown.targetRole} track={trackChoice ?? undefined} onPages={setSheetPages} watermark={isExample ? "Example" : "Draft"} /></A4Frame></div><p className={s.pagesNote}>{sheetPages === 1 ? "One A4 page. " : `${sheetPages} A4 pages - ask Scribe to tighten it if you would rather it fit one. `}Check every name, date and claim before sharing.</p></div>
          <aside className={s.editor}><div className={s.editorTabs} role="group" aria-label="Editing mode"><button type="button" aria-pressed={editor === "scribe"} onClick={() => setEditor("scribe")}>✦ Scribe</button><button type="button" aria-pressed={editor === "summary"} onClick={() => { setEditor("summary"); setSummaryDraft(shown.resume.summary); }}>Edit summary</button></div>
            {editor === "scribe" ? <><div className={s.assistantMark}>✦</div><h2>Your words. A little sharper.</h2><p>Tell Scribe what to change in plain words. It says when a change would work against you.</p><div className={s.promptChips}>{SCRIBE_EXAMPLES.slice(0, 3).map(item => <button type="button" key={item} onClick={() => setRequest(item)}>{item} ↗</button>)}</div><label className={s.field}>What would you like to change?<textarea rows={3} value={request} disabled={busy !== null} placeholder="Ask in your own words…" onChange={e => setRequest(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (isExample) askForAccount("Scribe, on your own resume", "Scribe rewrites your own draft from your own record. This one is an example, so there is nothing of yours for it to work on yet."); else void askScribe(); } }} /></label><button type="button" className={s.secondary} disabled={!request.trim() || busy !== null} onClick={() => isExample ? askForAccount("Scribe, on your own resume", "Scribe rewrites your own draft from your own record. This one is an example, so there is nothing of yours for it to work on yet.") : void askScribe()}>{busy === "revising" ? "Rewriting…" : "Ask Scribe"} <Arrow /></button>
              {revisions.length > 0 && <ol className={s.thread}>{revisions.map((rev, i) => <li key={`${rev.ask}-${i}`}><p className={s.ask}>{rev.ask}</p><div className={s.proposal}><span className={s.smallLabel}>SCRIBE</span><p>{rev.reply}</p>{rev.declined && rev.declined !== rev.reply && <p className={s.quiet}><b>Not changed:</b> {rev.declined}</p>}{rev.added.length > 0 && <p className={s.quiet}>Added from what you told me: {rev.added.join("; ")}. Make sure you can stand behind it in the interview.</p>}{rev.followUp && <p><b>{rev.followUp}</b></p>}{rev.didChange && <div><button type="button" onClick={() => undoRevision(i)}>↶ Undo this change</button></div>}</div></li>)}</ol>}
            </> : <><h2>Edit your summary</h2><label className={s.field}>Summary<textarea rows={9} value={summaryDraft} onChange={e => setSummaryDraft(e.target.value)} /></label><button type="button" className={s.secondary} onClick={() => isExample ? askForAccount("your resume", "This is an example. Yours is written from your own record, which is the point at which it needs an account.") : applySummary()}>Apply to draft <Arrow /></button></>}
            <div className={s.tip}><span>✦ KEEP IT TRUE</span><p>New numbers, responsibilities and skills need your confirmation. Nothing goes on the page that your record cannot back.</p></div></aside></div></>}

      {stage === "review" && <div className={s.feedback}>{exampleBanner}{busy === "reviewing" ? <section className={s.card}><span className={s.smallLabel}>READING YOUR RESUME BACK</span><h2 className={s.emptyTitle}>Someone is reading it now, the way a recruiter would.</h2><ReviewProgress /></section> : !shownReview ? <section className={s.emptyNotice}><span className={s.smallLabel}>FEEDBACK</span><h2 className={s.emptyTitle}>Your feedback could not be written just now.</h2><p className={s.quiet}>Your draft is safe. Try again in a moment.</p><div className={s.questionActions}><button type="button" onClick={() => { setError(null); setReview(null); }}>Try again <Arrow /></button></div></section> : <>
        <div className={s.summaryGrid}><section className={s.overview}><span className={s.smallLabel}>HOW YOUR RESUME READS</span><h2>{standingLabel(shownReview.standing.level, shown.targetRole)}</h2><p>{shownReview.standing.why}</p><div className={s.standing} role="img" aria-label={`Resume standing: ${shownReview.standing.level}. Not a readiness score.`}>{(["early", "competitive", "strong"] as const).map((level, i) => <span key={level} data-active={shownReview.standing.level === level}><i /><b>{["Developing", "Competitive", "Strong"][i]}</b></span>)}</div><small>Resume review · not a hiring probability</small></section>
          <section className={s.coverage}>{(() => { const covered = shownReview.coverage.covered.length, total = covered + shownReview.coverage.missing.length, deg = total ? Math.round((covered / total) * 360) : 0; return <div className={s.ring} style={{ background: `conic-gradient(var(--color-teal-700) 0deg ${deg}deg,var(--color-slate-200) ${deg}deg 360deg)` }} role="img" aria-label={`${covered} of ${total} signals shown`}><span><b>{covered}/{total}</b><small>shown</small></span></div>; })()}<div><span className={s.smallLabel}>DOCUMENT COVERAGE</span><h2>{shown.targetRole ? "Words this role looks for" : "Signals in this resume"}</h2><p><i />{shownReview.coverage.covered.length} shown <em />{shownReview.coverage.missing.length} not shown</p><small>Word coverage, not demonstrated ability.</small></div></section>
          <section className={s.readiness}><span className={s.smallLabel}>ROLE READINESS</span><strong>Not assessed</strong><p>A short role assessment shows what you can do.</p><b>{shown.targetRole || "Choose a role in Discovery"}</b><small>A readiness score cannot be read from resume wording.</small></section></div>
        <div className={s.insights}><section className={`${s.card} ${s.working}`}><div className={s.sectionHeading}><h2>✓ Keep these strengths</h2><span>{shownReview.strengths.length} signals</span></div>{shownReview.strengths.map(point => <p key={point}>{point}</p>)}</section>
          <section className={s.card}><div className={s.sectionHeading}><h2>✦ Improve this next</h2><span>{shownReview.gaps.length} priorities</span></div>{shownReview.gaps.map((item, i) => <div className={s.improvement} key={item.what}><span>{i === 0 ? "START HERE" : "THEN CONSIDER"}</span><h3>{item.what}</h3><p>{item.how}</p><button type="button" onClick={() => { setRequest(`${item.what}: ${item.how}`); setEditor("scribe"); setPane("edit"); go("draft"); }}>Improve with Scribe <Arrow /></button></div>)}</section></div>
        {(shownReview.roleIdeas?.length ?? 0) > 0 && <section className={s.roleIdeas}><div className={s.sectionHeading}><div><p className={s.eyebrow}>WHERE YOUR EXPERIENCE COULD FIT</p><h2>You have a story. Give it a direction.</h2></div><span>From what you have done</span></div><div className={s.roleCards}>{shownReview.roleIdeas!.map(idea => <article key={idea.role}><h3>{idea.role}</h3><p>{idea.why}</p><div className={s.roleReadiness}><span>Role readiness</span><b>Not assessed</b></div><Link href="/discover">Explore this role <Arrow /></Link></article>)}</div><small>Directions to explore, not a verdict. A real recommendation comes from what you choose in Discovery.</small></section>}
        <section className={s.nextAction}><span className={s.nextIcon}>✦</span><div><span className={s.smallLabel}>TURN YOUR STORY INTO SOMETHING YOU CAN SHOW</span><h2>{shownReview.nextStep.route === "interview" ? "Practise telling these stories out loud." : shownReview.nextStep.route === "profile" ? "Fill in what the resume is still missing." : `Try the work of a ${shown.targetRole || "role you choose"}.`}</h2><p>{shownReview.nextStep.why}</p></div><Link href={NEXT_STEP_HREF[shownReview.nextStep.route] ?? "/practice"} className={s.primary}>{NEXT_STEP_LABEL[shownReview.nextStep.route] ?? "Prove these skills →"}</Link></section>
        <details className={s.fullReview}><summary>See the evidence and full feedback <span>+</span></summary><h3>What the resume shows</h3><ul>{shownReview.coverage.covered.map(item => <li key={item}>{item}</li>)}</ul><h3>What is not yet shown</h3>{shownReview.coverage.missing.length ? <ul>{shownReview.coverage.missing.map(item => <li key={item}>{item}</li>)}</ul> : <p>Nothing this role looks for is missing from the wording.</p>}{shownAts && <><h3>How screening software read it</h3>{shownAts.readable && shownAts.problems.length === 0 ? <p>Every section, date and number came through.</p> : <ul>{shownAts.problems.map(problem => <li key={problem.what}><b>{problem.what}</b> {problem.why}</li>)}</ul>}</>}{shownReview.fromRules && <p>The model was unavailable, so this read came from the text alone.</p>}</details>
      </>}</div>}

      {stage === "export" && <div className={s.exportGrid}><section className={s.card}>{exampleBanner}{exported ? <><span className={s.successMark}><Tick /></span><p className={s.eyebrow}>EXPORT COMPLETE</p><h2>A version you can come back to.</h2><p>This version and its feedback stay together under saved versions.</p><div className={s.fileCard}><span>▤</span><div><strong>{shown.resume.header.name} — Resume.{format}</strong><small>{TEMPLATES.find(item => item.id === template)?.name} layout · {shown.targetRole || "General resume"}</small></div></div><button type="button" className={s.secondary} onClick={() => setExported(false)}>Export again <Arrow /></button></> : <><span className={s.smallLabel}>YOUR DOCUMENT, READY TO TAKE AWAY</span><h2>How would you like to use it?</h2>
        <div className={s.formats} role="group" aria-label="Export format">{([{ id: "docx", name: "Word document", copy: "Keep editing or upload to an application." }, { id: "pdf", name: "PDF document", copy: "Preserve the layout when sharing or printing." }] as Array<{ id: "docx" | "pdf"; name: string; copy: string }>).map(item => <button type="button" key={item.id} aria-pressed={format === item.id} onClick={() => setFormat(item.id)}><span className={s.fileIcon}>.{item.id.toUpperCase()}</span><span><strong>{item.name}</strong><small>{item.copy}</small></span><span className={s.radioDot}>{format === item.id && <Tick />}</span></button>)}</div>
        <div className={s.softBox}><strong>{shown.resume.header.name}</strong><p>{TEMPLATES.find(item => item.id === template)?.name} layout · {shown.targetRole || "General resume"}</p><small>{isExample ? "Example document. Yours is checked for readability before it leaves." : "Checked the way screening software reads it before it leaves."}{exportTemplate(template) !== template && format === "docx" && ` The Word file uses the ${TEMPLATES.find(item => item.id === exportTemplate(template))?.name} structure; print to PDF keeps this look exactly.`}</small></div>
        {!completeness.ready && <><p className={s.quiet}>This resume is missing {completeness.missing.map(g => g.section.toLowerCase()).join(", ")}. Add {completeness.missing.length === 1 ? "it" : "them"} and the download opens.</p><ul className={s.missingList}>{completeness.missing.map(item => <li key={item.section}><span aria-hidden="true">!</span><span><b>{item.section} is missing</b>{item.fix}</span></li>)}</ul></>}
        {shownAts && !shownAts.readable && <ul className={s.missingList}>{shownAts.problems.map(problem => <li key={problem.what}><span aria-hidden="true">!</span><span><b>{problem.what}</b>{problem.why}</span></li>)}</ul>}
        {shownAts?.readable && completeness.ready && !isExample && <p className={s.okNote}><Tick /><span>We opened your download and read it back the way screening software does. Every section, date and number came through.</span></p>}</>}
      </section><aside className={s.exportAside}><section className={s.nextCard}><span className={s.smallLabel}>✦ A USEFUL NEXT STEP</span><h2>Make sure you can tell the story.</h2><p>Use a role simulation or mock interview to practise explaining your experience.</p><Link href="/practice">Explore role readiness <Arrow /></Link><Link href="/interview">Explore AI interview practice <Arrow /></Link></section>
        <section className={s.nextCard}><span className={s.smallLabel}>SAVED VERSIONS</span><h2>Your versions stay together.</h2>{ledger.length === 0 ? <p>{signedOut ? "Every resume you build is kept here with its feedback, once you have an account." : "Every resume you export is kept here with its feedback."}</p> : <div className={s.versions}>{ledger.map((entry, i) => <button type="button" key={`${entry.at}-${i}`} onClick={() => openVersion(entry)}><span><strong>{entry.role}</strong><small>{entry.downloadedAt ? `Downloaded ${whenLabel(entry.downloadedAt)}` : `Built ${whenLabel(entry.at)}`}</small></span><span>{entry.downloadedAt ? "Downloaded" : "Draft"} <Arrow /></span></button>)}</div>}</section></aside></div>}
      </>}

      {error && <p className={s.error} role="alert">{error}</p>}
      <p className={status ? s.status : s.srOnly} role="status" aria-live="polite">{status}</p>
      {!building && <footer className={s.actionBar}><div><strong>{footer[stage][0]}</strong><small>{footer[stage][1]}</small></div><div>{stageIndex > 0 && <button type="button" className={s.backButton} onClick={() => go(STAGES[Math.max(0, stageIndex - 1)].id)}>Back</button>}<button type="button" className={s.primary} disabled={busy !== null || (stage === "export" && !exported && !completeness.ready)} onClick={primaryAction}>{busy === "exporting" ? "Preparing…" : busy === "saving" ? "One moment…" : footer[stage][2]} <Arrow /></button></div></footer>}
    </main></div>
  </div>;
}
