import { FeatureGrid } from "@/features/welcome";
import { RequestAccess } from "@/features/welcome";
import { EMPLOYER } from "@/features/welcome";

// The employer home. Same shape as the college one, and linkable directly for
// the same reason - a hiring manager arrives from an intro, not from the
// student home page.

export const metadata = {
  title: "Ascend for employers",
  description:
    "Candidates arrive with a record of work that was observed and marked, so screening rests on evidence rather than self-description.",
};

export default function EmployersPage() {
  return (
    <main className="mx-auto w-full max-w-(--page-max-width) px-4 pb-16 pt-6 sm:px-6">
      <FeatureGrid category={EMPLOYER} />
      {/* The way in. Everything above is not released yet, so the one
          thing this page can actually do for somebody is take their
          details and get a human back to them. */}
      <RequestAccess kind="employer" />
    </main>
  );
}
