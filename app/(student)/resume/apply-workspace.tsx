"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import type { HomeWorkItem, ProfileState, JobFitCheck } from "@/lib/api";
import { pickupReason } from "@/lib/home-presentation";
import { Avatar } from "@/components/avatar";
import { ToolLaunch } from "@/components/tool-launch";
import { RememberHub } from "@/components/remember-hub";
import { ArrowRight, Check, Spark } from "@/components/icons";
import type { ResumeSnapshot } from "./resume-excerpt";
import styles from "@/components/tool-hub.module.css";

// Professional Presence: the hub for the resume, the LinkedIn profile and the
// job-fit check, as approved in the /preview-apply-workspace concept. One tool
// is in view at a time; the panel shows what you have saved for it, or what
// you will create, beside the reason to open it now.

type ToolId = "resume" | "linkedin" | "fit";
const TOOLS = [
  { id: "resume" as const, title: "Resume Studio", short: "Resume Studio", subtitle: "Your experience, ready to share", href: "/resume/build", outcome: "A resume you can make your own.", intro: "Bring your experience, projects and skills into a clear document you can review and download.", why: "Most applications are filtered before a person reads them. Your resume is the first thing an employer, or their screening software, sees, and often the only thing. With little work history, it is where your projects, part-time work and college activities become evidence of what you can do. A clear resume earns a conversation. A vague one gets skipped.", points: ["Starts with the details in your career record", "Choose a layout and refine the wording", "Review the finished document before using it"], steps: ["Choose a layout and the role you want to aim at.", "Use your saved details or import an existing resume.", "Review the draft, refine it and download it."] },
  { id: "linkedin" as const, title: "LinkedIn Profile Builder", short: "LinkedIn Profile Builder", subtitle: "A clear professional introduction", href: "/profile/professional", outcome: "Sound like yourself. Show what you bring.", intro: "Build a headline and About section around your real experience, then choose what to keep.", why: "Recruiters search LinkedIn for people before a job is posted, and look you up after you apply. For a student or fresher it is the one public place where your story, skills and direction sit together. A profile that says where you are heading gets you found for roles you have not applied to yet, and gives an interviewer an easier first question.", points: ["A headline that makes your direction clear", "An About section grounded in your own record", "Review each suggestion before keeping it"], steps: ["Review the introduction your profile is based on.", "Refine the headline, About section and experience.", "Keep the sections you want and copy them to LinkedIn."] },
  { id: "fit" as const, title: "Job Fit Analyzer", short: "Job Fit Analyzer", subtitle: "See where you stand for one job", href: "/job-fit", outcome: "Know what this job needs from you.", intro: "Compare one job posting with your record, see what supports your application, and identify your next step.", why: "Applying to everything is how people land in roles that do not fit, and why so many applications go unanswered. Checking one posting against your record shows what you can already prove, what you can only claim, and the gap to close, so you spend your effort where it counts and can explain your fit in the interview.", points: ["A check against the specific job posting", "Evidence, claims and gaps shown separately", "A practical recommendation from the result"], steps: ["Paste the job posting you are considering.", "Compare its requirements with your record.", "Read the result and choose a useful next step."] },
];
function toolFor(item: HomeWorkItem): ToolId | null {
  return item.title.startsWith("Resume") ? "resume" : item.title.startsWith("LinkedIn") ? "linkedin" : item.title.startsWith("Job fit") ? "fit" : null;
}
function ToolIcon({ kind }: { kind: ToolId }) {
  return <svg aria-hidden="true" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {kind === "resume" ? <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5" /></> : kind === "linkedin" ? <><rect x="3" y="3" width="18" height="18" rx="4" /><path d="M8 10v7M8 7v.1M12 17v-7m0 3a3 3 0 0 1 6 0v4" /></> : <><circle cx="10" cy="10" r="6" /><path d="m15 15 5 5m-13-10 2 2 4-4" /></>}
  </svg>;
}

export function ApplyWorkspace({ name, photo, role, work, resume, professional, check, signedIn, available }: {
  name: string; photo?: string; role: string | null; work: HomeWorkItem[] | null; resume: ResumeSnapshot | null;
  professional: ProfileState | null; check: JobFitCheck | null; signedIn: boolean; available: Record<ToolId, boolean>;
}) {
  const [selected, setSelected] = useState<ToolId>(() => work?.map(toolFor).find((id): id is ToolId => id !== null) ?? "resume");
  const [activation, setActivation] = useState(0);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const tool = TOOLS.find(t => t.id === selected)!;
  const currentWork = work?.find(item => toolFor(item) === selected);
  const suggested = professional?.suggested;
  const hasSuggestion = Boolean(suggested?.headline || suggested?.about || suggested?.experience?.length || professional?.identity);
  const profile = suggested?.headline || suggested?.about ? suggested : professional?.accepted;
  const hasProfile = hasSuggestion || Boolean(profile?.headline || profile?.about);
  const hasData = selected === "resume" ? Boolean(resume) : selected === "linkedin" ? hasProfile : Boolean(check);
  // Signed out the data on show is a worked example, never "your saved work".
  const saved = signedIn && hasData;
  const unavailable = signedIn && !available[selected];
  const savedHref = selected === "resume" && resume ? `/resume/build?record=${encodeURIComponent(resume.at)}` : tool.href;
  const action = currentWork?.action ?? { href: savedHref, label: saved ? selected === "resume" ? "Open saved resume" : selected === "linkedin" ? "Open your LinkedIn profile" : "Open your job-fit check" : selected === "resume" ? "Build your resume" : selected === "linkedin" ? "Build your LinkedIn profile" : "Check a job posting" };
  function status(id: ToolId) {
    if (!signedIn) return "Example";
    if (!available[id]) return "Unable to load";
    const pending = work?.find(item => toolFor(item) === id);
    if (pending) return pending.status === "in_review" ? "In review" : pending.status === "follow_up" ? "Follow-up available" : "In progress";
    return id === "resume" && resume ? resume.downloaded ? "Downloaded" : "Saved resume" : id === "linkedin" && hasProfile ? "Saved profile" : id === "fit" && check ? "Check completed" : "Start here";
  }
  function onTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? 2 : (index + (event.key === "ArrowRight" ? 1 : 2)) % 3;
    setSelected(TOOLS[next].id); tabs.current[next]?.focus();
  }

  return <div className={styles.shell}>
    <div className={styles.canvas}>
      <main className={styles.main}>
        <RememberHub path="/resume" />
        <Link className={styles.back} href="/">← Home</Link>
        <header className={styles.header}><div><h1>Your professional<br /><span>presence.</span></h1><p>Put your experience to work: your resume, your LinkedIn profile, your next application.</p></div><div className={styles.role}><span className={styles.roleIcon}><Spark size={20} /></span><div><small>YOUR CHOSEN ROLE</small><strong>{role ?? "Still exploring"}</strong><Link href="/discover">{role ? "Explore your direction" : "Find a role to explore"} <ArrowRight size={13} /></Link></div></div></header>

        <div className={styles.tabs} data-layout="compact" role="tablist" aria-label="Application tools">{TOOLS.map((item, index) => <button key={item.id} ref={node => { tabs.current[index] = node; }} type="button" role="tab" id={`apply-tab-${item.id}`} aria-selected={selected === item.id} aria-controls="apply-panel" tabIndex={selected === item.id ? 0 : -1} onClick={() => { setSelected(item.id); setActivation(value => value + 1); }} onKeyDown={event => onTabKey(event, index)} className={styles.tab} data-kind={item.id}>
          <span className={styles.toolIcon}><ToolIcon kind={item.id} /></span><span className={styles.tabCopy}><strong className={styles.desktopTitle}>{item.title}</strong><strong className={styles.mobileTitle}>{item.short}</strong><small>{item.subtitle}</small><span className={styles.tabStatus}>{status(item.id)}</span></span><ArrowRight className={styles.tabArrow} size={17} />
        </button>)}</div>

        <section id="apply-panel" role="tabpanel" aria-labelledby={`apply-tab-${selected}`} tabIndex={0} className={styles.panel}>
          <div className={styles.artifact}>
            {unavailable ? <div className={styles.blank}><ToolIcon kind={selected} /><h2>Your saved work couldn’t load.</h2><p>Open the tool to try again and see your latest record.</p></div> : selected === "resume" ? <div className={styles.artifactScroll} tabIndex={0} aria-label="Your saved resume"><div className={styles.paper}>
              <div className={styles.paperHeading}><span className={styles.paperMonogram}>{(resume?.name || name || "A").charAt(0)}</span><div><h2>{resume?.name || name || "Your name"}</h2><p>{resume?.role || "Your next resume"}{!signedIn && " · example"}</p></div></div>
              {resume ? <>
                {resume.summary && <><h3>{resume.summaryHeading.toUpperCase()}</h3><p>{resume.summary}</p></>}
                {resume.skills.length > 0 && <><h3>SKILLS</h3>{resume.skills.map((group, index) => <p key={index}>{group.group && <b>{group.group}: </b>}{group.items.join(", ")}</p>)}</>}
                {resume.experience.length > 0 && <><h3>{resume.experienceHeading.toUpperCase()}</h3>{resume.experience.map((entry, index) => <div className={styles.experience} key={index}><strong>{entry.title}</strong><span>{[entry.organisation, entry.period].filter(Boolean).join(" · ")}</span>{entry.bullets.length > 0 && <ul>{entry.bullets.map((bullet, i) => <li key={i}>{bullet}</li>)}</ul>}</div>)}</>}
                {resume.projects.length > 0 && <><h3>PROJECTS</h3>{resume.projects.map((entry, index) => <div className={styles.experience} key={index}><strong>{entry.title}</strong>{entry.tools.length > 0 && <span>{entry.tools.join(", ")}</span>}<p>{entry.detail}</p></div>)}</>}
                {resume.education.length > 0 && <><h3>EDUCATION</h3>{resume.education.map((entry, index) => <div className={styles.experience} key={index}><strong>{entry.qualification}</strong><span>{[entry.institution, entry.period].filter(Boolean).join(" · ")}</span>{entry.detail && <p>{entry.detail}</p>}</div>)}</>}
                {resume.certifications.length > 0 && <><h3>CERTIFICATIONS</h3>{resume.certifications.map((entry, index) => <div className={styles.experience} key={index}><strong>{entry.title}</strong><span>{[entry.issuer, entry.year].filter(Boolean).join(" · ")}</span></div>)}</>}
                {resume.achievements.length > 0 && <><h3>ACHIEVEMENTS</h3><ul className={styles.paperList}>{resume.achievements.map((item, i) => <li key={i}>{item}</li>)}</ul></>}
                {resume.activities.length > 0 && <><h3>ACTIVITIES</h3><ul className={styles.paperList}>{resume.activities.map((item, i) => <li key={i}>{item}</li>)}</ul></>}
                {resume.languages.length > 0 && <><h3>LANGUAGES</h3><p>{resume.languages.join(", ")}</p></>}
                {resume.interests.length > 0 && <><h3>INTERESTS</h3><p>{resume.interests.join(", ")}</p></>}
                {!signedIn && <small className={styles.exampleLabel}>Example resume · not yours. Yours is written from your own record.</small>}
              </> : <><p className={styles.emptyIntro}>A clear document, built from your own experience.</p><div className={styles.outline}><span>Profile</span><i /><i /><span>Experience & projects</span><i /><i /><span>Education & skills</span><i /></div><small className={styles.exampleLabel}>Layout illustration · no resume saved yet</small></>}
            </div></div> : selected === "linkedin" ? <div className={styles.artifactScroll} tabIndex={0} aria-label="Your LinkedIn profile draft"><div className={styles.profileCard}>
              <div className={styles.profileCover}><span>YOUR PROFESSIONAL STORY</span><span className={styles.linkedinMark} aria-hidden="true">in</span></div>
              <div className={styles.profileBody}><Avatar name={name} src={profile?.photo || professional?.accepted.photo || photo} className={styles.avatar} /><h2>{name || "Your name"}</h2>
                <p className={styles.headline}>{profile?.headline || (hasProfile ? "Your introduction is the starting point." : "A headline that says what you bring.")}</p>
                <div className={styles.profileDivider} /><h3>{profile?.about ? "About" : professional?.identity ? "Your starting introduction" : "Your story, in your words"}</h3>
                <p>{profile?.about || professional?.identity || "Turn your experience, projects and interests into a professional introduction. Review every suggestion before keeping it."}</p>
                {Boolean(profile?.experience?.length) && <><div className={styles.profileDivider} /><h3>Experience</h3>{profile?.experience?.map((entry, index) => <div className={styles.profileEntry} key={index}><p><b>{entry.title}</b>{entry.organisation && <> · {entry.organisation}</>}</p>{entry.bullets.length > 0 && <ul>{entry.bullets.map((bullet, i) => <li key={i}>{bullet}</li>)}</ul>}</div>)}</>}
                {Boolean(profile?.skills?.length) && <><div className={styles.profileDivider} /><h3>Skills</h3><div className={styles.skills}>{profile?.skills?.map(skill => <span key={skill}>{skill}</span>)}</div></>}
                {profile?.openTo && <><div className={styles.profileDivider} /><h3>Open to work</h3><p>{profile.openTo}</p></>}
                <small className={styles.exampleLabel}>{!signedIn ? "Example profile · not yours. Yours is written from your own record." : hasProfile ? hasSuggestion ? "Draft · review before keeping" : "The sections you kept" : "Layout illustration · your LinkedIn profile will use your own record"}</small>
              </div>
            </div></div> : <div className={styles.artifactScroll} tabIndex={0} aria-label="Your latest job-fit check"><div className={styles.fitCard}><p className={styles.eyebrow}>{check ? signedIn ? "LATEST JOB-FIT CHECK" : "EXAMPLE JOB-FIT CHECK" : "ONE POSTING. YOUR EVIDENCE."}</p><h2>{check?.roleTitle || "Is this job a good next step?"}</h2>
              {check ? <>{check.inScope && <div className={styles.fitScore}><strong>{check.readiness}<small>/100</small></strong><span>Readiness for this posting<p>{signedIn ? "From your saved check" : "From an example check"}</p></span></div>}<p className={styles.verdict}>{check.verdict}</p><div className={styles.requirements}>{check.requirements.map((requirement, index) => <div key={index}><span data-state={requirement.state}>{requirement.state === "proof" ? "Evidence" : requirement.state === "claim" ? "Claim" : "Gap"}</span><p>{requirement.need}</p></div>)}</div><small className={styles.exampleLabel}>{!signedIn ? "Example check · not yours. Readiness for this posting, not a hiring probability." : "Readiness for this posting, not a hiring probability."}</small></> : <><p className={styles.emptyIntro}>See how your record lines up with a specific job.</p><div className={styles.fitLegend}><span>Evidence you can show</span><span>Claims to support</span><span>Gaps to work on</span></div><small className={styles.exampleLabel}>No saved check yet. Start with a job posting.</small></>}
            </div></div>}
            {saved && !unavailable && <Link href={savedHref} className={styles.artifactLink}>Open {selected === "resume" ? "full resume" : selected === "linkedin" ? "full profile" : "full check"}<ArrowRight size={14} /></Link>}
          </div>

          <div className={styles.guidance}><span className={styles.guidanceLabel}><Spark size={15} />{currentWork ? "PICK UP WHERE YOU LEFT OFF" : "MAKE YOUR NEXT MOVE"}</span><h2>{tool.outcome}</h2><p className={styles.intro}>{tool.intro}</p>
            <ToolLaunch activation={activation}>
              <Link href={action.href} className={styles.primary}>{action.label}<ArrowRight size={17} /></Link>
            </ToolLaunch>
            <div className={styles.why}><span>WHY THIS MATTERS</span><p>{tool.why}</p></div>
            <div className={styles.reason}><span>{currentWork ? "Why pick this up" : saved ? "Your work is saved" : "What you’ll leave with"}</span><p>{currentWork ? pickupReason(currentWork.reason) : saved ? "Open your saved work to review it and decide what you want to do next." : selected === "resume" ? "A resume you can review, refine and download." : selected === "linkedin" ? "A headline, About section and experience you can copy to LinkedIn." : "A clear view of what you can show for this posting and what to work on next."}</p></div>
            {saved && selected === "resume" && <Link className={styles.secondary} href="/resume/build">Create another resume <ArrowRight size={13} /></Link>}
            {saved && selected === "fit" && <Link className={styles.secondary} href="/job-fit">Check another posting <ArrowRight size={13} /></Link>}
            <ul className={styles.benefits}>{tool.points.map(point => <li key={point}><Check size={14} />{point}</li>)}</ul>
            <details className={styles.how} key={selected}><summary>How this tool works <span>+</span></summary><ol>{tool.steps.map(step => <li key={step}>{step}</li>)}</ol></details>
          </div>
        </section>
        <footer className={styles.record}><Link href="/profile">Review your profile <ArrowRight size={14} /></Link></footer>
      </main>
    </div>
  </div>;
}
