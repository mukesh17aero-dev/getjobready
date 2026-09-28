// Sample roleplay data: one finished conversation and its feedback.
//
// Shown only where a page must demonstrate the shape of a result before this
// person has one of their own. Every screen that renders this must label it
// as an example — it is never presented as somebody's work.

import type { RoleplayHome } from "./roleplay-api";

export const SAMPLE_ROLEPLAY: RoleplayHome["history"] = [
  {
    scenarioId: "difficult_customer",
    scenarioTitle: "De-escalating an unhappy customer",
    difficulty: "standard",
    completedAt: "2026-03-04T10:20:00.000Z",
    summary: {
      strengths: [
        "You acknowledged Priya's frustration in your first line before offering anything, which is exactly the order that lands.",
        "You asked what had actually arrived before assuming it was a delivery delay — that saved a wasted apology for the wrong problem.",
        "You proposed a concrete refund and a revised delivery date rather than a vague \"I'll sort it out\".",
      ],
      improvements: [
        "When Priya pushed back a second time, your reply repeated the same point instead of adding anything new — a second acknowledgement plus a firmer next step would have landed better.",
        "You offered a specific refund amount before checking what you were actually authorised to give — worth a quick \"let me confirm that\" instead.",
      ],
      focusNext:
        "Once you've acknowledged someone once, the second thing they need is progress, not repetition — have your next concrete step ready before they ask twice.",
      score: {
        overall: 73,
        bar: 73,
        perCriterion: [
          { id: "acknowledged", label: "Acknowledged the frustration first", rating: 3 },
          { id: "clarified", label: "Asked before assuming", rating: 3 },
          { id: "resolution", label: "Proposed a concrete next step", rating: 2 },
          { id: "composure", label: "Stayed composed under pushback", rating: 2 },
          { id: "no_overpromise", label: "Didn't over-promise", rating: 1 },
        ],
        ruleVersion: "v1",
      },
    },
    turns: [
      {
        index: 0,
        personaLine:
          "This is honestly ridiculous. My order was supposed to arrive three days ago and I still have nothing. What is going on?",
        concluding: false,
        reply: "I'm really sorry to hear that — that's a long wait. Can you give me your order number so I can see exactly what happened?",
      },
      {
        index: 1,
        personaLine:
          "Fine, it's ORD-4471. But I've already had to chase this myself, which is the part that's actually annoying me.",
        concluding: false,
        reply:
          "That's fair, you shouldn't have had to chase it. I can see it's stuck at the courier depot — I can get a refund processed today and have a replacement out for guaranteed delivery in two days. Does that work?",
      },
      {
        index: 2,
        personaLine: "Okay. As long as it actually happens this time.",
        concluding: true,
        reply: "Completely understand. I'll email you the refund confirmation and the new tracking number within the hour.",
      },
    ],
  },
];
