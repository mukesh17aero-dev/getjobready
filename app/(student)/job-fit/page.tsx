import { getServerSession } from "@/lib/supabase-server";
import { getJobFit } from "@/lib/api";
import { SAMPLE_JOB_FIT } from "@/lib/samples";
import { JobFitStudio } from "./job-fit-studio";

// The Job Fit Analyzer. One call when signed in: the checks already run and
// the axes counted from this person's record.
//
// Signed out the page reads in full and shows a worked example - somebody
// else's check, labelled as one on every stage after the first. Somebody
// deciding whether this is worth an account should see what it produces
// first. The account is asked for at the one point that costs something:
// running a check, which reads their whole record and spends an AI call.

export const metadata = { title: "Job Fit Analyzer" };
export const dynamic = "force-dynamic";

export default async function JobFitPage() {
  const session = await getServerSession();

  if (!session) return <JobFitStudio checks={[SAMPLE_JOB_FIT]} signedOut />;

  const state = await getJobFit(session.access_token);
  if (!state) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-display text-[1.5rem] font-bold text-brand-ink">
          Job fit could not load
        </h1>
        <p className="mt-2 text-[0.9rem] text-slate-600">
          The server may just be waking up. Give it a moment and reload.
        </p>
      </main>
    );
  }

  return <JobFitStudio checks={state.checks} />;
}
