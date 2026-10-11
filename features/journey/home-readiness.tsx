import Link from "next/link";
import type { HomeEvidence, JourneyProgress } from "@/lib/api";
import s from "./home-readiness.module.css";

/** Display the backend's assessment with its provenance; never infer a score. */
export function HomeReadiness({ role, evidence }: {
  role: JourneyProgress["role"];
  evidence: HomeEvidence | null;
}) {
  const result = evidence?.readiness
    .filter(item => role && item.roleId === role.id)
    .toSorted((a, b) => b.at.localeCompare(a.at))[0];
  const date = result?.at ? new Date(result.at) : null;
  const complete = result && result.basis && result.basis.scenesInSitting > 0
    && result.confidence && date && Number.isFinite(date.getTime());
  return <section className={s.card} aria-labelledby="readiness-heading">
    <div>
      <p className={s.label}>Your preparation progress</p>
      <h3 id="readiness-heading">{role ? `Readiness for ${role.title}` : "No readiness score yet."}</h3>
      {!result ? <p>{role ? "Try a role task to build evidence of what you can do." : "Choose a role or begin with one service."}</p>
        : complete ? <>
          <p className={s.score}><strong>{result.score}<span> / 100</span></strong><span>{result.stale ? "Needs a refresh" : "Role readiness"}</span></p>
          <p>{result.basis!.scenesAttempted} of {result.basis!.scenesInSitting} situations assessed · Confidence: {result.confidence}</p>
          <p>Source: role skills assessment · Updated <time dateTime={result.at}>{date!.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</time></p>
          <p>This is preparation progress, not a hiring prediction.</p>
        </> : <p>Your assessment is saved. Open the report to review its evidence and scoring details.</p>}
    </div>
    <Link href={result ? `/practice/readiness/results${result.runId ? `/${encodeURIComponent(result.runId)}` : ""}` : role ? `/practice?role=${encodeURIComponent(role.id)}` : "/discover"}>
      {result ? "Review my evidence" : role ? "Try a role task" : "Choose a role"} →
    </Link>
  </section>;
}
