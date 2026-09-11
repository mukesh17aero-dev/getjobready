import type { InterviewHome } from "@/lib/interview-api";
import type { AtsCheck, ResumeData, ResumeReview } from "@/lib/resume-api";
import type {
  AssessmentReview,
  JobFitCheck,
  Readout,
  ProfileState,
  RoleBrief,
  RoleDetail,
  Story,
} from "@/lib/api";

// What a finished piece of work looks like, for somebody who has not made one.
//
// A signed-out visitor sees an interview setup screen with an empty history and
// a resume builder with an empty preview, which is an honest picture of their
// own record and a useless picture of the product. These are the shop window:
// one worked example each, so the thing being offered is visible before an
// account is asked for.
//
// The one rule: it must be unmistakably an example. Every surface that renders
// these labels them, and the person in them has an obviously invented name -
// nobody should be able to mistake this for their own history, and no number
// here may be presented as evidence that the product works. It is a
// demonstration of the output's shape, not a claim about outcomes.

export const SAMPLE_INTERVIEW: InterviewHome["history"] = [
  {
    roleTitle: "Customer Success Associate",
    round: "hr",
    completedAt: "2026-03-04T10:20:00.000Z",
    summary: {
      wentWell: [
        "Used a specific incident for the difficult-customer question rather than describing what you would do in general. Interviewers score concrete examples far higher.",
        "Acknowledged the trade-off in the refund question instead of giving an answer that only worked for one side.",
        "Kept answers to roughly 60-90 seconds, which is the range most interviewers expect for a behavioural question.",
        "Used the customer's own words when describing the complaint, which showed you had actually listened rather than paraphrased.",
      ],
      toImprove: [
        "Two answers began by restating the question. It costs about ten seconds each time and makes a confident answer sound hesitant.",
        "You described what you did but not what changed as a result. An interviewer cannot score an outcome you did not state.",
        "The word 'basically' appeared six times. It is filler, and it tends to appear just before the most important part of a sentence.",
      ],
      focusNext:
        "Start with the outcome, then explain how you got there. Most of your answers already have the right content in the wrong order.",
      perQuestion: [
        {
          index: 0,
          question: "Tell me about a time you handled an unhappy customer.",
          strength:
            "You chose one specific incident and stayed inside it for the whole answer: what the customer said, what you tried first, what you tried next. That structure is what an interviewer is listening for.",
          improvement:
            "You never said how it ended. The interviewer has to ask a follow-up to find out whether you resolved it, and an answer that needs a follow-up scores lower than one that does not. Add a closing line: what the customer left with, and whether they came back.",
        },
        {
          index: 1,
          question:
            "A customer asks for a refund outside policy. What do you do?",
          strength:
            "You asked what the customer actually wanted before reaching for the policy. That is the right order, and most candidates do it the other way round.",
          improvement:
            "Name the escalation path. 'I would check with my manager' is a plan an interviewer can score; 'I would see what I could do' is not. Say who you would ask and what you would ask them for.",
        },
        {
          index: 2,
          question: "Why do you want to work in customer success?",
          strength:
            "You connected it to the retail job rather than giving a general answer about liking people, which made it specific to you.",
          improvement:
            "The answer was about what you enjoy. Add one line on what the employer gets: the part of the job you are already good at, and why that matters to them.",
        },
        {
          index: 3,
          question: "Describe a time you worked under pressure.",
          strength:
            "The festive-season example was well chosen — high volume, real constraints, and you were clear about what you were responsible for.",
          improvement:
            "You spent about forty seconds setting the scene before reaching what you did. Cut the context to two sentences and spend the time on your own actions instead.",
        },
      ],
      growthAreas: [
        {
          skill: "Stating outcomes",
          note: "Three of your four answers described actions without results. Practise ending each one with a sentence starting 'As a result…'.",
        },
        {
          skill: "Answer structure",
          note: "Lead with the situation in two sentences, then spend the rest on what you did. You are currently spending about half the answer on context.",
        },
        {
          skill: "Filler words",
          note: "'Basically' and 'sort of' appeared nine times between them. Pausing instead of filling reads as considered rather than uncertain.",
        },
      ],
      progressNote:
        "This was a first interview, so there is nothing to compare it against yet. The next one will show what moved.",
      mark: {
        overall: 69,
        bar: 67,
        perQuestion: [
          { index: 0, mark: 77, ratings: { situation: 3, ownAction: 3, outcome: 0, relevance: 3, clarity: 2 } },
          { index: 1, mark: 67, ratings: { situation: 2, ownAction: 2, outcome: 1, relevance: 3, clarity: 2 } },
          { index: 2, mark: 63, ratings: { situation: 2, ownAction: 2, outcome: 1, relevance: 2, clarity: 3 } },
          { index: 3, mark: 70, ratings: { situation: 3, ownAction: 2, outcome: 1, relevance: 3, clarity: 1 } },
        ],
        basis: { marked: 4, asked: 4 },
        ruleVersion: "v1",
      },
    },
    turns: [],
  },
];

