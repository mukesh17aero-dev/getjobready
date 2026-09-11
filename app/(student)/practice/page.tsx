import { getServerSession } from "@/lib/supabase-server";
import { getJourneyState } from "@/lib/api";
import { routeStatus, stages } from "@/lib/stages";
import { SAMPLE_READINESS } from "@/lib/samples";
import { ToolHub, type HubTool } from "@/components/tool-hub";
import s from "@/components/tool-hub.module.css";
import { Check, Eye, Spark } from "@/components/icons";

// Practice the role, in the same shape as Professional Presence: one tool in
// view at a time, where this person stands with it under the tab, what they
// have measured (or what the tool makes) on the left, and the reason to open
// it beside it.
//
// The readiness number is the one thing worth carrying from the record. It is
// only shown when there is a real measurement; before that the tab shows a
// worked example of the report, labelled as one on every line that matters,
// so the shape of what the assessment produces is visible without a number
// being claimed about somebody we have not measured.
//
// Simulation Missions and the Career Passport are still under development
// and say so; neither opens from here yet.

export const metadata = { title: "Practice" };
export const dynamic = "force-dynamic";

export default async function PracticeLandingPage() {
  const session = await getServerSession();
  const state = session ? await getJourneyState(session.access_token) : null;
  const signedIn = Boolean(session);
  const journey = state ? stages(state) : null;
  const readiness = state && journey ? routeStatus("readiness", state, journey) : null;
  const role = state?.progress?.role?.title ?? null;
  const example = SAMPLE_READINESS.review;
  const tone = (score: number) => (score >= 60 ? "earned" : "amber");

  const tools: HubTool[] = [
    {
      id: "readiness", title: "Role Readiness Assessment", subtitle: "12 questions from the actual work", icon: <Check size={22} />,
      status: !signedIn ? "Start here" : readiness?.percent != null ? `${readiness.percent}% ready` : readiness?.label ?? "Not started",
      outcome: "Find out where you stand by doing.", intro: "Try 12 questions in a simulated workplace, with no time limit. Respond to real situations through decisions, messages, priority ordering and handovers, with help beside the work where the task allows it.",
      why: "Knowing about a job and being able to do it are different things, and only one of them survives a first week. Twelve questions about the job’s own work show where you stand now, before an employer finds out, and turns what your resume claims into something marked.",
      artifactLabel: readiness?.percent != null ? "Your role readiness" : "An example readiness report",
      artifact: readiness?.percent != null ? <div className={s.summaryCard}><h2>{role ?? "Your chosen role"}</h2><small className={s.meta}>Measured from your own assessment</small><div className={s.bigStat}><strong>{readiness.percent}<small> / 100</small></strong><span>Role readiness<br />{readiness.done ? "Measured. Practice from here closes the gaps it found." : readiness.label}</span></div><small className={s.exampleLabel}>A reading of one sitting, with the reason behind every score quoted from what you wrote.</small></div>
        : <div className={s.summaryCard}><h2>{SAMPLE_READINESS.roleTitle}</h2><small className={s.meta}>Example report · not yours · {example.basis.scenesAttempted} of {example.basis.scenesInSitting} situations attempted</small><div className={s.bigStat} data-tone={tone(example.readiness.score)}><strong>{example.readiness.score}<small> / 100</small></strong><span>Role readiness · {example.confidence} confidence<br />{example.summary}</span></div><h3>WHY THIS SCORE</h3><p>{example.readiness.why}</p><h3>SKILL BY SKILL</h3>{example.skillScores.map(skill => <div key={skill.skill} className={s.skillRow} data-tone={tone(skill.score)}><strong>{skill.skill}</strong><i><b style={{ width: `${skill.score}%` }} /></i><span>{skill.score}</span></div>)}{example.skillScores.map(skill => <p key={`${skill.skill}-why`} style={{ marginTop: 8 }}><b>{skill.skill}.</b> {skill.why}</p>)}{example.usingAI && <><h3>WORKING WITH THE AI ASSISTANT</h3><div className={s.skillRow} data-tone={tone(example.usingAI.score)}><strong>Judgement</strong><i><b style={{ width: `${example.usingAI.score}%` }} /></i><span>{example.usingAI.score}</span></div><p style={{ marginTop: 8 }}>{example.usingAI.why}</p></>}<h3>STRENGTHS</h3><ul>{example.strengths.map(line => <li key={line}>{line}</li>)}</ul><h3>WORK ON NEXT</h3><ul>{example.workOn.map(line => <li key={line}>{line}</li>)}</ul><small className={s.exampleLabel}>{signedIn ? "Example report from an illustrative sitting, not yours. Yours is measured from your own work once you sit the assessment." : "Example report from an illustrative sitting, not yours. Yours is measured from your own sitting, once you have an account."}</small></div>,
      leaveWith: "A score for the role and one for each skill your work showed, each with the reason behind it. Skills you did not get to are left out rather than marked zero.",
      action: { href: "/practice/readiness", label: readiness?.percent != null ? "Sit it again" : "Start the assessment" },
      points: ["12 workplace questions, one at a time, with no timer", "AI help on the first two questions; the next ten are independent", "Every result is kept, so you can see what changed"],
      steps: ["Pick the job you chose in Discovery.", "Work through the situations, one at a time, with help where it is offered.", "Read the score, the reasons and the one thing to work on next."],
    },
    {
      id: "missions", title: "Simulation Missions", subtitle: "Decisions that carry weight", icon: <Eye size={22} />,
      status: "Under development",
      outcome: "Practise the decisions the job is made of.", intro: "Short scenarios that put you inside the job rather than describing it: a decision to make, consequences that follow, and marking against what a competent person would have done.",
      why: "Real situations with consequences build the judgement a job needs. A marked decision is evidence in a way a certificate of attendance is not, and missions are scored against the same skills as the assessment, so practice moves the number that matters.",
      artifactLabel: "What a mission gives you", artifact: <div className={s.summaryCard}><h2>A situation, a decision, a consequence</h2><p className={s.emptyIntro}>Each mission puts you inside one moment of the job and marks what you chose to do.</p><div className={s.outline}><span>The situation</span><i /><i /><span>Your decision</span><i /><i /><span>What followed, and the mark</span><i /></div><small className={s.exampleLabel}>Still under development · scored against the same skills as the readiness assessment</small></div>,
      leaveWith: "Marked decisions that count towards the same skills as your readiness score.",
      action: null,
      points: ["Inside the job, not a description of it", "Consequences follow each decision", "Marked against what a competent person would do"],
      steps: ["Choose a mission for your role.", "Make the decisions the situation asks for.", "See what followed and how it was marked."],
    },
    {
      id: "passport", title: "Career Passport", subtitle: "What you proved, in one place", icon: <Spark size={22} />,
      status: "Under development",
      outcome: "The record of what you proved, in one place.", intro: "Everything you have demonstrated, gathered into a single record an employer can look at. Not claims about yourself, but things you did that were marked.",
      why: "A first application has no work history to point at. A record of what you proved, gathered in one place and sealed once there is measured work inside, gives an employer something marked to look at instead of a list of claims.",
      artifactLabel: "What the passport holds",
      artifact: <div className={s.summaryCard}><h2>A booklet with your name on it</h2><p className={s.emptyIntro}>Made the moment you choose a role and filled from your own practice and assessment results, so there is nothing extra to write.</p><div className={s.outline}><span>Who you are</span><i /><i /><span>What you proved</span><i /><i /><span>Sealed by Ascend</span><i /></div><small className={s.exampleLabel}>Still under development · sealed once there is measured work inside</small></div>,
      leaveWith: "A sealed record an employer can look at, filled from your own measured work.",
      action: null,
      points: ["Filled from your own results, nothing extra to write", "Things you did that were marked, not claims", "Sealed once there is measured work inside"],
      steps: ["Choose a role in Discovery.", "Practise and sit the assessment; each result lands on a page.", "Ascend seals it once there is measured work inside."],
    },
  ];

  return <ToolHub path="/practice" title="Practise" accent="the role." intro="Knowing about a job and being able to do it are different things. This is where the second one gets built." role={role} roleHref="/discover" roleLabel={role ? "Explore your direction" : "Find a role to explore"} tools={tools} />;
}
