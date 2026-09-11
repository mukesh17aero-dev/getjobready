// Fixture shaped exactly like the live /v1/discovery payload, shared by the
// two preview routes. Local sample content only - the real catalogue is served
// to signed-in requests, which is why these previews exist.

import type { DiscoveryContent, RoleDetail } from "@/lib/api";

function role(
  roleId: string,
  sector: string,
  spec: Omit<RoleDetail, "roleId" | "sector" | "voices" | "voicesIllustrative">,
): RoleDetail {
  return { roleId, sector, voices: [], voicesIllustrative: true, ...spec };
}

export const ROLES: RoleDetail[] = [
  role("customer_success_associate", "Retail", {
    pitch: "The person customers remember, for better or worse.",
    description:
      "You are on the floor when something has gone wrong - a return, a wrong size, a bill that does not add up - and you are also there when someone just wants advice.",
    workMix: [
      { label: "With customers", share: 55, detail: "Face to face, one at a time" },
      { label: "Stock and displays", share: 25, detail: "Counting, moving, tidying" },
      { label: "Billing and systems", share: 20, detail: "Terminal, returns, records" },
    ],
    responsibilities: [
      "Greet and assist customers, understanding what they actually need",
      "Handle queries, complaints and returns in line with store policy",
      "Maintain product knowledge across the full range",
    ],
    skills: [
      { name: "Staying steady", why: "A good share of conversations start annoyed" },
      { name: "Switching", why: "Two people will need you at the same time" },
    ],
    workContext: {
      environment: "Shop floor, on your feet",
      hours: "Rotational shifts, weekends busiest",
      pace: "Quiet stretches, then all at once",
      team: "Six to ten, one supervisor",
    },
    payMonthly: { min: 14000, max: 20000 },
    payNote: "Indicative monthly range for Bengaluru; varies by employer and city.",
    growth: [
      { title: "Senior Associate", when: "12 months", pay: { min: 20000, max: 26000 } },
      { title: "Team Lead", when: "24 months", pay: { min: 28000, max: 38000 } },
    ],
    hardTruths: [
      "You are the face of mistakes you did not make - a late delivery is not your fault, but you are the one standing there.",
      "Weekends and festivals are the busiest days, and they are the days you will work.",
    ],
    suitsYouIf: [
      "You stay level when somebody in front of you is upset",
      "You would rather be interrupted all day than sit with one task",
    ],
    knowledge: {
      illustrative: true,
      importance:
        "this is the only job in the shop whose whole purpose is catching a problem before it reaches a manager or a review site. A store can survive a bad week of sales; it does not survive a month of people leaving annoyed, and this is the role standing between those two things.",
      opportunities: [
        "team lead on a larger floor, usually within two years",
        "customer operations inside a chain, where the same instinct is applied to a process rather than a person",
        "training and onboarding, once you have supervised anybody",
        "category or buying support, because you know what people actually ask for",
      ],
      succeed: [
        "They stop treating each complaint as a one-off and start noticing which one keeps arriving.",
        "They learn the policy well enough to say no kindly, which is a different skill from knowing it.",
        "They make themselves the person a new joiner asks, which is how a supervisor gets picked long before the job is posted.",
      ],
      skillsThatMatter: [
        { name: "Staying level", why: "the first thirty seconds of an upset conversation decides the other ten minutes" },
        { name: "Recall", why: "looking something up twice loses the room, and people notice" },
        { name: "Closing", why: "ending a conversation well is what lets you serve the next person at all" },
      ],
      interview: {
        stages: ["a short phone call", "a face-to-face with the store manager", "sometimes an hour on the floor watching"],
        judgedOn: [
          "whether you stay level when a story turns awkward",
          "whether you listen before you answer",
          "whether you would still be pleasant at the end of a long shift",
        ],
      },
      withAI: "the routine half - order status, refund rules, the same five questions - is increasingly answered by an app before anyone reaches you. That has not reduced the job so much as concentrated it: what walks up to you now is the case software could not settle, which is harder, more interesting, and worth more.",
      ceilings: [
        "It does not become a head-office job by itself; that takes a deliberate move around the three-year mark.",
        "And it is not a route into anything technical without separate study.",
      ],
    },
  }),
  role("store_operations_assistant", "Retail", {
    pitch: "The shop works because somebody counted things at seven in the morning.",
    description:
      "Stock in, stock out, and knowing what is actually on the shelf versus what the system thinks is there.",
    workMix: [
      { label: "Stock handling", share: 50, detail: "Receiving, checking, shelving" },
      { label: "Records and systems", share: 30, detail: "Counts, discrepancies, orders" },
      { label: "Helping on the floor", share: 20, detail: "When it gets busy" },
    ],
    responsibilities: [
      "Receive deliveries and check them against the order",
      "Keep stock records matching what is physically there",
      "Flag shortages before they become empty shelves",
    ],
    skills: [
      { name: "Care with numbers", why: "A miscount today is a missing order on Friday" },
      { name: "Routine without drifting", why: "The job is the same shape every day" },
    ],
    workContext: {
      environment: "Back of store and stockroom",
      hours: "Early starts, weekdays mostly",
      pace: "Steady, with delivery-day spikes",
      team: "Three to five",
    },
    payMonthly: { min: 13000, max: 18000 },
    payNote: "Indicative monthly range; varies by employer and city.",
    growth: [
      { title: "Operations Executive", when: "18 months", pay: { min: 19000, max: 25000 } },
      { title: "Store Operations Lead", when: "3 years", pay: { min: 27000, max: 36000 } },
    ],
    hardTruths: [
      "The early start is not occasional - it is the job, most days.",
      "Nobody notices this work until it is wrong.",
    ],
    suitsYouIf: [
      "You would rather be trusted with a system than watched on a floor",
      "You notice when a number does not add up",
    ],
    knowledge: {
      illustrative: true,
      importance:
        "every promise the shop makes to a customer depends on the stock record being true. When it is wrong, somebody is told an item is available that is not - and the person who takes that complaint is on the floor, not back here.",
      opportunities: [
        "operations executive across several stores",
        "warehouse or hub coordination, where the same discipline is worth more",
        "supply and planning support, which is where the numbers people end up",
      ],
      succeed: [
        "They find the cause of a recurring discrepancy instead of correcting it again.",
        "They make the count boring by fixing the process that made it exciting.",
      ],
      skillsThatMatter: [
        { name: "Care with numbers", why: "a miscount today is an empty shelf on Friday and nobody will trace it back to you" },
        { name: "Routine without drifting", why: "the job is the same shape every day and the mistakes come from the tenth repetition, not the first" },
      ],
      interview: {
        stages: ["a call", "a short practical - counting and reconciling something in front of them"],
        judgedOn: ["whether you are careful under mild time pressure", "whether you say when you are unsure rather than guessing"],
      },
      withAI: "forecasting and reorder suggestions are increasingly automatic, so less of the day is deciding what to order and more of it is judging when the system is wrong. That is a harder job, and a safer one.",
      ceilings: [
        "It stays behind the scenes; if you want to be in front of customers this is the wrong door.",
      ],
    },
  }),
  role("field_sales_executive", "Sales", {
    pitch: "You are out of the building, and the day is yours to lose.",
    description:
      "Visiting shops or customers in a patch you are given, explaining what you sell, and coming back with orders.",
    workMix: [
      { label: "Travel and visits", share: 60, detail: "Your patch, on a two-wheeler" },
      { label: "Talking to buyers", share: 25, detail: "Explaining, negotiating, following up" },
      { label: "Reporting", share: 15, detail: "What happened, what is next" },
    ],
    responsibilities: [
      "Cover a fixed set of shops or customers each week",
      "Explain the range and take orders",
      "Follow up on payments and complaints",
    ],
    skills: [
      { name: "Starting conversations", why: "Nobody is waiting for you to arrive" },
      { name: "Handling a no", why: "Most visits end in one" },
    ],
    workContext: {
      environment: "On the road, mostly outdoors",
      hours: "Long days, target-driven",
      pace: "Fast, and you set it yourself",
      team: "Reporting to one area manager",
    },
    payMonthly: { min: 15000, max: 22000 },
    payNote:
      "Indicative fixed monthly range; incentives vary widely and are not guaranteed.",
    growth: [
      { title: "Senior Executive", when: "18 months", pay: { min: 24000, max: 32000 } },
      { title: "Area Sales Manager", when: "3-4 years", pay: { min: 40000, max: 60000 } },
    ],
    hardTruths: [
      "The target does not care why the week was bad.",
      "A lot of the day is travel, in whatever weather there is.",
    ],
    suitsYouIf: [
      "You would rather be judged on results than on being seen at a desk",
      "A stranger saying no does not stay with you",
    ],
  }),
];

