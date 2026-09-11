import { getServerSession } from "@/lib/supabase-server";
import { getResumeRecord, getResumeTarget } from "@/lib/resume-api";
import { ResumeStudio } from "./resume-studio";

export const metadata = { title: "Resume Studio" };
export const dynamic = "force-dynamic";

// Resume Studio: fetch where this person stands (their career record and the
// role locked from Discovery), then hand both to the studio.
//
// Signed out, the studio renders with no record. The start stage is fully
// usable, the draft, feedback and export stages show a worked example, and
// the account is asked for at the moment we would actually write the thing.
export default async function ResumeBuildPage({ searchParams }: { searchParams: Promise<{ record?: string }> }) {
  const { record: recordAt } = await searchParams;
  const session = await getServerSession();
  if (!session) return <ResumeStudio profile={null} target={null} signedOut />;

  const [record, target] = await Promise.all([
    getResumeRecord(session.access_token),
    getResumeTarget(session.access_token),
  ]);

  return <ResumeStudio key={recordAt ?? "new"} profile={record?.profile ?? null} target={target} recordAt={recordAt} />;
}
