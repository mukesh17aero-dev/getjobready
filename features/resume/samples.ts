// Sample resume data: a resume, its checks, its ATS read and its review.
//
// Shown only where a page must demonstrate the shape of a result before
// this person has one of their own. Every screen that renders these must
// label them as an example — they are never presented as somebody's work.

import type { AtsCheck, ResumeData, ResumeReview } from "./resume-api";

export const EXAMPLE_RESUME: ResumeData = {
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
  redFlags: [
    "The placement-cell entry lists what was organised but not what came of it, so it reads as a duty rather than a result.",
    "The summary says what you are looking for before it says what you offer.",
  ],
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
