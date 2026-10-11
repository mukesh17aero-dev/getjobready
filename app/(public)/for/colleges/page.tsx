import Link from "next/link";
import { FeatureGrid } from "@/features/welcome";
import { RequestAccess } from "@/features/welcome";
import { COLLEGE } from "@/features/welcome";

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
    <main className="mx-auto w-full max-w-(--page-max-width) px-4 pb-16 pt-6 sm:px-6">
      <FeatureGrid category={COLLEGE} />
      {/* The way in. Everything above is not released yet, so the one
          thing this page can actually do for somebody is take their
          details and get a human back to them. */}
      <p className="mx-auto mt-8 max-w-3xl text-center text-sm text-slate-600">
        Already a partner?{" "}
        <Link href="/college" className="font-semibold text-brand-violet-deep underline">
          Open your cohort portal
        </Link>
      </p>
      <RequestAccess kind="college" />
    </main>
  );
}
