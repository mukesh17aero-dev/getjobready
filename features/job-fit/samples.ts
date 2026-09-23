// Sample job-fit data: a worked example for somebody with no record yet.
//
// Shown only where a page must demonstrate the shape of a result before
// this person has one of their own. Every screen that renders these must
// label them as an example — they are never presented as somebody's work.


import type { JobFitCheck } from "@/lib/api";

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
