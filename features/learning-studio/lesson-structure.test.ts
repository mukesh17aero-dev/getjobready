import { describe, expect, it } from "vitest";
import type { StudioJourneyData } from "@/lib/api";
import { blankStep } from "./step-kinds";
import { lessonsOf, withLessonOrder } from "./lesson-structure";

describe("lesson structure", () => {
  it("keeps an existing flat journey visible and in its original order", () => {
    const first = blankStep("text");
    const second = blankStep("quiz");
    const data: StudioJourneyData = { description: "", level: "student", objectives: [], language: "en", steps: [first, second] };
    const lessons = lessonsOf(data);
    expect(lessons[0]?.sections[0]?.stepIds).toEqual([first.id, second.id]);
    expect(withLessonOrder(data, lessons).steps.map((step) => step.id)).toEqual([first.id, second.id]);
  });

  it("orders blocks by lesson and subsection while retaining orphaned legacy steps", () => {
    const a = blankStep("text"); const b = blankStep("video"); const c = blankStep("quiz");
    const data: StudioJourneyData = { description: "", level: "student", objectives: [], language: "en", steps: [a, b, c] };
    const result = withLessonOrder(data, [{ id: "l", title: "Lesson", sections: [{ id: "s", title: "Section", stepIds: [b.id, a.id] }] }]);
    expect(result.steps.map((step) => step.id)).toEqual([b.id, a.id, c.id]);
    expect(result.lessons?.[0]?.sections[0]?.stepIds).toEqual([b.id, a.id, c.id]);
  });
});
