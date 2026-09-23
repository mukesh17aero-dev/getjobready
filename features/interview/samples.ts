// Sample interview data: one person's interview history.
//
// Shown only where a page must demonstrate the shape of a result before
// this person has one of their own. Every screen that renders these must
// label them as an example — they are never presented as somebody's work.

import type { InterviewHome } from "./interview-api";

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
