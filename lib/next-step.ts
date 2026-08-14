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
      stake: "Everything Ascend does for you is built from what you say here. Nothing else.",
      title: "Start with you",
      because:
        "We know nothing about you yet — so there is nothing yet for us to work with.",
      action: "Tell us about you",
      href: "/profile",
      minutes: 5,
    };
  }

  if (!discoveryDone) {
    return {
      stake:
        "Most people choose a job title before they know what the work feels like. This does it the other way round.",
      title: name ? `${name}, find the work that fits you` : "Find the work that fits you",
      because: `You have told us ${told} ${plural(told, "thing", "things")} about yourself. Discovery turns that into named roles, with real pay and the honest parts.`,
      action: "Find what fits me",
      href: "/discover",
      minutes: 4,
    };
  }

  if (!selectedRole) {
    return {
      stake:
        "A direction you have picked is what turns the rest of this from browsing into building.",
      title: "Pick the one you want to aim at",
      because:
        "Your answers already point somewhere. Choosing it is what lets everything after this be about that role instead of about roles in general.",
      action: "See my matches",
      href: "/discover",
      minutes: 2,
    };
  }

  return {
    stake:
      "An employer decides in seconds whether your record reads like the role. Right now yours is written for nobody in particular.",
    title: "Make your record read like the role you chose",
    because:
      "You have chosen a direction. The next thing worth your time is closing the distance between what you have written down and what that work asks for.",
    action: "Open your record",
    href: "/profile",
    minutes: 6,
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
