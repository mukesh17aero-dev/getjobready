"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  acceptProfileSection,
  importLinkedInPdf,
  reviseProfessionalProfile,
  uploadProfilePhoto,
  writeProfessionalProfile,
  type ProfileDraft,
  type ProfileEntry,
  type ProfileState,
} from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { SignUpPrompt, type GatedAction } from "@/components/signup-gate";
import { Avatar } from "@/components/avatar";
import { RememberHub } from "@/components/remember-hub";
import { ArrowRight, Check, Spark } from "@/components/icons";
import s from "./professional-studio.module.css";

// The LinkedIn Profile Builder, as approved in the /preview-professional-studio
// concept: three stages - where you start from, shaping one section at a time,
// and copying what you kept across to LinkedIn.
//
// Three things this screen keeps doing from the builder it replaces:
//
//   Show the refusals. When Scribe will not do something because it would
//   mean inventing a fact, that sits in its reply as its own paragraph.
//
//   Report what it took on trust. Facts that arrived through an instruction
//   are listed back, because they are what this person will be asked to stand
//   behind in a room we are not in.
//
//   Change nothing without being told. Every section is a draft until it is
//   kept, one at a time.

const sections = [
  { id: "headline" as const, title: "Headline", short: "Headline", purpose: "Make your direction clear at a glance.", hint: "" },
  { id: "about" as const, title: "About", short: "About", purpose: "Give someone a reason to read on.", hint: "Connect your experience to your next step. Keep it specific and easy to explain in person." },
  { id: "experience" as const, title: "Experience", short: "Experience", purpose: "Show what you did, and why it mattered.", hint: "Review one role at a time. Keep your contribution clear, and use only outcomes you can support." },
  { id: "skills" as const, title: "Skills", short: "Skills", purpose: "Make your strengths easy to find.", hint: "Keep the skills you could demonstrate or discuss with a recruiter." },
  { id: "openTo" as const, title: "Open to work", short: "Open to", purpose: "Help the right opportunities find you.", hint: "Describe the roles you want. Your visibility settings remain your choice on LinkedIn." },
];
type Section = typeof sections[number]["id"];
type StartWith = "record" | "linkedin" | "resume";
type Reply = { reply: string; changed: string[]; added: string[]; declined: string | null; followUp: string | null };
type Turn = { ask: string; reply: string; followUp: string | null };

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
  const [file, setFile] = useState<File | null>(null);
  const [compare, setCompare] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [edit, setEdit] = useState(false);
  const [request, setRequest] = useState("");
  const [reply, setReply] = useState<Reply | null>(null);
  const [thread, setThread] = useState<Turn[]>([]);
  const [busy, setBusy] = useState<"write" | "revise" | "keep" | "photo" | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [gate, setGate] = useState<GatedAction | null>(null);
  const [copied, setCopied] = useState<Partial<Record<Section, boolean>>>({});
  const photoInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const kept = state.accepted;
  const photo = state.accepted.photo || "";
  const info = sections.find(item => item.id === section)!;
  const value = textFor(draft, section);
  const isKept = hasValue(kept, section) && same(draft[section], kept[section]);
  const keptCount = sections.filter(item => hasValue(kept, item.id) && same(draft[item.id], kept[item.id])).length;
  const name = state.name || (signedOut ? "Anjali Kumar" : "Your name");
  const headlineOptions = Array.from(new Set([draft.headline, ...(draft.headlineOptions || [])].filter((v): v is string => Boolean(v))));
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
  function choose(next: Section) { setSection(next); setEdit(false); setReply(null); setRequest(""); setStatus(""); }
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
      const result = start === "record" ? await writeProfessionalProfile(t) : await importLinkedInPdf(t, file!);
      setBusy(null);
      if (!result) { setError(start === "record" ? "Could not reach the writer. Try again in a moment." : "Could not read that file. Try again in a moment."); return; }
      if ("error" in result) { setError(result.error); return; }
      if (!result.ok) { setError(result.reason); return; }
      setState(result); setDraft({ ...result.accepted, ...result.suggested }); setThread([]); setReply(null);
      setStatus(start === "record" ? "Your profile is written. Review each section before keeping it." : "Your file has been read. Review each section before keeping it.");
      go(1);
    });
  }

  async function keepSection() {
    if (signedOut) { needsAccount("your professional profile", "Keeping a section means it is still there next week, and on the next version. That needs an account for it to live in."); return; }
    const current = draft[section] as string | string[] | ProfileEntry[] | undefined;
    if (current === undefined) return;
    setBusy("keep"); setError("");
    await withToken(async t => {
      const updated = await acceptProfileSection(t, section, current);
      setBusy(null);
      if (!updated) { setError("Could not keep that section. Try again in a moment."); return; }
      setState(prev => ({ ...prev, accepted: updated.accepted }));
      setCopied({ ...copied, [section]: false });
      setStatus(`${info.title} kept.`);
    });
  }

  async function askScribe() {
    const text = request.trim();
    if (text.length < 3) return;
    if (signedOut) { needsAccount("Scribe, on your own profile", "Scribe rewrites what is on the right from your own record. That means there has to be a record, and it has to belong to somebody."); return; }
    setBusy("revise"); setError("");
    await withToken(async t => {
      const result = await reviseProfessionalProfile(t, text, thread);
      setBusy(null);
      if (!result) { setError("Could not reach Scribe. Try again in a moment."); return; }
      if (!result.ok) { setError(result.reason); return; }
      setState(prev => ({ ...prev, suggested: result.suggested }));
      setDraft({ ...state.accepted, ...result.suggested });
      setReply(result.revision);
      setThread(list => [...list, { ask: text, reply: result.revision.reply, followUp: result.revision.followUp }]);
      setRequest("");
    });
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
    try { await navigator.clipboard.writeText(textFor(kept, id)); setCopied({ ...copied, [id]: true }); setStatus(`${sections.find(item => item.id === id)?.title} copied to your clipboard. Paste it into LinkedIn when ready.`); }
    catch { setStatus("Clipboard access was unavailable. Select the text below and copy it manually."); }
  }

  const profileCard = <section className={s.profileCard} aria-label="Profile appearance preview"><div className={s.cover}><span>YOUR PROFESSIONAL STORY</span><b>in</b></div><div className={s.profileBody}><div className={s.photoRow}><Avatar key={photo} name={name} src={photo} className={s.avatar} fallbackClassName={s.avatarFallback} /><button type="button" disabled={busy === "photo"} onClick={() => photoInput.current?.click()}>{busy === "photo" ? "Uploading…" : photo ? "Update photo" : "Add photo"}</button></div><h2>{name}</h2><p className={s.headline} data-current={section === "headline"}>{draft.headline || "Your headline will appear here."}</p><span className={s.profileLabel}>{signedOut ? "Example profile · not yours" : "Draft appearance · not published"}</span>
    <div className={s.profileScroll} ref={scrollRef} tabIndex={0} aria-label="Full profile as it would read">
      <div className={s.profileSection} data-current={section === "about"}><h3>About</h3><p>{draft.about || "Nothing written yet."}</p></div>
      <div className={s.profileSection} data-current={section === "experience"}><h3>Experience</h3>{draft.experience?.length ? draft.experience.map((entry, i) => <div className={s.profileEntry} key={i}><p><b>{entry.title}</b>{entry.organisation && <> · {entry.organisation}</>}</p>{entry.bullets.length > 0 && <ul>{entry.bullets.map((bullet, j) => <li key={j}>{bullet}</li>)}</ul>}</div>) : <p>Nothing written yet.</p>}</div>
      <div className={s.profileSection} data-current={section === "skills"}><h3>Skills</h3>{draft.skills?.length ? <div className={s.skillChoices}>{draft.skills.map((skill, i) => <span key={i}>{skill}</span>)}</div> : <p>Nothing written yet.</p>}</div>
      <div className={s.profileSection} data-current={section === "openTo"}><h3>Open to work</h3><p>{draft.openTo || "Nothing written yet."}</p></div>
    </div>
    <button type="button" className={s.previewHint} onClick={() => setShowPreview(false)}>Review each section before keeping it.</button></div></section>;

  return <div className={s.shell}>
    {gate && <SignUpPrompt action={gate} onClose={() => setGate(null)} />}
    <div className={s.canvas}><main className={s.main}>
    <RememberHub path="/profile/professional" />
    <div className={s.breadcrumb}><Link href="/resume">← Application workspace</Link></div>
    <header className={s.heading}><div><p className={s.pageTitle}>Your LinkedIn Profile</p><h1 ref={headlineRef} tabIndex={-1}>{titles[stage]}</h1><p>{stage === 0 ? "Bring what you have. Build a professional introduction you can stand behind." : stage === 1 ? "Shape one section at a time. Keep only what feels true to you." : "Copy the sections you have kept, then choose when to update LinkedIn."}</p></div><span className={s.linkedInMark}>in</span></header>
    <nav className={`${s.steps} ${s.stages}`} aria-label="Profile stages">{["Your starting point", "Shape your profile", "Copy to LinkedIn"].map((label, i) => <button type="button" key={label} aria-current={stage === i ? "step" : undefined} data-past={i < stage} onClick={() => go(i)}><span>{i < stage && <Check size={14} />}</span><strong>{label}</strong></button>)}</nav>
    <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" className={s.srOnly} aria-label="Upload profile photo" onChange={e => { void pickPhoto(e.target.files?.[0]); e.target.value = ""; }} />
    <input ref={fileInput} type="file" accept={start === "linkedin" ? ".pdf,application/pdf" : ".pdf,.docx,.doc,application/pdf"} className={s.srOnly} aria-label="Choose the file to start from" onChange={e => { setFile(e.target.files?.[0] ?? null); e.target.value = ""; }} />
    {error && <p className={s.error} role="alert">{error}</p>}

    {stage === 0 && <div className={s.setupGrid}><section className={s.card}><div className={s.sectionHeading}><h2>How would you like to start?</h2></div><div className={s.sources} role="group" aria-label="Starting source">{([{ id: "record", icon: "◎", title: "My Ascend record", description: "Use the experience and skills already saved here." }, { id: "linkedin", icon: "in", title: "My LinkedIn profile", description: "Bring in the PDF exported from your profile." }, { id: "resume", icon: "▤", title: "An existing resume", description: "Start with your roles, projects and education." }] as Array<{ id: StartWith; icon: string; title: string; description: string }>).map(item => <button type="button" key={item.id} aria-pressed={start === item.id} onClick={() => { setStart(item.id); setFile(null); setError(""); }}><span>{item.icon}</span><div><strong>{item.title}</strong><small>{item.description}</small></div><span className={s.sourceCheck}>{start === item.id && <Check size={15} />}</span></button>)}</div>{start !== "record" && <button type="button" className={s.upload} onClick={() => fileInput.current?.click()}><strong>{file?.name || "Choose a file"}</strong><small>{start === "linkedin" ? "The PDF that LinkedIn gives you." : "PDF or Word. Your jobs and dates come across with it."}</small></button>}<div className={s.tip}><span><Spark size={14} /> THE NEXT STEP</span><p>Review your headline, About, experience and skills. Each section stays a suggestion until you keep it.</p></div></section><aside className={s.startAside}>{profileCard}<p className={s.quiet}>{signedOut ? "The profile shown is an example, not yours. Yours is written from your own stories, answers and interviews, which is the point at which this needs an account." : written ? "Your saved draft is shown. Starting again replaces it with a new draft; the sections you kept stay kept." : "Your profile appears here once it is written."}</p></aside></div>}

    {stage === 1 && <><div className={s.identity}><span className={s.identityIcon}><Spark size={18} /></span><div><span className={s.smallLabel}>THE STORY WE ARE WORKING FROM</span><p>{state.identity || "Your introduction starts with the experience and goals you choose to share."}</p></div><button type="button" onClick={() => { choose("about"); setEdit(true); }}>Review About</button></div>
      <div className={s.workspaceTop}><span><b>{keptCount}</b> of 5 sections kept</span><button type="button" onClick={() => setShowPreview(!showPreview)} aria-expanded={showPreview}>{showPreview ? "Back to editing" : "See profile preview"} ↗</button></div>
      <div className={s.workspace} data-show-preview={showPreview}><div className={s.workMain}><nav className={s.sectionTabs} aria-label="Profile sections">{sections.map(item => <button type="button" key={item.id} aria-current={section === item.id ? "true" : undefined} onClick={() => choose(item.id)}><span>{item.short}</span>{hasValue(kept, item.id) && same(draft[item.id], kept[item.id]) ? <Check size={12} /> : <i />}</button>)}</nav>
        <section className={`${s.card} ${s.sectionCard}`}><div className={s.sectionHeading}><div><p className={s.eyebrow}>{info.title.toUpperCase()}</p><h2>{info.purpose}</h2></div><span className={isKept ? s.keptBadge : s.draftBadge}>{isKept ? "Kept" : "Draft"}</span></div>{info.hint && <p className={s.quiet}>{info.hint}</p>}
          <div className={s.sectionTools}><button type="button" aria-pressed={compare} onClick={() => setCompare(!compare)}>{compare ? "Hide comparison" : "Compare with kept version"}</button><button type="button" aria-pressed={edit} onClick={() => setEdit(!edit)}>{edit ? "Done editing" : "Edit directly"}</button></div>
          <div className={s.comparison} data-compare={compare}>{compare && <div className={s.original}><span className={s.smallLabel}>CURRENTLY KEPT</span><p>{textFor(kept, section) || "You have not kept this section yet."}</p></div>}<div className={s.suggestion}><span className={s.smallLabel}>{isKept ? "YOUR KEPT VERSION" : "YOUR WORKING DRAFT"}</span>
            {edit ? section === "experience" ? <div className={s.experienceEdits}>{(draft.experience || []).map((entry, index) => <details key={index} open={index === 0}><summary>{entry.title} · {entry.organisation}</summary><label className={s.field}>Job title<input value={entry.title} onChange={e => setDraft({ ...draft, experience: draft.experience?.map((job, i) => i === index ? { ...job, title: e.target.value } : job) })} /></label><label className={s.field}>Organisation<input value={entry.organisation} onChange={e => setDraft({ ...draft, experience: draft.experience?.map((job, i) => i === index ? { ...job, organisation: e.target.value } : job) })} /></label><label className={s.field}>Responsibilities · one per line<textarea rows={4} value={entry.bullets.join("\n")} onChange={e => setDraft({ ...draft, experience: draft.experience?.map((job, i) => i === index ? { ...job, bullets: e.target.value.split("\n") } : job) })} /></label></details>)}</div> : <label className={s.field}>{section === "skills" ? "Skills · one per line" : info.title}<textarea rows={section === "about" ? 7 : 4} value={section === "skills" ? draft.skills?.join("\n") || "" : value} onChange={e => setDraft({ ...draft, [section]: section === "skills" ? e.target.value.split("\n").filter(Boolean) : e.target.value })} /></label> : section === "headline" ? <div className={s.headlineOptions}>{headlineOptions.length ? headlineOptions.map((option, i) => <button type="button" key={option} aria-pressed={draft.headline === option} onClick={() => setDraft({ ...draft, headline: option })}><span>OPTION {i + 1}<small>{option.length} characters</small></span><strong>{option}</strong>{draft.headline === option && <Check size={14} />}</button>) : <p>No headline written yet. Add one using Edit directly.</p>}</div> : section === "experience" ? <div className={s.experience}>{draft.experience?.length ? draft.experience.map((entry, i) => <details key={i} open={i === 0}><summary><span><b>{entry.title}</b><small>{entry.organisation}</small></span><span>+</span></summary><ul>{entry.bullets.map((bullet, j) => <li key={j}>{bullet}</li>)}</ul></details>) : <p>No experience written yet.</p>}</div> : section === "skills" ? <div className={s.skillChoices}>{draft.skills?.length ? draft.skills.map((skill, i) => <span key={i}>{skill}</span>) : <p>No skills written yet.</p>}</div> : <p className={s.sectionText}>{value || "Nothing written yet. Add your own words using Edit directly."}</p>}
          </div></div><div className={s.keepRow}><span>{isKept ? "This draft matches the version you kept." : "Keep this section when you can stand behind it."}</span><button type="button" disabled={isKept || !value.trim() || busy !== null} onClick={() => void keepSection()}>{busy === "keep" ? "Keeping…" : isKept ? "Kept" : `Keep ${info.title.toLowerCase()}`} <Check size={15} /></button></div>
        </section>
        <section className={s.scribe}><div className={s.scribeTitle}><span><Spark size={17} /></span><div><h2>A little help with your {info.title.toLowerCase()}?</h2><p>Tell Scribe what to change, in your own words. Nothing is kept until you say so.</p></div></div><div className={s.prompts}>{["Make it more concise", "Use simpler language", "Take out anything I cannot back up"].map(text => <button type="button" key={text} onClick={() => { setRequest(`${text} in my ${info.title.toLowerCase()}.`); setReply(null); }}>{text}</button>)}</div><label className={s.field}>Ask Scribe<textarea rows={2} value={request} disabled={busy !== null} onChange={e => setRequest(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void askScribe(); } }} placeholder={`What would you change in your ${info.title.toLowerCase()}?`} /></label><div className={s.scribeAction}><small>Enter to send, Shift + Enter for a new line.</small><button type="button" disabled={!request.trim() || busy !== null} onClick={() => void askScribe()}>{busy === "revise" ? "Working on it…" : "Ask Scribe"} <ArrowRight size={15} /></button></div>{reply && <div className={s.proposal}><span className={s.smallLabel}>SCRIBE</span><p>{reply.reply}</p>{reply.declined && <p><strong>Not changed: </strong>{reply.declined}</p>}{reply.added.length > 0 && <p className={s.quiet}>Added from what you told me: {reply.added.join("; ")}. Make sure you can stand behind it in the interview.</p>}{reply.followUp && <p><strong>{reply.followUp}</strong></p>}{reply.changed.length > 0 && <p className={s.quiet}>Updated: {reply.changed.join(", ")}. Review the draft above, then keep it when it reads true.</p>}</div>}</section>
      </div><aside className={s.previewAside}>{profileCard}<div className={s.photoNote}><button type="button" disabled={busy === "photo"} onClick={() => photoInput.current?.click()}>{photo ? "Choose a new photo" : "Upload profile photo"}</button><small>Optional · JPG, PNG or WebP · shown on your profile card</small></div><div className={s.tip}><span><Spark size={14} /> ONE SECTION AT A TIME</span><p>Keeping a section saves it to your record. Nothing is published to LinkedIn until you copy it across yourself.</p></div></aside></div></>}

    {stage === 2 && <div className={s.transferGrid}><section className={s.card}><span className={s.smallLabel}>YOUR COPY CHECKLIST</span><h2 className={s.transferTitle}>Take the parts you are happy with.</h2><p className={s.quiet}>Copying is available for sections you have kept. Review any remaining drafts when you are ready.</p><div className={s.copyList}>{sections.map(item => <details key={item.id}><summary><span className={hasValue(kept, item.id) ? s.readyDot : s.emptyDot}>{hasValue(kept, item.id) ? <Check size={13} /> : "·"}</span><span><strong>{item.title}</strong><small>{copied[item.id] ? "Copied to clipboard" : hasValue(kept, item.id) ? same(draft[item.id], kept[item.id]) ? "Kept · ready to copy" : "Kept version available · newer draft not kept" : "No kept version yet"}</small></span><span>+</span></summary><p className={s.copyText}>{textFor(kept, item.id) || "Return to this section and keep the version you want to use."}</p><div>{hasValue(kept, item.id) && <button type="button" onClick={() => void copySection(item.id)}>{copied[item.id] ? "Copy again" : `Copy ${item.title.toLowerCase()}`}</button>}<button type="button" onClick={() => { choose(item.id); go(1); }}>Review section <ArrowRight size={14} /></button></div></details>)}</div></section><aside className={s.transferAside}><span className={s.linkedInMark}>in</span><h2>Your profile, on your terms.</h2><p>Nothing is published automatically. Copy your kept sections and paste them into your LinkedIn profile when you are ready.</p><ol><li>Copy a section from your checklist.</li><li>Open your profile editor on LinkedIn.</li><li>Paste, check the formatting, and save there.</li></ol><p className={s.quiet}>For experience, keep titles and organisations in their matching fields. Skills are added individually.</p><Link className={s.secondary} href="https://www.linkedin.com/in/me/" target="_blank" rel="noreferrer">Open LinkedIn <ArrowRight size={15} /></Link></aside></div>}
    <div className={status ? s.status : s.srOnly} role="status" aria-live="polite">{status}</div>
    <footer className={s.actionBar}><div>{stage > 0 && <><strong>{stage === 1 ? `${keptCount} of 5 sections kept. You can return to the others.` : "You decide when the world sees it."}</strong><small>{stage === 1 ? "No need to finish every section in one sitting." : "Copy controls use your clipboard; nothing is published."}</small></>}</div><div>{stage > 0 && <button type="button" className={s.backButton} onClick={() => go(stage - 1)}>Back</button>}<button type="button" className={s.primary} disabled={busy !== null} onClick={() => stage === 0 ? void begin() : go(stage === 2 ? 1 : stage + 1)}>{stage === 0 ? busy === "write" ? "Working on it…" : start === "record" ? "Write my profile" : "Read my file" : stage === 1 ? "Review kept sections" : "Back to my profile"}<ArrowRight size={17} /></button></div></footer>
  </main></div></div>;
}
