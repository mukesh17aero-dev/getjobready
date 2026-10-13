import type { JourneyProgress, JourneyState } from "@/lib/api";

// The one thing to do next, and the three things a person needs to know about
// it before they will do it:
//
//   why should I care    → stake
//   why is this for me   → because, drawn from their own record
//   what do I do         → one action, never two
//
// Every screen that asks for something has to answer all three. Keeping them
// in one shape makes that checkable rather than aspirational: a step with no
// `because` is a step that has not earned the ask.
//
// The ordering is the backend's — which route is recommended, and what it
// resolves to, comes from the journey module. What lives here is the wording.

// An API that predates the progress summary tells us nothing about the
// person, which is a state the screens already know how to render — the same
// one a brand-new account is in. Never a crash.
const NOTHING_YET: JourneyProgress = {
  told: 0,
  profile: { filled: 0, total: 13 },
  discovery: { answered: 0, done: false },
  name: null,
  track: null,
  discoveryDone: false,
  selectedRole: null,
};

export function progressOf(state: JourneyState): JourneyProgress {
  return state.progress ?? NOTHING_YET;
}

export type NextStep = {
  stake: string;
  title: string;
  because: string;
  action: string;
  href: string;
  minutes: number;
};

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export function nextStep(state: JourneyState): NextStep {
  const { told, name, discoveryDone, selectedRole } = progressOf(state);

  if (told === 0) {
    return {
      stake: "Pick the work before you pick a job title.",
      title: name ? `${name}, find the work that fits you` : "Find the work that fits you",
      because: "We don't know anything about you yet — exploring roles is the place to start.",
      action: "Explore roles",
      href: "/discover",
      minutes: 4,
    };
  }

  if (!discoveryDone) {
    return {
      stake: "See what the work feels like before you commit to a title.",
      title: name ? `${name}, find the work that fits you` : "Find the work that fits you",
      because: `You've told us ${told} ${plural(told, "thing", "things")} so far. Discovery turns that into real roles.`,
      action: "Find what fits me",
      href: "/discover",
      minutes: 4,
    };
  }

  // "Has a role been chosen?" is the role object, not selectedRole alone:
  // selectedRole can be the sentinel "none" (they went through Discovery and
  // picked none) or an id whose role no longer resolves to an object. In both
  // cases there is nothing to run a skills check against, so send them back to
  // pick one. The role object is the signal the rest of the UI trusts for this
  // (see start-router's "Your direction").
  const role = state.progress?.role;
  if (!role || !selectedRole || selectedRole === "none") {
    return {
      stake: "Choosing a direction turns browsing into building.",
      title: "Pick the one you want to aim at",
      because: "Your answers already point somewhere — choose one to aim at.",
      action: "See my matches",
      href: "/discover",
      minutes: 2,
    };
  }

  // A role is chosen. From here the ladder follows the journey: find out where
  // you stand, do the real work, rehearse the interview, then prepare to apply.
  // Each step is the first one not yet finished; "done" comes from the backend's
  // per-module status (and, for the skills check, from a finished sitting too).
  const mods = state.modules ?? {};
  const skillsCheckDone =
    mods.readiness === "done" ||
    (state.evidence?.readiness ?? []).some((sitting) => sitting.roleId === role.id);

  if (!skillsCheckDone) {
    return {
      stake: "An employer decides in seconds whether you can do the job.",
      title: "See where you stand",
      because: `You chose ${role.title}. A skills check shows what you can already prove, and what to work on.`,
      action: "Start a skills check",
      href: `/practice/readiness?role=${encodeURIComponent(role.id)}`,
      minutes: 15,
    };
  }

  if (mods.simulation !== "done") {
    return {
      stake: "Knowing the skills isn't the same as doing the work.",
      title: "Try the real work",
      because: `Practise ${role.title} tasks, marked the way the job would mark them.`,
      action: "Start a simulation",
      href: `/practice/missions?role=${encodeURIComponent(role.id)}`,
      minutes: 20,
    };
  }

  if (mods.interview !== "done") {
    return {
      stake: "The interview is where it all has to come together, out loud.",
      title: "Practise the interview",
      because: `Answer ${role.title} questions and get feedback on each one.`,
      action: "Start an AI interview",
      href: "/interview/practice",
      minutes: 15,
    };
  }

  if (mods.resume !== "done") {
    return {
      stake: "An employer decides in seconds whether your resume reads like the role.",
      title: "Make your resume read like the role",
      because: `You've done the work — now make your resume show it for ${role.title}.`,
      action: "Open your resume",
      href: "/resume/build",
      minutes: 10,
    };
  }

  if (mods.jobFit !== "done") {
    return {
      stake: "Before you apply, see how you line up against the real posting.",
      title: "Check your job fit",
      because: `Compare a ${role.title} opening with what your profile now proves.`,
      action: "Check a job",
      href: "/job-fit",
      minutes: 5,
    };
  }

  return {
    stake: "You've built the proof — now put it in front of people.",
    title: "Share what you've proven",
    because: "Your Skills Passport now has real, scored evidence behind it.",
    action: "Open your Passport",
    href: "/passport",
    minutes: 3,
  };
}

export type Station = {
  id: string;
  label: string;
  /** What they banked. Null until it is true — never a placeholder. */
  detail: string | null;
  done: boolean;
};

/** What Ascend has, in the order it was earned. */
export function stations(state: JourneyState): Station[] {
  const { told, track, discoveryDone, selectedRole } = progressOf(state);
  return [
    {
      id: "you",
      label: "You told us about yourself",
      detail: told > 0 ? `${told} ${plural(told, "answer", "answers")} on your record` : null,
      done: told > 0,
    },
    {
      id: "track",
      label: "We know which road you are on",
      detail:
        track === "student"
          ? "Studying"
          : track === "early_career"
            ? "Working or job-hunting"
            : null,
      done: Boolean(track),
    },
    {
      id: "discovery",
      label: "You found the work that fits",
      detail: discoveryDone ? "Three matches, explained" : null,
      done: discoveryDone,
    },
    {
      id: "direction",
      label: "You chose a direction",
      detail: selectedRole ? "Saved to your record" : null,
      done: Boolean(selectedRole),
    },
  ];
}
