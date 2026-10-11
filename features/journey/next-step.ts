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
      stake:
        "Most people pick a job title before they know what the work feels like. Start the other way round — by looking at the work itself.",
      title: name ? `${name}, find the work that fits you` : "Find the work that fits you",
      because:
        "We know nothing about you yet, so there is nothing to tailor this to. Exploring real roles is the one step that needs nothing from you first.",
      action: "Explore roles",
      href: "/discover",
      minutes: 4,
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

  // A role is chosen. The next worthwhile thing is not polishing a resume — it
  // is finding out where you actually stand against that role. Only once a
  // skills check exists does closing the gap on your resume become the step
  // that earns the ask.
  const role = state.progress?.role;
  const skillsCheckDone =
    state.modules?.readiness === "done" ||
    (state.evidence?.readiness ?? []).some((sitting) => sitting.roleId === role?.id);

  if (!skillsCheckDone) {
    return {
      stake:
        "An employer spends seconds deciding whether you can do the job. Knowing where you actually stand — before you polish anything — is what makes the rest worth doing.",
      title: role ? `See where you stand as a ${role.title}` : "See where you stand",
      because: role
        ? `You chose ${role.title}. A skills check shows which of its skills you can already prove, and which to work on — the part a resume cannot show.`
        : "You have chosen a direction. A skills check shows which of its skills you can already prove, and which to work on.",
      action: "Start a skills check",
      href: role ? `/practice/readiness?role=${encodeURIComponent(role.id)}` : "/practice/readiness",
      minutes: 15,
    };
  }

  return {
    stake:
      "An employer decides in seconds whether your record reads like the role. Right now yours is written for nobody in particular.",
    title: role ? `Make your resume read like a ${role.title}` : "Make your resume read like the role",
    because:
      "You know where you stand. The next thing worth your time is closing the distance between what you have written down and what the work asks for.",
    action: "Open your resume",
    href: "/resume/build",
    minutes: 10,
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
