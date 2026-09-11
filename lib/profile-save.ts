import type { CareerProfile } from "./api";
import { educationForRecord, experienceForRecord, hasSubstance, marksFromEducation, type EducationEntry, type ExperienceEntry, type ProfileFields } from "./profile";

/** Merge editable fields into the shared record without dropping other tools' saved work. */
export function profileSavePayload(
  previous: CareerProfile | null,
  fields: ProfileFields,
  education: EducationEntry[],
  experience: ExperienceEntry[],
  summary: string | null,
): Pick<CareerProfile, "education" | "experience" | "projects" | "achievements" | "preferences"> {
  return {
    education: education.filter(hasSubstance).map(educationForRecord),
    experience: experience.filter(hasSubstance).map(experienceForRecord),
    projects: previous?.projects ?? [],
    achievements: previous?.achievements ?? [],
    preferences: {
      ...previous?.preferences,
      ...fields,
      ...marksFromEducation(education),
      storySummary: summary,
    },
  };
}
