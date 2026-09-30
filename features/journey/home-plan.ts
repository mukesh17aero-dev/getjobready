import type { HomeFocus, JourneyState } from "@/lib/api";

// What the home page says, decided from the record alone: the goal, where they
// are on the way to it, the one next step with its reason, and which tools
// lead. A customer who came for one thing - interviews, practice, a resume -
// gets a page about that one thing, not a journey they never asked for.

export type RailStep = { label: string; state: "done" | "current" | "started" | "ahead"; note: string };
export type HomeTool = { label: string; href: string; status?: "done" | "in_progress"; note?: string; isNew?: boolean };
export type ToolGroup = { id: "explore" | "readiness" | "presence" | "interview"; title: string; tools: HomeTool[] };
export type NextStepPanel = { eyebrow: string; title: string; why: string; cta: string; href: string; meta: string[] };
export type HomePlan = {
  focus: HomeFocus;
  heading: string;
  subline: string;
  rail: RailStep[];
  next: NextStepPanel;
  groups: ToolGroup[];
  alsoAvailable: ToolGroup[];
};

export const FOCUS_OPTIONS: Array<{ id: HomeFocus; label: string; detail: string }> = [
  { id: "journey", label: "Find the right role", detail: "Explore roles, check where you stand, practise and prove it" },
  { id: "interview", label: "Get ready for interviews", detail: "Rehearse out loud and get feedback on every answer" },
  { id: "practice", label: "Practise the real work", detail: "Missions from a role, marked the way the job would mark them" },
  { id: "presence", label: "My resume and LinkedIn", detail: "Build or improve them from what you have actually done" },
];

const NEW_UNTIL = Date.parse("2026-10-15");

