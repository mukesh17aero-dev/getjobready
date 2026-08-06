import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Role readiness" };

export default function ReadinessPage() {
  return (
    <ComingSoon
      stage="Stage 3 · Assessment"
      title="Check role readiness"
      delivers="A concise, role-specific proficiency check with a benchmarked report: your baseline score, strengths, job-critical gaps and a prescribed practice plan."
    />
  );
}
