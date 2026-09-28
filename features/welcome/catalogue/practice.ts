// Practice features, as the marketing pages describe them.

// ---------------------------------------------------------------- practice

// Not everything under this heading is finished, and each card says so - a
// tap that lands on "this part isn't built yet" is worse than a card that
// told you first. Role Readiness and Simulation Missions are live, though
// content is published role by role so not every role has both yet; Career
// Passport stays closed until the work that fills it exists to seal.
import type { FeatureCategory } from "./types";
export const PRACTICE: FeatureCategory = {
  id: "practice",
  title: "Practice the role",
  stake:
    "Knowing about a job and being able to do it are different things, and only one of them survives contact with a first week. This is where the second one gets built.",
  features: [
    {
      id: "role-readiness",
      title: "Role Readiness Assessment",
      blurb: "Fifteen minutes of the actual work, and what it showed.",
      status: "live",
      href: "/practice/readiness",
      time: "15 min",
      about:
        "Try 5 workplace questions with no time limit. Read the context cards and respond through decisions, messages, priority ordering, handovers or spoken updates. AI assistance is available on questions 1 and 2 only.",
      walkthrough: [
        {
          tab: "What",
          head: "What you get",
          body: "A readiness score for the job and a score for each skill your work actually showed, each one quoting the writing that produced it. A resume says what you claim; this says what you did, on work somebody in the job actually does.",
          art: "readiness-report",
        },
        {
          tab: "Who",
          head: "Who it is for, and how it starts",
          body: "Anyone who has chosen a role and would rather find out where they stand now than in front of an employer. You do not need work experience - the situations are the job's own work, explained as you go. Pick the job, read a short onboarding covering the company and who is around you, and press start. The clock does not begin until you do.",
          art: "readiness-scene",
        },
        {
          tab: "How",
          head: "The help beside the work",
          body: "Read a simple question and its context cards, then think through your response. AI assistance is available only on questions 1 and 2, with up to three requests per question. Answer the remaining questions independently. Clipboard actions in answer boxes and tab or window departures are recorded, with a warning; these observations are not automatic cheating findings.",
          points: [
            "Fifteen minutes of the job's own situations, one at a time",
            "AI assistance on the first two questions; your own response throughout",
            "Which situation comes next is chosen from how the last one went",
            "Every result is kept, so you can see what changed",
          ],
          art: "readiness-help",
        },
        {
          tab: "Result",
          head: "What comes back, and what to do next",
          body: "The score leads, with the reason beside it, and a reading of how you worked with the AI assistant - taking an answer whole and taking it apart read differently, and both are recorded. A skill the work never called on is left out rather than marked zero: no evidence is not the same as doing badly.",
          art: "readiness-ai",
        },
      ],
      forWho:
        "Anyone who has chosen a role and would rather find out where they stand now than in front of an employer.",
      expect:
        "A score for the role and one for each skill your work showed, each with the reason behind it quoted from what you wrote. Skills you did not get to are left out rather than marked zero. It is a reading of one sitting, and it says so.",
    },
    {
      id: "simulation-missions",
      title: "Simulation Missions",
      blurb: "Real workplace situations, with decisions that carry weight.",
      status: "live",
      href: "/practice/missions",
      time: null,
      about:
        "Short scenarios that put you inside the job rather than describing it - a decision to make, consequences that follow, and marking against what a competent person would have done.",
      forWho:
        "People who learn by doing, and anyone who needs evidence of capability rather than a certificate of attendance.",
      expect:
        "Missions are scored against the same skills as the readiness assessment, so practice moves the number that matters. Published role by role, so not every role has a full set yet.",
    },
    {
      id: "career-passport",
      title: "Career Passport",
      blurb: "The record of what you proved, in one place.",
      // Closed again while the work behind it is finished. A passport is
      // sealed from measured work, and the modules that produce that work are
      // still being built - so an open card here would hand somebody an empty
      // booklet with no way to fill it. The route still exists and says so;
      // it is just not offered.
      status: "building",
      href: null,
      time: null,
      about:
        "Everything you have demonstrated, gathered into a single record an employer can look at - not claims about yourself, but things you did that were marked.",
      forWho:
        "Anyone applying without a work history to point at, which is most people applying for their first role.",
      expect:
        "A booklet with your name on it, made the moment you choose a role and filled from your own practice and assessment results, so there is nothing extra to write. Ascend seals it once there is measured work inside, and a sealed passport is the one you can share.",
    },
  ],
};
