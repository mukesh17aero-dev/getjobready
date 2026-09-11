import { z } from "zod";

const strings = z.array(z.string());
const resume = z.object({
  header: z.object({ name: z.string(), city: z.string(), email: z.string(), phone: z.string().optional(), link: z.string().optional() }),
  summary: z.string(), summaryHeading: z.string().optional(),
  skills: z.array(z.object({ group: z.string(), items: strings })),
  experienceHeading: z.string(),
  experience: z.array(z.object({ title: z.string(), organisation: z.string(), period: z.string(), bullets: strings })),
  education: z.array(z.object({ qualification: z.string(), institution: z.string(), period: z.string(), detail: z.string() })),
  projects: z.array(z.object({ title: z.string(), detail: z.string(), tools: strings })).optional(),
  certifications: z.array(z.object({ title: z.string(), issuer: z.string(), year: z.string() })).optional(),
  achievements: strings.optional(), languages: strings, activities: strings, interests: strings.optional(), keywordsUsed: strings,
});
const review = z.object({
  strengths: strings, gaps: z.array(z.object({ what: z.string(), how: z.string() })),
  standing: z.object({ level: z.enum(["early", "competitive", "strong"]), why: z.string() }),
  nextStep: z.object({ route: z.enum(["readiness", "practice", "interview", "profile"]), why: z.string() }),
  roleIdeas: z.array(z.object({ role: z.string(), why: z.string() })).optional(),
  coverage: z.object({ covered: strings, missing: strings }), fromRules: z.boolean(),
});
const record = z.object({
  at: z.string().refine(value => Number.isFinite(Date.parse(value))), role: z.string(),
  resume, template: z.enum(["classic", "compact", "sidebar"]).optional(),
  downloadedAt: z.string().optional(), review: review.optional(),
});
export type StudioRecord = z.infer<typeof record>;
export function studioRecords(value: unknown): StudioRecord[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => { const parsed = record.safeParse(item); return parsed.success ? [parsed.data] : []; })
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 10);
}
