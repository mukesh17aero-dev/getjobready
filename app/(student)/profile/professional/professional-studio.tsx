"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  acceptProfileSection,
  importLinkedInPdf,
  uploadProfilePhoto,
  writeProfessionalProfile,
  type ProfileCheckItem,
  type ProfileChecklist,
  type ProfileDraft,
  type ProfileEntry,
  type ProfileState,
  type ProfileVoice,
} from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { SignUpPrompt, type GatedAction } from "@/components/auth/signup-gate";
import { Avatar } from "@/components/ui/avatar";
import { RequiredMark } from "@/components/ui/required-mark";
import { HelpSheet } from "@/components/ui/help-sheet";
import { RememberHub } from "@/features/journey";
import { ArrowRight, Check, Info, Spark } from "@/components/ui/icons";
import s from "./professional-studio.module.css";

// The LinkedIn Profile Builder, as approved in the /preview-professional-studio
// concept: three stages - where you start from, shaping one section at a time,
// and copying what you kept across to LinkedIn.
//
// Every section is a working draft until the person keeps it.

const sections = [
  { id: "headline" as const, title: "Headline", short: "Headline", purpose: "Make your direction clear at a glance.", hint: "" },
  { id: "about" as const, title: "About", short: "About", purpose: "Give someone a reason to read on.", hint: "Connect your experience to your next step. Keep it specific and easy to explain in person." },
  { id: "experience" as const, title: "Experience", short: "Experience", purpose: "Show what you did, and why it mattered.", hint: "One role at a time. Use only outcomes you could back up if you were asked about them." },
  { id: "skills" as const, title: "Skills", short: "Skills", purpose: "Make your strengths easy to find.", hint: "Keep the skills you could demonstrate or discuss with a recruiter." },
  { id: "openTo" as const, title: "Open to work", short: "Open to", purpose: "Help the right opportunities find you.", hint: "Describe the roles you want. Your visibility settings remain your choice on LinkedIn." },
];
type Section = typeof sections[number]["id"];
// A recruiter check opens the matching editor and its guidance.
const CHECK_SECTION: Record<string, Section> = {
  headline: "headline",
  skills: "skills",
  generic: "skills",
  opening: "about",
  aboutLength: "about",
  firstPerson: "about",
  adjectives: "about",
  hype: "about",
  placeholders: "about",
  bullets: "experience",
  openTo: "openTo",
};
// Two registers, one standard. Either must read as written by somebody a
// recruiter would shortlist; what changes is rhythm and how the headline opens.
const VOICES: Array<{ id: ProfileVoice; title: string; description: string }> = [
  { id: "formal", title: "Formal", description: "Complete sentences, measured and precise. The register of a company careers page." },
  { id: "genz", title: "Gen Z", description: "Conversational and direct, short lines, a true specific up front. Still no slang, no emojis." },
];
type StartWith = "record" | "linkedin" | "resume";
type HelpTopic = Section | "source" | "voice" | "file" | "jobTitle" | "organisation" | "responsibilities";
const HELP: Record<HelpTopic, { title: string; body: string; example?: string }> = {
  source: { title: "Choose your starting point", body: "Use your Ascend record, a LinkedIn PDF, or an existing resume. You can review every section before you keep it." },
  voice: { title: "Choose a writing voice", body: "Formal and Gen Z change the wording, not your facts. You can switch after creating your draft." },
  file: { title: "Which file should I upload?", body: "For LinkedIn, export your profile as a PDF. For a resume, use a PDF or Word file. Check imported details before keeping them." },
  headline: { title: "Write a clear headline", body: "Lead with the role or work you want to be known for. Add a specific strength you can support in an interview.", example: "Customer Success Associate | Client onboarding and issue resolution" },
  about: { title: "Write your About section", body: "Use the first person. Explain what you have done, what you do well, and the kind of work you want next. Keep claims specific and true." },
  experience: { title: "Describe your experience", body: "Add each role separately. Describe the work you owned and its outcome. Use numbers only when you know they are accurate." },
  jobTitle: { title: "Job title", body: "Use the title you held, or the closest truthful title your organisation used." },
  organisation: { title: "Organisation", body: "Enter the employer or organisation where you did this work." },
  responsibilities: { title: "Work and outcomes", body: "Write one responsibility or outcome per line. Start with what you did and include a result when you can back it up." },
  skills: { title: "Choose skills you can show", body: "Add one skill per line. Include only skills you could discuss or demonstrate to a recruiter." },
  openTo: { title: "Say what you are open to", body: "Name the types of roles you want. LinkedIn visibility settings are controlled on LinkedIn itself." },
};

