"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Spark } from "@/components/icons";
import type { AssessableRole } from "@/lib/api";
import { ResumeFeedback } from "./resume-feedback";
import type { ResumeData, ResumeTemplate } from "@/lib/resume-api";
import { SAMPLE_RESUME, SAMPLE_REVIEW } from "@/lib/samples";
import type { StudioRecord } from "./preview-data";
import s from "./studio.module.css";

const steps = ["Start", "Details", "Your draft", "Review", "Export"];
const questions = [
  { title: "Make your experience specific.", question: "What were your main responsibilities in your most recent role?", hint: "Describe what you did yourself. You can leave this blank if your record already covers it.", group: "Your experience" },
  { title: "Show how you help a customer.", question: "Tell us about a customer issue you resolved or stopped from escalating.", hint: "What happened, what did you do, and how did it end?", group: "Customer situations" },
  { title: "Show how you choose what comes first.", question: "How did you prioritise when several requests arrived at once?", hint: "One real example is enough.", group: "Customer situations" },
  { title: "Make your communication visible.", question: "When did you explain something technical to a non-technical person?", hint: "What did they need to understand, and how did you help?", group: "Customer situations" },
  { title: "Show what you owned.", question: "Describe a problem you took from discovery through to a lasting fix.", hint: "Separate your contribution from what the wider team did.", group: "Your impact" },
  { title: "Give your work some scale.", question: "What did your dashboards measure, and who used them?", hint: "Use numbers only when you can support them.", group: "Your impact" },
  { title: "Make the outcome clear.", question: "What changed after an outage review or corrective action you worked on?", hint: "A concrete improvement helps more than an unsupported claim.", group: "Your impact" },
  { title: "Explain your team context.", question: "How many people did you plan work with, and what was the delivery cycle?", hint: "Skip this if planning was not part of your role.", group: "Your impact" },
];
const layouts: { id: ResumeTemplate; title: string; description: string }[] = [
  { id: "classic", title: "Classic", description: "Clear & familiar" },
  { id: "compact", title: "Compact", description: "More room for experience" },
  { id: "sidebar", title: "Sidebar", description: "Distinct section labels" },
];
const nextLinks = { readiness: "/practice/readiness", practice: "/practice", interview: "/interview", profile: "/profile" };
const nextLabels = { readiness: "Check your readiness", practice: "Practise a work situation", interview: "Practise your interview", profile: "Update your profile" };
function date(at: string) { return new Date(at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }); }

function Paper({ resume, template }: { resume: ResumeData; template: ResumeTemplate }) {
  return <article className={s.paper} data-template={template} aria-label="Resume document">
    <header><h2>{resume.header.name}</h2><p>{[resume.header.city, resume.header.email, resume.header.phone, resume.header.link].filter(Boolean).join(" · ")}</p></header>
    <section><h3>{resume.summaryHeading || "Summary"}</h3><p>{resume.summary}</p></section>
    <section><h3>Skills</h3>{resume.skills.map((group, i) => <p key={i}><b>{group.group}: </b>{group.items.join(" · ")}</p>)}</section>
    <section><h3>{resume.experienceHeading || "Experience"}</h3>{resume.experience.map((job, i) => <div className={s.job} key={i}><div><b>{job.title} · {job.organisation}</b><span>{job.period}</span></div><ul>{job.bullets.map((bullet, n) => <li key={n}>{bullet}</li>)}</ul></div>)}</section>
    <section><h3>Education</h3>{resume.education.map((item, i) => <p key={i}><b>{item.qualification}</b><br />{[item.institution, item.period].filter(Boolean).join(" · ")}{item.detail && <><br />{item.detail}</>}</p>)}</section>
    {!!resume.projects?.length && <section><h3>Projects</h3>{resume.projects.map((item, i) => <p key={i}><b>{item.title}</b> — {item.detail}{item.tools.length > 0 && ` (${item.tools.join(", ")})`}</p>)}</section>}
    {!!resume.certifications?.length && <section><h3>Certifications</h3>{resume.certifications.map((item, i) => <p key={i}>{[item.title, item.issuer, item.year].filter(Boolean).join(" · ")}</p>)}</section>}
    {!!resume.achievements?.length && <section><h3>Achievements</h3><ul>{resume.achievements.map((item, i) => <li key={i}>{item}</li>)}</ul></section>}
    {([ ["Languages", resume.languages], ["Activities", resume.activities], ["Interests", resume.interests] ] as const).map(([label, items]) => items?.length ? <section key={label}><h3>{label}</h3><p>{items.join(" · ")}</p></section> : null)}
  </article>;
}

