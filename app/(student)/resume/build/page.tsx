import { getServerSession } from "@/lib/supabase-server";
import { getResumeRecord, getResumeTarget } from "@/features/resume";
import { ResumeStudio, GuestResume, ResumeLoadError } from "@/features/resume";

export const metadata = { title: "Resume builder" };
export const dynamic = "force-dynamic";

// Resume Studio: fetch where this person stands (their career record and the
// role locked from Discovery), then hand both to the studio.
//
// Signed-out visitors can write and restore a browser-local draft; exporting requires sign-in.
// Account import is explicit after sign-in.
export default async function ResumeBuildPage({ searchParams }: { searchParams: Promise<{ record?: string; profileType?: string; start?: string }> }) {
  const { record: recordAt, profileType, start } = await searchParams;
  const session = await getServerSession();
  if (!session) return <GuestResume initialTrack={profileType === "experienced" ? "early_career" : "student"} />;

  const [record, target] = await Promise.all([
    getResumeRecord(session.access_token),
    getResumeTarget(session.access_token),
  ]);

  if (!record) return <ResumeLoadError />;

  return <ResumeStudio initialPurpose={start === "upload" ? "improve" : start === "details" ? "general" : undefined} initialTrack={profileType === "experienced" ? "early_career" : profileType === "student" ? "student" : undefined} key={recordAt ?? "new"} profile={record?.profile ?? null} target={target} recordAt={recordAt} />;
}
