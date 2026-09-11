import { WorkRail } from "./work-rail";

// Getting back to what you already made. Dead preview page.
//
// Every feature that produces something keeps the old ones - resumes,
// readiness sittings, interviews, job fit checks - and every one of them puts
// that list at the FOOT of the page, under the tool. On a phone that is three
// screens below the fold, so the commonest thing a returning person wants is
// the hardest thing on the page to reach, and most never learn it is there.
//
// Three ways to put it in reach.

export const metadata = { title: "Preview — getting back to your work" };

export default function Page() {
  return <WorkRail />;
}