function textFor(draft: ProfileDraft, section: Section): string {
  const value = draft[section];
  if (typeof value === "string") return value;
  if (!value) return "";
  return value.map(item => typeof item === "string" ? item : `${item.title} — ${item.organisation}\n${item.bullets.map(b => `• ${b}`).join("\n")}`).join("\n\n");
}
function hasValue(draft: ProfileDraft, section: Section) { return Boolean(textFor(draft, section).trim()); }
const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

async function token(): Promise<string | null> {
  const { data } = await supabaseBrowser().auth.getSession();
  return data.session?.access_token ?? null;
}

// Square, centre-cropped, 320px JPEG: around 25KB, so the upload works on a
// phone on 3G and the API never does image work.
async function squarePhoto(file: File): Promise<Blob | null> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = 320; canvas.height = 320;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 320, 320);
  return new Promise(resolve => canvas.toBlob(b => resolve(b), "image/jpeg", 0.82));
}

export function ProfessionalStudio({ initial, signedOut = false }: { initial: ProfileState; signedOut?: boolean }) {
  const written = Object.keys(initial.suggested).length > 0 || Object.keys(initial.accepted).some(k => k !== "photo");
  const [state, setState] = useState(initial);
  const [stage, setStage] = useState(written && !signedOut ? 1 : 0);
  const [section, setSection] = useState<Section>("headline");
  const [draft, setDraft] = useState<ProfileDraft>({ ...initial.accepted, ...initial.suggested });
  const [start, setStart] = useState<StartWith>("record");
  const [voice, setVoice] = useState<ProfileVoice>(initial.suggested.voice ?? "formal");
  const [checklist, setChecklist] = useState<ProfileChecklist | null>(initial.checklist ?? null);
  const [checksStale, setChecksStale] = useState(false);
  const [showChecks, setShowChecks] = useState(false);
  const [help, setHelp] = useState<HelpTopic | null>(null);
  const [checkGuidance, setCheckGuidance] = useState<ProfileCheckItem | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [compare, setCompare] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [busy, setBusy] = useState<"write" | "keep" | "photo" | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [gate, setGate] = useState<GatedAction | null>(null);
  const [copied, setCopied] = useState<Partial<Record<Section, boolean>>>({});
  const [expandedCopy, setExpandedCopy] = useState<Partial<Record<Section, boolean>>>({ headline: true });
  const photoInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const editorRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const kept = state.accepted;
  const photo = state.accepted.photo || "";
  const info = sections.find(item => item.id === section)!;
  const value = textFor(draft, section);
  const canKeepSection = (id: Section) => id === "experience"
    ? Boolean(draft.experience?.length) && (draft.experience ?? []).every(entry => entry.title.trim() && entry.organisation.trim())
    : hasValue(draft, id);
  const canKeep = canKeepSection(section);
  const isKept = hasValue(kept, section) && same(draft[section], kept[section]);
  const name = state.name || (signedOut ? "Anjali Kumar" : "Your name");
  // The written order, never the chosen one. Putting the selection first
  // meant picking option 2 moved it to the top and everything shuffled under
  // the cursor - the list has to hold still while somebody compares it. A
  // headline edited by hand is not among the three, so it is
  // appended rather than allowed to displace them.
  const headlineOptions = Array.from(
    new Set([...(draft.headlineOptions || []), draft.headline].filter((v): v is string => Boolean(v))),
  );
  const titles = ["Start with your own story.", "Your profile. In your own voice.", "Ready when you are."];

  // The card follows the section being shaped: the matching block is
  // highlighted, and the card scrolls it into view - inside the card on a
  // desktop, on the page when the card is the whole screen on a phone.
  useEffect(() => {
    const box = scrollRef.current;
    if (!box) return;
    const target = box.parentElement?.querySelector<HTMLElement>('[data-current="true"]') ?? null;
    const behavior: ScrollBehavior = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    if (box.scrollHeight > box.clientHeight) {
      const top = target && box.contains(target) ? target.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - 6 : 0;
      box.scrollTo({ top: Math.max(0, top), behavior });
    } else if (showPreview && target) target.scrollIntoView({ block: "start", behavior });
  }, [section, showPreview, stage]);

  function go(next: number) { setStage(next); setError(""); setTimeout(() => { headlineRef.current?.focus(); headlineRef.current?.scrollIntoView({ behavior: "instant", block: "start" }); }, 0); }
  function choose(next: Section) { setSection(next); setHelp(null); setCheckGuidance(null); setStatus(""); }
  function changeDraft(next: ProfileDraft) { setDraft(next); setChecksStale(true); setError(""); }
  function helpButton(topic: HelpTopic) { return <button type="button" className={s.infoButton} aria-label={`How to write: ${HELP[topic].title}`} aria-haspopup="dialog" aria-expanded={help === topic} title={`Writing tips: ${HELP[topic].title}`} onClick={() => setHelp(topic)}><span className={s.infoBadge} aria-hidden="true"><Info size={18} /></span></button>; }
  function fieldHeading(id: string, label: string, topic: HelpTopic, required = true) { return <div className={s.fieldHeading}><label htmlFor={id}>{label}{required && <RequiredMark />}</label>{helpButton(topic)}</div>; }
  const helpSheet = help && typeof document !== "undefined" && createPortal(
    <HelpSheet title={HELP[help].title} onClose={() => setHelp(null)}>
      <div className={s.helpContent}>
        <section><h3>What to write</h3><p>{HELP[help].body}</p></section>
        {HELP[help].example && <section><h3>Example</h3><div className={s.helpExample}><p>{HELP[help].example}</p></div><p>Use your own role and facts; this shows the shape of a clear line.</p></section>}
        <section><h3>Before you keep it</h3><p>Check that every claim is accurate and something you can explain in an interview.</p></section>
      </div>
    </HelpSheet>,
    document.body,
  );
  function needsAccount(what: string, why: string) { setGate({ what, why }); }
  async function withToken(run: (t: string) => Promise<void>) {
    const t = await token();
    if (!t) { setError("Your session expired. Reload the page and sign in again."); setBusy(null); return; }
    await run(t);
  }

  // Stage one: write from the record, or read an export. Either way the
  // result is a draft on the right, and nothing kept yet.
  async function begin() {
    if (signedOut) {
      needsAccount("a profile written from your own record", "Writing it means reading everything you have done here - your stories, your answers, your interviews - so there has to be a record, and it has to belong to somebody. What is on the right is an example.");
      return;
    }
    if (start !== "record" && !file) { setError("Choose the file to start from first."); return; }
    setBusy("write"); setError("");
    await withToken(async t => {
      const result = start === "record" ? await writeProfessionalProfile(t, voice) : await importLinkedInPdf(t, file!);
      setBusy(null);
      if (!result) { setError(start === "record" ? "Could not reach the writer. Try again in a moment." : "Could not read that file. Try again in a moment."); return; }
      if ("error" in result) { setError(result.error); return; }
      if (!result.ok) { setError(result.reason); return; }
      setState(result); setDraft({ ...result.accepted, ...result.suggested }); setChecklist(result.checklist ?? null); setChecksStale(false);
      setStatus(start === "record" ? "Your profile is written. Review each section before keeping it." : "Your file has been read. Review each section before keeping it.");
      go(1);
    });
  }

  // The same record, the other register. A new draft replaces the working
  // one; sections already kept stay kept.
  async function rewriteIn(next: ProfileVoice) {
    if (signedOut) { needsAccount("a profile in your chosen voice", "Rewriting it means reading your own record again, so there has to be one, and it has to belong to somebody. What is on the right is an example."); return; }
    setVoice(next); setBusy("write"); setError("");
    await withToken(async t => {
      const result = await writeProfessionalProfile(t, next);
      setBusy(null);
      if (!result) { setError("Could not reach the writer. Try again in a moment."); return; }
      if (!result.ok) { setError(result.reason); return; }
      setState(result); setDraft({ ...result.accepted, ...result.suggested }); setChecklist(result.checklist ?? null); setChecksStale(false);
      setStatus(`Rewritten in the ${next === "genz" ? "Gen Z" : "formal"} voice. Review each section before keeping it.`);
    });
  }

  async function keepSection(id: Section) {
    if (!canKeepSection(id)) { setError("Complete the required fields in this section before keeping it."); return; }
    if (signedOut) { needsAccount("your professional profile", "Keeping a section means it is still there next week, and on the next version. That needs an account for it to live in."); return; }
    const current = draft[id] as string | string[] | ProfileEntry[] | undefined;
    if (current === undefined) return;
    setBusy("keep"); setError("");
    await withToken(async t => {
      const updated = await acceptProfileSection(t, id, current);
      setBusy(null);
      if (!updated) { setError("Could not keep that section. Try again in a moment."); return; }
      setState(prev => ({ ...prev, accepted: updated.accepted }));
      setCopied(previous => ({ ...previous, [id]: false }));
      setStatus(`${sections.find(item => item.id === id)?.title} kept. You can now copy it to LinkedIn.`);
    });
  }

  function editCheck(item: ProfileCheckItem) {
    const target = CHECK_SECTION[item.id] ?? "about";
    choose(target);
    setCheckGuidance(item);
    setHelp(null);
    setShowPreview(false);
    const behavior: ScrollBehavior = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    setTimeout(() => editorRef.current?.scrollIntoView({ block: "start", behavior }), 0);
  }

  async function pickPhoto(chosen: File | undefined) {
    if (!chosen) return;
    if (signedOut) { needsAccount("your photo", "A photo has to live somewhere, and that somewhere is an account."); return; }
    if (!/^image\/(jpeg|png|webp)$/.test(chosen.type) || chosen.size > 5 * 1024 * 1024) { setError("Choose a JPG, PNG or WebP image under 5 MB."); return; }
    setBusy("photo"); setError("");
    const blob = await squarePhoto(chosen).catch(() => null);
    if (!blob) { setBusy(null); setError("That photo could not be read. Please choose another."); return; }
    await withToken(async t => {
      const result = await uploadProfilePhoto(t, blob);
      setBusy(null);
      if (!result) { setError("Could not reach the server. Check you are online and try again."); return; }
      if ("error" in result) { setError(result.error); return; }
      setState(prev => ({ ...prev, accepted: result.accepted }));
      setStatus("Photo updated.");
      // The photo is also written onto the auth user, so a fresh session shows
      // it in the header without a reload. A failure here costs nothing.
      void supabaseBrowser().auth.refreshSession();
    });
  }

  async function copySection(id: Section) {
    if (signedOut) { needsAccount("your LinkedIn sections", "Sign in to keep and copy your own LinkedIn profile. You can continue exploring the example here."); return; }
    try { await navigator.clipboard.writeText(textFor(kept, id)); setCopied({ ...copied, [id]: true }); setStatus(`${sections.find(item => item.id === id)?.title} copied to your clipboard. Paste it into LinkedIn when ready.`); }
    catch { setStatus("Clipboard access was unavailable. Select the text below and copy it manually."); }
  }

  const checkPanel = checklist && <section className={s.checkPanel} aria-label="What a recruiter search sees">
    <button type="button" className={s.checkToggle} aria-expanded={showChecks} onClick={() => setShowChecks(!showChecks)}><span><span className={s.smallLabel}>WHAT A RECRUITER SEARCH SEES</span><strong>{checksStale ? "Checks from the earlier draft" : checklist.passed === checklist.counted ? "Every check passes." : `${checklist.passed} of ${checklist.counted} checks pass.`}</strong></span>{!checksStale && <span className={s.checkRing} data-all={checklist.passed === checklist.counted}><b>{checklist.passed}</b><small>/{checklist.counted}</small></span>}</button>
    {showChecks && <>
      <p className={s.quiet}>{checksStale ? "You have edited this draft since these checks were made. Use them as guidance; the pass count no longer describes your current wording." : "Review these checks against your draft. Add only facts you can back up."}</p>
      {(["fix", "info", "pass"] as const).map(status => {
        const items = checklist.items.filter(item => item.status === status);
        return items.length > 0 && <div key={status}><p className={`${s.smallLabel} ${s.checkGroup}`}>{checksStale ? "EARLIER DRAFT" : status === "pass" ? "ALREADY PASSING" : "WORTH REVIEWING"} · {items.length}</p><ul className={s.checkList}>{items.map(item => <li key={item.id} data-status={item.status}><span aria-hidden="true">{item.status === "pass" ? "✓" : item.status === "fix" ? "!" : "·"}</span><div><strong>{item.label}</strong><p>{item.detail}</p>{(item.ask || item.fix || item.link) && <div className={s.checkRowActions}>{(item.ask || item.fix) && <button type="button" onClick={() => editCheck(item)}>Edit {sections.find(entry => entry.id === (CHECK_SECTION[item.id] ?? "about"))?.title} <ArrowRight size={12} /></button>}{item.link && <Link href={item.link.href} className={s.checkLink}>{item.link.label} <ArrowRight size={12} /></Link>}</div>}</div></li>)}</ul></div>;
      })}
    </>}
  </section>;

  const profileCard = <section className={s.profileCard} aria-label="Profile appearance preview"><div className={s.cover}><span>YOUR PROFESSIONAL STORY</span><b>in</b></div><div className={s.profileBody}><div className={s.photoRow}><Avatar key={photo} name={name} src={photo} className={s.avatar} fallbackClassName={s.avatarFallback} /><button type="button" disabled={busy === "photo"} title="JPG, PNG or WebP. Optional." onClick={() => photoInput.current?.click()}>{busy === "photo" ? "Uploading…" : photo ? "Update photo" : "Add photo (optional)"}</button></div><h2>{name}</h2><p className={s.headline} data-current={section === "headline"}>{draft.headline || "Your headline will appear here."}</p><span className={s.profileLabel}>{signedOut ? "Example profile · not yours" : "Draft appearance · not published"}</span>
    <div className={s.profileScroll} ref={scrollRef} tabIndex={0} aria-label="Full profile as it would read">
      <div className={s.profileSection} data-current={section === "about"}><h3>About</h3><p>{draft.about || "Nothing written yet."}</p></div>
      <div className={s.profileSection} data-current={section === "experience"}><h3>Experience</h3>{draft.experience?.length ? draft.experience.map((entry, i) => <div className={s.profileEntry} key={i}><p><b>{entry.title}</b>{entry.organisation && <> · {entry.organisation}</>}</p>{entry.bullets.length > 0 && <ul>{entry.bullets.map((bullet, j) => <li key={j}>{bullet}</li>)}</ul>}</div>) : <p>Nothing written yet.</p>}</div>
      <div className={s.profileSection} data-current={section === "skills"}><h3>Skills</h3>{draft.skills?.length ? <div className={s.skillChoices}>{draft.skills.map((skill, i) => <span key={i}>{skill}</span>)}</div> : <p>Nothing written yet.</p>}</div>
      <div className={s.profileSection} data-current={section === "openTo"}><h3>Open to work</h3><p>{draft.openTo || "Nothing written yet."}</p></div>
    </div>
    <button type="button" className={s.previewHint} onClick={() => setShowPreview(false)}>Review each section before keeping it.</button></div></section>;

  return <div className={s.shell}>
    {helpSheet}
    {gate && <SignUpPrompt action={gate} onClose={() => setGate(null)} />}
    <div className={s.canvas}><main className={s.main}>
    <RememberHub path="/profile/professional" />
    <div className={s.breadcrumb}><Link href="/resume">← Application workspace</Link></div>
    <header className={s.heading}><div><p className={s.pageTitle}>Your LinkedIn Profile</p><h1 ref={headlineRef} tabIndex={-1}>{titles[stage]}</h1><p>{stage === 0 ? "Bring what you have. Build a professional introduction you can stand behind." : stage === 1 ? "Shape one section at a time. Keep only what feels true to you." : "Copy the sections you have kept, then choose when to update LinkedIn."}</p></div><span className={s.linkedInMark}>in</span></header>
    <nav className={`${s.steps} ${s.stages}`} aria-label="Profile stages">{["Your starting point", "Shape your profile", "Copy to LinkedIn"].map((label, i) => <button type="button" key={label} aria-current={stage === i ? "step" : undefined} data-past={i < stage} onClick={() => go(i)}><span>{i < stage && <Check size={14} />}</span><strong>{label}</strong></button>)}</nav>
    <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" className={s.srOnly} aria-label="Upload profile photo" onChange={e => { void pickPhoto(e.target.files?.[0]); e.target.value = ""; }} />
    <input ref={fileInput} type="file" accept={start === "linkedin" ? ".pdf,application/pdf" : ".pdf,.docx,.doc,application/pdf"} className={s.srOnly} aria-label="Choose the file to start from" onChange={e => { setFile(e.target.files?.[0] ?? null); e.target.value = ""; }} />
    {error && <p className={s.error} role="alert">{error}</p>}

    {stage === 0 && <div className={s.setupGrid}><section className={s.card}><div className={s.sectionHeading}><h2>How would you like to start?<RequiredMark /> {helpButton("source")}</h2></div><div className={s.sources} role="group" aria-label="Starting source (required)">{([{ id: "record", icon: "◎", title: "My Ascend record", description: "Use the experience and skills already saved here." }, { id: "linkedin", icon: "in", title: "My LinkedIn profile", description: "Bring in the PDF exported from your profile." }, { id: "resume", icon: "▤", title: "An existing resume", description: "Start with your roles, projects and education." }] as Array<{ id: StartWith; icon: string; title: string; description: string }>).map(item => <button type="button" key={item.id} aria-pressed={start === item.id} onClick={() => { setStart(item.id); setFile(null); setError(""); }}><span>{item.icon}</span><div><strong>{item.title}</strong><small>{item.description}</small></div><span className={s.sourceCheck}>{start === item.id && <Check size={15} />}</span></button>)}</div><div className={s.voiceBlock}><div className={s.sectionHeading}><h2>How should it sound?<RequiredMark /> {helpButton("voice")}</h2></div><div className={s.voices} role="group" aria-label="Voice (required)">{VOICES.map(item => <button type="button" key={item.id} aria-pressed={voice === item.id} onClick={() => setVoice(item.id)}><strong>{item.title}</strong><small>{item.description}</small><span className={s.sourceCheck}>{voice === item.id && <Check size={15} />}</span></button>)}</div><p className={s.quiet}>Both keep the same rules: your facts only, no adjectives about yourself, nothing a hiring manager would have to decode. You can switch later.</p></div>{start !== "record" && <><div className={s.uploadLabel}>Profile file<RequiredMark /> {helpButton("file")}</div><button type="button" className={s.upload} onClick={() => fileInput.current?.click()}><strong>{file?.name || "Choose a file"}</strong><small>{start === "linkedin" ? "The PDF that LinkedIn gives you." : "PDF or Word. Your jobs and dates come across with it."}</small></button></>}<div className={s.tip}><span><Spark size={14} /> THE NEXT STEP</span><p>Review your headline, About, experience and skills. Each section stays a suggestion until you keep it.</p></div></section><aside className={s.startAside}>{profileCard}<p className={s.quiet}>{signedOut ? "The profile shown is an example, not yours. Yours is written from your own stories, answers and interviews, which is the point at which this needs an account." : written ? "Your saved draft is shown. Starting again replaces it with a new draft; the sections you kept stay kept." : "Your profile appears here once it is written."}</p></aside></div>}

    {stage === 1 && <><div className={s.identity}><span className={s.identityIcon}><Spark size={18} /></span><div><span className={s.smallLabel}>THE STORY WE ARE WORKING FROM</span><p>{state.identity || "Your introduction starts with the experience and goals you choose to share."}</p></div><button type="button" onClick={() => { choose("about"); }}>Review About</button></div>
      <div className={s.voiceRow}><span><b>Voice:</b> {voice === "genz" ? "Gen Z" : "Formal"}</span>{VOICES.filter(item => item.id !== voice).map(item => <button type="button" key={item.id} disabled={busy !== null} onClick={() => void rewriteIn(item.id)}>{busy === "write" ? "Rewriting…" : `Rewrite in the ${item.title} voice`} <ArrowRight size={13} /></button>)}</div>
      <div className={s.workspaceTop}><span /><button type="button" onClick={() => setShowPreview(!showPreview)} aria-expanded={showPreview}>{showPreview ? "Back to editing" : "See profile preview"} ↗</button></div>
      <div className={s.workspace} data-show-preview={showPreview}><div className={s.workMain}><nav className={s.sectionTabs} aria-label="Profile sections">{sections.map(item => <button type="button" key={item.id} aria-current={section === item.id ? "true" : undefined} onClick={() => choose(item.id)}><span>{item.short}</span>{hasValue(kept, item.id) && same(draft[item.id], kept[item.id]) ? <Check size={12} /> : <i />}</button>)}</nav>
        <section className={`${s.card} ${s.sectionCard}`} ref={editorRef}>
          <div className={s.sectionHeading}><div><p className={s.eyebrow}>{info.title.toUpperCase()}</p><h2>{info.purpose}</h2></div><span className={isKept ? s.keptBadge : s.draftBadge}>{isKept ? "Kept" : "Draft"}</span></div>
          <p className={s.quiet}>{info.hint || "Write a clear line that reflects the work you have done and want to do next."}</p>
          {checkGuidance && <div className={s.editGuidance}><button type="button" aria-label="Dismiss recruiter guidance" onClick={() => setCheckGuidance(null)}>×</button><strong>{checkGuidance.label}</strong><p>{checkGuidance.ask || checkGuidance.detail}</p></div>}
          <div className={s.sectionTools}><span>Edit the draft below. Changes appear in the preview as you type.</span><button type="button" aria-pressed={compare} onClick={() => setCompare(!compare)}>{compare ? "Hide kept version" : "Compare with kept version"}</button></div>
          <div className={s.comparison} data-compare={compare}>
            {compare && <div className={s.original}><span className={s.smallLabel}>CURRENTLY KEPT</span><p>{textFor(kept, section) || "You have not kept this section yet."}</p></div>}
            <div className={s.suggestion}>
              {section === "headline" && headlineOptions.length > 1 && <div className={s.headlineOptions}><span className={s.smallLabel}>DRAFT OPTIONS</span>{headlineOptions.map((option, i) => <button type="button" key={option} aria-pressed={draft.headline === option} onClick={() => changeDraft({ ...draft, headline: option })}><span>OPTION {i + 1}<small>{option.length} characters</small></span><strong>{option}</strong>{draft.headline === option && <Check size={14} />}</button>)}</div>}
              {section === "experience" ? <div className={s.experienceEdits}>
                {(draft.experience ?? []).map((entry, index) => <div className={s.experienceEdit} key={index}>
                  <div className={s.experienceEditTitle}><strong>Role {index + 1}</strong><button type="button" onClick={() => changeDraft({ ...draft, experience: draft.experience?.filter((_, i) => i !== index) })}>Remove role</button></div>
                  <div className={s.fieldBlock}>{fieldHeading(`job-title-${index}`, "Job title", "jobTitle")}<input id={`job-title-${index}`} required aria-required="true" value={entry.title} placeholder="e.g. Customer Success Associate" onChange={e => changeDraft({ ...draft, experience: draft.experience?.map((job, i) => i === index ? { ...job, title: e.target.value } : job) })} /></div>
                  <div className={s.fieldBlock}>{fieldHeading(`organisation-${index}`, "Organisation", "organisation")}<input id={`organisation-${index}`} required aria-required="true" value={entry.organisation} placeholder="e.g. Acme Retail" onChange={e => changeDraft({ ...draft, experience: draft.experience?.map((job, i) => i === index ? { ...job, organisation: e.target.value } : job) })} /></div>
                  <div className={s.fieldBlock}>{fieldHeading(`responsibilities-${index}`, "Work and outcomes · one per line", "responsibilities", false)}<textarea id={`responsibilities-${index}`} rows={5} value={entry.bullets.join("\n")} placeholder="Describe what you owned and what happened" onChange={e => changeDraft({ ...draft, experience: draft.experience?.map((job, i) => i === index ? { ...job, bullets: e.target.value.split("\n") } : job) })} /></div>
                </div>)}
                <button type="button" className={s.addRole} onClick={() => changeDraft({ ...draft, experience: [...(draft.experience ?? []), { title: "", organisation: "", bullets: [] }] })}>+ Add a role</button>
              </div> : <div className={s.fieldBlock}>
                {fieldHeading(`profile-${section}`, section === "skills" ? "Skills · one per line" : section === "openTo" ? "Roles you are open to" : info.title, section)}
                <textarea id={`profile-${section}`} rows={section === "about" ? 8 : 4} required aria-required="true" value={section === "skills" ? draft.skills?.join("\n") || "" : value} placeholder={section === "headline" ? "e.g. Operations Coordinator | Store operations and team support" : section === "skills" ? "One skill on each line" : section === "openTo" ? "e.g. Customer Success Associate roles" : "Describe your experience in your own words"} onChange={e => changeDraft({ ...draft, [section]: section === "skills" ? e.target.value.split("\n").map(line => line.trim()).filter(Boolean) : e.target.value })} />
              </div>}
            </div>
          </div>
          <div className={s.keepRow}><span>{isKept ? "This draft matches the version you kept." : "Keep this section when it is accurate and complete."}</span><button type="button" disabled={isKept || !canKeep || busy !== null} onClick={() => void keepSection(section)}>{busy === "keep" ? "Keeping…" : isKept ? "Kept" : `Keep ${info.title.toLowerCase()}`} <Check size={15} /></button></div>
        </section>
      </div><aside className={s.previewAside}>{profileCard}{checkPanel}<div className={s.tip}><span><Spark size={14} /> ONE SECTION AT A TIME</span><p>Keeping a section saves it to your record. Nothing is published to LinkedIn until you copy it across yourself.</p></div></aside></div></>}

    {stage === 2 && <div className={s.transferGrid}><section className={s.card}><span className={s.smallLabel}>YOUR PROFILE SECTIONS</span><h2 className={s.transferTitle}>Review what you will take to LinkedIn.</h2><p className={s.quiet}>Each section shows the version you kept, or its draft if you have not kept one yet. Keep a draft when it reads right, then copy it. Nothing is published automatically.</p><div className={s.copyList}>{sections.map(item => {
      const saved = textFor(kept, item.id);
      const current = textFor(draft, item.id);
      const changed = Boolean(saved) && !same(draft[item.id], kept[item.id]);
      return <details key={item.id} open={Boolean(expandedCopy[item.id])}><summary onClick={event => { event.preventDefault(); setExpandedCopy(previous => ({ ...previous, [item.id]: !previous[item.id] })); }}><span className={saved ? s.readyDot : s.emptyDot}>{saved ? <Check size={13} /> : "·"}</span><span><strong>{item.title}</strong><small>{copied[item.id] ? "Copied to clipboard" : saved ? changed ? "Kept version ready · draft has changes" : "Kept · ready to copy" : current ? "Draft ready to review" : "Add this section when ready"}</small></span><span>{expandedCopy[item.id] ? "−" : "+"}</span></summary><p className={s.copyText}>{saved || current || "Nothing written here yet."}</p>{changed && <p className={s.quiet}>Your newer draft is not kept yet. Review it before replacing the version above.</p>}<div>{saved && <button type="button" onClick={() => void copySection(item.id)}>{copied[item.id] ? "Copy again" : `Copy ${item.title.toLowerCase()}`}</button>}{!saved && current && <button type="button" disabled={busy !== null || !canKeepSection(item.id)} onClick={() => void keepSection(item.id)}>{busy === "keep" ? "Keeping…" : `Keep ${item.title.toLowerCase()} to copy`}</button>}<button type="button" onClick={() => { choose(item.id); go(1); }}>{changed ? "Review newer draft" : current ? "Edit section" : "Add section"} <ArrowRight size={14} /></button></div></details>;
    })}</div></section><aside className={s.transferAside}><span className={s.linkedInMark}>in</span><h2>Your profile, on your terms.</h2><p>Nothing is published automatically. Copy your kept sections and paste them into your LinkedIn profile when you are ready.</p><ol><li>Copy a section from your checklist.</li><li>Open your profile editor on LinkedIn.</li><li>Paste, check the formatting, and save there.</li></ol><p className={s.quiet}>For experience, keep titles and organisations in their matching fields. Skills are added individually.</p><Link className={s.secondary} href="https://www.linkedin.com/in/me/" target="_blank" rel="noreferrer">Open LinkedIn <ArrowRight size={15} /></Link></aside></div>}
    <div className={status ? s.status : s.srOnly} role="status" aria-live="polite">{status}</div>
    <footer className={s.actionBar}><div>{stage > 0 && <><strong>{stage === 1 ? "Keep a section when it reads true to you." : "You decide when the world sees it."}</strong><small>{stage === 1 ? "You can also review every draft on the next page." : "Copy controls use your clipboard; nothing is published."}</small></>}</div><div>{stage > 0 && <button type="button" className={s.backButton} onClick={() => go(stage - 1)}>Back</button>}<button type="button" className={s.primary} disabled={busy !== null} onClick={() => stage === 0 ? void begin() : go(stage === 2 ? 1 : stage + 1)}>{stage === 0 ? busy === "write" ? "Working on it…" : start === "record" ? "Write my profile" : "Read my file" : stage === 1 ? "Review and copy profile" : "Back to my profile"}<ArrowRight size={17} /></button></div></footer>
  </main></div></div>;
}
