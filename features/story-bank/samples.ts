// Sample story-bank data: what a full story bank looks like.
//
// Shown only where a page must demonstrate the shape of a result before
// this person has one of their own. Every screen that renders these must
// label them as an example — they are never presented as somebody's work.


import type { Story } from "@/lib/api";

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