// A readiness report in full, for the Practice hub before anybody has sat
// the assessment. Same rules as the interview above: an invented person, an
// obviously illustrative sitting, and never presented as evidence of
// anything but the report's shape.
export const SAMPLE_READINESS: { roleTitle: string; readout: Readout; review: AssessmentReview } = {
  roleTitle: "Customer Success Associate",
  readout: {
    runId: "example",
    roleId: "example",
    finishedAt: "2026-03-06T09:40:00.000Z",
    scenesAttempted: 5,
    scenesInSitting: 6,
    minutesSpent: 14,
    skills: [
      { skill: "Customer communication", attempted: 2, inSitting: 2 },
      { skill: "Prioritising", attempted: 1, inSitting: 1 },
      { skill: "Written handover", attempted: 1, inSitting: 1 },
      { skill: "Escalating well", attempted: 1, inSitting: 2 },
    ],
    reachedFor: [
      { sceneTitle: "A complaint before nine", assistantAtSeconds: 40, buddyAtSeconds: null },
      { sceneTitle: "Four things by lunch", assistantAtSeconds: 15, buddyAtSeconds: 95 },
    ],
    repeated: [],
  },
  review: {
    scenes: [],
    readiness: {
      score: 64,
      why: "You handled the two customer situations well and ordered the morning's work sensibly. The handover note left out what the next person needed most, and the escalation was raised without the facts that would let a manager act on it.",
    },
    skillScores: [
      { skill: "Customer communication", score: 78, why: "You acknowledged the complaint in the customer's own words before offering anything, and set a time you would call back." },
      { skill: "Prioritising", score: 70, why: "You put the account at risk of leaving ahead of the routine renewals, and said why." },
      { skill: "Written handover", score: 48, why: "The note said what you did but not what was still open, so the next person would have had to ask." },
      { skill: "Escalating well", score: 55, why: "You escalated at the right moment but without the order number or what the customer had already been promised." },
    ],
    usingAI: {
      score: 60,
      why: "You asked the assistant for a first draft of the reply and then rewrote the promise in your own words, which is the right use of it. On the priority task you sent its ordering back unchanged.",
    },
    confidence: "medium",
    strengths: [
      "Listens before answering: both customer replies opened with what the customer had actually said.",
      "Makes a decision and gives the reason for it, rather than listing options.",
    ],
    workOn: [
      "Write a handover for the reader: what is still open, what was promised, and by when.",
      "Escalate with the facts a manager needs to act - the order, the promise made, the deadline.",
    ],
    summary:
      "Ready for the customer-facing half of the job now; the written half is where the next few weeks of practice should go.",
    basis: { scenesAttempted: 5, scenesInSitting: 6 },
  },
};

