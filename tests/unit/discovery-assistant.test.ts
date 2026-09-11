import { describe, expect, it } from "vitest";
import {
  breaksPromiseRule,
  assistantAnswers,
  assistantHooks,
  tourBriefing,
  isAskingForAPromise,
  replyTo,
  type RoleKnowledge,
} from "@/components/discovery-assistant";
import type { RoleDetail } from "@/lib/api";

const role: RoleDetail = {
  roleId: "customer_success_associate",
  sector: "Retail",
  pitch: "Keep customers sorted, and keep them coming back.",
  description: "The person on the floor when something has gone wrong.",
  workMix: [{ label: "With customers", share: 60, detail: "Face to face" }],
  responsibilities: [
    "Handle queries, complaints and returns in line with store policy",
    "Maintain product knowledge across the range",
  ],
  skills: [
    { name: "Staying steady", why: "Most conversations start annoyed" },
    { name: "Switching", why: "Two people need you at once" },
  ],
  workContext: {
    environment: "Shop floor",
    hours: "Rotational, weekends",
    pace: "Busy in bursts",
    team: "Six to ten",
  },
  payMonthly: { min: 14000, max: 20000 },
  payNote: "Indicative, Bengaluru, varies by employer.",
  growth: [
    { title: "Senior Associate", when: "12 months", pay: { min: 20000, max: 26000 } },
    { title: "Team Lead", when: "24 months", pay: { min: 28000, max: 38000 } },
  ],
  hardTruths: ["You are the face of mistakes you did not make."],
  suitsYouIf: ["You stay level when someone is upset."],
  voices: [],
  voicesIllustrative: true,
};

const knowledge: RoleKnowledge = {
  standards: [{ when: "three months", looksLike: "You stop escalating the easy ones." }],
  tools: ["the billing terminal", "a CRM"],
  industry: [{ heading: "Quick commerce is growing", detail: "More roles, shorter shifts." }],
  transfers: ["operations", "inside sales"],
  ceilings: ["It does not become a corporate job without a deliberate move."],
  behind: {
    "Handle queries, complaints and returns in line with store policy":
      "Means saying no to someone who is already upset, using words that are not yours.",
  },
};

