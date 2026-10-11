import { describe, expect, it } from "vitest";
import type { LearningJourney } from "@/lib/api/simulation-journey";
import { roleLessons, withRoleLessons } from "./role-journey-lessons";

const activity = (id: string) => ({ id, type: "text" as const, title: id, instructions: "", body: id, mediaUrl: "", captionsUrl: "", altText: "", required: true, skillIds: ["skill"], durationSeconds: 60, xp: 10, passScore: 70, attempts: 3, watchedPercent: 90, cards: [], questions: [] });
const journey: LearningJourney = { title: "Role", description: "", objectives: [], language: "en", completionXp: 100, activities: [activity("a"), activity("b"), activity("c")] };

describe("role learning journey lessons", () => {
  it("places older activities in one lesson without changing their content", () => {
    const lessons = roleLessons(journey);
    expect(lessons[0]?.sections[0]?.activityIds).toEqual(["a", "b", "c"]);
    expect(withRoleLessons(journey, lessons).activities).toEqual(journey.activities);
  });

  it("saves block order and attaches an orphan to the first subsection", () => {
    const updated = withRoleLessons(journey, [{ id: "lesson", title: "Learn", sections: [{ id: "section", title: "Read", activityIds: ["b", "a"] }] }]);
    expect(updated.activities.map((item) => item.id)).toEqual(["b", "a", "c"]);
    expect(updated.lessons?.[0]?.sections[0]?.activityIds).toEqual(["b", "a", "c"]);
  });
});
