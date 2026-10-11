import type { JourneyLesson, LearningJourney } from "@/lib/api/simulation-journey";

export function roleLessons(journey: LearningJourney): JourneyLesson[] {
  if (journey.lessons?.length) return journey.lessons;
  return journey.activities.length ? [{ id: "existing-lesson", title: "Existing activities", sections: [{ id: "existing-section", title: "Activities", activityIds: journey.activities.map((activity) => activity.id) }] }] : [];
}

export function withRoleLessons(journey: LearningJourney, lessons: JourneyLesson[]): LearningJourney {
  const known = new Set(lessons.flatMap((lesson) => lesson.sections.flatMap((section) => section.activityIds)));
  const orphanIds = journey.activities.map((activity) => activity.id).filter((id) => !known.has(id));
  const next = lessons.map((lesson, li) => ({ ...lesson, sections: lesson.sections.map((section, si) =>
    li === 0 && si === 0 ? { ...section, activityIds: [...section.activityIds, ...orphanIds] } : section) }));
  const byId = new Map(journey.activities.map((activity) => [activity.id, activity]));
  const ordered = next.flatMap((lesson) => lesson.sections.flatMap((section) => section.activityIds)).map((id) => byId.get(id)).filter((item): item is LearningJourney["activities"][number] => Boolean(item));
  return { ...journey, lessons: next, activities: next.length ? ordered : journey.activities };
}
