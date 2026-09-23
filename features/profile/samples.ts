// Sample profile data: one worked professional profile.
//
// Shown only where a page must demonstrate the shape of a result before
// this person has one of their own. Every screen that renders these must
// label them as an example — they are never presented as somebody's work.


import type { ProfileState } from "@/lib/api";

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
  checklist: {
    passed: 9,
    counted: 10,
    items: [
      { id: "headline", label: "Headline a search can find", status: "pass", detail: "77 of 220 characters, and it carries the title a recruiter would search for." },
      { id: "opening", label: "The two lines before 'see more'", status: "pass", detail: "The opening carries the role or a real specific, so the click to 'see more' is earned." },
      { id: "skills", label: "Skills a search can filter on", status: "fix", detail: "4 skills. LinkedIn allows fifty and recruiters filter on them - list every one your record can back, then pin the three that matter most for the role.", fix: "Add any more skills my record genuinely shows, in the words a job advert would use. Nothing I have not done.", link: { href: "/profile", label: "Add skills you can back up" } },
      { id: "bullets", label: "Experience says what you did", status: "pass", detail: "All 5 bullets open with an action, which is what a scanning reader catches." },
      { id: "openTo", label: "Open-to line names a role and a place", status: "pass", detail: "It names the role and where, so LinkedIn's Open to Work feature can match you." },
      { id: "placeholders", label: "Nothing left to fill in", status: "pass", detail: "No [X] placeholders remain, so every line can be copied across as it is." },
      { id: "generic", label: "No skills everybody lists", status: "pass", detail: "No 'Communication', 'Teamwork' or 'MS Office' - the ones every profile lists and nobody can check." },
      { id: "adjectives", label: "No adjectives about yourself", status: "pass", detail: "Nothing calls you passionate, hardworking or results-driven. The reader decides what you are from what you did." },
      { id: "firstPerson", label: "About in the first person", status: "pass", detail: "Written as 'I', which is how a LinkedIn About is read - it is you speaking, not a resume." },
      { id: "aboutLength", label: "About length", status: "pass", detail: "402 characters - readable in one scroll, well inside LinkedIn's limit." },
    ],
  },
  suggested: {
    audience: "student",
    voice: "formal",
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
