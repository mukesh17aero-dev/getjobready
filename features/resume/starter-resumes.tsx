"use client";

// Starter content for a blank builder, and how an uploaded file is read.

import { type ResumeData } from "./resume-api";
export const SAMPLE_RESUME: ResumeData = {
  header: {
    name: "Aarav Sharma",
    city: "Hyderabad",
    email: "aarav.sharma@example.com",
  },
  summary:
    "Customer-focused commerce graduate with hands-on practice in order handling, billing queries and everyday problem solving. Comfortable working shifts, quick to pick up new tools, and calm with difficult customers. Looking for work where the day is measured in problems closed rather than hours sat.",
  skills: [
    {
      group: "Customer service",
      items: [
        "Clear phone manner",
        "Patient listening",
        "Complaint handling",
        "Escalation judgement",
      ],
    },
    {
      group: "Tools",
      items: ["Google Sheets", "Billing systems", "Tally", "Hindi typing"],
    },
    {
      group: "Ways of working",
      items: ["Shift work", "Counter ownership", "Working to daily targets"],
    },
  ],
  experienceHeading: "Work experience",
  summaryHeading: "Summary",
  experience: [
    {
      title: "Store assistant",
      organisation: "Sharma General Stores",
      period: "2023 - 2024",
      bullets: [
        "Handled daily billing and customer questions at the counter, about 60 customers a day",
        "Kept stock lists up to date in Google Sheets so reorders went out before shelves emptied",
        "Settled billing disputes at the counter without calling the owner in",
      ],
    },
    {
      title: "Customer support intern",
      organisation: "Zippy Logistics",
      period: "Jun 2023 - Dec 2023",
      bullets: [
        "Answered 40 delivery queries a day across calls and email",
        "Logged repeat complaints in a shared tracker so the team could see which routes caused them",
        "Covered evening shifts through the festive peak without a missed handover",
      ],
    },
    {
      title: "Volunteer, registration desk",
      organisation: "College fest",
      period: "2023",
      bullets: [
        "Managed sign-ins for 200 students and sorted out schedule clashes on the day",
      ],
    },
  ],
  education: [
    {
      qualification: "B.Com",
      institution: "Osmania University",
      period: "2021 - 2024",
      detail: "72%, specialised in accounting and taxation",
    },
    {
      qualification: "Class XII, Commerce",
      institution: "Kendriya Vidyalaya, Hyderabad",
      period: "2021",
      detail: "78%",
    },
  ],
  languages: ["English", "Hindi", "Telugu"],
  activities: [
    "College cricket team, two seasons",
    "Peer study group - ran weekly accounts revision for eight classmates",
    "NSS volunteer at two blood donation drives",
  ],
  keywordsUsed: [],
};

// The same person, a year earlier and still studying. The two samples exist
// because the answer to "where are you right now?" is the one that changes
// the shape of the page: education and projects first, an objective instead
// of a summary, and the only work is an internship. Showing one sample for
// both answers made the question look decorative.
export const STUDENT_SAMPLE: ResumeData = {
  ...SAMPLE_RESUME,
  summaryHeading: "Career objective",
  summary:
    "Final-year B.Com student looking for a first role in customer support or billing. Ran the counter at a family shop through two exam seasons, and handled 40 delivery queries a day on an internship. Quick with Sheets and billing systems, and calm with people who are not.",
  experienceHeading: "Internships and part-time work",
  experience: SAMPLE_RESUME.experience.slice(1),
  projects: [
    {
      title: "Billing tracker for the shop counter",
      detail:
        "Built a Sheets tracker for daily takings and stock so reorders went out before shelves emptied. Still in use.",
      tools: ["Google Sheets", "Tally"],
    },
    {
      title: "College fest registration desk",
      detail:
        "Signed in 200 students across two days and sorted schedule clashes on the spot.",
      tools: ["Forms", "Rota planning"],
    },
  ],
  achievements: [
    "Second place, inter-college accounts quiz, 2023",
    "Ran weekly revision for eight classmates through final year",
  ],
};

// An A4-proportioned thumbnail: the container crops a full page's worth of
// the one-third-scale sheet, so each card reads as a complete resume page.
/**
 * What the parser found in the file they handed over, said plainly. Somebody
 * who uploads a resume and is told only "uploaded" has no way of knowing
 * whether we could read it at all - and a resume nobody could read is worth
 * saying out loud before they build on it.
 */
export function uploadRead(read: {
  experience: number;
  education: number;
  skills: number;
}): string {
  const parts: string[] = [];
  const plural = (n: number, one: string, many: string) =>
    `${n} ${n === 1 ? one : many}`;
  if (read.experience) parts.push(plural(read.experience, "role", "roles"));
  if (read.education)
    parts.push(plural(read.education, "qualification", "qualifications"));
  if (read.skills) parts.push(plural(read.skills, "skill", "skills"));
  if (parts.length === 0) {
    return "We read the file but could not pick out sections from it - we will work from its words as they are.";
  }
  const last = parts.pop() as string;
  return `We read ${parts.length ? `${parts.join(", ")} and ${last}` : last} from it.`;
}

// A4 at 96dpi: 210mm x 297mm. Everything on the page is laid out in these
// units, so what is on the screen is the page that comes out of the printer.