export const CONTENT: Pick<DiscoveryContent, "worlds" | "catalogue"> = {
  worlds: [
    {
      id: "retail",
      title: "Retail and stores",
      caption: "Where things are sold and kept moving",
      brief: {
        illustrative: true,
        what: "Retail is the business of putting things in front of people and making the exchange work - in a shop, a showroom or a warehouse behind one. The jobs in it are less about selling than most people assume: a large part of the day is knowing what is in stock, why it is not, and what to tell the person standing in front of you about it. It is one of the few industries where a nineteen-year-old is trusted with a customer and a till in their first week.",
        changed: "For most of the last century it was family-run counters where the owner knew every regular. Organised chains changed that by standardising how a store runs - the same layout, the same process, the same training in a hundred towns - which is what created a career ladder where there had only been a job. The last decade added an online half to almost every chain, so a shop is now also a place orders are picked from.",
        heading: "The part that is growing is the work that needs a person present: advice, returns, the awkward cases an app cannot settle. The part that is shrinking is the purely transactional counter work, which is steadily being absorbed by self-checkout and apps. Anyone building a decade here should be moving toward the first and away from the second.",
        starting: "It is one of the easiest industries to get into and one of the harder ones to be taken seriously in. Nobody will ask for a degree; they will watch how you handle somebody who is already annoyed. The people who move up tend to do it fast and inside two years, because the store can see exactly what you are like every day.",
      },
    },
    {
      id: "sales",
      title: "Sales",
      caption: "Being paid for what you bring back",
      brief: {
        illustrative: true,
        what: "Sales is being given a patch - a set of shops, customers or accounts - and being responsible for what comes back from it. The day is mostly travel and conversation, and the work is judged on a number rather than on hours seen at a desk. It suits people who would rather be measured than watched.",
        changed: "It used to be built on relationships that took years and territories nobody could see into. Software changed the second half of that: every visit, order and follow-up is now logged, so a manager can see a week's work in a dashboard. That has made the job more transparent and, for some, more pressured.",
        heading: "Simple order-taking is moving to apps and portals, so what is left for a person is the harder half - explaining something complicated, rescuing an unhappy account, opening a customer who has said no twice. Pay is following it: the gap between an average and a strong performer is wider here than in most industries.",
        starting: "Expect the first six months to be uncomfortable. Most visits end in no, and the skill being built is not persuasion so much as not carrying the last no into the next conversation. In return it is one of the few starts where what you earn is genuinely in your hands, and where two years of it opens doors in almost any industry.",
      },
    },
    {
      id: "logistics",
      title: "Logistics",
      caption: "Getting things from there to here",
      brief: {
        illustrative: true,
        what: "Logistics is the work of moving things and knowing where they are - hubs, routes, riders, stock counts. Most roles in it are coordination under time pressure: something has gone wrong somewhere, and it is your afternoon. It is invisible when done well, which is both the difficulty and the appeal.",
        changed: "E-commerce turned it from a back-office function into the thing customers judge a company on. Delivery promises measured in days became promises measured in hours, and that pushed a whole layer of planning and supervision jobs into towns that never had them.",
        heading: "Routing and forecasting are increasingly done by software, so the human work is shifting toward exceptions and toward managing people rather than parcels. The roles that involve only data entry are the exposed ones; the ones that involve running a shift are not.",
        starting: "The hours are the honest cost - early starts are normal and the busy season is not optional. What you get for it is responsibility early: people run hubs and shifts here at an age they would still be shadowing someone in most industries.",
      },
    },
  ],
  catalogue: [
    {
      id: "customer_success_associate",
      title: "Customer Success Associate",
      world: "retail",
      summary: "On the floor, with the people who came in.",
    },
    {
      id: "store_operations_assistant",
      title: "Store Operations Assistant",
      world: "retail",
      summary: "Behind the floor, keeping the stock honest.",
    },
    {
      id: "field_sales_executive",
      title: "Field Sales Executive",
      world: "sales",
      summary: "Out in a patch of the city, bringing back orders.",
    },
  ],
};

