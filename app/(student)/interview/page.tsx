import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Interview prep" };

export default function InterviewPage() {
  return (
    <ComingSoon
      stage="Stage 6 · AI Interview"
      title="Prepare for interviews"
      delivers="Role-specific practice interviews by voice or text, with feedback on relevance, structure and use of evidence — plus a personal story bank."
      backHref={"/tools"}
      backLabel={"Back to career tools"}
    />
  );
}
