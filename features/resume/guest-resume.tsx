"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { M3_ROOT } from "./m3";
import g from "./guest-resume.module.css";
import { FeaturePreview, FeatureTour } from "./feature-preview";
import { Files, Handover, Pencil } from "@/components/ui/icons";
import { z } from "zod";
import { ResumeWorkbench } from "./resume-workbench";
import { SignUpPrompt, type GatedAction } from "@/components/auth/signup-gate";
import { resumeDraftIssue } from "./resume-draft-validation";
import { type ResumeData, type ResumeTemplate } from "./resume-api";
import { asTemplate } from "./templates";

const KEY = "ascend:guest-resume:v1";
const subscribe = () => () => {};
const mounted = () => true;
const server = () => false;
const empty: ResumeData = {header:{name:"",city:"",email:"",phone:""},summary:"",skills:[],experienceHeading:"Experience",experience:[],education:[],languages:[],activities:[],keywordsUsed:[]};
type Draft = {resume:ResumeData;template:ResumeTemplate};
export function readGuestResume(): Draft | null {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null") as unknown;
    const envelope = z.object({resume:z.record(z.string(),z.unknown()),template:z.string()}).safeParse(raw);
    if (!envelope.success) return null;
    const candidate = envelope.data.resume as unknown as ResumeData;
    if (!candidate.header || typeof candidate.header.name !== "string" || resumeDraftIssue({...candidate,header:{...candidate.header,name:candidate.header.name || "Draft"}})) return null;
    return {resume:{...candidate,keywordsUsed:[]},template:asTemplate(envelope.data.template)};
  } catch { return null; }
}
export function clearGuestResume() { localStorage.removeItem(KEY); }
export function GuestResume({ initialTrack = "student" }: { initialTrack?: "student" | "early_career" }) {
  const ready=useSyncExternalStore(subscribe,mounted,server);
  return ready ? <GuestEditor initialTrack={initialTrack} /> : <main className="p-6" role="status">Opening your resume editor…</main>;
}
function GuestEditor({ initialTrack }: { initialTrack: "student" | "early_career" }) {
  const [track, setTrack] = useState(initialTrack);
  const [draft,setDraft]=useState<Draft>(()=>readGuestResume()??{resume:empty,template:"classic"});
  // Preserve the saved layout while keeping content editing first.
  const [hadDraft]=useState(()=>readGuestResume()!==null);
  // A first visit chooses how to start, as a signed-in one does; a draft
  // already in this browser goes straight back to its editor.
  const [writing, setWriting] = useState(hadDraft);
  // The way that needs an account, explained before it is asked for.
  const [needsAccount, setNeedsAccount] = useState<"upload" | "details" | null>(null);
  // The features an account adds, shown as examples when asked for.
  const [touring, setTouring] = useState(false);
  const [failed,setFailed]=useState(false);
  const [message,setMessage]=useState("");
  const [gate, setGate] = useState<GatedAction | null>(null);
  function requireAccount(action: "suggestions" | "regenerate" | "download") {
    const why = action === "download" ? "Sign in to download your resume. The draft you entered is kept in this browser and can be imported into your account." : action === "suggestions" ? "Sign in to get suggestions based on your resume. Your draft stays in this browser." : "Sign in to regenerate your draft from your change requests. Your resume stays in this browser.";
    setGate({ what: action === "download" ? "your resume download" : "AI help with your resume", why });
  }
  function save(next:Draft) {
    setDraft(next);
    try { localStorage.setItem(KEY,JSON.stringify(next));setFailed(false); } catch {setFailed(true);}
  }
  function download() { requireAccount("download"); }

  function startOver() {
    if (!window.confirm("Start over? This clears the resume kept in this browser. Sign in and save it to your account first if you want to keep it.")) return;
    try { clearGuestResume(); setDraft({ resume: empty, template: "classic" }); setMessage("Started over - the draft in this browser is cleared."); }
    catch { setMessage("This browser would not let the draft be cleared. Use your browser's site-data settings."); }
  }
  if (!writing) return <main className={`${g.page} ${M3_ROOT}`}>
    <Link className={g.back} href="/resume">← Apply</Link>
    <header className={g.header}><h1>Create resume</h1></header>
    <section className={g.choose} aria-labelledby="guest-start-title">
      <h2 id="guest-start-title">How would you like to start?</h2>
      <div className={g.ways}>
        <button type="button" className={g.way} onClick={() => setWriting(true)}>
          <span className={g.wayIcon} aria-hidden="true"><Pencil size={22} /></span>
          <strong>Write it myself</strong>
          <span className={g.wayNote}>Start now - no account needed</span>
        </button>
        <button type="button" className={g.way} aria-expanded={needsAccount === "upload"} onClick={() => setNeedsAccount("upload")}>
          <span className={g.wayIcon} aria-hidden="true"><Handover size={22} /></span>
          <strong>Upload a resume</strong>
          <span className={g.wayBadge}>With an account</span>
        </button>
        <button type="button" className={g.way} onClick={() => setWriting(true)}>
          <span className={g.wayIcon} aria-hidden="true"><Files size={22} /></span>
          <strong>Fill in my details</strong>
          <span className={g.wayNote}>Start now - no account needed</span>
        </button>
      </div>
      {/* Said before it is asked for: what this way does, and that an account
          brings them straight back to it. */}
      {needsAccount && <div className={g.needsAccount} role="region" aria-label={needsAccount === "upload" ? "Upload a resume" : "Fill in my details"}>
        <p>{needsAccount === "upload"
          ? "We read your resume, keep what you wrote, and show what is missing for the role you want. Reading a file needs an account - create one and you come straight back here, ready to upload."
          : "Answer a few questions and we write your first draft from them. Writing it needs an account - create one and you come straight back here to start."}</p>
        <div className={g.accountActions}>
          <Link className={g.primary} href={`/signup?next=${encodeURIComponent(`/resume/build?start=${needsAccount}`)}`}>Create an account</Link>
          <Link className={g.secondary} href={`/login?next=${encodeURIComponent(`/resume/build?start=${needsAccount}`)}`}>Sign in</Link>
          <button type="button" className={g.textButton} onClick={() => setWriting(true)}>Write it myself instead</button>
        </div>
      </div>}
      <p className={g.signIn}>Already have an account? <Link href="/login?next=%2Fresume%2Fbuild">Sign in</Link></p>
    </section>
  </main>;

  // Signed out: the same builder, with one clear way to keep it and get the
  // rest - an account - and nothing that reads as a warning before they start.
  return <main className={`${g.page} ${M3_ROOT}`}>
    {gate && <SignUpPrompt action={gate} onClose={() => setGate(null)} />}
    <Link className={g.back} href="/resume">← Apply</Link>
    <header className={g.header}>
      <h1>Create resume</h1>
      <p>Kept in this browser as you type.</p>
    </header>
    <section className={g.account} aria-labelledby="guest-account-title">
      <div>
        <h2 id="guest-account-title">Save it to your account</h2>
        <p>Keep this draft, get AI help with the wording, see suggestions for it and download it after signing in. You can import the draft kept in this browser.</p>
      </div>
      <div className={g.accountActions}>
        <Link className={g.primary} href="/signup?next=%2Fresume%2Fbuild">Create an account</Link>
        <Link className={g.secondary} href="/login?next=%2Fresume%2Fbuild">Sign in</Link>
      </div>
      <button type="button" className={g.tourToggle} aria-expanded={touring} onClick={() => setTouring(open => !open)}>{touring ? "Hide the examples" : "See what you get with an account"}</button>
      {touring && <div className={g.tour}><FeatureTour /></div>}
    </section>
    <fieldset className={g.track}>
      <legend>Your experience</legend>
      <div>{([["student", "Student / first job"], ["early_career", "I have work experience"]] as const).map(([id, title]) => <label key={id} data-on={track === id || undefined}>
        <input type="radio" name="resume-guidance" checked={track === id} onChange={() => setTrack(id)} />{title}
      </label>)}</div>
    </fieldset>
    {message && <p className={g.message} role="status">{message}</p>}
    <ResumeWorkbench saveScope="browser" track={track} resume={draft.resume} template={draft.template} role="" onChange={resume=>save({...draft,resume})} onTemplate={template=>save({...draft,template})} templateChosen={hadDraft} disabled={false} example={false} saveLabel={failed?"Browser storage unavailable. Keep this tab open until you can sign in and save your work.":"Draft kept in this browser only"} saveFailed={failed} onRetry={()=>save(draft)} onDownload={download} onRequireAccount={requireAccount} locked={tool => <FeaturePreview kind={tool} />} />
    <div className={g.startOver}><button type="button" onClick={startOver}>Start over</button><span>On a shared device? Start over when you finish - it clears the draft from this browser.</span></div>
  </main>;
}
export function GuestDraftImport({onImport}:{onImport:(draft:Draft)=>Promise<void>}) {
  const ready=useSyncExternalStore(subscribe,mounted,server);
  return ready?<ImportNotice onImport={onImport}/>:null;
}
function ImportNotice({onImport}:{onImport:(draft:Draft)=>Promise<void>}) {
  const [draft,setDraft]=useState(readGuestResume);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  if(!draft)return null;
  return <section className="my-4 rounded-xl border border-violet-300 p-4" aria-label="Resume from this browser"><h2 className="font-semibold">You have a draft in this browser</h2><p>Import it into your account to continue editing. Your other saved resumes stay available.</p>{error&&<p role="alert">{error}</p>}<button className="min-h-11 underline" disabled={busy} onClick={async()=>{setBusy(true);setError("");try{await onImport(draft);clearGuestResume();setDraft(null);}catch(e){setError(e instanceof Error?e.message:"Could not import. Your browser draft is still available.");}finally{setBusy(false);}}}>{busy?"Importing…":"Import my draft"}</button></section>;
}
