// Every category, keyed the way the pages look them up.

import type { FeatureCategory } from "./types";
import { RESUME } from "./resume";
import { INTERVIEW } from "./interview";
import { PRACTICE } from "./practice";
import { JOURNEY } from "./journey";
import { COLLEGE, EMPLOYER } from "./partners";
export const CATEGORIES: Record<string, FeatureCategory> = {
  resume: RESUME,
  interview: INTERVIEW,
  practice: PRACTICE,
  journey: JOURNEY,
  college: COLLEGE,
  employer: EMPLOYER,
};
