import { ComingSoon } from "@/components/ui/coming-soon";

export const metadata = { title: "Opportunities" };

export default function OpportunitiesPage() {
  return (
    <ComingSoon
      stage="Stage 7 · Talent Network"
      title="Opportunities"
      delivers="Matched employer interviews ranked by your verified capability, with an interview kit for each — and your evidence shared only with your consent."
      backHref="/"
      backLabel="Back to home"
    />
  );
}
