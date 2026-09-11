// A small display excerpt from the existing saved resume, without changing it.
export type ResumeExcerpt = { role: string; at: string; name: string; summary: string; skills: string[]; experience: { title: string; organisation: string }[]; downloaded: boolean };
const object = (v: unknown): Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v) ? v as Record<string, unknown> : {};
const string = (v: unknown) => typeof v === "string" ? v : "";

export function resumeExcerpt(raw: unknown): ResumeExcerpt | null {
  if (!Array.isArray(raw)) return null;
  const latest = raw.map(object).filter(e => typeof e.role === "string" && typeof e.at === "string" && Object.keys(object(e.resume)).length > 0)
    .sort((a, b) => string(b.at).localeCompare(string(a.at)))[0];
  if (!latest) return null;
  const resume = object(latest.resume);
  return { role: string(latest.role), at: string(latest.at), name: string(object(resume.header).name), summary: string(resume.summary),
    skills: Array.isArray(resume.skills) ? resume.skills.flatMap(group => { const items = object(group).items; return Array.isArray(items) ? items.filter((item): item is string => typeof item === "string") : []; }).slice(0, 5) : [],
    experience: Array.isArray(resume.experience) ? resume.experience.slice(0, 2).map(entry => ({ title: string(object(entry).title), organisation: string(object(entry).organisation) })) : [],
    downloaded: Boolean(latest.downloadedAt) };
}