export function ResumeStudio({ records, role, track: initialTrack, unavailable, roles, initialStep = 0, initialExample = null }: {
  records: StudioRecord[]; role: string; track: "student" | "early_career" | ""; unavailable: boolean; roles: AssessableRole[]; initialStep?: number; initialExample?: "targeted" | "general" | null;
}) {
  const [step, setStep] = useState(initialStep);
  const [mobile, setMobile] = useState(false);
  const [recordIndex, setRecordIndex] = useState(0);
  const [exampleMode, setExampleMode] = useState(Boolean(initialExample));
  const [exampleKind, setExampleKind] = useState<"targeted" | "general">(initialExample ?? "targeted");
  const saved = exampleMode ? undefined : records[recordIndex];
  const initial = saved?.resume ?? SAMPLE_RESUME;
  const [resume, setResume] = useState<ResumeData>(initial);
  const [making, setMaking] = useState("role");
  const [target, setTarget] = useState(role || saved?.role || "");
  const [track, setTrack] = useState(initialTrack);
  const [template, setTemplate] = useState<ResumeTemplate>(saved?.template ?? "classic");
  const [question, setQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [skills, setSkills] = useState("");
  const [posting, setPosting] = useState("");
  const [file, setFile] = useState("");
  const [editor, setEditor] = useState<"scribe" | "sections">("scribe");
  const [mobilePane, setMobilePane] = useState<"document" | "edit">("document");
  const [summary, setSummary] = useState(initial.summary);
  const [request, setRequest] = useState("");
  const [proposal, setProposal] = useState<string | null>(null);
  const [previous, setPrevious] = useState<ResumeData | null>(null);
  const [edited, setEdited] = useState(false);
  const [versions, setVersions] = useState(false);
  const [format, setFormat] = useState("docx");
  const [exported, setExported] = useState(false);
  const [status, setStatus] = useState("");
  const [problem, setProblem] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const answered = Object.values(answers).filter(v => v.trim()).length;
  const review = saved ? saved.review : exampleKind === "general" ? { ...SAMPLE_REVIEW, roleIdeas: [
    { role: "Customer Success Associate", why: "The example resume shows customer conversations, complaint handling and training others." },
    { role: "Retail Sales Associate", why: "Store experience and handling customers under volume are relevant starting points." },
    { role: "Operations Associate", why: "Organising activities and following processes suggest an operations direction to explore." },
  ] } : SAMPLE_REVIEW;
  const reviewAvailable = Boolean(review && !edited);
  const source = saved ? `Saved ${date(saved.at)} · ${saved.role || "General resume"}` : unavailable ? "Saved work unavailable · showing an example" : "Illustrative example · not your personal record";
  function go(next: number) { setStep(next); setStatus(""); setProblem(false); setTimeout(() => { heading.current?.focus(); heading.current?.scrollIntoView({ behavior: "instant", block: "start" }); }, 0); }
  function update(text: string) { setPrevious(resume); setResume({ ...resume, summary: text }); setSummary(text); setEdited(true); setProposal(null); setStatus("Summary updated in this preview. Review would need to be refreshed."); }
  function openRecord(index: number) { setExampleMode(false); const item = records[index]; setRecordIndex(index); setResume(item.resume); setSummary(item.resume.summary); setTemplate(item.template ?? "classic"); setTarget(item.role); setPrevious(null); setEdited(false); setProposal(null); setExported(false); setVersions(false); go(2); }
  const titles = ["Your experience. A clearer story.", "A little detail can make a difference.", "Make this sound like you.", "Know what your resume is saying.", exported ? "Your next move starts here." : "Take your story with you."];
  const subtitles = ["Start with what you have. Shape it for where you want to go.", "Your saved record is enough to start. Add only what helps.", "Read the draft, check the facts, and refine the words.", "See what is working and what could be stronger before you download.", exported ? "Keep your resume close, and take one useful next step." : "Choose a format for the way you plan to use it."];

  return <div className={s.preview}>
    <div className={s.toolbar}><span><i /> Resume studio · interactive preview</span><div role="group" aria-label="Preview width"><button aria-pressed={!mobile} onClick={() => setMobile(false)}>Desktop</button><button aria-pressed={mobile} onClick={() => setMobile(true)}>Mobile</button></div><Link href="/resume/build">Current builder ↗</Link></div>
    <div className={s.canvas} data-mobile={mobile}>
      <main className={s.main}>
        <div className={s.breadcrumb}><Link href="/resume">← Application workspace</Link><button onClick={() => setVersions(!versions)} aria-expanded={versions}>Saved versions <span>{records.length}</span></button></div>
        <div className={s.previewNote}>Design preview · uses {saved ? "a saved resume" : "example content"} · changes stay in this page</div>
        {versions && <section className={s.versions} aria-label="Saved resumes"><div className={s.sectionHeading}><h2>Your saved resumes</h2><button onClick={() => setVersions(false)}>Close</button></div>{records.length ? records.map((item, i) => <button key={`${item.at}-${i}`} onClick={() => openRecord(i)}><span><strong>{item.role || "General resume"}</strong><small>{date(item.at)} · {item.template || "classic"}</small></span><span>{item.downloadedAt ? "Downloaded" : "Draft"} <ArrowRight size={16} /></span></button>) : <p>No saved versions available. You can still explore the example flow.</p>}</section>}
        <header className={s.heading}><div><p className={s.eyebrow}>YOUR RESUME STUDIO</p><h1 ref={heading} tabIndex={-1}>{titles[step]}</h1><p>{subtitles[step]}</p></div><span className={s.stageCount}>Step {step + 1} of 5</span></header>
        <nav className={s.steps} aria-label="Resume stages">{steps.map((label, index) => <button key={label} aria-current={step === index ? "step" : undefined} data-past={index < step} onClick={() => go(index)}><span>{index < step ? <Check size={14} /> : `0${index + 1}`}</span><strong>{label}</strong></button>)}</nav>

        {step === 0 && <div className={s.setupGrid}>
          <section className={s.card}><div className={s.sectionHeading}><h2>What are you making?</h2><span>01 / Direction</span></div>
            <div className={s.purposes} role="group" aria-label="Resume purpose">{[{ id: "role", name: "For a role", copy: "Give it a clear direction", icon: "◎" }, { id: "general", name: "General resume", copy: "Bring your story together", icon: "▤" }, { id: "improve", name: "Improve existing", copy: "Start with your document", icon: "↥" }].map(item => <button key={item.id} aria-pressed={making === item.id} onClick={() => setMaking(item.id)}><span className={s.purposeIcon}>{item.icon}</span><strong>{item.name}</strong><small>{item.copy}</small></button>)}</div>
            {making === "improve" && <label className={s.upload}><strong>{file || "Choose your existing resume"}</strong><span>PDF, Word or text · file selection preview only</span><input type="file" accept=".pdf,.docx,.doc,.txt,.md" onChange={event => setFile(event.target.files?.[0]?.name ?? "")} /><small>Your file stays on this device; this preview does not read or upload it.</small></label>}
            {making !== "general" ? <><label className={s.field}>Target role {making === "improve" && <small>(optional)</small>}<input value={target} onChange={e => setTarget(e.target.value)} placeholder="e.g. Customer Success Associate" /></label><details className={s.details}><summary>Add a job posting <span>Optional</span></summary><label className={s.field}>Job description<textarea rows={3} value={posting} onChange={e => setPosting(e.target.value)} placeholder="Paste the responsibilities and requirements" /></label></details></> : <p className={s.softBox}>Bring your experience, projects and skills into one reusable resume. You can make a role-specific version later.</p>}
            <fieldset className={s.track}><legend>Where are you right now?</legend><div>{[{ id: "student" as const, label: "Still studying" }, { id: "early_career" as const, label: "Working, or have worked" }].map(item => <label key={item.id}><input type="radio" name="studio-track" checked={track === item.id} onChange={() => setTrack(item.id)} />{item.label}</label>)}</div></fieldset>
          </section>
          <aside className={s.setupAside}><section className={s.recordCard}><span className={s.smallLabel}><Check size={14} /> {saved ? "A HEAD START FROM YOUR RECORD" : "EXPLORE WITH AN EXAMPLE"}</span><h2>{initial.header.name}</h2><p>{initial.experience[0] ? `${initial.experience[0].title} · ${initial.experience[0].organisation}` : "Your experience will appear here"}</p><div className={s.facts}><span><b>{initial.experience.length}</b> experience {initial.experience.length === 1 ? "entry" : "entries"}</span><span><b>{initial.education.length}</b> education {initial.education.length === 1 ? "entry" : "entries"}</span><span><b>{initial.skills.reduce((n, g) => n + g.items.length, 0)}</b> listed skills</span></div><small>{source}</small></section>
            <section className={s.card}><div className={s.sectionHeading}><h2>Choose a look</h2><span>Change anytime</span></div><div className={s.templates} role="group" aria-label="Resume layout">{layouts.map(item => <button key={item.id} aria-pressed={template === item.id} onClick={() => setTemplate(item.id)}><span className={s.miniPaper} data-look={item.id}><b /><i /><i /><em /><i /><i /><em /><i /><i /></span><strong>{item.title}</strong><small>{item.description}</small></button>)}</div></section>
          </aside>
        </div>}

        {step === 1 && <div className={s.detailsGrid}>
          <aside className={s.questionRail}><span className={s.smallLabel}><Spark size={15} /> OPTIONAL DETAILS</span><h2>You do not need to start again.</h2><p>Your saved experience, education and skills come with you.</p><div className={s.questionGroups}>{["Your experience", "Customer situations", "Your impact"].map(group => <button key={group} aria-pressed={questions[question].group === group} onClick={() => setQuestion(questions.findIndex(q => q.group === group))}><span>{group}</span><small>{questions.reduce((n, q, i) => n + Number(q.group === group && Boolean(answers[i]?.trim())), 0)} / {questions.filter(q => q.group === group).length}</small></button>)}</div><p className={s.quiet}>These eight sample prompts follow the questions seen in the live walkthrough. The real builder would ask only what your record needs.</p></aside>
          <section className={s.card}><div className={s.sectionHeading}><span className={s.eyebrow}>QUESTION {question + 1} OF {questions.length}</span><span>Optional · {answered} answered</span></div><div className={s.progress}><span style={{ width: `${(question + 1) / questions.length * 100}%` }} /></div><h2 className={s.questionTitle}>{questions[question].title}</h2><label className={s.field}>{questions[question].question}<textarea rows={5} value={answers[question] || ""} onChange={e => setAnswers({ ...answers, [question]: e.target.value })} placeholder="Your own words are enough…" /></label><p className={s.quiet}>{questions[question].hint}</p><div className={s.questionActions}><button disabled={question === 0} onClick={() => setQuestion(question - 1)}>← Previous</button><button onClick={() => question < questions.length - 1 ? setQuestion(question + 1) : go(2)}>{question === questions.length - 1 ? "Finish details" : answers[question]?.trim() ? "Next question" : "Skip question"} <ArrowRight size={15} /></button></div><details className={s.details}><summary>Add another skill <span>Optional</span></summary><label className={s.field}>Skills you can demonstrate<input value={skills} onChange={e => setSkills(e.target.value)} placeholder="e.g. Jira, stakeholder communication" /></label></details><p className={s.quiet}>Preview answers stay here and are not added to the displayed resume.</p></section>
        </div>}

        {step === 2 && <><div className={s.documentToolbar}><span><i /> {source}{edited ? " · edited locally" : ""}</span><label>Layout<select value={template} onChange={e => setTemplate(e.target.value as ResumeTemplate)}>{layouts.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label></div><div className={s.mobileTabs} role="group" aria-label="Workspace view"><button aria-pressed={mobilePane === "document"} onClick={() => setMobilePane("document")}>Document</button><button aria-pressed={mobilePane === "edit"} onClick={() => setMobilePane("edit")}>Edit with Scribe</button></div>
          <div className={s.editorGrid} data-pane={mobilePane}><div className={s.document}><Paper resume={resume} template={template} /><p className={s.paperCaption}>Check every name, date and claim before sharing.</p></div><aside className={s.editor}><div className={s.editorTabs} role="group" aria-label="Editing mode"><button aria-pressed={editor === "scribe"} onClick={() => setEditor("scribe")}><Spark size={15} /> Scribe</button><button aria-pressed={editor === "sections"} onClick={() => setEditor("sections")}>Edit summary</button></div>
            {editor === "scribe" ? <><div className={s.assistantMark}><Spark size={22} /></div><h2>Your words. A little sharper.</h2><p>Tell Scribe what you want to change. Review the suggestion before keeping it.</p><div className={s.promptChips}>{["Make my summary shorter", "Bring my customer work forward", "Make the language simpler"].map(text => <button key={text} onClick={() => setRequest(text)}>{text} <span>↗</span></button>)}</div><label className={s.field}>What would you like to change?<textarea rows={3} value={request} onChange={e => setRequest(e.target.value)} placeholder="Ask in your own words…" /></label><button className={s.secondary} disabled={!request.trim()} onClick={() => { setProposal(resume.summary.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ")); setStatus("Example response shown: a shorter summary using existing sentences. No AI request was sent."); }}>Preview a suggestion <ArrowRight size={15} /></button><p className={s.quiet}>Demo response: shortens the summary using its first two sentences.</p>{proposal !== null && <div className={s.proposal}><span className={s.smallLabel}>SUGGESTED SUMMARY · DEMO</span><p>{proposal}</p><div><button onClick={() => setProposal(null)}>Dismiss</button><button onClick={() => update(proposal)}>Keep this change <Check size={14} /></button></div></div>}</> : <><h2>Edit your summary</h2><label className={s.field}>Summary<textarea rows={9} value={summary} onChange={e => setSummary(e.target.value)} /></label><button className={s.secondary} disabled={!summary.trim() || summary === resume.summary} onClick={() => update(summary)}>Apply to preview <Check size={15} /></button></>}
            {previous && <button className={s.undo} onClick={() => { setResume(previous); setSummary(previous.summary); setPrevious(null); setEdited(previous.summary !== initial.summary); setStatus("Last change undone."); }}>↶ Undo last change</button>}
            <div className={s.tip}><span><Spark size={14} /> KEEP IT TRUE</span><p>A stronger sentence should describe what you did. New skills, numbers and responsibilities need your confirmation.</p></div>
          </aside></div></>}

        {step === 3 && <ResumeFeedback review={review} role={saved ? saved.role : exampleKind === "general" ? "" : "Customer Success Associate"} roles={roles} example={!saved} edited={edited}
          onEdit={text => { setRequest(text); setEditor(text ? "scribe" : "sections"); setMobilePane("edit"); go(2); }}
          onExample={kind => { setExampleMode(true); setExampleKind(kind); setResume(SAMPLE_RESUME); setSummary(SAMPLE_RESUME.summary); setEdited(false); setPrevious(null); setProposal(null); setStatus("Showing illustrative feedback for an example resume, not your personal record."); }} />}

        {step === 4 && <div className={s.exportGrid}><section className={s.card}>
          {exported ? <><span className={s.successMark}><Check size={28} /></span><p className={s.eyebrow}>EXPORT COMPLETE · PREVIEW STATE</p><h2>A version you can come back to.</h2><p>In the live flow, your exported version and its review would stay together in Saved versions.</p><div className={s.fileCard}><span>▤</span><div><strong>{resume.header.name} — Resume.{format === "docx" ? "docx" : "pdf"}</strong><small>{template} layout · {saved?.role || "General resume"}</small></div></div><p className={s.quiet}>No file was downloaded and no saved record was changed by this preview.</p><button className={s.secondary} onClick={() => setExported(false)}>Back to export choices</button></> : <><span className={s.smallLabel}>YOUR DOCUMENT, READY TO TAKE AWAY</span><h2>How would you like to use it?</h2><div className={s.formats} role="group" aria-label="Export format">{[{ id: "docx", title: "Word document", ext: ".DOCX", copy: "Keep editing or upload to an application." }, { id: "pdf", title: "PDF document", ext: ".PDF", copy: "Keep the layout when sharing or printing." }].map(item => <button key={item.id} aria-pressed={format === item.id} onClick={() => setFormat(item.id)}><span className={s.fileIcon}>{item.ext}</span><span><strong>{item.title}</strong><small>{item.copy}</small></span><span className={s.radioDot}>{format === item.id && <Check size={13} />}</span></button>)}</div><div className={s.softBox}><strong>{resume.header.name}</strong><p>{saved?.role || "General resume"} · {layouts.find(item => item.id === template)?.title} layout</p><small>Print layout and file readability need to be checked on the actual export.</small></div><p className={s.quiet}>This preview demonstrates the export and saved screens. Use the current builder to download an actual file.</p></>}
        </section><aside className={s.exportAside}><div className={s.miniDocument}><Paper resume={resume} template={template} /></div><section className={s.nextCard}><span className={s.smallLabel}><Spark size={14} /> A USEFUL NEXT STEP</span><h2>{reviewAvailable && review ? nextLabels[review.nextStep.route] : "Make sure the story is yours."}</h2><p>{reviewAvailable && review ? review.nextStep.why : "Check your details and be ready to explain every claim before using this resume."}</p>{reviewAvailable && review ? <Link href={nextLinks[review.nextStep.route]}>Open next step <ArrowRight size={16} /></Link> : <button onClick={() => go(2)}>Review your draft <ArrowRight size={16} /></button>}</section></aside></div>}

        <div role="status" aria-live="polite" className={status ? s.status : s.srOnly}>{status}</div>
        {problem && <div className={s.error} role="alert"><strong>We could not finish that request.</strong><p>Your draft and answers are still here. Try again when you are ready.</p><button onClick={() => { setProblem(false); setStatus("Error dismissed. Your preview work is still here."); }}>Try again</button><small>Preview of the recoverable error state</small></div>}
        <footer className={s.actionBar}><div><strong>{step === 0 ? "Start with what is already yours." : step === 1 ? "No pressure to answer everything." : step === 2 ? "Happy with the words?" : step === 3 ? "You choose what to improve." : exported ? "Your resume stays part of your journey." : "One clear version, ready to share."}</strong><small>{step === 0 ? "You can add more detail and change the look later." : step === 1 ? `${answered} optional ${answered === 1 ? "answer" : "answers"} added in this preview.` : step === 2 ? "See the feedback before you export." : step === 3 ? "Suggestions help you decide; they are not a hiring score." : "Preview only · no profile changes or downloads."}</small></div><div>{step > 0 && <button className={s.backButton} onClick={() => go(step - 1)}>Back</button>}<button className={s.primary} onClick={() => step < 4 ? go(step + 1) : exported ? go(2) : setExported(true)}>{step === 0 ? "Continue to details" : step === 1 ? answered ? "Preview my draft" : "Use saved details" : step === 2 ? "Review my resume" : step === 3 ? "Continue to export" : exported ? "Back to my resume" : "Preview export complete"}<ArrowRight size={17} /></button></div></footer>
        <div className={s.demoControls}><span>Explore any stage above. Setup and answers do not regenerate the saved example.</span><button onClick={() => setProblem(!problem)}>Preview error state</button></div>
      </main>
    </div>
  </div>;
}
