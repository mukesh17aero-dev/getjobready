"use client";

import { radioNavigation } from "@/components/ui/radio-navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { SignUpPrompt, type GatedAction } from "@/components/auth/signup-gate";
import { FormAlert, type MissingField } from "@/components/ui/form-alert";
import { RequiredMark } from "@/components/ui/required-mark";
import { track as trackEvent } from "@/lib/footprints";
import { SAMPLE_ATS, EXAMPLE_RESUME, SAMPLE_REVIEW } from "./samples";
import { EssentialsModal } from "./essentials-modal";
import { RoleAimModal } from "./role-aim-modal";
import { ResumeSetup, firstStepFor, hasNothingSaved, setupGaps, type SetupStep } from "./resume-setup";
import { ReviewProgress } from "./review-progress";
import { uploadRead } from "./starter-resumes";
import { TEMPLATES, asTemplate } from "./templates";
import { splitList } from "./resume-text";
import { downloadResumeDocx, exportTemplate, polishResumeField, generateResume, getResumeRecord, readResumeUpload, refineResume, resumeCompleteness, reviewResume, saveResumeDraft, saveResumeProfile, type AtsCheck, type ResumeCareerProfile, type ResumeData, type ResumeReview, type ReviewNext, type ResumeTarget, type ResumeTemplate } from "./resume-api";
import { savedResumeEntries } from "./saved-resumes";
import { previewTemplate } from "./resume-template-access";
import { resumeDraftIssue } from "./resume-draft-validation";
import { useResumeSave } from "./use-resume-save";
import { ResumePrintDocument } from "./resume-print-document";
import { requiredDestination } from "./resume-required";
import type { ResumeSection } from "./resume-section-editor";
import { PolishProvider, type PolishRequest } from "./polish-button";
import { RecruiterReview } from "./recruiter-review";
import { Files, Handover, Pencil } from "@/components/ui/icons";
import { hasSubstance, readEducation, readExperience, trackFromRecord } from "@/features/profile";
import type { WriterReply } from "./draft-requests";
import { GuestDraftImport } from "./guest-resume";
import { ResumeWorkbench, type WorkbenchTool } from "./resume-workbench";
import { resumeFromProfile } from "./resume-from-profile";
import s from "./resume-studio.module.css";
import { M3_ROOT } from "./m3";

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
  { id: "draft", name: "Edit resume" },
  { id: "export", name: "Download" },
  // After the download: the read is optional, and the resume is already theirs.
  { id: "review", name: "AI Recruiter Review" },
];
// Build from nothing, or improve a resume they already have.
// How they start: from their saved details, from a resume they upload, or
// writing it themselves with their saved details filled in.
type Purpose = "general" | "improve" | "write";
type Track = "student" | "early_career";
const EXAMPLE_ROLE = "Customer Success Associate";
const HEADINGS: Record<Stage, [string, string]> = {
  start: ["Create a resume", "Add your details or upload an existing resume."],
  draft: ["Edit resume", "Edit your details and check the preview."],
  review: ["AI Recruiter Review", ""],
  export: ["Download resume", "Choose PDF or Word."],
};
const Arrow = () => <span aria-hidden="true">→</span>;
/** What a resume is aimed at: a role, and the job posting when one was given. */
type Target = { targetRole: string; jobDescription?: string };
/** The target as every writer and reader is asked for it; a resume aimed at nothing says so. */
const aimOf = (target: Target) => ({
  ...(!target.targetRole.trim() && !target.jobDescription ? { general: true } : {}),
  ...(target.jobDescription ? { jobDescription: target.jobDescription } : {}),
});
const Tick = () => <span aria-hidden="true">✓</span>;

async function token(): Promise<string | null> {
  const { data } = await supabaseBrowser().auth.getSession();
  return data.session?.access_token ?? null;
}