// A real ResumeData, so the landing page can hand it straight to the same
// ResumeSheet the builder uses. Not a description of the output - the output.
export const SAMPLE_RESUME: ResumeData = {
  header: {
    name: "A. Sample",
    city: "Coimbatore",
    email: "a.sample@example.com",
  },
  summaryHeading: "Career objective",
  summary:
    "Final-year commerce graduate with six months of part-time retail experience, looking for a first customer success role. Comfortable handling complaints on the floor and closing them without escalating.",
  skills: [
    {
      group: "Customer",
      items: ["Complaint handling", "Returns processing", "Point of sale"],
    },
    { group: "Tools", items: ["Excel", "Google Workspace"] },
  ],
  experienceHeading: "Experience",
  experience: [
    {
      title: "Sales Assistant (part-time)",
      organisation: "Regional apparel chain",
      period: "Jan 2025 - Mar 2026",
      bullets: [
        "Handled around 40 customer conversations a shift, including returns and complaints.",
        "Trained two new starters on the returns process during the festive season.",
        "Covered the service desk single-handed on weekends across a six-month period.",
      ],
    },
    {
      title: "Student placement coordinator",
      organisation: "College placement cell",
      period: "2025",
      bullets: [
        "Organised a two-day recruitment drive for 120 students across nine employers.",
      ],
    },
  ],
  education: [
    {
      qualification: "B.Com",
      institution: "Bharathiar University",
      period: "2023 - 2026",
      detail: "Commerce, with accounting and business communication.",
    },
  ],
  languages: ["Hindi", "English", "Tamil"],
  activities: ["College placement cell volunteer"],
  keywordsUsed: [
    "Customer service",
    "Complaint resolution",
    "Point of sale",
    "Returns processing",
    "Team training",
  ],
};

// The read the AI gives back on a finished resume, at the depth it actually
// produces. A one-line verdict is not something anybody can act on or check -
// the point of showing this before an account is that somebody can decide
// whether the feedback would be worth having.

export const SAMPLE_ATS: AtsCheck = {
  readable: true,
  found: [
    "Customer service",
    "Complaint resolution",
    "Point of sale",
    "Returns processing",
    "Team training",
    "Hindi",
    "English",
  ],
  problems: [
    {
      what: "One unexplained six-month gap (Jun-Dec 2025)",
      why: "Filters flag gaps over three months. A single line - study, exams, family - closes it, and the reader stops wondering.",
    },
    {
      what: "No month on the second role's dates",
      why: "Years alone are read as approximate. Some systems drop the entry rather than guess at it.",
    },
    {
      what: "'Excel — basic' understates a listed skill",
      why: "Keyword matching does not read qualifiers, but a human does. Either name what you can do in Excel, or leave it out.",
    },
  ],
};

export const SAMPLE_REVIEW: ResumeReview = {
  strengths: [
    "Every bullet has a number or a scale attached. 'Around 40 conversations a shift' is checkable; 'excellent communication skills' is not.",
    "The training line shows responsibility beyond the job description, which is the strongest signal on the page for an early-career applicant.",
    "The summary names the role being applied for. Filters and readers both look for that in the first two lines.",
    "Languages are listed explicitly, which matters for customer-facing roles and is often left off.",
  ],
  gaps: [
    {
      what: "No outcome on the placement-cell entry",
      how: "You organised a drive for 120 students across nine employers. Add what came of it — offers made, attendance, or that it ran without incident.",
    },
    {
      what: "The summary describes you, not the employer's problem",
      how: "Rewrite the second sentence around what a customer success team gets: someone who has already handled complaints face to face and closed them without escalating.",
    },
    {
      what: "No mention of systems or tools by name",
      how: "You used a point-of-sale system daily. Name it. Recruiters search for the tools they already run.",
    },
  ],
  standing: {
    level: "competitive",
    why: "For a first customer-facing role this sits above the median: there is real customer contact, a quantified workload and one clear example of added responsibility. It is not yet strong because no entry states an outcome, so a reader can see what you did but not what changed.",
  },
  nextStep: {
    route: "interview",
    why: "The resume is good enough to get a callback. What decides the outcome now is whether you can tell these same stories out loud, with endings — which is exactly what interview practice checks.",
  },
  coverage: {
    covered: [
      "Customer interaction",
      "Complaint handling",
      "Working to a process",
      "Training others",
      "Working under volume",
    ],
    missing: [
      "CRM or ticketing software",
      "Written customer communication",
      "Working to a target or SLA",
    ],
  },
  fromRules: false,
};

