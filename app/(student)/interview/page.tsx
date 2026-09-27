import { getServerSession } from "@/lib/supabase-server";
import { getPracticeQuestions, type LibraryQuestion } from "@/lib/api";
import { getInterviewHome, type InterviewHome } from "@/features/interview";
import { SAMPLE_INTERVIEW } from "@/features/interview";
import { SAMPLE_STORIES } from "@/features/story-bank";
import { ToolHub, type HubTool } from "@/features/journey";
import s from "@/features/journey/tool-hub.module.css";
import { Mic, Spark, Check } from "@/components/ui/icons";

// Interview practice, in the same shape as Professional Presence: one tool in
// view at a time, where this person stands with it under the tab, what they
// have saved (or what the tool makes) on the left, and the reason to open it
// beside it.
//
// Signed out everything here reads, with a worked example on each tab. The
// account is asked for inside the tools, where an AI's time is spent on one
// person.

export const metadata = { title: "Interview practice" };
export const dynamic = "force-dynamic";

const STATUS: Record<LibraryQuestion["state"], { word: string; tone: string }> = {
  weak: { word: "Needs practice", tone: "amber" },
  unattempted: { word: "Not tried yet", tone: "" },
  solid: { word: "Holding up", tone: "earned" },
};
const ORDER: Record<LibraryQuestion["state"], number> = { weak: 0, unattempted: 1, solid: 2 };
const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
const shortDate = (iso: string) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? "" : `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };

export default async function InterviewLandingPage() {
  const session = await getServerSession();
  const [home, library] = await Promise.all([
    session ? getInterviewHome(session.access_token) : Promise.resolve<InterviewHome | null>(null),
    getPracticeQuestions(session?.access_token ?? null),
  ]);
  const signedIn = Boolean(session);
  const role = home?.selectedRole?.title ?? null;
  const last = signedIn ? (home?.history[0] ?? null) : SAMPLE_INTERVIEW[0]!;
  const inProgress = home?.session?.status === "in_progress";
  const questions = (library?.questions ?? []).slice().sort((a, b) => ORDER[a.state] - ORDER[b.state]);
  const weak = questions.filter(q => q.state === "weak").length;
  const tried = questions.filter(q => q.state !== "unattempted").length;
  const story = SAMPLE_STORIES[0]!;

  const tools: HubTool[] = [
    {
      id: "interview", title: "AI Interview", subtitle: "A full rehearsal, with feedback", icon: <Mic size={22} />,
      status: !signedIn ? "Example" : inProgress ? "In progress" : last?.summary.mark ? `Last mark ${last.summary.mark.overall}/100` : home && home.pastCount > 0 ? `${home.pastCount} ${home.pastCount === 1 ? "interview" : "interviews"} done` : "Start here",
      outcome: "Find the words before the real interview.", intro: "Choose your interviewer and the round, name the role, and answer questions written for you. Afterwards you get feedback on what you actually said.",
      why: "Interviews are the one part of hiring that is pure performance under pressure, and the only reliable way through is having said the words out loud before the day. A rehearsal with feedback shows you what you actually said, not what you meant to say.",
      artifactLabel: last ? "Your last interview's feedback" : "What the interview gives you",
      artifact: last ? <div className={s.summaryCard}><h2>{last.roleTitle}</h2><small className={s.meta}>{last.round === "managerial" ? "Managerial" : "HR"} round · {shortDate(last.completedAt)}{!signedIn && " · example"}</small>{last.summary.mark && <div className={s.bigStat} data-tone={last.summary.mark.overall >= last.summary.mark.bar ? "earned" : "amber"}><strong>{last.summary.mark.overall}<small> / 100</small></strong><span>Mark for this rehearsal<br />Bar to clear for the role: {last.summary.mark.bar}. {last.summary.mark.overall >= last.summary.mark.bar ? "Cleared." : "Not cleared yet."}</span></div>}<h3>WHAT WENT WELL</h3><ul>{last.summary.wentWell.slice(0, 2).map(line => <li key={line}>{line}</li>)}</ul><h3>WHAT TO IMPROVE</h3><ul>{last.summary.toImprove.slice(0, 2).map(line => <li key={line}>{line}</li>)}</ul><h3>YOUR NEXT FOCUS</h3><p>{last.summary.focusNext}</p><small className={s.exampleLabel}>{signedIn ? "From your read-out. Every answer is quoted back in full inside." : "Example read-out · not yours. Yours is written from your own answers."}</small></div>
        : <div className={s.summaryCard}><h2>Your read-out will sit here</h2><p className={s.emptyIntro}>Ten minutes with an interviewer who has read your record, then every answer read back with the marks on it.</p><div className={s.outline}><span>What went well</span><i /><i /><span>What to improve</span><i /><i /><span>Your next focus</span><i /></div><small className={s.exampleLabel}>Layout illustration · no interview yet</small></div>,
      leaveWith: "A mark out of 100 against the bar for the role, feedback on every answer, and a short list of what to work on that the next interview picks up from.",
      action: { href: "/interview/practice", label: inProgress ? "Return to your interview" : home && home.pastCount > 0 ? "Practise again" : "Set up my interview" },
      points: ["Questions written for your role, not pulled from a bank", "Answer by speaking or typing, whichever you have room for", "A mark for every answer, and the bar it had to clear"],
      steps: ["Check your microphone, name the role, and choose the round and your interviewer.", "Answer one question at a time, out loud or by typing. It ends on time.", "Read the feedback on every answer and the one thing to work on next."],
    },
    {
      id: "stories", title: "Interview Story Bank", subtitle: "Answers built from what you have done", icon: <Spark size={22} />,
      status: "Available",
      outcome: "Build answers from what you have already proven.", intro: "The small number of real examples most interview questions are really asking for, written down properly once instead of improvised each time.",
      why: "Most interview questions are the same five or six, each asking for a real example. Written down once, from what you have actually done here, a story comes back for every question it answers instead of being improvised in the room.",
      artifactLabel: "An example story", artifact: <div className={s.summaryCard}><h2>{story.title}</h2><small className={s.meta}>{story.competency} · example story</small><h3>SITUATION</h3><p>{story.star.situation}</p><h3>TASK</h3><p>{story.star.task}</p><h3>ACTION</h3><p>{story.star.action}</p><h3>RESULT</h3><p>{story.star.result}</p><small className={s.exampleLabel}>Example · not yours. Yours are drafted from your own record, and a part your record does not hold is left blank rather than invented.</small></div>,
      leaveWith: "Stories in the shape an interviewer expects, each marked with what it rests on.",
      action: { href: "/stories", label: "Open my Story Bank" },
      points: ["Drafted from your simulations and practice answers, not a blank form", "Proof and claim kept apart", "Every question shows whether you have anything for it"],
      steps: ["Open the questions an interview for your role asks.", "The drafter writes each story from your own record and says where it is thin.", "Read it, then say it out loud once in your own words."],
    },
    {
      id: "questions", title: "Question library", subtitle: "One question at a time", icon: <Check size={22} />,
      status: !library ? "Unable to load" : !signedIn ? `${library.total} questions` : weak > 0 ? `${weak} need practice` : tried > 0 ? `${tried} of ${library.total} tried` : "Start here",
      outcome: "Practise the question that matters next.", intro: "Single questions you can answer whenever you have a few minutes, with one note back on each saying the single thing that would have made it land better.",
      why: "The question you keep getting caught by is the one to drill. Short bursts with one note back build the habit of saying what you did, and every attempt is kept so the next one has something to be better than.",
      artifactLabel: "Where you stand on the questions",
      artifact: <div className={s.summaryCard}><h2>{signedIn && tried > 0 ? "Your questions, worst first" : "What an interview actually asks"}</h2><small className={s.meta}>{library ? `${library.total} questions across HR and managerial rounds` : "The questions could not load"}</small>{questions.slice(0, 4).map(q => <div key={q.id} style={{ marginTop: 12 }}><p><strong>{q.q}</strong></p><div className={s.chips}><span data-tone={STATUS[q.state].tone}>{signedIn ? STATUS[q.state].word : q.round === "hr" ? "HR round" : "Managerial round"}</span><span>{q.competency}</span></div></div>)}<small className={s.exampleLabel}>{signedIn ? "Sorted worst first: what went badly, then what you have not tried." : "The questions are the same for everyone. Where you stand on each is kept once you have an account."}</small></div>,
      leaveWith: "One note per answer, never a report, and sometimes just 'that would hold up', which is a real answer.",
      action: { href: "/interview/questions", label: weak > 0 ? "Practise what needs work" : "Open question practice" },
      points: ["Says what each question is really testing", "Sorted worst first", "One note back, never a report"],
      steps: ["Search or filter by round and by what is being tested.", "Type the answer the way you would say it out loud. A few sentences is plenty.", "Read the one note, then answer it again or move on."],
    },
  ];

  return <ToolHub path="/interview" title="Your interview" accent="practice." intro="Find your words: a full rehearsal, the stories behind your answers, and the questions you will actually be asked." role={role} roleHref="/discover" roleLabel={role ? "Explore your direction" : "Find a role to explore"} tools={tools} />;
}
