import type { JourneyState } from "@/lib/api";
import { progressOf } from "@/lib/next-step";

// The journey as data, so every layout that shows it is showing the same thing.
//
// The end-to-end map has fourteen screens on it. A person does not have
// fourteen things to do — they have one, with a past behind it and a future in
// front. Modelling it as stages with a state is what lets a page show all of it
// while asking for only one.
//
// A stage that has not opened is never a link. Sending someone to a screen that
// tells them to come back later is worse than showing them what it will give
// them and what unlocks it.

export type StageState = "done" | "live" | "ahead";

/** How far through a stage someone is, when the stage can be partly done. */
export type StageProgress = {
  done: number;
  total: number;
  /** Said in words, because "6 / 14" is not a sentence. */
  label: string;
};

export type Stage = {
  id: string;
  /** What you do here, in the second person. */
  title: string;
  /** What you walk away with — the reason to bother. */
  gives: string;
  /** What you already have from it. Null until it is done. */
  detail: string | null;
  /** What opens it. Null unless it is still ahead. */
  unlock: string | null;
  state: StageState;
  href: string | null;
  minutes: number | null;
  /**
   * Null when the stage cannot be half-finished, or when the module that would
   * measure it does not exist yet. A bar at zero on a stage nobody can start is
   * a lie about what is available.
   */
  progress: StageProgress | null;
};

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export function stages(state: JourneyState): Stage[] {
  const { told, discoveryDone, selectedRole, profile, discovery } =
    progressOf(state);

  // The survey has no fixed length — it ends when it is sure, somewhere between
  // eight and fourteen. Eight is the earliest it can end, so it is the honest
  // denominator for "how far in am I".
  const SURVEY_FLOOR = 8;
  const answered = discovery?.answered ?? 0;

  const built: Array<
    Omit<Stage, "state" | "href"> & { done: boolean; href: string }
  > = [
    {
      id: "about-you",
      title: "Tell us about you",
      gives: "Everything after this is built from what you say here",
      detail: told > 0 ? `${told} ${plural(told, "answer", "answers")} on file` : null,
      unlock: null,
      minutes: 5,
      done: Boolean(profile && profile.filled >= profile.total),
      href: "/profile",
      progress: profile
        ? {
            done: profile.filled,
            total: profile.total,
            label: `${profile.filled} of ${profile.total} questions answered`,
          }
        : null,
    },
    {
      id: "discovery",
      title: "Find the work that fits",
      gives: "Three jobs that suit you, with the pay and what the day is really like",
      detail: discoveryDone ? "Three matches, explained" : null,
      unlock: null,
      minutes: 4,
      done: discoveryDone,
      href: "/discover",
      progress: discoveryDone
        ? { done: 1, total: 1, label: "Finished" }
        : answered > 0
          ? {
              done: Math.min(answered, SURVEY_FLOOR),
              total: SURVEY_FLOOR,
              label: `${answered} ${plural(answered, "question", "questions")} in, a few to go`,
            }
          : null,
    },
    {
      id: "direction",
      title: "Choose a direction",
      gives: "From here on, everything is about that one job instead of jobs in general",
      detail: selectedRole ? "Saved to your record" : null,
      unlock: null,
      minutes: 2,
      done: Boolean(selectedRole),
      href: "/discover",
      progress: null,
    },
    {
      id: "readiness",
      title: "Check where you stand",
      gives: "What you can already do for that job, and the two things worth fixing",
      detail: null,
      unlock: "Opens once you have picked a job to aim at",
      minutes: 12,
      done: false,
      href: "/readiness",
      progress: null,
    },
    {
      id: "missions",
      title: "Try the actual work",
      gives: "Real tasks from the job, marked, that an employer can look at",
      detail: null,
      unlock: "Opens after you have checked where you stand",
      minutes: 20,
      done: false,
      href: "/practice/missions",
      progress: null,
    },
    {
      id: "interview",
      title: "Practise the interview",
      gives: "Feedback on what you actually said, and your best answers saved",
      detail: null,
      unlock: "Opens at the same time as the real tasks",
      minutes: 15,
      done: false,
      href: "/interview",
      progress: null,
    },
    {
      id: "passport",
      title: "Prove it",
      gives: "Proof of what you can do, sent to an employer only when you say so",
      detail: null,
      unlock: "Opens once two of those tasks have been marked",
      minutes: null,
      done: false,
      href: "/passport",
      progress: null,
    },
  ];

  // The live stage is the first unfinished one; everything past it is ahead.
  const liveIndex = built.findIndex((stage) => !stage.done);

  return built.map((stage, i) => {
    const state: StageState =
      stage.done ? "done" : i === liveIndex ? "live" : "ahead";
    return {
      id: stage.id,
      title: stage.title,
      gives: stage.gives,
      detail: stage.detail,
      unlock: state === "ahead" ? stage.unlock : null,
      state,
      // Nothing ahead is clickable: a link to "come back later" is a dead end.
      href: state === "ahead" ? null : stage.href,
      minutes: stage.minutes,
      progress: stage.progress,
    };
  });
}

