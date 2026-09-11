import { FeatureGrid } from "@/components/feature-grid";
import { RequestAccess } from "@/components/request-access";
import { COLLEGE } from "@/lib/features";

// The college home. Reached from the welcome screen's audience tabs, and
// linkable directly from a deck or an email - which is how a placement officer
// actually arrives, rather than by browsing in from the student side.

export const metadata = {
  title: "Ascend for colleges",
  description:
    "Cohort readiness measured from work students were scored on, early enough in the year to change the outcome.",
};

export default function CollegesPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6">
      <FeatureGrid category={COLLEGE} />
      {/* The way in. Everything above is not released yet, so the one
          thing this page can actually do for somebody is take their
          details and get a human back to them. */}
      <RequestAccess kind="college" />
    </main>
  );
}