// ---- discovery: one role, as the role page shows it -----------------------

/** The pay ladder behind a role, in the shape PayProgression renders. */
export const SAMPLE_GROWTH: RoleDetail["growth"] = [
  {
    title: "Customer Success Associate",
    when: "Year 0-2",
    pay: { min: 20000, max: 30000 },
  },
  {
    title: "Senior Associate",
    when: "Year 2-4",
    pay: { min: 32000, max: 45000 },
  },
  {
    title: "Team Lead",
    when: "Year 4-7",
    pay: { min: 50000, max: 70000 },
  },
];

export const SAMPLE_PAY_NOTE =
  "Indicative monthly ranges for metros and tier-1 cities. Smaller cities run lower, and the first-year figure moves most with the size of the employer.";

/**
 * A composite, and labelled as one wherever it is shown. Ascend does not
 * publish invented people as though they were real - the role page carries the
 * same warning above the same kind of text.
 */
export const SAMPLE_VOICE = {
  name: "Meera",
  title: "Team Lead, retail support",
  journey: "Started as an associate in 2021",
  quote:
    "The first year is mostly learning to say no without losing the customer. Nobody tells you that is the skill, but it is the one that got me promoted.",
};

/**
 * What the fit read-out looks like when there is something to write it from.
 *
 * Shown to a signed-out visitor as an example and labelled as one, because the
 * real version is written from their own tour - what they said about each role
 * on the way out of it - and they have not taken one yet. Every line here is
 * traceable to a thing somebody did, which is the whole point: a fit insight
 * that cannot name what it rests on is a horoscope.
 */
export const SAMPLE_FIT: RoleBrief = {
  roleId: "customer_success_associate",
  fit: [
    {
      point:
        "The part of the store job you said you liked was being the one who actually sorted the problem out. That is most of this role, most days.",
      basedOn: ["Your note leaving Customer Success Associate"],
    },
    {
      point:
        "You ruled out Operations Coordinator for the supplier calls being the same conversation every week. This one is different people every day, which is the opposite trade - worth knowing before you pick it.",
      basedOn: ["Your note leaving Operations Coordinator"],
    },
    {
      point:
        "You went back to the pay and progression section twice. This role moves on what you close rather than time served, so the second step comes faster here than in the other two you walked.",
      basedOn: ["What you read on the tour"],
    },
  ],
  excel: [
    {
      title: "Learn the five objections in your first fortnight",
      how: "Almost every call is one of five. Write down how the person next to you answers each, and you are past the hardest part of the first year in two weeks.",
      basedOn: ["What decides who moves up, on this role"],
    },
    {
      title: "Ask for the difficult calls early",
      how: "Nobody is judged on the easy ones. Taking the complaints in month two is how you end up trusted in month six.",
      basedOn: ["What decides who moves up, on this role"],
    },
  ],
  watch: [
    {
      title: "Most conversations end in no",
      how: "That is normal and it is not about you - but it is the thing people leave over. Decide now how you will keep score, so a bad week does not read as a bad fit.",
      basedOn: ["The hard parts, on this role"],
    },
  ],
};

// ---- story bank: what a full one looks like ------------------------------

