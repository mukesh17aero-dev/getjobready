import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Resume Studio" };

export default function ResumePage() {
  return (
    <ComingSoon
      stage="Stage 1 · Resume"
      title="Resume Studio"
      delivers="Upload what you have or start from scratch. Ascend builds a marketable, ATS-safe resume in Word and PDF — and creates the career record every later module reuses."
      backHref={"/tools"}
      backLabel={"Back to career tools"}
    />
  );
}
