"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { checkJobFit, type JobFitCheck, type NextAction, type ReqState } from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { SignUpPrompt, type GatedAction } from "@/components/signup-gate";
import { FitRadar } from "@/components/fit-chart";
import s from "./job-fit-studio.module.css";

// The Job Fit Analyzer, as approved in public/previews/ascend-job-readiness.html:
// four stages - the job description, the skill map, the readiness path and
// the report - on top of the fit check the API already runs.
//
// The number is readiness against this one posting, from this person's own
// record, and it is labelled that way every time it appears. It is not odds
// of an offer; nobody can give those. The requirement list is what makes the
// number defensible: anybody who doubts it can see the lines it was built
// from and exactly what each one rests on.
//
// The preview also proposed mapping each requirement to a catalogue skill and
// carrying it through a role assessment into a per-skill report. The API does
// not return that yet, so this page shows what the check does return - each
// requirement, what backs it, and the one thing to do next - and hands over
// to the readiness assessment for the assessed evidence.

type Stage = "jd" | "skills" | "readiness" | "report";
const STAGES: Array<{ id: Stage; name: string }> = [
  { id: "jd", name: "Job description" },
  { id: "skills", name: "Skill map" },
  { id: "readiness", name: "Role readiness" },
  { id: "report", name: "Your report" },
];
const MIN_POSTING = 120;
const EXAMPLE_POSTING = `Customer Success Associate · Bengaluru

Help customers resolve order and service issues through calls and email. Explain the next steps in clear, simple language.

Stay calm when dealing with upset customers. Prioritise urgent requests during a busy shift. Investigate recurring delivery issues to find their cause.

Follow up with operations until each issue is resolved. Maintain accurate customer records in Salesforce.

Graduate in any discipline; 0–2 years of experience.`;
const ACTIONS: Record<NextAction, { href: string; label: string }> = {
  "practice-question": { href: "/interview/questions", label: "Practise the questions this tests" },
  story: { href: "/interview/questions", label: "Practise answering it" },
  interview: { href: "/interview/practice", label: "Run a practice interview" },
  record: { href: "/practice/readiness", label: "Check job fitness" },
};
const STATE_WORD: Record<ReqState, string> = { proof: "Proven", claim: "Claimed", gap: "Nothing yet" };
const STATE_CHIP: Record<ReqState, string> = { proof: s.earned, claim: s.amber, gap: s.neutral };
const HEADINGS: Record<Stage, [string, string, string]> = {
  jd: ["TURN A JOB POSTING INTO A PLAN", "See what this job needs from you.", "Read the posting against your record, then find out what you can demonstrate."],
  skills: ["THE JOB, TRANSLATED INTO REQUIREMENTS", "Know what matters before you prepare.", "Every requirement shows what on your record backs it, and what does not."],
  readiness: ["YOUR RECORD → THE RELEVANT WORK", "Find out where you stand by doing.", "The role assessment marks you on the job's own work."],
  report: ["FROM YOUR RECORD TO YOUR NEXT STEP", "Your readiness, made useful.", "Keep what is backed. Work on the gaps that matter for this job."],
};
const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
const shortDate = (iso: string) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? "" : `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
async function token(): Promise<string | null> {
  const { data } = await supabaseBrowser().auth.getSession();
  return data.session?.access_token ?? null;
}

export function JobFitStudio({ checks: initialChecks, signedOut = false }: { checks: JobFitCheck[]; signedOut?: boolean }) {
  const [stage, setStage] = useState<Stage>("jd");
  const [posting, setPosting] = useState(signedOut ? EXAMPLE_POSTING : "");
  const [checks, setChecks] = useState<JobFitCheck[]>(initialChecks);
  const [selectedId, setSelectedId] = useState<string | null>(signedOut ? (initialChecks[0]?.id ?? null) : null);
  const [tab, setTab] = useState<"overview" | "evidence" | "actions">("overview");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [gate, setGate] = useState<GatedAction | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const check = checks.find(c => c.id === selectedId) ?? null;
  const isExample = signedOut;
  const counts = check ? { proof: check.requirements.filter(r => r.state === "proof").length, claim: check.requirements.filter(r => r.state === "claim").length, gap: check.requirements.filter(r => r.state === "gap").length } : { proof: 0, claim: 0, gap: 0 };
  const stageIndex = STAGES.findIndex(item => item.id === stage);
  const left = MIN_POSTING - posting.trim().length;

  function go(next: Stage) {
    setStage(next); setError(null); setStatus("");
    setTimeout(() => { titleRef.current?.focus({ preventScroll: true }); titleRef.current?.scrollIntoView({ block: "start", behavior: "instant" }); }, 0);
  }
  const canOpen = (id: Stage) => id === "jd" || Boolean(check);
  function openCheck(c: JobFitCheck) { setSelectedId(c.id); setTab("overview"); go("report"); }

  async function run() {
    if (signedOut) {
      setGate({ what: "a fit check against your own record", why: "Checking you against a posting means reading everything you have done here - your stories, your answers, your interviews - so there has to be a record, and it has to belong to somebody. The stages after this one show what it produces." });
      return;
    }
    if (left > 0) { setStatus(`Add the responsibilities and requirements - at least ${MIN_POSTING} characters - so the check has enough to go on.`); return; }
    setBusy(true); setError(null); setStatus("");
    const t = await token();
    if (!t) { setBusy(false); setError("Your session expired. Reload the page and sign in again."); return; }
    const result = await checkJobFit(t, posting.trim());
    setBusy(false);
    if (!result) { setError("Could not reach the analyser. Try again in a moment."); return; }
    if (!result.ok) { setError(result.reason); return; }
    setChecks(list => [result.check, ...list]);
    setSelectedId(result.check.id); setTab("overview"); setPosting("");
    go("skills");
  }

  const exampleBanner = isExample && stage !== "jd" && <div className={s.exampleBanner}><span><b>This is an example.</b> Somebody else&apos;s check, so you can see what one produces. Yours is measured against your own record.</span><button type="button" onClick={() => go("jd")}>Check my own fit →</button></div>;
  const primaryNext = check?.nextAction ? ACTIONS[check.nextAction] : { href: "/practice/readiness", label: "Check where you stand for this role" };
  // The gaps first, then the claims: the order somebody should work in.
  const tasks = check ? [...check.requirements.filter(r => r.state === "gap"), ...check.requirements.filter(r => r.state === "claim")].slice(0, 3) : [];

  return <div className={s.shell}>
    {gate && <SignUpPrompt action={gate} onClose={() => setGate(null)} />}
    <div className={s.canvas}><main className={s.main}>
      <Link className={s.back} href="/resume">← Professional Presence</Link>
      <nav className={s.steps} aria-label="Job fit stages">{STAGES.map(item => <button type="button" key={item.id} aria-current={stage === item.id ? "step" : undefined} disabled={!canOpen(item.id)} onClick={() => go(item.id)}>{item.name}</button>)}</nav>
      <header className={s.heading}><div><p className={s.eyebrow}>{HEADINGS[stage][0]}</p><h1 ref={titleRef} tabIndex={-1}>{HEADINGS[stage][1]}</h1><p>{HEADINGS[stage][2]}</p></div></header>

      {stage === "jd" && <div className={s.grid}><section className={s.card}><div className={s.cardHead}><h2>Start with the opportunity.</h2><span>{checks.length > 0 && !signedOut ? `${checks.length} ${checks.length === 1 ? "check" : "checks"} so far` : ""}</span></div>
        <label className={s.field}><span>The job description</span><textarea value={posting} disabled={busy} spellCheck={false} placeholder="Paste the responsibilities, skills and requirements…" onChange={e => setPosting(e.target.value)} /></label>
        <div className={s.sourceFoot}><span>{posting.trim().length} characters{left > 0 && posting.length > 0 ? ` · ${left} more needed` : ""}</span>{signedOut && posting !== EXAMPLE_POSTING && <button type="button" className={s.textButton} onClick={() => setPosting(EXAMPLE_POSTING)}>Load example JD</button>}</div>
        <p className={s.hint}>Include responsibilities and requirements so each line can be traced to the job. A job title on its own is not enough to check you against.</p>
        {error && <p className={s.status} role="alert">{error}</p>}
      </section><aside>
        <section className={`${s.card} ${s.visualIntro}`}><p className={s.eyebrow}>KNOW WHAT TO PREPARE FOR</p><h2>One job description.<br />A clearer next step.</h2><p>Understand what the job asks for, see what your record already backs, then try the work that shows where you stand.</p><div className={s.flowArt} aria-hidden="true"><div className={s.artNode}><b>≡</b><small>The job</small></div><span>→</span><div className={s.artNode}><b>✧</b><small>Your record</small></div><span>→</span><div className={s.artNode}><b>◎</b><small>Your next step</small></div></div><div className={s.promise}>Every line is checked against what you have actually done here.<br />Readiness comes from assessed work.</div></section>
        {!signedOut && checks.length > 0 && <section className={s.secondaryCard}><h3>Your checks</h3><p>Every check is kept, so a second run three weeks later can be read beside the first.</p><div className={s.checks}>{checks.map(c => <button type="button" key={c.id} onClick={() => openCheck(c)}><span><strong>{c.roleTitle}</strong><small>Checked {shortDate(c.createdAt)}</small></span><b>{c.readiness}</b></button>)}</div></section>}
      </aside></div>}

      {stage === "skills" && check && <>{exampleBanner}<div className={s.sourceBadge}><i className={s.dot} />{check.roleTitle}{!signedOut && ` · checked ${shortDate(check.createdAt)}`}</div>
        <div className={s.statStrip}><div><b>{check.requirements.length}</b><span>Requirements read from the posting</span></div><div><b>{counts.proof}</b><span>Backed by something you were seen doing</span></div><div><b>{counts.claim + counts.gap}</b><span>Claimed or missing from your record</span></div></div>
        <div className={s.grid}><section className={`${s.card} ${s.mappingCard}`}><div className={s.cardHead}><h2>What this job asks you to do.</h2><span>Open a row for the reason</span></div><div className={s.mappingHead}><span>From the job description</span><span>On your record</span><span /></div>
          {check.requirements.map(r => <details className={s.mapDetails} key={r.need}><summary className={`${s.mapRow} ${r.state === "gap" ? s.pending : ""}`}><span>{r.need}</span><span><strong>{STATE_WORD[r.state]}</strong><small>{r.from}</small></span><b>↗</b></summary><p>{r.note}</p></details>)}
          <p className={s.hint}>Proven means it rests on something you were seen doing here. Claimed means it is on your record and nothing backs it yet. Nothing yet means it is never mentioned and never practised.</p></section>
        <aside><section className={`${s.card} ${s.roleCard}`}><span className={s.chip}>SUGGESTED READINESS PATH</span><div className={s.roleIcon} aria-hidden="true">◈</div><p className={s.eyebrow}>THE ROLE THIS POSTING IS</p><h2>{check.roleTitle}</h2><p>{check.verdict}</p><div className={s.miniSkills}><span>{counts.proof} proven</span><span>{counts.claim} claimed</span><span>{counts.gap} nothing yet</span></div><div className={s.scope}><b>What this check can tell you</b>Where your record already backs what this job asks, and where an interviewer would hear the difference.</div><div className={s.scope}><b>What remains open</b>{counts.claim + counts.gap > 0 ? check.requirements.filter(r => r.state !== "proof").map(r => r.need).join(" · ") : "Every requirement here rests on something you were seen doing."}</div>{check.inScope === false && <div className={s.scope}><b>Outside what Ascend prepares you for</b>It prepares people for early-career non-technical roles. The marks are still honest about what you have; they are measured against a job we cannot coach you into.</div>}<button type="button" className={s.primary} onClick={() => go("readiness")}>See my readiness path →</button></section>
          <section className={s.secondaryCard}><h3>Skills first. Role title second.</h3><p>The requirements come from the posting itself, even when an employer uses a different job title.</p></section></aside></div></>}

      {stage === "readiness" && check && <>{exampleBanner}<div className={s.readinessGrid}><section className={s.card}><div className={s.cardHead}><h2>A small sample of the actual work.</h2><span>{check.roleTitle}</span></div>
        <div className={s.sequence}><div><i aria-hidden="true">◎</i><div><h3>Try relevant workplace situations</h3><p>Twenty minutes on the job&apos;s own work, marked the way the job would mark it.</p></div></div><div><i aria-hidden="true">✧</i><div><h3>See what your decisions demonstrate</h3><p>Feedback is tied to the response you gave, not to what your resume says.</p></div></div><div><i aria-hidden="true">↗</i><div><h3>Return to this job&apos;s report</h3><p>Your requirement list stays attached, including the lines the assessment cannot measure.</p></div></div></div>
        <div className={s.notice}>A fit check reads a posting against the record you already have. The assessment is the only thing here that turns a claim into evidence.</div></section>
      <aside className={s.card}><span className={s.chip}>YOUR STARTING POINT</span><div className={s.readinessState}><p className={s.eyebrow}>ROLE READINESS</p><strong>{counts.proof === check.requirements.length ? "Every line is backed" : counts.proof === 0 ? "Nothing backed yet" : `${counts.proof} of ${check.requirements.length} lines backed`}</strong><p>{counts.proof === check.requirements.length ? "Your record already backs everything this posting asks. The assessment shows how well." : "Your resume can describe experience. The assessment shows what you can demonstrate."}</p></div><div className={s.sourceBadge}><span className={`${s.chip} ${s.neutral}`}>{counts.claim} claimed</span><span className={`${s.chip} ${s.neutral}`}>{counts.gap} nothing yet</span></div><p className={s.hint}>{counts.claim + counts.gap > 0 ? `${check.requirements.filter(r => r.state !== "proof").map(r => r.need).join(", ")} ${counts.claim + counts.gap === 1 ? "stays" : "stay"} open until something backs ${counts.claim + counts.gap === 1 ? "it" : "them"}.` : "Nothing is open on this posting."}</p></aside></div></>}

      {stage === "report" && check && <>{exampleBanner}<section className={s.reportTop}><div><span className={s.chip}>READINESS FOR THIS POSTING · FROM YOUR RECORD</span><h2>{check.verdict}</h2><p>{check.roleTitle} · {check.requirements.length} requirements{!signedOut && ` · checked ${shortDate(check.createdAt)}`}</p></div><div className={s.reportMetric}><strong>{check.readiness}<small> / 100</small></strong><span>Readiness for this posting</span></div><div className={s.reportMetric}><strong>{counts.proof}<small> / {check.requirements.length}</small></strong><span>Requirements backed</span></div></section>
        <div className={s.reportTabs} role="tablist" aria-label="Report sections">{([["overview", "Overview"], ["evidence", "Requirements & evidence"], ["actions", "Next steps"]] as Array<["overview" | "evidence" | "actions", string]>).map(([id, name]) => <button type="button" key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{name}</button>)}<small>Not a chance of being hired</small></div>
        <section role="tabpanel">{tab === "overview" ? <><div className={s.charts}><section className={`${s.card} ${s.chartCard}`}><div className={s.cardHead}><h2>You against what this job asks</h2><span>From your record</span></div>{check.axes.length >= 3 ? <><FitRadar axes={check.axes} /><p className={s.legend}><i className={s.legendYou} /> You <i className={s.legendJob} /> This job</p></> : <div className={s.chartHint}>Fewer than three measures on this check, so the bars beside carry the values.</div>}<p className={s.chartHint}>A wider shape means more of what this job asks is backed.<br />Each measure is explained beside it.</p></section>
          <section className={`${s.card} ${s.chartCard}`}><div className={s.cardHead}><h2>Where to focus</h2><span>You / this job, out of 100</span></div>{check.axes.map(a => <div className={s.barRow} key={a.label} data-tone={a.you >= a.need ? "earned" : a.you >= a.need - 15 ? "build" : "focus"}><strong>{a.label}</strong><b>{a.you}</b><span className={s.track}><i style={{ "--value": `${a.you}%` } as React.CSSProperties} /></span><small>This job asks for {a.need}. {a.basis}</small></div>)}<div className={s.unmeasured}><span>Requirements with nothing on file</span><span className={`${s.chip} ${s.neutral}`}>{counts.gap}</span></div></section></div>
          {check.nextStep && <div className={s.actionFeature}><span aria-hidden="true">↗</span><div><p className={s.eyebrow}>YOUR MOST USEFUL NEXT STEP</p><h3>The one thing to do next.</h3><p>{check.nextStep}</p></div><Link href={primaryNext.href} className={s.primary}>{primaryNext.label} →</Link></div>}</>
        : tab === "evidence" ? <div className={s.evidenceList}>{check.requirements.map(r => <section className={`${s.card} ${s.evidenceCard}`} key={r.need}><div className={s.cardHead}><h3>{r.need}</h3><span className={`${s.chip} ${STATE_CHIP[r.state]}`}>{STATE_WORD[r.state]}</span></div><p>{r.note}</p><blockquote>{r.from}</blockquote></section>)}</div>
        : <><div className={s.tasks}>{tasks.length === 0 ? <section className={`${s.card} ${s.task}`}><span className={`${s.chip} ${s.earned}`}>EVERYTHING BACKED</span><h2>Turn backed lines into a marked result.</h2><p>Every requirement on this posting rests on something you were seen doing. The assessment shows how well, on the job&apos;s own work.</p><Link href="/practice/readiness" className={s.primary}>Check where you stand for this role →</Link></section> : tasks.map((r, i) => <section className={`${s.card} ${s.task}`} key={r.need}><span className={`${s.chip} ${i === 0 ? s.amber : r.state === "gap" ? s.neutral : ""}`}>{i === 0 ? "START HERE" : "THEN"} · {STATE_WORD[r.state].toUpperCase()}</span><h2>{r.need}</h2><p>{r.note}</p><p className={s.outcome}><strong>{r.state === "gap" ? "Nothing on file. " : "On your record, unbacked. "}</strong>{r.state === "gap" ? "The role assessment shows whether you can do it on the job's own work." : "One practice answer turns this into evidence."}</p><Link href={r.state === "gap" ? "/practice/readiness" : "/interview/questions"} className={i === 0 ? s.primary : s.secondary}>{r.state === "gap" ? "Check job fitness →" : "Practise the questions this tests →"}</Link></section>)}</div>
          <details className={s.details}><summary>How will I know I improved? <span>+</span></summary><p>Run the check again after you have practised or added to your record. The number moves only when something new backs a line; finishing practice does not raise it on its own.</p></details></>}</section>
        <div className={s.reportFoot}><span>Readiness for this posting, from your own record. It is not a chance of being hired; nobody can tell you that.</span></div></>}

      {status && <p className={s.status} role="status" aria-live="polite">{status}</p>}
      <footer className={s.footer}><div><strong>{stage === "jd" ? "Understand the job before judging your fit." : stage === "skills" ? "Follow the requirements into role readiness." : stage === "readiness" ? "Your job description stays connected." : "Readiness grows through assessed work."}</strong><small>{stage === "jd" ? "No readiness figure without your record behind it." : stage === "skills" ? "Unbacked requirements stay visible throughout." : stage === "readiness" ? "The assessment opens on the role this posting is." : "Run the check again when your record has changed."}</small></div><div>{stageIndex > 0 && <button type="button" className={s.textButton} onClick={() => go(STAGES[stageIndex - 1].id)}>← Back</button>}{stage === "jd" ? <button type="button" className={s.primary} disabled={busy} onClick={() => void run()}>{busy ? "Reading the posting…" : "Check my fit →"}</button> : stage === "skills" ? <button type="button" className={s.primary} onClick={() => go("readiness")}>See my readiness path →</button> : stage === "readiness" ? <><button type="button" className={s.secondary} onClick={() => { setTab("overview"); go("report"); }}>See my report</button><Link href="/practice/readiness" className={s.primary}>Start the role assessment →</Link></> : <Link href="/practice/readiness" className={s.primary}>Check where you stand for this role →</Link>}</div></footer>
    </main></div>
  </div>;
}