/**
 * Three stories, shown to somebody who has not signed in and labelled as an
 * example wherever they appear.
 *
 * They are deliberately not all the same quality: one rests on a scored
 * interview, one on the person's own account, and one has been drafted and
 * never said out loud. That spread is the honest picture of a real bank, and
 * a sample showing three perfect stories would teach the wrong thing about
 * what this page is for.
 */
export const SAMPLE_STORIES: Story[] = [
  {
    id: "sample-escalation",
    title: "The refund I could not give",
    competency: "Handling conflict",
    star: {
      situation:
        "A customer wanted a refund eleven days in, after someone else had told her the window was fourteen days.",
      task: "Hold the policy without making her feel she had been lied to - because effectively she had.",
      action:
        "I said plainly that the earlier answer had been wrong and apologised for that specifically, then offered the one thing I could actually authorise.",
      result:
        "She took the credit note and stayed. My manager used the call as a training example the week after.",
    },
    evidence: {
      kind: "interview",
      label: "Customer Success interview · HR round",
      ref: null,
      proof: true,
    },
    roles: [],
    answers: ["refund-outside-policy", "difficult-customer"],
    spokenAt: "2026-08-14T09:20:00.000Z",
    updatedAt: "2026-08-14T09:20:00.000Z",
  },
  {
    id: "sample-counter",
    title: "The Saturday I ran the counter alone",
    competency: "Working under pressure",
    star: {
      situation:
        "Both weekend staff were out and about sixty customers came through between eleven and four.",
      task: "Keep the queue moving without getting the billing wrong, which is the part that costs money.",
      action:
        "I batched the simple purchases and asked the two complicated ones to wait five minutes - and told them why rather than leaving them standing.",
      result:
        "No billing errors that day. Two of the people I asked to wait came back the next week and asked for me.",
    },
    evidence: {
      kind: "resume",
      label: "Your experience, as you told us",
      ref: null,
      proof: false,
    },
    roles: [],
    answers: ["under-pressure"],
    spokenAt: "2026-08-15T11:02:00.000Z",
    updatedAt: "2026-08-15T11:02:00.000Z",
  },
  {
    id: "sample-mistake",
    title: "The two tickets I filed wrong",
    competency: "Taking ownership",
    star: {
      situation: "Mid-shift, two tickets went onto the wrong customer account.",
      task: "",
      action:
        "I spotted it at the next handover, flagged it myself rather than waiting to be asked, and corrected both.",
      result: "",
    },
    evidence: {
      kind: "simulation",
      label: "Busy shift simulation",
      ref: null,
      proof: true,
    },
    roles: [],
    answers: ["a-mistake"],
    spokenAt: null,
    updatedAt: "2026-08-16T08:00:00.000Z",
  },
];

// ---- job fit: a worked example for somebody with no record yet -----------

/**
 * One finished check, shown to a signed-out visitor and labelled as somebody
 * else's throughout.
 *
 * The marks are deliberately mixed - two proven, two claimed, one gap - and
 * the readiness figure is what the real arithmetic produces from exactly that
 * spread (1 + 1 + 0.5 + 0.5 + 0 out of 5). A sample whose number did not match
 * its own rows would be the first thing to teach somebody the number is
 * decoration.
 */
