// Sample assessment data: a worked readiness report.
//
// Shown only where a page must demonstrate the shape of a result before
// this person has one of their own. Every screen that renders these must
// label them as an example — they are never presented as somebody's work.

import type { AssessmentReview, Readout } from "@/lib/api";

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