export function homePlan(state: JourneyState, now: number): HomePlan {
  const focus: HomeFocus = state.progress?.focus ?? "journey";
  const role = state.progress?.role?.title ?? null;
  const m = state.modules ?? {};
  const weakest = state.evidence?.weakestSkill ?? null;
  const lastMark = state.evidence?.interview ?? null;
  const fresh = now < NEW_UNTIL;

  const all: Record<ToolGroup["id"], ToolGroup> = {
    explore: { id: "explore", title: "Explore the role", tools: [{ label: "Discovery", href: "/discover", status: role ? "done" : undefined }] },
    readiness: { id: "readiness", title: "Role readiness", tools: [
      { label: "The Readiness Sitting", href: "/practice/readiness", status: m.readiness },
      { label: "Simulation Missions", href: "/practice/missions", isNew: fresh },
      { label: "Career Passport", href: "/passport", isNew: fresh },
    ] },
    presence: { id: "presence", title: "Professional presence", tools: [
      { label: "Resume Builder", href: "/resume/build", status: m.resume, note: m.resume === "in_progress" ? "draft" : undefined },
      { label: "LinkedIn Profile", href: "/profile/professional", status: m.linkedin, note: m.linkedin === "in_progress" ? "in review" : undefined },
      { label: "Job Fit Analyzer", href: "/job-fit", status: m.jobFit },
    ] },
    interview: { id: "interview", title: "Interview readiness", tools: [
      { label: "AI Interview", href: "/interview/practice", status: m.interview, note: m.interview === "in_progress" ? "open" : undefined },
      { label: "Interview Story Bank", href: "/stories" },
      { label: "Question library", href: "/interview/questions" },
    ] },
  };
  const lead: Record<HomeFocus, ToolGroup["id"][]> = {
    journey: ["explore", "readiness", "presence", "interview"],
    interview: ["interview"],
    practice: ["explore", "readiness"],
    presence: ["presence"],
  };
  const groups = lead[focus].map((id) => all[id]);
  const alsoAvailable = (Object.keys(all) as ToolGroup["id"][]).filter((id) => !lead[focus].includes(id)).map((id) => all[id]);

  const missions: NextStepPanel = {
    eyebrow: "YOUR NEXT STEP",
    title: "Try the real work",
    why: weakest
      ? `Your readiness sitting found ${weakest} is where you have the most to gain. Missions put you through a ${role ?? "role"}'s real tasks, marked the way the job would mark them.`
      : `Missions put you through a ${role ?? "role"}'s real tasks, marked the way the job would mark them.`,
    cta: "Start a mission",
    href: "/practice/missions",
    meta: ["About 20 minutes", "Marked against the role", "Counts toward your Passport"],
  };
  const explore: NextStepPanel = {
    eyebrow: "YOUR FIRST STEP",
    title: "Explore the roles",
    why: "Everything else here aims at one role. Each is shown as a real working day: what it pays, what is hard and where it leads.",
    cta: "Explore roles",
    href: "/discover",
    meta: ["15 to 22 minutes", "Nothing is marked", "Change your mind any time"],
  };
  const step = (state: RailStep["state"], label: string, note: string): RailStep => ({ label, state, note });
  const status = (s: "done" | "in_progress" | undefined, doneNote: string, startedNote: string) =>
    s === "done" ? { state: "done" as const, note: doneNote } : s === "in_progress" ? { state: "started" as const, note: startedNote } : null;

  if (focus === "interview") {
    const done = m.interview === "done";
    return {
      focus, groups, alsoAvailable,
      heading: role ? `Your interview preparation · ${role}` : "Your interview preparation",
      subline: role ? "Questions are written for this role, from what it actually needs." : "Name the role when you start, and the questions are written for it.",
      rail: [
        step(role ? "done" : "current", "Name the role", role ? role : "Or type one in"),
        m.interview === "done" ? step("done", "Rehearse the interview", "Rehearsed") : step(m.interview === "in_progress" ? "started" : role ? "current" : "ahead", "Rehearse the interview", m.interview === "in_progress" ? "Still open" : "15 minutes"),
        step(done ? "done" : "ahead", "Read your feedback", done ? "Ready" : "On every answer"),
        step(done ? "current" : "ahead", "Rehearse again", "Picks up from your feedback"),
      ],
      next: m.interview === "in_progress"
        ? { eyebrow: "YOUR NEXT STEP", title: "Finish your interview", why: "Your rehearsal is still open. Pick up where you stopped; your answers so far are saved.", cta: "Continue interview", href: "/interview/practice", meta: ["Answers saved", "Speak or type"] }
        : done
          ? { eyebrow: "YOUR NEXT STEP", title: "Rehearse again, with your feedback", why: lastMark ? `Your last rehearsal marked ${lastMark.mark} against a bar of ${lastMark.bar} for an answer that holds up. The next one picks up from what to work on.` : "The next rehearsal picks up from what your feedback said to work on.", cta: "Rehearse again", href: "/interview/practice", meta: ["15 minutes", "Speak or type", "Feedback on every answer"] }
          : { eyebrow: "YOUR FIRST STEP", title: "Rehearse your interview", why: `Answer questions written for ${role ?? "the role you name"}, out loud or typed, and get feedback on what you actually said.`, cta: "Start a rehearsal", href: "/interview/practice", meta: ["15 minutes", "Speak or type", "Feedback on every answer"] },
    };
  }

  if (focus === "presence") {
    const order: Array<{ key: "resume" | "linkedin" | "jobFit"; label: string; panel: NextStepPanel }> = [
      { key: "resume", label: "Resume", panel: { eyebrow: "YOUR NEXT STEP", title: m.resume === "in_progress" ? "Finish your resume" : "Build your resume", why: m.resume === "in_progress" ? "Your draft is saved. Check the facts and wording, then download it." : "Written from what you have actually done, step by step. You do not need a resume to start.", cta: m.resume === "in_progress" ? "Review your resume" : "Build my resume", href: "/resume/build", meta: ["About 15 minutes", "Autosaves as you go"] } },
      { key: "linkedin", label: "LinkedIn profile", panel: { eyebrow: "YOUR NEXT STEP", title: "Shape your LinkedIn profile", why: "A headline and About section written from your own record, in your voice. You keep only what is accurate.", cta: "Open the profile builder", href: "/profile/professional", meta: ["About 10 minutes", "You approve every line"] } },
      { key: "jobFit", label: "Job fit", panel: { eyebrow: "YOUR NEXT STEP", title: "Check your fit for a real job", why: "Paste a job posting and see what your record already shows for it, and what it asks that you have not shown yet.", cta: "Check a job", href: "/job-fit", meta: ["About 5 minutes"] } },
    ];
    const first = order.find((o) => m[o.key] !== "done");
    return {
      focus, groups, alsoAvailable,
      heading: "Your resume and LinkedIn",
      subline: role ? `Aimed at ${role}, from what you have actually done.` : "Written from what you have actually done.",
      rail: order.map((o) => { const s = status(m[o.key], "Done", o.key === "linkedin" ? "In review" : "Draft saved"); return s ? step(s.state, o.label, s.note) : step(o === first ? "current" : "ahead", o.label, o === first ? "You are here" : "Next"); }),
      next: first ? first.panel : { eyebrow: "YOUR NEXT STEP", title: "Tailor your resume for a job", why: "Your resume, profile and job fit are done. Shaping a version for a specific job is what gets it read.", cta: "Tailor my resume", href: "/resume/build", meta: ["About 10 minutes"] },
    };
  }

  if (!role) {
    return {
      focus, groups, alsoAvailable,
      heading: focus === "practice" ? "Pick a role to practise" : "Let's find work you can see yourself doing",
      subline: "Ascend works from one role you choose. Everything after shapes itself around it.",
      rail: focus === "practice"
        ? [step("current", "Pick the role", "Start here"), step("ahead", "Try the real work", "Marked like the job"), step("ahead", "Prove it", "A Passport employers can check")]
        : [step("current", "Explore the role", "Start here"), step("ahead", "Check your readiness", "For the role you pick"), step("ahead", "Try the real work", "Marked like the job"), step("ahead", "Practise the interview", "Out loud, with feedback"), step("ahead", "Prove it", "A Passport employers can check")],
      next: explore,
    };
  }

  const readinessDone = m.readiness === "done";
  const readinessPanel: NextStepPanel = {
    eyebrow: "YOUR NEXT STEP",
    title: m.readiness === "in_progress" ? "Finish your readiness sitting" : "Check where you stand",
    why: m.readiness === "in_progress" ? "Your sitting is still open. Your answers so far are saved." : `Five short questions on a ${role}'s own work show what you can already do and what is worth practising first.`,
    cta: m.readiness === "in_progress" ? "Continue your sitting" : "Take the readiness sitting",
    href: "/practice/readiness",
    meta: ["5 questions", "No time limit", "Scored against the role"],
  };

  if (focus === "practice") {
    return {
      focus, groups, alsoAvailable,
      heading: `Your ${role} practice`,
      subline: "Real tasks from the job, marked the way it would mark them.",
      rail: [
        step("done", "Pick the role", role),
        status(m.readiness, "Sitting finished", "Sitting open") ? step(readinessDone ? "done" : "started", "Check where you stand", readinessDone ? "Sitting finished" : "Optional · open") : step("ahead", "Check where you stand", "Optional"),
        step("current", "Try the real work", "You are here"),
        step("ahead", "Prove it", "Opens after two marked missions"),
      ],
      next: missions,
    };
  }

  const interviewStep = status(m.interview, "Rehearsed", "Started");
  return {
    focus, groups, alsoAvailable,
    heading: `Your ${role} journey`,
    subline: "Everything below is aimed at this role.",
    rail: [
      step("done", "Explore the role", "Role chosen"),
      readinessDone ? step("done", "Check your readiness", "Sitting finished") : step(m.readiness === "in_progress" ? "started" : "current", "Check your readiness", m.readiness === "in_progress" ? "Sitting open" : "You are here"),
      step(readinessDone ? "current" : "ahead", "Try the real work", readinessDone ? "You are here" : "Marked like the job"),
      interviewStep ? step(interviewStep.state, "Practise the interview", interviewStep.note) : step("ahead", "Practise the interview", "Out loud, with feedback"),
      step("ahead", "Prove it", "Opens after two marked missions"),
    ],
    next: readinessDone ? missions : readinessPanel,
  };
}
