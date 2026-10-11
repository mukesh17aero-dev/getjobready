"use client";

import { useState } from "react";
import Link from "next/link";
import type { AssessableRole } from "@/lib/api";
import { AssessmentRun, countOf } from "@/features/assessment";

// Keep role selection available on the approved overview, without an extra launch page.
function history(role: AssessableRole): string {
  if (role.sittings === 0) return "You have not taken this one yet.";
  const times = role.sittings === 1 ? "once" : `${role.sittings} times`;
  return role.lastReadiness === null
    ? `You have taken this ${times}.`
    : `You have taken this ${times}. Your last score was ${role.lastReadiness} out of 100.`;
}

/**
 * What the sitting they are about to enter holds, from the backend - a sitting
 * already under way may be from when sittings were 8 or 12 questions, and the
 * line must not promise five and then ask eight.
 */
export function sittingLine(role: Pick<AssessableRole, "sittingSize" | "inProgress">): string {
  const size = role.sittingSize;
  if (!size) return "Try a few workplace questions with no time limit.";
  if (role.inProgress) return `You have a sitting under way: ${role.inProgress.answered} of ${countOf(size, "question")} answered, with no time limit.`;
  return `Try ${countOf(size, "workplace question")} with no time limit.`;
}

export function ReadinessStart({ roles, initialRoleId, signedOut = false }: { roles: AssessableRole[]; initialRoleId?: string; signedOut?: boolean }) {
  const [roleId, setRoleId] = useState(initialRoleId ?? roles[0]?.roleId ?? "");
  const picked = roles.find(r => r.roleId === roleId) ?? roles[0];
  if (!picked) return null;
  const selector = <div className="readiness-role-selection">
    <label htmlFor="readiness-role">Choose a role<select id="readiness-role" value={picked.roleId} onChange={event => setRoleId(event.target.value)}>{roles.map(role => <option key={role.roleId} value={role.roleId}>{role.roleTitle}{role.current ? " (chosen in Discover)" : ""}{!role.hasAssessment ? " (not ready yet)" : ""}</option>)}</select></label>
    {!signedOut && <p>{history(picked)}</p>}
    {picked.sittings > 0 && <Link href={`/practice/readiness/results?role=${encodeURIComponent(picked.roleId)}`}>See past results →</Link>}
  </div>;
  return picked.hasAssessment ? <AssessmentRun key={picked.roleId} roleId={picked.roleId} roleTitle={picked.roleTitle} backHref="/practice" signedOut={signedOut} showIntroduction introductionHeader={selector} /> : <>{selector}<h1>Role readiness: {picked.roleTitle}</h1><p>The assessment for this role is not published yet. Choose another role to explore an available assessment.</p></>;
}
