import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase-server";
import { getResumeRecord, getResumeTarget } from "@/lib/resume-api";
import { ResumeBuilder } from "@/components/resume-builder";

export const metadata = { title: "Build your resume" };
export const dynamic = "force-dynamic";

// The AI Resume Builder page: fetch where this person stands (their career
// record and the role locked from Discovery), then hand both to the builder.
export default async function ResumePage() {
  const session = await getServerSession();
  if (!session) redirect("/login?next=/resume");
  const [record, target] = await Promise.all([
    getResumeRecord(session.access_token),
    getResumeTarget(session.access_token),
  ]);

  return <ResumeBuilder profile={record?.profile ?? null} target={target} />;
}
