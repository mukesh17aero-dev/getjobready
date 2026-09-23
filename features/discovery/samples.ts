// Sample discovery data: one role, as the role page shows it.
//
// Shown only where a page must demonstrate the shape of a result before
// this person has one of their own. Every screen that renders these must
// label them as an example — they are never presented as somebody's work.


import type { RoleBrief, RoleDetail } from "@/lib/api";

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
