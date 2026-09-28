// Discovery and journey features, as the marketing pages describe them.

// ----------------------------------------------------------------- journey

// The whole package, in the order it is meant to be walked. Five of the seven
// are usable today; the line at the top of the page shows which.
// Discovery has a front door now, the same as the resume and the interview.
// One card, because there is one tool. The browsing, the tour and the
// assistant are all inside it - listing them alongside it made four doors
// into the same room and read as more product than there is.
import type { FeatureCategory } from "./types";
import { PRACTICE } from "./practice";
export const DISCOVER: FeatureCategory = {
  id: "discover",
  title: "Discovery",
  stake:
    "Applying for whatever appears is how people end up in jobs that do not fit. This is where you find out what the work actually is - what the day is spent on, what it pays, what is hard about it - before you aim at anything.",
  features: [
    {
      id: "discovery",
      title: "Discovery",
      blurb: "See what the work actually is, then pick the role you want.",
      status: "live",
      href: "/discover",
      time: "15-22 min",
      about:
        "You pick the industries you are curious about and read every role inside them - what the day is actually spent on, what it pays, what is hard about it - then walk a few of them properly and choose one.",
      forWho:
        "Anyone who cannot yet name the job they are aiming at - which is the honest starting position for most people.",
      expect:
        "A shortlist in your own words, and one role you chose. That choice is what makes everything after it specific to you.",
      walkthrough: [
        {
          tab: "What",
          head: "What you get",
          body: "A real catalogue of non-technical jobs, opened up: what each day involves, what it pays now and three steps later, where it leads, and what is hard about it. Applying for whatever appears is how people end up in jobs that do not fit.",
          art: "discovery-role",
        },
        {
          tab: "Who",
          head: "Who it is for, and how to start",
          body: "Anyone who cannot yet name the job they are going for - the ordinary starting position, and the thing every other module depends on you having settled. Pick the industries you are curious about, as many as you like and changeable whenever. Not sure what is in one? Look inside before you pick it.",
          art: "discovery-industries",
        },
        {
          tab: "How",
          head: "How you use it",
          body: "Read a few roles, then take the tour of the ones worth a proper look - you choose the stops and how many, one role at a time.",
          points: [
            "Roles from a real catalogue, with real pay ranges",
            "No test and no score - you read the work and decide",
            "A tour you choose the stops for, one role at a time",
            "An assistant on every role, for what the page does not say",
          ],
          art: "discovery-tour",
        },
        {
          tab: "Ask",
          head: "The assistant beside every role",
          body: "The assistant is there at every stop and answers what the page does not: whether the pay holds outside a metro, what the job is like without a degree, what the worst week looks like. Ask it in your own words.",
          art: "discovery-chat",
        },
        {
          tab: "Result",
          head: "What comes back, and what to do next",
          body: "The tour ends on a shortlist of the roles you walked, each with what you said about it at the time - your own reason for ruling one in or out, written before you had to defend it. Then choose a role: the readiness assessment measures you against it, practice closes the gaps, and the interview asks its questions.",
          art: "discovery-shortlist",
        },
      ],
    },
  ],
};

export const JOURNEY: FeatureCategory = {
  id: "journey",
  title: "The whole journey",
  stake:
    "Each of these is useful alone. In order, they compound - what you learn in Discovery decides the role, the role decides what you practise, and what you practise is what you end up able to prove.",
  features: [
    // The first stage is the same feature described in DISCOVER, borrowed
    // rather than restated - one description of Discovery, in one place, and
    // one address now that the tool opens on the page it is described on.
    DISCOVER.features[0]!,
    {
      id: "assessment",
      title: "Assessment",
      blurb: "Measure where you stand against the role you picked.",
      status: "live",
      href: "/practice/readiness",
      time: "15 min",
      about:
        "The starting-point check: what you can already do for the chosen role, and what is missing. Ten real workplace situations, not a self-rating.",
      forWho: "Anyone who has finished Discovery and chosen a role.",
      expect:
        "A score for the role and one for each skill your work showed, each with the reason behind it quoted from what you wrote. It is a reading of one sitting, and it says so.",
      walkthrough: PRACTICE.features[0]!.walkthrough,
    },
    {
      id: "practice-stage",
      title: "Practice",
      blurb: "Close the gaps the assessment found.",
      status: "live",
      href: "/practice",
      time: null,
      about:
        "Targeted work on the specific competencies you came up short on, rather than a general course everybody takes.",
      forWho: "Anyone with a measured gap and time to close it.",
      expect:
        "Driven by your own assessment results, so no two people get the same set. One hub for the readiness sitting, simulation missions and your Career Passport.",
    },
    {
      id: "simulation",
      title: "Simulation",
      blurb: "Do the job before anyone has hired you to.",
      status: "live",
      href: "/practice/missions",
      time: null,
      about:
        "Full task cycles inside a realistic version of the role - the part that turns knowing into having done.",
      forWho: "Anyone who has practised and wants to prove it under pressure.",
      expect:
        "Simulation results are what the Career Passport is built from. Published role by role, so not every role has a full set yet.",
    },
    {
      id: "passport",
      title: "Career Passport",
      blurb: "Everything you proved, gathered into one record.",
      status: "building",
      href: null,
      time: null,
      about:
        "A record of demonstrated capability that an employer can inspect, rather than a list of claims.",
      forWho: "Anyone applying without a work history to point at.",
      expect: "In development. It assembles itself from what you have done.",
    },
    {
      id: "journey-interview",
      title: "AI Interview",
      blurb: "Say the words out loud before the day.",
      status: "live",
      href: "/interview/practice",
      time: "12-15 min",
      about:
        "A practice interview with questions written for your role, and feedback on what you actually said.",
      forWho:
        "Anyone with an interview coming, and anyone who freezes in them.",
      expect:
        "A transcript, feedback, and a short list of what to work on that the next interview picks up from.",
    },
    {
      id: "job-deployment",
      title: "Job Deployment",
      blurb: "Reach the employers who are looking for what you proved.",
      status: "planned",
      href: null,
      time: null,
      about:
        "The last step: putting a finished, evidenced profile in front of employers searching for exactly that capability.",
      forWho:
        "People who have completed the journey and are ready to be hired.",
      expect:
        "Not released yet. Only learners who opt in will be discoverable, and employers will see evidence rather than claims.",
    },
  ],
};