describe("the discovery assistant makes no promises", () => {
  const answers = assistantAnswers(role, knowledge);

  it("has something to say to every starter", () => {
    expect(answers.length).toBeGreaterThan(4);
    for (const { a } of answers) expect(a.length).toBeGreaterThan(40);
  });

  it("never promises an outcome in any answer it can give unprompted", () => {
    for (const { q, a } of answers) {
      expect(breaksPromiseRule(a), `answer to "${q}" promises something`).toBe(false);
    }
  });

  it("describes progression as what happens to people, not to the reader", () => {
    const leads = answers.find((x) => x.q === "Where does it lead?");
    expect(leads).toBeDefined();
    expect(leads?.a).toMatch(/typically|usual/i);
    expect(leads?.a).not.toMatch(/\byou will\b/i);
  });

  it("hedges pay as a range that varies rather than an amount", () => {
    const pay = answers.find((x) => x.q === "What does it really pay?");
    expect(pay?.a).toMatch(/typically/i);
    expect(pay?.a).toMatch(/varies/i);
  });

  it("declines the questions that are asking for a guarantee", () => {
    for (const q of [
      "will i get this job",
      "Would I be good at this?",
      "can i get placed in 3 months",
      "do i have a chance",
    ]) {
      expect(isAskingForAPromise(q), q).toBe(true);
      const reply = replyTo(q, role);
      expect(breaksPromiseRule(reply)).toBe(false);
      expect(reply).toMatch(/no way of knowing|not going to tell you/i);
    }
  });

  it("still answers ordinary questions rather than deflecting everything", () => {
    const reply = replyTo("what are the shifts like", role);
    expect(reply).not.toMatch(/no way of knowing/i);
  });

  // What actually ships today: the backend does not send RoleKnowledge yet, so
  // every role on a walk-through reaches the assistant with nothing behind it.
  // It has to stay useful and stay honest in that state, or the tour is a
  // demo rather than a feature.
  describe("with no written depth for the role", () => {
    const bare = assistantAnswers(role, null);

    it("still answers from the record rather than going silent", () => {
      expect(bare.length).toBeGreaterThan(2);
      for (const { a } of bare) expect(a.length).toBeGreaterThan(40);
    });

    it("makes no promise it could not make with the depth", () => {
      for (const { q, a } of bare) {
        expect(breaksPromiseRule(a), `answer to "${q}"`).toBe(false);
      }
    });

    it("offers nothing it cannot answer", () => {
      // The written-depth questions must simply not be on the menu - an
      // apology in place of an answer is worse than not asking.
      for (const q of [
        "What does good look like here?",
        "What is the industry doing?",
        "What will I actually be using?",
      ]) {
        expect(bare.some((x) => x.q === q), q).toBe(false);
      }
    });

    it("only teases questions it has an answer to", () => {
      const answerable = new Set(bare.map((a) => a.q));
      for (const hook of assistantHooks(role, null)) {
        expect(answerable.has(hook.q), hook.teaser).toBe(true);
      }
    });
  });

  // What the assistant says on a tour, unprompted, for two minutes per role.
  // This is the content the tour exists for, delivered to somebody who cannot
  // check any of it - which is exactly the situation in which a system invents
  // things.
  describe("the tour briefing", () => {
    const deep: RoleKnowledge = {
      ...knowledge,
      importance: "Nothing else in the store catches a problem before it reaches the manager.",
      opportunities: ["team lead on a bigger floor", "customer operations in a chain"],
      succeed: ["They write down the complaint that keeps coming back."],
      skillsThatMatter: [{ name: "Steadiness", why: "the first minute decides the rest" }],
      interview: {
        stages: ["a short call", "a roleplay with a manager"],
        judgedOn: ["whether you stay level", "whether you listen before answering"],
      },
      withAI: "The routine answers are drafted by software now, so what is left for a person is the case it cannot settle.",
    };

    it("opens with the job and promises what a description leaves out", () => {
      expect(tourBriefing(role, deep)[0]!.text).toMatch(
        /job description leaves out/i,
      );
    });

    it("titles every chapter, so a tour can be read as well as heard", () => {
      for (const c of tourBriefing(role, deep)) {
        expect(c.title.length).toBeGreaterThan(4);
        expect(c.text.length).toBeGreaterThan(30);
      }
    });

    it("covers what no job description does, when it has been written", () => {
      const said = tourBriefing(role, deep)
        .map((c) => `${c.title} ${c.text}`)
        .join(" ");
      expect(said).toMatch(/why this job exists/i);
      expect(said).toMatch(/door into several/i);
      expect(said).toMatch(/how they actually hire/i);
      expect(said).toMatch(/turning into/i);
      expect(said).toMatch(/honest ceiling/i);
    });

    it("promises nothing, written or not", () => {
      for (const k of [deep, knowledge, null]) {
        for (const c of tourBriefing(role, k)) {
          expect(breaksPromiseRule(c.text), c.text).toBe(false);
          expect(breaksPromiseRule(c.title), c.title).toBe(false);
        }
      }
    });

    it("skips what has not been written rather than inventing it", () => {
      const bare = tourBriefing(role, null)
        .map((c) => `${c.title} ${c.text}`)
        .join(" ");
      expect(bare).not.toMatch(/why this job exists/i);
      expect(bare).not.toMatch(/how they actually hire/i);
      expect(bare).not.toMatch(/what it opens up/i);
      // A briefing with no written depth is short rather than padded: it says
      // only the things the record itself supports.
      expect(bare).toMatch(/what this actually is/i);
      // It used to close on a chapter inventorying the gaps ("What I do not
      // have yet"). That was removed - the reticence shows by the chapter
      // simply not being built, which is what the assertions above check.
      expect(bare).not.toMatch(/what i do not have yet/i);
    });

    it("still has something to say with nothing written at all", () => {
      const bare = tourBriefing(role, null);
      expect(bare.length).toBeGreaterThanOrEqual(3);
      for (const c of bare) expect(c.text.length).toBeGreaterThan(40);
    });
  });

  // Self-exploring: the assistant volunteers none of the briefing, but it has
  // to actually answer when somebody asks for a piece of it. Deflecting a
  // question we hold the answer to is the same failure as inventing one.
  describe("answering what was actually asked", () => {
    const deep: RoleKnowledge = {
      ...knowledge,
      interview: {
        stages: ["a short call", "a roleplay"],
        judgedOn: ["whether you stay level"],
      },
      opportunities: ["team lead on a bigger floor"],
      withAI: "The routine answers are drafted by software now.",
    };

    it("answers an interview question with the interview", () => {
      for (const q of [
        "what is the interview process",
        "How do they hire for this?",
        "is there a test round",
      ]) {
        expect(replyTo(q, role, deep), q).toMatch(/how they actually hire/i);
      }
    });

    it("answers pay, day and progression from the record", () => {
      expect(replyTo("what does it pay", role, deep)).toMatch(/typically/i);
      expect(replyTo("what are the hours like", role, deep)).toMatch(/hours are/i);
      expect(replyTo("what is the career path", role, deep)).toMatch(/usual path/i);
    });

    it("answers an AI question when it has been written", () => {
      expect(replyTo("will ai replace this job", role, deep)).toMatch(
        /drafted by software/i,
      );
    });

    it("admits the gap rather than reaching for a near-miss", () => {
      expect(replyTo("what is the dress code", role, deep)).toMatch(
        /do not have it, I say so|say so plainly/i,
      );
    });

    it("still declines a question asking for a guarantee", () => {
      expect(replyTo("will i get this job", role, deep)).toMatch(
        /no way of knowing/i,
      );
    });
  });

  // The detector has to bite, or the tests above prove nothing.
  it("catches the promises we are worried about", () => {
    for (const bad of [
      "You will earn ₹40K within a year.",
      "This is a guaranteed placement.",
      "You would be great at this role.",
      "This will land you a job in retail.",
      "Within 6 months you will be a team lead.",
      "You will definitely enjoy it.",
    ]) {
      expect(breaksPromiseRule(bad), bad).toBe(true);
    }
  });
});
