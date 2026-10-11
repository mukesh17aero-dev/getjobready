/** Display copy only: the saved stage is owned by the career record API. */
export type ExploreIntro = { eyebrow: string; title: string; description: string };

const student: ExploreIntro = {
  eyebrow: "EXPLORE YOUR FIRST ROLE",
  title: "Find work that feels worth trying.",
  description: "Browse the day-to-day, compare the trade-offs, and save what interests you.",
};
const professional: ExploreIntro = {
  eyebrow: "EXPLORE YOUR NEXT MOVE",
  title: "Find a role to build on your experience.",
  description: "Compare responsibilities, skills and growth opportunities to plan your next career move.",
};
const neutral: ExploreIntro = {
  eyebrow: "EXPLORE YOUR OPTIONS",
  title: "Find work that feels worth trying.",
  description: "Browse the day-to-day, compare the trade-offs, and save what interests you.",
};

export function exploreIntro(profileType?: string | null, savedTrack?: string | null): ExploreIntro {
  // A Home link carries the current selection, including an unsaved guest choice.
  if (profileType === "student") return student;
  if (profileType === "experienced" || profileType === "early_career") return professional;
  // Both Home and Profile write this same field, so the latest saved choice wins.
  if (savedTrack === "student") return student;
  if (savedTrack === "early_career") return professional;
  return neutral;
}
