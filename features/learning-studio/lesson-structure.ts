import type { LearningLesson, StudioJourneyData } from "@/lib/api";

/** Give older flat journeys a visible home without changing their saved data. */
export function lessonsOf(data: StudioJourneyData): LearningLesson[] {
  if (data.lessons?.length) return data.lessons;
  if (!data.steps.length) return [];
  return [{ id: "existing-lesson", title: "Existing activities", sections: [{ id: "existing-section", title: "Activities", stepIds: data.steps.map((step) => step.id) }] }];
}

/** Keep the flat list in reading order for existing learner and video flows. */
export function withLessonOrder(data: StudioJourneyData, lessons: LearningLesson[]): StudioJourneyData {
  const byId = new Map(data.steps.map((step) => [step.id, step]));
  const referenced = new Set(lessons.flatMap((lesson) => lesson.sections.flatMap((section) => section.stepIds)));
  const orphanIds = data.steps.map((step) => step.id).filter((id) => !referenced.has(id));
  const nextLessons = lessons.map((lesson, lessonIndex) => ({ ...lesson, sections: lesson.sections.map((section, sectionIndex) =>
    lessonIndex === 0 && sectionIndex === 0 ? { ...section, stepIds: [...section.stepIds, ...orphanIds] } : section) }));
  const ordered = nextLessons.flatMap((lesson) => lesson.sections.flatMap((section) => section.stepIds))
    .map((id) => byId.get(id)).filter((step): step is StudioJourneyData["steps"][number] => Boolean(step));
  const seen = new Set(ordered.map((step) => step.id));
  return { ...data, lessons: nextLessons, steps: [...ordered, ...data.steps.filter((step) => !seen.has(step.id))] };
}