export function ResumeStudio({ profile: initialProfile, target, recordAt, signedOut = false, initialTrack, initialPurpose }: {
  profile: ResumeCareerProfile | null; target: ResumeTarget | null; recordAt?: string; signedOut?: boolean; initialTrack?: Track;
  /** The way to start they already chose - signed out, before they made an account. */
  initialPurpose?: "general" | "improve";
}) {
  const [profile, setProfile] = useState(initialProfile);
  const prefs = useMemo(() => profile?.preferences ?? {}, [profile]);
  const text = (key: string) => { const v = prefs[key]; return typeof v === "string" ? v.trim() : ""; };
  const ledger = useMemo(() => savedResumeEntries(profile), [profile]);
  const opened = recordAt ? ledger.find(entry => entry.at === recordAt && entry.resume) : undefined;
  const lockedRole = target?.role ?? null;
  const savedTrack: Track | null = prefs["track"] === "student" || prefs["track"] === "early_career" ? (prefs["track"] as Track) : null;
  const profileSkills = useMemo(() => splitList(prefs["skills"]), [prefs]);

  const [requestedSection, setRequestedSection] = useState<ResumeSection>("header");
  const [workbenchSession, setWorkbenchSession] = useState(0);
  const [stage, setStage] = useState<Stage>(opened ? "draft" : "start");
  // Nothing chosen until they choose: what follows depends on the choice.
  const [purpose, setPurpose] = useState<Purpose | null>(initialPurpose ?? null);
  const [roleInput, setRoleInput] = useState(lockedRole?.title ?? "");
  // A new resume with a role chosen in Discovery asks, before building, whether
  // to aim at that role or stay general. Reopened resumes keep their own target.
  const [roleAimOpen, setRoleAimOpen] = useState(Boolean(lockedRole && !opened));
  const [jdInput, setJdInput] = useState("");
  // Where they are, read from their profile the way the profile page reads it:
  // a course in progress means studying, a job on record means working, and
  // otherwise what they chose. With nothing on record and nothing chosen, it
  // stays unanswered rather than guessed.
  const recordTrack: Track | null = useMemo(() => {
    if (!profile) return savedTrack;
    const studyingNow = readEducation(profile.education).filter(hasSubstance).some(entry => Boolean(entry.current));
    const hasWork = readExperience(profile.experience).some(hasSubstance);
    return studyingNow || hasWork || savedTrack ? trackFromRecord({ studyingNow, hasWork, chosen: savedTrack ?? "" }) : null;
  }, [profile, savedTrack]);
  const [trackChoice, setTrackChoice] = useState<Track | null>(initialTrack ?? recordTrack);
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate>(asTemplate(opened?.displayTemplate ?? opened?.template));
  const allowedTemplateIds = TEMPLATES.map(item => item.id);
  const template = previewTemplate(selectedTemplate, allowedTemplateIds);
  // A reopened resume already has its look; a new one picks a layout first.
  // Kept here, not in the editor, so leaving the editor and coming back does
  // not ask again.
  const [templatePicked, setTemplatePicked] = useState(Boolean(opened));
  const setTemplate = (next: ResumeTemplate) => { setSelectedTemplate(next); setTemplatePicked(true); };
  // Which setup step is open; the first one still missing something.
  const gaps = setupGaps(profile);
  // Nothing on the profile yet: the first door is filling it in, and there is
  // no saved detail to "write it myself" from.
  const startingFresh = !signedOut && hasNothingSaved(profile);
  const [setupStep, setSetupStep] = useState<SetupStep | null>(() => signedOut ? null : firstStepFor(setupGaps(initialProfile)));
  const [upload, setUpload] = useState<{ filename: string; text: string; read: { experience: number; education: number; skills: number }; parsed: Record<string, unknown> | null } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState<null | "checking" | "building" | "reviewing" | "revising" | "exporting" | "saving">(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [essentialsOpen, setEssentialsOpen] = useState(false);
  // The posting typed on Your details, when the resume is aimed at a role.
  const postingNow = () => (targeted && jdInput.trim() ? { jobDescription: jdInput.trim() } : {});
  // The resume, and what it is aimed at: the role and, when they gave one, the
  // job posting. Kept together so every later step - and reopening it - works
  // to the same target. A general resume is filed as "No particular role".
  const [result, setResult] = useState<Target & { resume: ResumeData } | null>(opened?.resume ? { resume: opened.resume, targetRole: /^no particular role$/i.test(opened.role.trim()) ? "" : opened.role, ...(opened.jobDescription ? { jobDescription: opened.jobDescription } : {}) } : null);
  const [ats, setAts] = useState<AtsCheck | null>(null);
  const [review, setReview] = useState<ResumeReview | null>(opened?.review ?? null);
  // The one step after the review, from what they have done for the role.
  const [reviewNext, setReviewNext] = useState<ReviewNext | null>(null);
  // Which of the editor's tools is showing: the footer reads it, so it can
  // send someone who is still editing on to Suggestions first.
  const [tool, setTool] = useState<WorkbenchTool>("content");
  const [format, setFormat] = useState<"docx" | "pdf">("docx");
  const [exported, setExported] = useState(false);
  const [gate, setGate] = useState<GatedAction | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  // The action bar is pinned to the foot of the window. Panels pinned beside
  // the resume need to stop above it, not run underneath, so its height is
  // handed down as --footer-h - and is 0 wherever the bar is not pinned.
  const shellRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const bar = footerRef.current, shell = shellRef.current;
    if (!bar || !shell) return;
    const measure = () => {
      const style = getComputedStyle(bar);
      const pinned = style.position === "sticky" || style.position === "fixed";
      const below = parseFloat(style.bottom) || 0;
      shell.style.setProperty("--footer-h", pinned ? `${Math.ceil(bar.offsetHeight + below + 12)}px` : "0px");
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(bar);
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
    // The bar comes and goes with the stage and with a build in progress.
  }, [busy, stage]);

  // A role is optional on both doors: named, the draft is shaped for it.
  // A role, or a job posting, aims the resume; with neither it is general.
  const targeted = Boolean(roleInput.trim() || jdInput.trim());
  const general = !targeted;
  const chosenRole = () => (targeted ? roleInput.trim() : "");
  // Building from nothing needs the record filled first; improving needs the file.
  const detailsReady = purpose === "improve" ? upload !== null : gaps.length === 0;
  const readyToBuild = Boolean(trackChoice) && detailsReady;
  // What the person still has to answer on the start stage, so the alert at
  // the top can send them straight to it instead of describing it.
  const missingNow: MissingField[] = stage !== "start" ? [] : [
    ...(purpose === "general" || purpose === "write" ? gaps.map(gap => ({ id: "resume-setup", label: gap.label })) : []),
    ...(!trackChoice ? [{ id: "resume-track", label: "Your experience" }] : []),
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
  const completeness = result ? resumeCompleteness(result.resume) : { ready: true, missing: [] };
  const stageIndex = STAGES.findIndex(item => item.id === stage);

  function go(next: Stage) {
    if (next === "export") trackEvent({family:"engagement",event:"export_opened",module:"resume"});
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
  // Writing it yourself asks for the same details as building from them, then
  // opens the editor with those details already in place - copied as saved,
  // not rewritten. An empty editor after a form made people type it twice.
  function startWriting() {
    if (signedOut) { void withToken(); return; }
    if (purpose !== "write") setPurpose("write");
    if (gaps.length > 0) {
      setSetupStep(firstStepFor(gaps));
      setError("Add the details below, then start writing. They go straight into your resume.");
      setTimeout(() => { const field = document.getElementById("resume-setup"); field?.focus(); field?.scrollIntoView({ block: "start" }); }, 0);
      return;
    }
    if (!trackChoice) {
      setError("Tell us where you are right now first.");
      setTimeout(() => { const field = document.getElementById("resume-track"); field?.focus(); field?.scrollIntoView({ block: "center" }); }, 0);
      return;
    }
    setError(null);
    setWorkbenchSession(value => value + 1);
    setResult({ targetRole: chosenRole(), ...postingNow(), resume: resumeFromProfile(profile, trackChoice === "early_career") });
    setReview(null); setAts(null); setExported(false); go("draft");
  }
  function continueFromStart() {
    if (signedOut) { void withToken(); return; }
    if (!purpose) {
      setError("Choose how you would like to start.");
      setTimeout(() => { const first = document.querySelector<HTMLElement>('[aria-label="How would you like to start?"] [role="radio"]'); first?.focus(); first?.scrollIntoView({ block: "center" }); }, 0);
      return;
    }
    if (purpose === "write") { startWriting(); return; }
    if (!readyToBuild) {
      if (purpose === "general" && gaps.length > 0) { setSetupStep(firstStepFor(gaps)); setError("A few details are still needed before your resume can be written."); return; }
      setError(!trackChoice ? "Tell us where you are right now first." : "Choose the resume to improve first.");
      setTimeout(() => { const field = document.getElementById(!trackChoice ? "resume-track" : "resume-upload"); field?.focus(); field?.scrollIntoView({block:"center"}); }, 0);
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
    setWorkbenchSession(value => value + 1);
    setResult({ resume: generated.resume, targetRole: generated.targetRole, ...postingNow() });
    setAts(generated.ats ?? null); setReview(null); setExported(false);
    trackEvent({ family: "engagement", event: "resume_generated", module: "resume", target: generated.targetRole, meta: { keywordsUsed: generated.resume.keywordsUsed.length } });
    go("draft");
  }
  // The writer behind the editor's Draft and Suggestions tools. It hands back
  // the rewritten resume rather than putting it in place, so the editor can
  // apply it through its own undo.
  async function rewrite(instruction: string, base: ResumeData): Promise<WriterReply | null> {
    if (!result) return null;
    const t = await withToken(); if (!t) return null;
    const revised = await refineResume(t, { resume: base, comment: instruction, targetRole: result.targetRole, ...(trackChoice ? { track: trackChoice } : {}), ...aimOf(result) });
    if (!revised) return null;
    if (revised.ats) setAts(revised.ats);
    trackEvent({ family: "engagement", event: "resume_revised", module: "resume", target: result.targetRole, meta: { declined: Boolean(revised.declined) } });
    return { resume: revised.resume, changed: JSON.stringify(revised.resume) !== JSON.stringify(base), message: revised.declined ?? revised.reply, added: revised.added };
  }


  // ---- AI Recruiter Review: read back when the stage opens ----
  //
  // Asked once per version of the resume. Leaving the stage while it is
  // being written does not throw it away: it is kept for when they come
  // back, unless the resume changed meanwhile. And "reviewing" always ends
  // when the read does - it is the flag every main button waits on, so a
  // read left running would otherwise hold them all disabled.
  const reviewAsked = useRef<ResumeData | null>(null);
  const reviewsRunning = useRef(0);
  const [reviewAttempt, setReviewAttempt] = useState(0);
  const latestResume = useRef<ResumeData | null>(null);
  useEffect(() => { latestResume.current = result?.resume ?? null; }, [result]);
  useEffect(() => {
    if (stage !== "review" || !result || review || signedOut) return;
    if (reviewAsked.current === result.resume) return;
    const asked = result.resume;
    reviewAsked.current = asked;
    void (async () => {
      reviewsRunning.current++;
      setBusy("reviewing");
      const t = await withToken();
      const read = t ? await reviewResume(t, { resume: asked, targetRole: result.targetRole, ...(trackChoice ? { track: trackChoice } : {}), ...aimOf(result) }) : null;
      reviewsRunning.current--;
      if (reviewsRunning.current === 0) setBusy(current => (current === "reviewing" ? null : current));
      // A newer version is being read: this one is out of date.
      if (latestResume.current !== asked) return;
      if (!read) { reviewAsked.current = null; if (t) setError("I could not read your resume back just now. Your draft is safe - this is only the feedback on it."); return; }
      setReview(read.review);
      setReviewNext(read.next ?? null);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, result, review, signedOut, reviewAttempt]);

  // ---- Export: the file leaves, and the version is kept with its feedback ----
  async function exportResume() {
    if (!result) { askForAccount("your resume", "This is an example. Yours is written from your own record, which is the point at which it needs an account."); return; }
    if (!completeness.ready) return;
    const issue = resumeDraftIssue(result.resume);
    if (issue) { setError(issue); return; }
    setBusy("exporting"); setError(null);
    const t = await withToken(); if (!t) { setBusy(null); return; }
    if (format === "docx") {
      const blob = await downloadResumeDocx(t, result.resume, exportTemplate(template), result.targetRole);
      if (!blob) { setBusy(null); setError("The Word file didn't come through. Try the download again."); return; }
      const url = URL.createObjectURL(blob); const a = document.createElement("a");
      a.href = url; a.download = `${result.resume.header.name.replace(/\s+/g, "-").toLowerCase() || "resume"}-resume.docx`; a.click(); URL.revokeObjectURL(url);
    } else {
      await new Promise<void>(resolve => { const after = () => { window.removeEventListener("afterprint", after); resolve(); }; window.addEventListener("afterprint", after); window.print(); });
      // The page cannot see whether the PDF was saved or the dialog cancelled,
      // so it says so - and treats it like any download: the version is kept
      // and the AI Recruiter Review is offered next.
      setStatus("If you saved the PDF, it is yours. You can print or save it again at any time.");
    }
    setBusy(null); setExported(true);
    // Saved on the server against the current record, then read back for the shelf.
    const kept = await saveResumeDraft(t, { resume: result.resume, targetRole: result.targetRole, ...(result.jobDescription ? { jobDescription: result.jobDescription } : {}), template: exportTemplate(template), displayTemplate: template, downloaded: true, ...(review ? { review } : {}) });
    if (kept) { const record = await getResumeRecord(t); if (record?.profile) setProfile(record.profile); }
  }

  const { dirty, saveLabel, saveFailed, retry, acceptSaved, flush } = useResumeSave(result, template, signedOut);
  // Leaving from the side menu saves unsaved edits first. "Create new resume"
  // always loads fresh, even from a new draft: a client navigation to the URL
  // already open would change nothing on screen.
  const leaveTo = (href: string, event: { preventDefault(): void }) => {
    if (!dirty && href !== "/resume/build") return;
    event.preventDefault();
    void flush().then(ok => { if (ok) setTimeout(() => window.location.assign(href), 0); else setError("Your changes could not be saved. Retry before leaving."); });
  };
  async function importGuest(draft: {resume: ResumeData; template: ResumeTemplate}) {
    const issue=resumeDraftIssue(draft.resume);if(issue)throw new Error(issue);
    if(!await flush())throw new Error("Save your current edits before importing the browser draft.");
    const t=await withToken();if(!t)throw new Error("Sign in again to import your draft.");
    const kept=await saveResumeDraft(t,{resume:draft.resume,targetRole:"",template:exportTemplate(draft.template),displayTemplate:draft.template});
    if(!kept)throw new Error("Could not save your draft. Your browser copy is still available.");
    acceptSaved(draft.resume,"",draft.template);setResult({resume:draft.resume,targetRole:""});setTemplate(draft.template);setWorkbenchSession(value=>value+1);setReview(null);setAts(null);go("draft");
  }
  // The ✦ after a detailed field: their notes, shaped into resume wording.
  const polishRequest: PolishRequest = async (field, text, context) => {
    if (!result) return null;
    const t = await withToken(); if (!t) return null;
    return polishResumeField(t, { field, text, ...(context ? { context } : {}), resume: result.resume, ...(result.targetRole ? { targetRole: result.targetRole } : {}), ...(trackChoice ? { track: trackChoice } : {}) });
  };
  function editResume(resume: ResumeData) {
    if (!result) return;
    setResult({ ...result, resume }); setReview(null); setAts(null); setExported(false);
  }
  // ---- Which stages can be opened from the bar ----
  function canOpen(id: Stage) {
    if (signedOut) return true;
    if (id === "start") return true;
    return Boolean(result);
  }
  // Download and the AI Recruiter Review open once the resume carries what a
  // resume needs - the same details the download itself requires. Until then
  // the step says what is missing and takes them to it.
  const locked = (id: Stage) => !signedOut && (id === "export" || id === "review") && Boolean(result) && !completeness.ready;
  const missingLine = () => {
    const parts = completeness.missing.map(gap => gap.section.toLowerCase());
    const list = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}` : parts[0] ?? "the required details";
    return `Add ${list} first - then your resume is ready to download and review.`;
  };
  function openStage(id: Stage) {
    if (locked(id)) { openMissing(completeness.missing[0]!); setStatus(missingLine()); return; }
    go(id);
  }
  const exampleBanner = isExample && <div className={s.exampleBanner}><span><b>This is an example.</b> A finished resume and the feedback it was given, so you can see what you get. Yours is written from your own record.</span><button type="button" onClick={() => go("start")}>Build mine <Arrow /></button></div>;
  const building = busy === "building" || busy === "checking";
  const footer: Record<Stage, [string, string, string]> = {
    start: !purpose
      ? ["Choose how to start.", "Your saved details, a resume you have, or writing it yourself.", "Continue"]
      : purpose === "improve"
      ? upload
        ? ["Start from the resume you have.", "We keep what you wrote and work on how it reads.", "Work on my resume"]
        : ["Upload your resume to continue.", "PDF or Word - we keep what you wrote.", "Work on my resume"]
      : purpose === "write"
        ? ["Write it your way.", "The editor opens with your saved details already in place.", "Start writing"]
      : gaps.length > 0 && !signedOut
        ? [`${gaps.length} ${gaps.length === 1 ? "detail" : "details"} to go.`, gaps.map(gap => gap.label).join(" · "), "Build my resume"]
        : ["Everything is in.", "You can change the look and add more detail later.", "Build my resume"],
    draft: tool === "content"
      ? ["Done editing?", "Read it through and ask for any changes.", "Request changes"]
      : tool === "draft"
        ? ["Happy with it?", "See what would improve it before you download.", "Continue to suggestions"]
        : completeness.ready
          ? ["Ready to download?", "Choose PDF or Word.", "Continue to download"]
          : ["Almost there.", "Add the required details, then download.", "Add required details"],
    review: ["You choose what to improve.", "", "Back to my resume"],
    export: exported
      ? ["Downloaded.", "See how a recruiter would read it - optional.", "AI Recruiter Review"]
      : ["Download your resume.", "Find saved versions in My resumes.", format === "docx" ? "Download Word file" : "Print or save as PDF"],
  };
  function openMissing(gap: { section: string; fix: string }) {
    setRequestedSection(requiredDestination(gap).section); setTool("content"); setWorkbenchSession(value => value + 1); go("draft");
    setTimeout(() => {
      const fields = [...document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[aria-label="Resume controls"] [aria-required="true"]')];
      const field = fields.find(item => !item.value.trim()) ?? fields[0];
      field?.focus({ preventScroll: true }); field?.scrollIntoView({ block: "center", behavior: "instant" });
    }, 0);
  }
  function primaryAction() {
    if (stage === "start") return continueFromStart();
    if (stage === "draft" && (tool === "content" || tool === "draft")) {
      setTool(tool === "content" ? "draft" : "suggestions");
      document.querySelector('[aria-label="Resume editing workspace"]')?.scrollIntoView({ block: "start", behavior: "instant" });
      return;
    }
    if (stage === "draft") return openStage("export");
    if (stage === "review") return go("draft");
    if (exported) return go("review");
    if (!completeness.ready) { openMissing(completeness.missing[0]); return; }
    return void exportResume();
  }

  return <div ref={shellRef} className={`${s.shell} ${M3_ROOT}`} data-stage={stage}>
    {gate && <SignUpPrompt action={gate} onClose={() => setGate(null)} />}
    {roleAimOpen && lockedRole && <RoleAimModal roleTitle={lockedRole.title} onChoose={useRole => { setRoleInput(useRole ? lockedRole.title : ""); setRoleAimOpen(false); }} />}
    {essentialsOpen && <EssentialsModal firstName={text("fullName").split(/\s+/)[0] ?? ""} busy={busy !== null} onClose={() => { if (busy === null) setEssentialsOpen(false); }} onSubmit={values => void saveEssentials(values)} />}
    <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt,.md" className={s.srOnly} aria-label="Choose the resume to improve" onChange={e => { const file = e.target.files?.[0]; e.target.value = ""; if (file) void readExisting(file); }} />
    <div className={s.canvas}><main className={s.main}>
      <div className={s.breadcrumb}><Link href="/resume">← Apply</Link></div>
      <header className={s.heading}><div><div className={s.titleRow}><h1 ref={titleRef} tabIndex={-1}>{stage === "start" ? "Create resume" : HEADINGS[stage][0]}</h1></div>{stage !== "start" && HEADINGS[stage][1] && <p>{HEADINGS[stage][1]}</p>}</div>{/* The versions already made, one press away from every step. */}{!signedOut && <Link href="/resume/saved" className={s.savedLink} onClick={event => leaveTo("/resume/saved", event)}><Files size={18} />My resumes</Link>}</header>
      <nav className={s.journeyNav} aria-label="Resume stages">{STAGES.map(item => <button type="button" key={item.id} aria-current={stage === item.id ? "step" : undefined} disabled={!canOpen(item.id)} data-locked={locked(item.id) || undefined} title={locked(item.id) ? "Add the required details first" : undefined} onClick={() => openStage(item.id)}>{locked(item.id) && <span className={s.lock} aria-hidden="true" />}{item.name}{locked(item.id) && <span className="sr-only"> (add the required details first)</span>}</button>)}</nav>

      <FormAlert message={error} missing={missingNow} className="mb-4" />

      {building ? <section className={`${s.card} ${s.buildState}`}><div className={s.buildGlyph} aria-hidden="true">✦</div><span className={s.smallLabel} style={{ justifyContent: "center", marginTop: 18 }}>{busy === "checking" ? "GETTING YOUR DETAILS TOGETHER" : "WRITING YOUR DRAFT"}</span><h2>Bringing your story together.</h2><p>Your draft is written from your saved record and nothing else.</p><div className={s.buildRows}><span>Read your experience and skills</span><span>Shape the draft for your direction</span><span>Prepare the document for your review</span></div><p className={s.quiet}>This takes a minute or so. Stay on this page.</p></section> : <>

      {stage === "start" && <div className={s.setupGrid}><div className={s.setupLeft} role="region" aria-label="Resume setup and details" tabIndex={0}><section className={s.card}><div className={s.sectionHeading}><h2>How would you like to start?</h2></div>
        <div className={s.purposes} role="radiogroup" onKeyDown={radioNavigation} aria-label="How would you like to start?">{/* Writing it yourself starts from saved details; with none saved there is nothing to start from yet. */}{([
          { id: "general", name: startingFresh ? "Fill in my details" : "Use my saved details", Icon: Files },
          { id: "improve", name: "Upload a resume", Icon: Handover },
          ...(startingFresh ? [] : [{ id: "write" as const, name: "Write it myself", Icon: Pencil }]),
        ] as Array<{ id: Purpose; name: string; Icon: (p: { size?: number }) => React.ReactElement }>).map((item, index) => <button type="button" key={item.id} role="radio" aria-checked={purpose === item.id} tabIndex={purpose === item.id || (!purpose && index === 0) ? 0 : -1} onClick={() => choosePurpose(item.id)}>
          <span className={s.purposeIcon} aria-hidden="true"><item.Icon size={22} /></span>
          <strong>{item.name}</strong>
          <span className={s.purposeMark} aria-hidden="true" />
        </button>)}</div>
        {purpose && <>
        {purpose === "improve" && (upload ? <div className={s.softBox}><strong>Working from {upload.filename}</strong><p>{uploadRead(upload.read)} We keep what you wrote and work on how it reads.</p><button type="button" className={s.undo} onClick={() => setUpload(null)}>Remove</button></div> : <div className={s.dropZone} data-dragging={dragging || undefined}
            onDragOver={e => { e.preventDefault(); if (!dragging) setDragging(true); }} onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); const file = e.dataTransfer.files[0]; if (file && !uploading) void readExisting(file); }}>
            <span className={s.dropIcon} aria-hidden="true"><Handover size={26} /></span>
            <strong>{uploading ? "Reading your resume…" : "Upload your resume"}</strong>
            <small>PDF or Word. We keep what you wrote and say what is missing.</small>
            <button type="button" id="resume-upload" className={s.primary} disabled={uploading} onClick={() => fileRef.current?.click()}>{uploading ? "Reading…" : "Choose a file"}</button>
            <small className={s.dropOr}>or drag it here</small>
          </div>)}
        <label className={s.field} htmlFor="resume-role">Target role (optional)<input id="resume-role" value={roleInput} onChange={e => setRoleInput(e.target.value)} placeholder="e.g. Operations Executive" /></label>{lockedRole && roleInput.trim() !== lockedRole.title && <button type="button" className={s.undo} onClick={() => setRoleInput(lockedRole.title)}>Use {lockedRole.title}, from your Discovery</button>}{targeted && <details className={s.details}><summary>Add a job posting <span>Optional</span></summary><label className={s.field}>Job description<textarea rows={3} value={jdInput} onChange={e => setJdInput(e.target.value)} /></label></details>}
        <fieldset className={s.track} id="resume-track" tabIndex={-1} aria-invalid={wrongTrack || undefined} data-invalid={wrongTrack || undefined}><legend>Your experience<RequiredMark /></legend><div className={s.starterTrack}>{([{ id: "student", label: "Student / first job" }, { id: "early_career", label: "I have work experience" }] as Array<{ id: Track; label: string }>).map(option => <label key={option.id}><input type="radio" name="resume-track" value={option.id} checked={trackChoice === option.id} onChange={() => { setTrackChoice(option.id); setError(null); }} />{option.label}</label>)}</div></fieldset>
        </>}
      </section>
        {(purpose === "general" || purpose === "write") && !signedOut && <div id="resume-setup" tabIndex={-1}><ResumeSetup track={trackChoice ?? undefined} profile={profile} suggestions={target?.suggestedSkills ?? target?.keywords ?? []} suggestionsForRole={Boolean(target?.role)} role={roleInput || target?.role?.title} token={token} onSaved={setProfile} step={setupStep} onStep={setSetupStep} /></div>}
      </div></div>}

      {!signedOut && <GuestDraftImport onImport={importGuest} />}
      {stage === "draft" && <PolishProvider request={isExample || signedOut ? null : polishRequest}>{exampleBanner}{/* What every suggestion and change is aimed at. */}{result && <p className={s.tailored}>{result.targetRole.trim() ? <>Tailored for <b>{result.targetRole}</b>{result.jobDescription ? " · using the job posting you added" : ""}</> : result.jobDescription ? "Tailored to the job posting you added" : "General resume · not aimed at a particular role"}</p>}<ResumeWorkbench key={workbenchSession} initialSection={requestedSection} jobDescription={result?.jobDescription} resume={shown.resume} template={template} role={shown.targetRole} track={trackChoice ?? undefined} onChange={editResume} onTemplate={setTemplate} templateChosen={templatePicked} disabled={busy !== null} example={isExample} saveLabel={saveLabel} saveFailed={saveFailed} onRetry={retry} tool={tool} onToolChange={setTool} writer={isExample || signedOut ? undefined : { getToken: withToken, onAsk: rewrite }} onNext={() => go("export")} locked={<p>This is an example. Build your own resume to review a draft and see suggestions for it.</p>} /></PolishProvider>}

      {stage === "review" && <div className={s.feedback}>{exampleBanner}{busy === "reviewing" ? <section className={s.card}><span className={s.smallLabel}>READING YOUR RESUME BACK</span><h2 className={s.emptyTitle}>Someone is reading it now, the way a recruiter would.</h2><ReviewProgress /></section> : !shownReview ? <section className={s.emptyNotice}><span className={s.smallLabel}>FEEDBACK</span><h2 className={s.emptyTitle}>Your feedback could not be written just now.</h2><p className={s.quiet}>Your draft is safe. Try again in a moment.</p><div className={s.questionActions}><button type="button" onClick={() => { setError(null); setReview(null); setReviewAttempt(n => n + 1); }}>Try again <Arrow /></button></div></section> : <>
        <RecruiterReview review={shownReview} next={result ? reviewNext : null} role={shown.targetRole} />
      </>}</div>}

      {stage === "export" && <div className={s.exportGrid}><section className={s.card}>{exampleBanner}{exported ? <><span className={s.successMark}><Tick /></span><p className={s.eyebrow}>EXPORT COMPLETE</p><h2>A version you can come back to.</h2><p>Your resume is available in My resumes.</p><div className={s.fileCard}><span>▤</span><div><strong>{shown.resume.header.name} — Resume.{format}</strong><small>{TEMPLATES.find(item => item.id === template)?.name} layout · {shown.targetRole || "General resume"}</small></div></div><button type="button" className={s.secondary} onClick={() => setExported(false)}>Export again <Arrow /></button></> : <><span className={s.smallLabel}>YOUR DOCUMENT, READY TO TAKE AWAY</span><h2>How would you like to use it?</h2>
        <div className={s.formats} role="radiogroup" onKeyDown={radioNavigation} aria-label="Export format">{([{ id: "docx", name: "Word document", copy: "Keep editing or upload to an application." }, { id: "pdf", name: "PDF document", copy: "Preserve the layout when sharing or printing." }] as Array<{ id: "docx" | "pdf"; name: string; copy: string }>).map(item => <button type="button" key={item.id} role="radio" aria-checked={format === item.id} tabIndex={format === item.id ? 0 : -1} onClick={() => setFormat(item.id)}><span className={s.fileIcon}>.{item.id.toUpperCase()}</span><span><strong>{item.name}</strong><small>{item.copy}</small></span><span className={s.radioDot}>{format === item.id && <Tick />}</span></button>)}</div>
        {/* Only when the Word file cannot match the chosen look exactly. */}
        {exportTemplate(template) !== template && format === "docx" && <p className={s.quiet}>The Word file uses the {TEMPLATES.find(item => item.id === exportTemplate(template))?.name} structure; print to PDF keeps this look exactly.</p>}
        {template === "sidebar" && <div className={s.softBox}><strong>Applying through an online system?</strong><p>Two columns can disrupt reading order. Basic uses a simpler single-column layout.</p><button type="button" className={s.secondary} disabled={busy !== null} onClick={() => setTemplate("classic")}>Use Basic layout</button></div>}
        {!completeness.ready && <><p className={s.quiet}>This resume is missing {completeness.missing.map(g => g.section.toLowerCase()).join(", ")}. Add {completeness.missing.length === 1 ? "it" : "them"} and the download opens.</p><ul className={s.missingList}>{completeness.missing.map(item => <li key={item.section}><span aria-hidden="true">!</span><span><b>{item.section} is missing</b>{item.fix}<button type="button" className={s.checkLink} onClick={() => openMissing(item)}>Add {requiredDestination(item).label.toLowerCase()} →</button></span></li>)}</ul></>}
        {shownAts && !shownAts.readable && <ul className={s.missingList}>{shownAts.problems.map(problem => <li key={problem.what}><span aria-hidden="true">!</span><span><b>{problem.what}</b>{problem.why}</span></li>)}</ul>}
</>}
      </section></div>}
      </>}

      {stage === "export" && <ResumePrintDocument resume={shown.resume} template={template} role={shown.targetRole} track={trackChoice ?? undefined} />}
      <p className={status ? s.status : s.srOnly} role="status" aria-live="polite">{status}</p>
      {!building && <footer ref={footerRef} className={s.actionBar}><div><strong>{footer[stage][0]}</strong>{footer[stage][1] && <small>{footer[stage][1]}</small>}</div><div>{stageIndex > 0 && <button type="button" className={s.backButton} onClick={() => go(STAGES[Math.max(0, stageIndex - 1)].id)}>Back</button>}<button type="button" className={s.primary} disabled={busy !== null || (stage === "start" && (!purpose || (purpose === "improve" && !upload)))} onClick={primaryAction}>{busy === "exporting" ? "Preparing…" : busy === "saving" ? "One moment…" : stage === "export" && !completeness.ready && !exported ? "Add required details" : footer[stage][2]} <Arrow /></button></div></footer>}
    </main></div>
  </div>;
}
