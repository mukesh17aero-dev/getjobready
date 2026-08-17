import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Passport" };

export default function PassportPage() {
  return (
    <ComingSoon
      stage="Stage 5 · Passport"
      title="Your Ascend Passport"
      delivers="Your portable, evidence-backed professional identity: resume, benchmark report, verified competencies and simulation evidence — with sharing you control."
      backHref="/"
      backLabel="Back to home"
    />
  );
}
