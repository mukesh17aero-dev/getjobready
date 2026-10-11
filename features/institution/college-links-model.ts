// How a student's college links are grouped and worded. Plain functions, so the
// wording and the grouping can be tested without rendering anything.

import type { InstitutionLink } from "@/lib/api";

/** Pending invitations first (they need an answer), then active, then history. */
export function splitLinks(links: InstitutionLink[]): { pending: InstitutionLink[]; active: InstitutionLink[]; past: InstitutionLink[] } {
  const byDate = (a: InstitutionLink, b: InstitutionLink) => b.requestedAt.localeCompare(a.requestedAt);
  return {
    pending: links.filter((l) => l.status === "pending").sort(byDate),
    active: links.filter((l) => l.status === "active").sort(byDate),
    past: links.filter((l) => l.status === "declined" || l.status === "revoked").sort(byDate),
  };
}

/** What the college can and cannot see. Mirrors ascend-backend/src/modules/institution: the roster holds an email and a status, and everything else is group totals. */
export const SHARED = "Your college sees your email address and that you accepted. Your practice results are counted in group totals and averages.";
export const NOT_SHARED = "They do not see your individual scores, answers, resume or stories, and averages are only shown once at least 3 students are included.";
export const STOP_ANY_TIME = "You can stop sharing at any time in Settings.";

export function pastLabel(link: InstitutionLink): string {
  return link.status === "declined" ? "You declined" : "You stopped sharing";
}