export const SAMPLE_JOB_FIT: JobFitCheck = {
  id: "sample-check",
  roleTitle: "Customer Success Associate",
  readiness: 60,
  inScope: true,
  nextAction: "practice-question",
  verdict:
    "You have proof for the two parts of this job that actually carry it, and nothing at all behind the CRM line.",
  nextStep:
    "Answer the two questions in the library about picking up a new system. That turns the weakest line here into something you can talk about for two minutes.",
  requirements: [
    {
      need: "Own escalations end to end",
      state: "proof",
      from: "Story: The refund I could not give",
      note: "You have told this one, and it rests on a scored interview answer rather than on your own account.",
    },
    {
      need: "Handle 40-60 customer queries a day",
      state: "proof",
      from: "Practice answer: under-pressure",
      note: "Your answer about the Saturday counter held up when it was read back.",
    },
    {
      need: "Keep the customer informed through a delay",
      state: "claim",
      from: "Your experience, as you told us",
      note: "It is on your record and nothing backs it up yet. One practice answer would fix that.",
    },
    {
      need: "Coordinate with operations on delivery issues",
      state: "claim",
      from: "Your experience, as you told us",
      note: "Adjacent to what you have described, but not the same thing, and an interviewer will hear the difference.",
    },
    {
      need: "Maintain CRM records accurately",
      state: "gap",
      from: "Nothing on file",
      note: "Never mentioned and never practised. This is the one to close first.",
    },
  ],
  axes: [
    {
      label: "Interviews",
      you: 66,
      need: 66,
      basis: "2 practice interviews finished",
    },
    {
      label: "Stories",
      you: 50,
      need: 75,
      basis: "2 of your 3 stories rest on something you were seen doing",
    },
    {
      label: "Questions",
      you: 50,
      need: 60,
      basis: "3 of the 6 questions you answered would hold up",
    },
  ],
  createdAt: "2026-08-20T10:00:00.000Z",
};

// ---- professional profile: one worked example ---------------------------

/**
 * A profile mid-build: a thin "yours now" on the left, the rewrite on the
 * right, and one section already kept.
 *
 * The before column is deliberately weak in the way real ones are - a
 * headline naming a college rather than a job, no About at all - because the
 * comparison is the entire point of the screen and a strong before makes it
 * meaningless.
 */
export const SAMPLE_PROFILE: ProfileState = {
  name: "Anjali Kumar",
  identity:
    "Someone going into customer-facing operations, who has handled a full shift of queries and three escalations end to end.",
  identityAgreed: true,
  updatedAt: "2026-08-20T09:00:00.000Z",
  targetRole: "Customer Success Associate",
  sourceCount: 9,
  provenCount: 4,
  accepted: {
    headline: "Student at Ramaiah College | Looking for opportunities",
    experience: [
      {
        title: "Family store",
        organisation: "",
        bullets: ["Worked at family store. Handled customers."],
      },
    ],
    openTo: "Open to Customer Success and Operations roles in Bengaluru",
  },
  suggested: {
    audience: "student",
    headline:
      "Customer Success Associate · Escalations, CRM, 50+ queries a day · Bengaluru",
    headlineOptions: [
      "Customer Success Associate · Escalations, CRM, 50+ queries a day · Bengaluru",
      "Keeping customers when something has gone wrong · Support & escalations · Bengaluru",
      "Escalation handling and CRM accuracy for customer teams · Bengaluru",
    ],
    experience: [
      {
        title: "Counter and complaints, weekends",
        organisation: "Family retail store",
        bullets: [
          "Ran the counter alone on Saturdays, around 60 customers a day, with no billing errors on the busiest one.",
          "Handled complaints myself instead of passing them on, including refunds outside the stated window.",
          "Cut the wait for complicated purchases by batching the simple ones and telling people why they were waiting.",
        ],
      },
      {
        title: "Busy shift simulation",
        organisation: "Ascend",
        bullets: [
          "Cleared 52 queries in a timed shift and handled three escalations end to end.",
          "Caught two tickets filed to the wrong account at handover and corrected them before they reached the customer.",
        ],
      },
    ],
    about:
      "I am aiming at customer-facing operations work. In a timed simulation I cleared 52 queries in a shift and handled three escalations end to end. Before that I ran the counter at my family's store on weekends, roughly sixty customers a day, and dealt with the complaints myself. The part I am best at is being the one who actually sorts it out.",
    skills: [
      "Escalation handling",
      "CRM data entry",
      "Customer communication",
      "Shift coordination",
    ],
    openTo: "Open to Customer Success and Operations roles in Bengaluru",
  },
};
