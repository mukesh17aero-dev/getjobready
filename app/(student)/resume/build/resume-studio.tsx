"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { SignUpPrompt, type GatedAction } from "@/components/auth/signup-gate";
import { FormAlert, type MissingField } from "@/components/ui/form-alert";
import { RequiredMark } from "@/components/ui/required-mark";
import { track as trackEvent } from "@/lib/footprints";
import { whenLabel } from "@/lib/when";
import { SAMPLE_ATS, SAMPLE_CHECKLIST, EXAMPLE_RESUME, SAMPLE_REVIEW } from "@/features/resume";
import { CopyButton } from "@/components/ui/copy-button";
import {
  A4Frame,
  EssentialsModal,
  MiniPreview,
  NEXT_STEP_HREF,
  NEXT_STEP_LABEL,
  ResumeSetup,
  ResumeSheet,
  ReviewProgress,
  SAMPLE_RESUME,
  SCRIBE_EXAMPLES,
  STUDENT_SAMPLE,
  TEMPLATES,
  asTemplate,
  firstStepFor,
  setupGaps,
  splitList,
  standingLabel,
  uploadRead,
  type LedgerEntry,
  type Revision,
  type SetupStep,
} from "@/features/resume";
import {
  downloadResumeDocx,
  exportTemplate,
  generateResume,
  getResumeRecord,
  readResumeUpload,
  refineResume,
  resumeCompleteness,
  resumeChecklistFor,
  resumeGapCheck,
  reviewResume,
  saveResumeDraft,
  saveResumeProfile,
  type AtsCheck,
  type ChecklistItem,
  type GapQuestion,
  type ResumeChecklist,
  type ResumeCareerProfile,
  type ResumeData,
  type ResumeReview,
  type ResumeTarget,
  type ResumeTemplate,
} from "@/features/resume";
import { resumePage } from "@/features/resume";
import { previewTemplate } from "@/features/resume";
import s from "./resume-studio.module.css";

// Resume Studio, as approved in public/previews/ascend-resume-complete.html:
// five stages - start, choose a plan, your draft, feedback, export - on top
// of the same API the builder has always used. There is no questions stage:
// the draft comes first, and what would make it stronger is asked beside it,
// three things at most, each optional. Nothing here writes,
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