/** How much of the journey is behind them, for the passport layout. */
export function completed(list: Stage[]): number {
  return list.filter((stage) => stage.state === "done").length;
}

/**
 * Progress across the whole journey, as a percentage.
 *
 * A finished stage counts once; the stage in progress counts for the fraction
 * of it that is done. Without that, someone eleven questions into a survey sits
 * at exactly the same number as someone who has not opened it.
 */
export function journeyPercent(list: Stage[]): number {
  const each = 100 / list.length;
  return Math.round(
    list.reduce((total, stage) => {
      if (stage.state === "done") return total + each;
      if (stage.state === "live" && stage.progress) {
        return total + each * Math.min(1, stage.progress.done / stage.progress.total);
      }
      return total;
    }, 0),
  );
}

/**
 * What a companion would actually say to this person today.
 *
 * Not a status line — a sentence with a reason in it. Every version names where
 * they are and what it buys them, because "6 of 8 answered" tells someone what
 * they have done and nothing about why to carry on.
 */
export function note(list: Stage[]): { lead: string; body: string } {
  const live = list.find((stage) => stage.state === "live");

  if (!live) {
    return {
      lead: "You have done everything that is open.",
      body: "The rest arrives as we build it, and you will hear from us when it does.",
    };
  }

  const partway = (live.progress?.done ?? 0) > 0;

  switch (live.id) {
    case "about-you":
      return partway
        ? {
            lead: `You are ${live.progress!.total - live.progress!.done} answers from a full record.`,
            body: "Finish those and everything after this — the roles, the gaps, the practice — is built from your own words rather than a guess.",
          }
        : {
            lead: "We know nothing about you yet.",
            body: "Five minutes changes that, and it is the only thing standing between you and roles that actually fit.",
          };
    case "discovery":
      return partway
        ? {
            lead: `You are ${live.progress!.done} questions into finding what fits.`,
            body: "A few more and I can name three roles that suit how you work — with the pay, the real day, and the parts people find hard.",
          }
        : {
            lead: "You have told me who you are. Now let me show you where that fits.",
            body: "A few minutes of real work choices — no right answers — and three roles come out of it, each one explained.",
          };
    case "direction":
      return {
        lead: "Three roles are waiting for you.",
        body: "Pick the one you want to aim at, and everything after this stops being about roles in general and starts being about that one.",
      };
    default:
      return {
        lead: `Next: ${live.title.toLowerCase()}.`,
        body: live.gives,
      };
  }
}

/**
 * Where this person stands inside a given entry point.
 *
 * The doors say what each one gives you. That is the right answer the first
 * time and the wrong one every time after, because by then the question is
 * "where did I get to in this". Only routes we can actually measure report a
 * number; the rest say plainly that nothing has started, which is true and is
 * better than a bar sitting at zero pretending to be data.
 */
export type RouteStatus = {
  label: string;
  /** 0–100 when there is something real to draw, null when there is not. */
  percent: number | null;
  done: boolean;
};

export function routeStatus(
  routeId: string,
  state: JourneyState,
  list: Stage[],
): RouteStatus {
  const { profile, discovery, selectedRole } = progressOf(state);

  switch (routeId) {
    case "resume": {
      // The resume is built from the record, so the record is what there is to
      // report until the studio itself exists.
      if (!profile || profile.filled === 0) {
        return { label: "Not started", percent: null, done: false };
      }
      const full = profile.filled >= profile.total;
      return {
        label: full
          ? "Your record is complete"
          : `Your record: ${profile.filled} of ${profile.total}`,
        percent: Math.round((profile.filled / profile.total) * 100),
        done: full,
      };
    }
    case "discovery": {
      if (discovery?.done) {
        return {
          label: selectedRole ? "Done · role chosen" : "Done · pick your role",
          percent: 100,
          done: true,
        };
      }
      const answered = discovery?.answered ?? 0;
      if (answered === 0) return { label: "Not started", percent: null, done: false };
      return {
        label: `${answered} ${plural(answered, "question", "questions")} in`,
        percent: Math.min(100, Math.round((answered / 8) * 100)),
        done: false,
      };
    }
    case "full_journey": {
      const behind = completed(list);
      return {
        label: `${behind} of ${list.length} steps behind you`,
        percent: journeyPercent(list),
        done: behind === list.length,
      };
    }
    default:
      // readiness, practice, interview — nothing to measure until they exist.
      return { label: "Not started", percent: null, done: false };
  }
}