// No plan stage while payments are off: a plan chosen without paying unlocked
// layouts for nothing. It returns when checkout is real.
type Stage = "start" | "draft" | "review" | "export";
const STAGES: Array<{ id: Stage; name: string }> = [
  { id: "start", name: "Your details" },
  { id: "draft", name: "Your draft" },
  { id: "review", name: "Feedback" },
  { id: "export", name: "Download" },
];
// Build from nothing, or improve a resume they already have.
type Purpose = "general" | "improve";
type Track = "student" | "early_career";
const EXAMPLE_ROLE = "Customer Success Associate";
// What the example draft would be asked beside it - the same shape a live
// build gets, so a visitor sees the ask is small and optional.
const EXAMPLE_PROMPTS: GapQuestion[] = [
  { field: "placement_outcome", question: "What came of the placement drive - how many offers, or did it run without a hitch?", about: "the placement cell entry" },
  { field: "pos_system", question: "Which billing or point-of-sale system did you use at the store?", about: "the store job" },
];
const HEADINGS: Record<Stage, [string, string]> = {
  start: ["Your details", "A resume can only say what is true about you. Start with what you have done."],
  draft: ["Your draft", "Read the draft, check the facts and refine the words."],
  review: ["Feedback", "See the key signals, improve one thing and choose a useful next step."],
  export: ["Download", "Choose a format for the way you plan to use it."],
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
    return raw.filter((e): e is LedgerEntry => typeof e === "object" && e !== null && typeof (e as { role?: unknown }).role === "string").slice().reverse();
  }, [profile]);
  const [savedPage, setSavedPage] = useState(0);
  const savedVersions = resumePage(ledger, savedPage);
  const opened = recordAt ? ledger.find(entry => entry.at === recordAt && entry.resume) : undefined;
  const lockedRole = target?.role ?? null;
  const savedTrack: Track | null = prefs["track"] === "student" || prefs["track"] === "early_career" ? (prefs["track"] as Track) : null;
  const profileSkills = useMemo(() => splitList(prefs["skills"]), [prefs]);

  const [stage, setStage] = useState<Stage>(opened ? "draft" : "start");
  const [purpose, setPurpose] = useState<Purpose>("general");
  const [roleInput, setRoleInput] = useState(lockedRole?.title ?? "");
  const [jdInput, setJdInput] = useState("");
  const [trackChoice, setTrackChoice] = useState<Track | null>(savedTrack);
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate>(asTemplate(opened?.template));
  const allowedTemplateIds = TEMPLATES.map(item => item.id);
  const template = previewTemplate(selectedTemplate, allowedTemplateIds);
  const availableTemplates = TEMPLATES;
  const setTemplate = (next: ResumeTemplate) => setSelectedTemplate(next);
  // Which setup step is open; the first one still missing something.
  const gaps = setupGaps(profile);
  const [setupStep, setSetupStep] = useState<SetupStep | null>(() => signedOut ? null : firstStepFor(setupGaps(initialProfile)));
  const [upload, setUpload] = useState<{ filename: string; text: string; read: { experience: number; education: number; skills: number }; parsed: Record<string, unknown> | null } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState<null | "checking" | "building" | "reviewing" | "revising" | "exporting" | "saving">(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  // What would make the draft stronger: three questions at most, asked
  // beside the draft after it exists, each optional. Answers go in through
  // Scribe, so the grounding guard and the claims record apply to them.
  const [prompts, setPrompts] = useState<GapQuestion[] | null>(null);
  const [promptAnswers, setPromptAnswers] = useState<Record<string, string>>({});
  const [askingPrompts, setAskingPrompts] = useState(false);
  // A check being worked on, and what the person typed for the ones only they
  // can answer. A check a rewrite cannot close is handed to them, never left
  // as a sentence with nothing to press.
  const [fixing, setFixing] = useState<string | null>(null);
  const [checkAnswers, setCheckAnswers] = useState<Record<string, string>>({});
  const [essentialsOpen, setEssentialsOpen] = useState(false);
  const [result, setResult] = useState<{ resume: ResumeData; targetRole: string } | null>(opened?.resume ? { resume: opened.resume, targetRole: opened.role } : null);
  const [ats, setAts] = useState<AtsCheck | null>(null);
  // What a screener and a recruiter will see, counted by the backend from
  // the draft itself. Refreshed with every build, rewrite and review.
  const [checklist, setChecklist] = useState<ResumeChecklist | null>(null);
  const [review, setReview] = useState<ResumeReview | null>(opened?.review ?? null);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [request, setRequest] = useState("");
  // One panel at a time in the column beside the draft: Scribe, what would
  // make it stronger, the checks, or the summary by hand. Stacked, they ran
  // past the bottom of the page and the checks were never seen.
  const [editor, setEditor] = useState<"scribe" | "strengthen" | "checks" | "summary">("scribe");
  const [summaryDraft, setSummaryDraft] = useState("");
  const [pane, setPane] = useState<"document" | "edit">("document");
  const [format, setFormat] = useState<"docx" | "pdf">("docx");
  const [exported, setExported] = useState(false);
  const [sheetPages, setSheetPages] = useState(1);
  const [gate, setGate] = useState<GatedAction | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // A role is optional on both doors: named, the draft is shaped for it.
  const targeted = Boolean(roleInput.trim());
  const general = !targeted;
  const chosenRole = () => (targeted ? roleInput.trim() : "");
  // Building from nothing needs the record filled first; improving needs the file.
  const detailsReady = purpose === "improve" ? upload !== null : gaps.length === 0;
  const readyToBuild = Boolean(trackChoice) && detailsReady;
  // What the person still has to answer on the start stage, so the alert at
  // the top can send them straight to it instead of describing it.
  const missingNow: MissingField[] = stage !== "start" ? [] : [
    ...(purpose === "general" ? gaps.map(gap => ({ id: "resume-setup", label: gap.label })) : []),
    ...(!trackChoice ? [{ id: "resume-track", label: "Where are you right now?" }] : []),
    ...(purpose === "improve" && upload === null ? [{ id: "resume-upload", label: "The resume to improve" }] : []),
  ];
  const wrongTrack = Boolean(error) && !trackChoice;
  // Improving an upload still needs a name for the header; building from
  // nothing asks for it in the first setup step.
  const needsEssentials = purpose === "improve" && !text("fullName");
  const isExample = !result;
  const shown = result ?? { resume: EXAMPLE_RESUME, targetRole: EXAMPLE_ROLE };
  const shownReview = result ? review : SAMPLE_REVIEW;
  const shownAts = result ? ats : SAMPLE_ATS;
  const shownChecklist = result ? checklist : SAMPLE_CHECKLIST;
  const shownPrompts = result ? prompts : EXAMPLE_PROMPTS;
  const checklistFixes = (shownChecklist?.items ?? []).filter(item => item.status === "fix" && item.fix).map(item => item.fix!);
  const completeness = result ? resumeCompleteness(result.resume) : { ready: true, missing: [] };
  const previewResume = useMemo<ResumeData>(() => {
    const sample = trackChoice === "student" ? STUDENT_SAMPLE : SAMPLE_RESUME;
    const name = text("fullName"), city = text("city");
    return { ...sample, header: { name: name || sample.header.name, city: city || sample.header.city, email: name ? "" : sample.header.email } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, trackChoice]);
  const stageIndex = STAGES.findIndex(item => item.id === stage);

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

  // ---- Start ----
  function choosePurpose(next: Purpose) {
    setPurpose(next); setError(null);
    if (next !== "improve") setUpload(null);
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
    if (signedOut) { void withToken(); return; }
    if (!readyToBuild) {
      if (purpose === "general" && gaps.length > 0) { setSetupStep(firstStepFor(gaps)); setError("A few details are still needed before your resume can be written."); return; }
      setError(!trackChoice ? "Tell us where you are right now first." : "Choose the resume to improve first.");
      return;
    }
    setError(null);
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
    trackEvent({ family: "decision", event: "resume_target_confirmed", module: "resume", target: body.targetRole || "no particular role", meta: { locked: targeted && roleInput.trim() === lockedRole?.title, general, fromUpload: Boolean(upload) } });
    await build(t, body);
  }
  async function build(t: string, body: ReturnType<typeof buildBody>) {
    setBusy("building");
    const generated = await generateResume(t, { ...body, template: exportTemplate(template) });
    setBusy(null);
    if (!generated.ok) {
      // The server refuses an incomplete record by name; open the step that fills it.
      if (generated.missing?.length) { setPurpose("general"); setSetupStep(firstStepFor(generated.missing)); go("start"); }
      setError(generated.reason);
      return;
    }
    // The server wrote this draft into the record; read it back so later saves start from it.
    void getResumeRecord(t).then(record => { if (record?.profile) setProfile(record.profile); });
    lastSaved.current = generated.resume;
    setResult({ resume: generated.resume, targetRole: generated.targetRole });
    setAts(generated.ats ?? null); setChecklist(generated.checklist ?? null); setReview(null); setRevisions([]); setExported(false); setPane("document");
    trackEvent({ family: "engagement", event: "resume_generated", module: "resume", target: generated.targetRole, meta: { keywordsUsed: generated.resume.keywordsUsed.length } });
    setPrompts(null); setPromptAnswers({});
    go("draft");
  }
  // An answer goes in through Scribe: the same grounding guard, the same
  // record of what they claimed, and the line changes in front of them.
  async function answerPrompt(item: GapQuestion) {
    const answer = (promptAnswers[item.field] ?? "").trim();
    if (!answer) return;
    setPrompts(list => (list ?? []).filter(p => p.field !== item.field));
    setEditor("scribe");
    await askScribe(`Answering your question "${item.question}"${item.about ? ` about ${item.about}` : ""}: ${answer}. Put it into the resume where it belongs, exactly as strong as I said it.`);
  }
  function skipPrompt(field: string) { setPrompts(list => (list ?? []).filter(p => p.field !== field)); }

  // ---- Draft: Scribe, and a summary you can change by hand ----
  async function askScribe(instruction?: string) {
    const ask = (instruction ?? request).trim();
    if (!ask || !result) return;
    setBusy("revising"); setError(null);
    const t = await withToken(); if (!t) { setBusy(null); return; }
    const before = result.resume;
    const revised = await refineResume(t, { resume: before, comment: ask, targetRole: result.targetRole, ...(general ? { general: true } : {}), ...(targeted && jdInput.trim() ? { jobDescription: jdInput.trim() } : {}), history: revisions.slice(-6).map(r => ({ ask: r.ask, reply: r.reply })) });
    setBusy(null);
    if (!revised) { setError("That revision didn't go through. Your resume is unchanged."); return; }
    const didChange = JSON.stringify(revised.resume) !== JSON.stringify(before);
    setResult({ resume: revised.resume, targetRole: result.targetRole });
    if (revised.ats) setAts(revised.ats);
    if (revised.checklist) setChecklist(revised.checklist);
    setRevisions(list => [...list, { ask, reply: revised.reply, changed: revised.changed, didChange, added: revised.added, ...(revised.followUp ? { followUp: revised.followUp } : {}), ...(revised.offer ? { offer: revised.offer } : {}), declined: revised.declined, before }]);
    setRequest(""); setReview(null); setExported(false);
    trackEvent({ family: "engagement", event: "resume_revised", module: "resume", target: result.targetRole, meta: { declined: Boolean(revised.declined) } });
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

  // ---- The draft stage fetches what it is missing ----
  //
  // Both of these used to be filled in only by the reply to a build, so a
  // reload, or a version opened from the shelf, left the two panels empty
  // until the Feedback stage happened to fill them.
  useEffect(() => {
    if (stage !== "draft" || !result || checklist || signedOut) return;
    let cancelled = false;
    void (async () => {
      const t = await token();
      if (!t || cancelled) return;
      const read = await resumeChecklistFor(t, { resume: result.resume, targetRole: result.targetRole, ...(general ? { general: true } : {}), ...(targeted && jdInput.trim() ? { jobDescription: jdInput.trim() } : {}) });
      if (!cancelled && read) setChecklist(read.checklist);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, result, checklist, signedOut]);

  // Which draft the questions were asked about, so the effect fires once per
  // resume rather than once per render while the state is still settling.
  const askedAbout = useRef<ResumeData | null>(null);
  useEffect(() => {
    if (stage !== "draft" || !result || prompts !== null || signedOut) return;
    if (askedAbout.current === result.resume) return;
    askedAbout.current = result.resume;
    let cancelled = false;
    void (async () => {
      const t = await token();
      if (!t || cancelled) return;
      setAskingPrompts(true);
      const check = await resumeGapCheck(t, { resume: result.resume, targetRole: result.targetRole, ...(general ? { general: true } : {}), ...(targeted && jdInput.trim() ? { jobDescription: jdInput.trim() } : {}) });
      if (cancelled) return;
      setAskingPrompts(false);
      setPrompts(check && !check.ready ? check.missing.slice(0, 3) : []);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, result, prompts, signedOut]);

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
      if (read.checklist) setChecklist(read.checklist);
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
    // Saved on the server against the current record, then read back for the shelf.
    const kept = await saveResumeDraft(t, { resume: result.resume, targetRole: result.targetRole, template: exportTemplate(template), downloaded: true, ...(review ? { review } : {}) });
    if (kept) { const record = await getResumeRecord(t); if (record?.profile) setProfile(record.profile); }
  }

  // ---- Autosave: the draft is saved a moment after every change ----
  const lastSaved = useRef<ResumeData | null>(opened?.resume ?? null);
  useEffect(() => {
    if (signedOut || !result || result.resume === lastSaved.current) return;
    const id = setTimeout(() => {
      void (async () => {
        const t = await token();
        if (!t) return;
        const saved = await saveResumeDraft(t, { resume: result.resume, targetRole: result.targetRole, template: exportTemplate(template) });
        if (saved) { lastSaved.current = result.resume; setStatus("Draft saved."); }
      })();
    }, 1500);
    return () => clearTimeout(id);
  }, [result, template, signedOut]);
  function openVersion(entry: LedgerEntry) {
    if (!entry.resume) return;
    setResult({ resume: entry.resume, targetRole: entry.role }); setSelectedTemplate(asTemplate(entry.template)); setRevisions([]); setReview(entry.review ?? null); setAts(null); setChecklist(null); setExported(false);
    go("draft");
  }

  // ---- Which stages can be opened from the bar ----
  function canOpen(id: Stage) {
    if (signedOut) return true;
    if (id === "start") return true;
    return Boolean(result);
  }
  const needsAccountForScribe = () => askForAccount("Scribe, on your own resume", "Scribe rewrites your own draft from your own record. This one is an example, so there is nothing of yours for it to work on yet.");
  async function fixOne(item: ChecklistItem) {
    if (isExample) { needsAccountForScribe(); return; }
    if (!item.fix) return;
    setFixing(item.id); setEditor("scribe"); setPane("edit");
    await askScribe(item.fix);
    setFixing(null);
  }
  // Their own fact, handed to the writer as their claim - the same guard and
  // the same record of what they said as any other instruction.
  async function answerCheck(item: ChecklistItem) {
    const answer = (checkAnswers[item.id] ?? "").trim();
    if (!answer || !item.ask) return;
    if (isExample) { needsAccountForScribe(); return; }
    setFixing(item.id); setEditor("scribe"); setPane("edit");
    await askScribe(`Answering "${item.ask}": ${answer}. Put it into the resume where it belongs, exactly as strong as I said it.`);
    setFixing(null);
    setCheckAnswers(a => ({ ...a, [item.id]: "" }));
  }
  function fixAll() {
    if (isExample) { askForAccount("Scribe, on your own resume", "Scribe rewrites your own draft from your own record. This one is an example, so there is nothing of yours for it to work on yet."); return; }
    if (checklistFixes.length === 0) return;
    const instruction = checklistFixes.length === 1 ? checklistFixes[0]! : `Make these changes, adding no fact I have not given you: ${checklistFixes.map((fix, i) => `(${i + 1}) ${fix}`).join(" ")}`;
    setEditor("scribe"); setPane("edit"); go("draft");
    void askScribe(instruction);
  }
  const checkPanel = shownChecklist && <section className={s.checkPanel} aria-label="What a screener and a recruiter will see">
    <div className={s.checkHead}><div><span className={s.smallLabel}>WHAT A SCREENER AND A RECRUITER SEE</span><h2>{shownChecklist.passed === shownChecklist.counted ? "Every check passes." : `${shownChecklist.passed} of ${shownChecklist.counted} checks pass.`}</h2></div><span className={s.checkRing} data-all={shownChecklist.passed === shownChecklist.counted} role="img" aria-label={`${shownChecklist.passed} of ${shownChecklist.counted} checks pass`}><b>{shownChecklist.passed}</b><small>/{shownChecklist.counted}</small></span></div>
    <p className={s.quiet}>Counted from the words on the page: what screening software matches on, and what a recruiter catches in a six-second scan. Not a hiring score.</p>
    {/* What is missing comes first, together. Interleaved with the passes
        it read as a jumble, and the thing to do next was buried. */}
    {(() => {
      const row = (item: ChecklistItem) => <li key={item.id} data-status={item.status}><span aria-hidden="true">{item.status === "pass" ? "✓" : item.status === "fix" ? "!" : "·"}</span><div><strong>{item.label}</strong><p>{item.detail}</p>
        {item.ask && <div className={s.checkAsk}><label htmlFor={`check-${item.id}`}>{item.ask}</label><div><input id={`check-${item.id}`} value={checkAnswers[item.id] ?? ""} disabled={busy !== null} placeholder="Only what is true" onChange={e => setCheckAnswers(a => ({ ...a, [item.id]: e.target.value }))} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); void answerCheck(item); } }} /><button type="button" disabled={busy !== null || !(checkAnswers[item.id] ?? "").trim()} onClick={() => void answerCheck(item)}>{fixing === item.id ? "Adding…" : "Add"}</button></div></div>}
        {(item.fix || item.link) && <div className={s.checkRowActions}>{item.fix && <button type="button" disabled={busy !== null} onClick={() => void fixOne(item)}>{fixing === item.id ? "Asking Scribe…" : "Fix with Scribe"} <Arrow /></button>}{item.link && <Link href={item.link.href} className={s.checkLink}>{item.link.label} <Arrow /></Link>}</div>}
      </div></li>;
      const open = shownChecklist.items.filter(item => item.status !== "pass");
      const done = shownChecklist.items.filter(item => item.status === "pass");
      return <>
        {open.length > 0 && <><p className={`${s.smallLabel} ${s.checkGroup}`}>WORTH FIXING · {open.length}</p><ul className={s.checkList}>{open.map(row)}</ul></>}
        {done.length > 0 && <><p className={`${s.smallLabel} ${s.checkGroup}`}>ALREADY PASSING · {done.length}</p><ul className={s.checkList}>{done.map(row)}</ul></>}
      </>;
    })()}
    {checklistFixes.length > 0 && <div className={s.checkActions}><button type="button" className={s.secondary} disabled={busy !== null} onClick={fixAll}>{busy === "revising" ? "Asking Scribe…" : `Fix ${checklistFixes.length === 1 ? "this" : `these ${checklistFixes.length}`} with Scribe`} <Arrow /></button><small>Only the items a rewrite can close. The rest need a fact from you - a number, a phone, a date.</small></div>}
  </section>;
  const exampleBanner = isExample && <div className={s.exampleBanner}><span><b>This is an example.</b> A finished resume and the feedback it was given, so you can see what you get. Yours is written from your own record.</span><button type="button" onClick={() => go("start")}>Build mine <Arrow /></button></div>;
  const building = busy === "building" || busy === "checking";
  const footer: Record<Stage, [string, string, string]> = {
    start: purpose === "improve"
      ? ["Start from the resume you have.", "We keep what you wrote and work on how it reads.", "Work on my resume"]
      : gaps.length > 0 && !signedOut
        ? [`${gaps.length} ${gaps.length === 1 ? "detail" : "details"} to go.`, gaps.map(gap => gap.label).join(" · "), "Build my resume"]
        : ["Everything is in.", "You can change the look and add more detail later.", "Build my resume"],
    draft: ["Happy with the words?", "See the feedback before you export.", "Review my resume"],
    review: ["You choose what to improve.", "Feedback helps you decide; it is not a hiring score.", "Continue to export"],
    export: ["Your resume stays part of your journey.", "Every version is kept with its feedback.", exported ? "Back to my resume" : format === "docx" ? "Download Word file" : "Print or save as PDF"],
  };
  function primaryAction() {
    if (stage === "start") return continueFromStart();
    if (stage === "draft") {
      if (!completeness.ready) { setError(`Before feedback, the draft needs: ${completeness.missing.map(g => g.section.toLowerCase()).join(", ")}. Ask Scribe or add it to your details.`); return; }
      return go("review");
    }
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

      <FormAlert message={error} missing={missingNow} className="mb-4" />

      {building ? <section className={`${s.card} ${s.buildState}`}><div className={s.buildGlyph} aria-hidden="true">✦</div><span className={s.smallLabel} style={{ justifyContent: "center", marginTop: 18 }}>{busy === "checking" ? "GETTING YOUR DETAILS TOGETHER" : "WRITING YOUR DRAFT"}</span><h2>Bringing your story together.</h2><p>Your draft is written from your saved record and nothing else.</p><div className={s.buildRows}><span>Read your experience and skills</span><span>Shape the draft for your direction</span><span>Prepare the document for your review</span></div><p className={s.quiet}>This takes a minute or so. Stay on this page.</p></section> : <>

      {stage === "start" && <div className={s.setupGrid}><div className={s.setupLeft}><section className={s.card}><div className={s.sectionHeading}><h2>Do you have a resume already?</h2></div>
        <div className={s.purposes} role="group" aria-label="Do you have a resume already?">{([{ id: "general", name: "No - build it with me", copy: "Step by step, from what you have done", icon: "✦" }, { id: "improve", name: "Yes - improve mine", copy: "Upload it and we work on how it reads", icon: "↥" }] as Array<{ id: Purpose; name: string; copy: string; icon: string }>).map(item => <button type="button" key={item.id} aria-pressed={purpose === item.id} onClick={() => choosePurpose(item.id)}><span className={s.purposeIcon}>{item.icon}</span><strong>{item.name}</strong><small>{item.copy}</small></button>)}</div>
        {purpose === "improve" && (upload ? <div className={s.softBox}><strong>Working from {upload.filename}</strong><p>{uploadRead(upload.read)} We keep what you wrote and work on how it reads.</p><button type="button" className={s.undo} onClick={() => setUpload(null)}>Remove</button></div> : <button type="button" className={s.upload} disabled={uploading} onClick={() => fileRef.current?.click()}><strong>{uploading ? "Reading your resume…" : "Choose an existing resume"}</strong><small>PDF or Word. We read it, keep what you wrote, and say what is missing.</small></button>)}
        <label className={s.field} htmlFor="resume-role">Aiming at a role? (optional)<input id="resume-role" value={roleInput} onChange={e => setRoleInput(e.target.value)} placeholder="e.g. Customer Success Associate - leave blank for a general resume" /></label>{lockedRole && roleInput.trim() !== lockedRole.title && <button type="button" className={s.undo} onClick={() => setRoleInput(lockedRole.title)}>Use {lockedRole.title}, from your Discovery</button>}{targeted && <details className={s.details}><summary>Add a job posting <span>Optional</span></summary><label className={s.field}>Job description<textarea rows={3} value={jdInput} onChange={e => setJdInput(e.target.value)} /></label></details>}
        <fieldset className={s.track} id="resume-track" tabIndex={-1} aria-invalid={wrongTrack || undefined} data-invalid={wrongTrack || undefined}><legend>Where are you right now?<RequiredMark /></legend><div className={s.starterTrack}>{([{ id: "student", label: "Still studying" }, { id: "early_career", label: "Working, or have worked" }] as Array<{ id: Track; label: string }>).map(option => <label key={option.id}><input type="radio" name="resume-track" value={option.id} checked={trackChoice === option.id} onChange={() => { setTrackChoice(option.id); setError(null); }} />{option.label}</label>)}</div></fieldset>
      </section>
        {purpose === "general" && !signedOut && <div id="resume-setup" tabIndex={-1}><ResumeSetup profile={profile} suggestions={target?.keywords ?? []} token={token} onSaved={setProfile} step={setupStep} onStep={setSetupStep} /></div>}
        <section className={s.card}><div className={s.sectionHeading}><h2>Choose a look</h2><span>Switch any time</span></div><div className={s.templates} role="group" aria-label="Template selection">{TEMPLATES.map(item => <button type="button" key={item.id} aria-pressed={template === item.id} aria-label={`Preview ${item.name}`} onClick={() => setTemplate(item.id)}>
              <span className={s.templatePreview}><span className={s.thumb}><MiniPreview id={item.id} resume={previewResume} roleLine={targeted ? roleInput.trim() : "Written for whoever reads it"} track={trackChoice ?? undefined} /></span></span>
              <strong>{item.name}</strong><small>{item.blurb}</small>
            </button>)}</div>
        </section>
      </div><aside className={s.setupAside}>
        {ledger.length > 0 && <section className={s.card}><div className={s.sectionHeading}><h2>Your saved resumes</h2><span>{ledger.length} {ledger.length === 1 ? "version" : "versions"}</span></div><div className={`${s.versions} ${s.pagedVersions}`}>{savedVersions.entries.map((entry, i) => <button type="button" key={`${entry.at}-${savedVersions.start + i}`} onClick={() => openVersion(entry)}><span><strong>{entry.role}</strong><small>{entry.downloadedAt ? `Downloaded ${whenLabel(entry.downloadedAt)}` : `Built ${whenLabel(entry.at)}`}</small></span><span>Open <Arrow /></span></button>)}</div>{savedVersions.pages > 1 && <nav className={s.savedPagination} aria-label="Saved resume pages"><button type="button" disabled={savedVersions.page === 0} onClick={() => setSavedPage(savedVersions.page - 1)}>Previous</button><span aria-live="polite" aria-atomic="true">Page {savedVersions.page + 1} of {savedVersions.pages}<small>{savedVersions.start + 1}–{savedVersions.start + savedVersions.entries.length} of {ledger.length} resumes</small></span><button type="button" disabled={savedVersions.page === savedVersions.pages - 1} onClick={() => setSavedPage(savedVersions.page + 1)}>Next</button></nav>}<p className={s.quiet}>Open one to read it, refine it or export it again. Building below makes a new version.</p></section>}
        <section className={`${s.card} ${s.lookPreview}`}><div className={s.sectionHeading}><h2>Preview · {TEMPLATES.find(item => item.id === template)?.name}</h2><span>{signedOut ? "Illustration, not your information" : "Your details, in this look"}</span></div><div className={`${s.documentFrame} ${s.lookSheet}`}><A4Frame><ResumeSheet resume={previewResume} template={template} roleLine={targeted ? roleInput.trim() || "The role you are aiming at" : "Written for whoever reads it"} track={trackChoice ?? undefined} /></A4Frame></div></section>
        <section className={s.recordCard}><span className={s.smallLabel}>{signedOut ? "✓ A HEAD START FROM YOUR RECORD" : text("fullName") ? "✓ A HEAD START FROM YOUR RECORD" : "YOUR RECORD"}</span><h2>{signedOut ? "Your saved details come with you" : text("fullName") || "Nothing saved yet"}</h2><p>{signedOut ? "Once you have an account, your experience, education and skills are written in for you." : `${profile?.experience.length ?? 0} experience, ${profile?.education.length ?? 0} education, ${profileSkills.length} skills on your record.`}</p>{!signedOut && <div className={s.facts}><span><b>{profile?.experience.length ?? 0}</b> experience entries</span><span><b>{profile?.education.length ?? 0}</b> education entries</span><span><b>{profileSkills.length}</b> listed skills</span></div>}<small>{signedOut ? "The resume preview is an illustration, not your information." : "Everything you add here is saved to your profile."}</small>{!signedOut && <Link href="/profile" className={s.checkLink}>Open my profile <Arrow /></Link>}</section>

      </aside></div>}

      {stage === "draft" && <>{exampleBanner}<div className={s.documentToolbar}><span><i />{isExample ? "Example resume" : revisions.length ? `Your draft · ${revisions.length} ${revisions.length === 1 ? "change" : "changes"}` : "Your draft · ready to review"}</span><label>Layout<select value={template} onChange={e => setTemplate(asTemplate(e.target.value))}>{availableTemplates.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>
        <div className={s.mobileTabs} role="group" aria-label="Workspace view"><button type="button" aria-pressed={pane === "document"} onClick={() => setPane("document")}>Document</button><button type="button" aria-pressed={pane === "edit"} onClick={() => setPane("edit")}>Edit with Scribe</button></div>
        <div className={s.editorGrid} data-pane={pane}><div className={s.document}><div className={`${s.documentFrame} ${s.sheetScroll}`}><A4Frame><ResumeSheet resume={shown.resume} template={template} roleLine={shown.targetRole} track={trackChoice ?? undefined} onPages={setSheetPages} watermark={isExample ? "Example" : "Draft"} /></A4Frame></div><p className={s.pagesNote}>{sheetPages === 1 ? "One A4 page. " : `${sheetPages} A4 pages - ask Scribe to tighten it if you would rather it fit one. `}Check every name, date and claim before sharing.</p></div>
          <aside className={s.editor}><div className={`${s.editorTabs} ${s.editorTabsTrio}`} role="group" aria-label="What to work on"><button type="button" aria-pressed={editor === "scribe" || editor === "summary"} onClick={() => setEditor("scribe")}>✦ Change the words</button><button type="button" aria-pressed={editor === "strengthen"} onClick={() => setEditor("strengthen")}>Add details{(shownPrompts?.length ?? 0) > 0 && <i>{shownPrompts!.length}</i>}</button><button type="button" aria-pressed={editor === "checks"} onClick={() => setEditor("checks")}>Recruiter checks{shownChecklist && <i data-all={shownChecklist.passed === shownChecklist.counted}>{shownChecklist.passed}/{shownChecklist.counted}</i>}</button></div>
            {editor === "strengthen" ? <section className={s.strengthen} aria-label="What would make this stronger"><span className={s.smallLabel}>✦ MAKE IT STRONGER</span>{askingPrompts ? <p className={s.quiet}>Reading your draft for anything a real detail would improve…</p> : (shownPrompts?.length ?? 0) === 0 ? <><h2>Nothing more to ask.</h2><p className={s.quiet}>{shownPrompts === null ? "Build a draft and anything a real detail would improve appears here." : "Your record already gives this resume what it needs. Anything else you want on the page, tell Scribe."}</p></> : <><h2>{shownPrompts!.length === 1 ? "One thing" : `${shownPrompts!.length} things`} a real detail would improve.</h2><p className={s.quiet}>All optional. Skip any, and the line stays as it is. Nothing is added that you do not say.</p><ol>{shownPrompts!.map(item => <li key={item.field}><p><strong>{item.question}</strong>{item.about && <small>Goes into {item.about}</small>}</p><div><input value={promptAnswers[item.field] ?? ""} disabled={busy !== null} placeholder="A number, a date, a tool - only what is true" aria-label={item.question} onChange={e => setPromptAnswers(a => ({ ...a, [item.field]: e.target.value }))} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (isExample) askForAccount("your resume", "This is an example. Yours is written from your own record, which is the point at which it needs an account."); else void answerPrompt(item); } }} /><button type="button" disabled={busy !== null || !(promptAnswers[item.field] ?? "").trim()} onClick={() => isExample ? askForAccount("your resume", "This is an example. Yours is written from your own record, which is the point at which it needs an account.") : void answerPrompt(item)}>Add</button><button type="button" disabled={busy !== null} onClick={() => isExample ? askForAccount("your resume", "This is an example. Yours is written from your own record, which is the point at which it needs an account.") : skipPrompt(item.field)}>Skip</button></div></li>)}</ol></>}</section>
            : editor === "checks" ? (checkPanel || <><h2>No checks yet.</h2><p className={s.quiet}>Build a draft and what a screener and a recruiter will see is counted here.</p></>)
            : editor === "scribe" ? <><div className={s.scribeHead}><span className={s.assistantMark} aria-hidden="true">✦</span><div><h2>Scribe</h2><p>Tell it what to change, in your own words. It says when a change would work against you.</p></div></div>
              {/* Suggestions, plainly labelled and shaped as pills: inside the
                  box they read as part of the input, and bordered boxes above
                  it read as more fields to fill. */}
              <div className={s.suggested}>
                <p className={s.smallLabel}>SUGGESTED PROMPTS · TAP TO USE ONE</p>
                <div>{SCRIBE_EXAMPLES.slice(0, 3).map(item => <button type="button" key={item} disabled={busy !== null} onClick={() => setRequest(item)}><span aria-hidden="true">+</span>{item}</button>)}</div>
              </div>
              <label className={s.field} htmlFor="scribe-ask">Or ask in your own words
                <textarea id="scribe-ask" rows={3} value={request} disabled={busy !== null} placeholder="Tell Scribe what to change…" onChange={e => setRequest(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (isExample) askForAccount("Scribe, on your own resume", "Scribe rewrites your own draft from your own record. This one is an example, so there is nothing of yours for it to work on yet."); else void askScribe(); } }} />
              </label>
              <button type="button" className={s.secondary} disabled={!request.trim() || busy !== null} onClick={() => isExample ? askForAccount("Scribe, on your own resume", "Scribe rewrites your own draft from your own record. This one is an example, so there is nothing of yours for it to work on yet.") : void askScribe()}>{busy === "revising" ? "Rewriting…" : "Ask Scribe"} <Arrow /></button>
              {revisions.length > 0 && <ol className={s.thread}>{revisions.map((rev, i) => <li key={`${rev.ask}-${i}`}><p className={s.ask}>{rev.ask}</p><div className={s.proposal}><span className={s.smallLabel}>SCRIBE</span>{rev.didChange ? <p className={s.okNote}><Tick /><span>Updated on your resume{rev.changed.length > 0 ? `: ${rev.changed.join("; ")}` : ""}</span></p> : <p className={s.quiet}>Your resume was not changed.</p>}<p>{rev.reply}</p>{rev.declined && rev.declined !== rev.reply && <p className={s.quiet}><b>Not changed:</b> {rev.declined}</p>}{rev.added.length > 0 && <p className={s.quiet}>Added from what you told me: {rev.added.join("; ")}. Make sure you can stand behind it in the interview.</p>}{rev.followUp && <p><b>{rev.followUp}</b></p>}<div>{rev.offer && <button type="button" disabled={busy !== null} onClick={() => void askScribe(rev.offer!.instruction)}>✦ {rev.offer.label}</button>}{rev.didChange && <button type="button" onClick={() => undoRevision(i)}>↶ Undo this change</button>}<CopyButton value={rev.reply} label="Copy Scribe's reply" /></div></div></li>)}</ol>}
              {/* The other way to change the words: your own hands. It was a
                  fourth tab, which made it look like a fourth thing to do. */}
              <button type="button" className={s.handEdit} onClick={() => { setEditor("summary"); setSummaryDraft(shown.resume.summary); }}>Rather write the opening paragraph yourself? <Arrow /></button>
            </> : <><button type="button" className={s.handEdit} onClick={() => setEditor("scribe")}><span aria-hidden="true">←</span> Back to Scribe</button><h2>Write it yourself</h2><p className={s.quiet}>Your own words for the opening paragraph. Nothing is rewritten - it goes on the page exactly as you type it.</p><label className={s.field}>{shown.resume.summaryHeading || "Summary"}<textarea rows={9} value={summaryDraft} onChange={e => setSummaryDraft(e.target.value)} /></label><button type="button" className={s.secondary} onClick={() => isExample ? askForAccount("your resume", "This is an example. Yours is written from your own record, which is the point at which it needs an account.") : applySummary()}>Apply to draft <Arrow /></button></>}
            {editor === "scribe" && <div className={s.tip}><span>✦ KEEP IT TRUE</span><p>New numbers, responsibilities and skills need your confirmation. Nothing goes on the page that your record cannot back.</p></div>}</aside></div></>}

      {stage === "review" && <div className={s.feedback}>{exampleBanner}{busy === "reviewing" ? <section className={s.card}><span className={s.smallLabel}>READING YOUR RESUME BACK</span><h2 className={s.emptyTitle}>Someone is reading it now, the way a recruiter would.</h2><ReviewProgress /></section> : !shownReview ? <section className={s.emptyNotice}><span className={s.smallLabel}>FEEDBACK</span><h2 className={s.emptyTitle}>Your feedback could not be written just now.</h2><p className={s.quiet}>Your draft is safe. Try again in a moment.</p><div className={s.questionActions}><button type="button" onClick={() => { setError(null); setReview(null); }}>Try again <Arrow /></button></div></section> : <>
        <div className={s.summaryGrid}><section className={s.overview}><span className={s.smallLabel}>HOW YOUR RESUME READS</span><h2>{standingLabel(shownReview.standing.level, shown.targetRole)}</h2><p>{shownReview.standing.why}</p><div className={s.standing} role="img" aria-label={`Resume standing: ${shownReview.standing.level}. Not a readiness score.`}>{(["early", "competitive", "strong"] as const).map((level, i) => <span key={level} data-active={shownReview.standing.level === level}><i /><b>{["Developing", "Competitive", "Strong"][i]}</b></span>)}</div><small>Resume review · not a hiring probability</small></section>
          <section className={s.coverage}>{(() => { const covered = shownReview.coverage.covered.length, total = covered + shownReview.coverage.missing.length, deg = total ? Math.round((covered / total) * 360) : 0; return <div className={s.ring} style={{ background: `conic-gradient(var(--color-teal-700) 0deg ${deg}deg,var(--color-slate-200) ${deg}deg 360deg)` }} role="img" aria-label={`${covered} of ${total} signals shown`}><span><b>{covered}/{total}</b><small>shown</small></span></div>; })()}<div><span className={s.smallLabel}>DOCUMENT COVERAGE</span><h2>{shown.targetRole ? "Words this role looks for" : "Signals in this resume"}</h2><p><i />{shownReview.coverage.covered.length} shown <em />{shownReview.coverage.missing.length} not shown</p><small>Word coverage, not demonstrated ability.</small></div></section>
          <section className={s.readiness}><span className={s.smallLabel}>ROLE READINESS</span><strong>Not assessed</strong><p>A short role assessment shows what you can do.</p><b>{shown.targetRole || "Choose a role in Discovery"}</b><small>A readiness score cannot be read from resume wording.</small></section></div>
        <div className={s.insights}><section className={`${s.card} ${s.working}`}><div className={s.sectionHeading}><h2>✓ Keep these strengths</h2><span>{shownReview.strengths.length} signals</span></div>{shownReview.strengths.map(point => <p key={point}>{point}</p>)}</section>
          <section className={s.card}><div className={s.sectionHeading}><h2>✦ Improve this next</h2><span>{shownReview.gaps.length} priorities</span></div>{shownReview.gaps.map((item, i) => <div className={s.improvement} key={item.what}><span>{i === 0 ? "START HERE" : "THEN CONSIDER"}</span><h3>{item.what}</h3><p>{item.how}</p><button type="button" onClick={() => { setRequest(`${item.what}: ${item.how}`); setEditor("scribe"); setPane("edit"); go("draft"); }}>Improve with Scribe <Arrow /></button></div>)}</section></div>
        {checkPanel}
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

      <p className={status ? s.status : s.srOnly} role="status" aria-live="polite">{status}</p>
      {!building && <footer className={s.actionBar}><div><strong>{footer[stage][0]}</strong><small>{footer[stage][1]}</small></div><div>{stageIndex > 0 && <button type="button" className={s.backButton} onClick={() => go(STAGES[Math.max(0, stageIndex - 1)].id)}>Back</button>}<button type="button" className={s.primary} disabled={busy !== null || (stage === "export" && !exported && !completeness.ready)} onClick={primaryAction}>{busy === "exporting" ? "Preparing…" : busy === "saving" ? "One moment…" : footer[stage][2]} <Arrow /></button></div></footer>}
    </main></div>
  </div>;
}
