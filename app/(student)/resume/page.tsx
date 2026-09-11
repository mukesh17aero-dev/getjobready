import { getServerSession } from "@/lib/supabase-server";
import { getCareerRecord, getJourneyState, getJobFit, getProfessionalProfile } from "@/lib/api";
import { ApplyWorkspace } from "./apply-workspace";
import { resumeSnapshot, snapshotFromResume } from "./resume-excerpt";
import { SAMPLE_JOB_FIT, SAMPLE_PROFILE, SAMPLE_RESUME } from "@/lib/samples";

// Professional Presence: the hub, not the resume tool. Three things live
// under this heading - the resume, the LinkedIn profile and the job fit check
// - so this page's job is to show where each one stands for this person and
// hand them straight to the one they came for.
//
// The builder itself lives at /resume/build. Anything still pointing at
// /resume lands here, which is the intent.

export const metadata = { title: "Professional Presence" };
export const dynamic = "force-dynamic";

export default async function ResumeLandingPage() {
  const session = await getServerSession();
  // Four reads, and only when there is somebody to read for. Signed out, there
  // is no saved work and no chosen role, and the page says so rather than
  // guessing.
  const [journey, record, professional, fit] = session ? await Promise.all([
    getJourneyState(session.access_token), getCareerRecord(session.access_token),
    getProfessionalProfile(session.access_token), getJobFit(session.access_token),
  ]) : [null, null, null, null];
  const meta = session?.user.user_metadata ?? {};
  const photo = [meta.avatar_url, meta.picture].find((v): v is string => typeof v === "string" && v.startsWith("http"));
  const name = professional?.name || journey?.progress?.name || (typeof meta.full_name === "string" ? meta.full_name : "");
  const latestCheck = fit?.checks.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
  // Signed out, each tool shows a finished example - a resume, a LinkedIn
  // profile and a job-fit check that belong to nobody - so what the tool
  // produces can be seen before an account is asked for.
  if (!session) return <ApplyWorkspace name={SAMPLE_PROFILE.name ?? ""} role={null} work={null}
    resume={snapshotFromResume(SAMPLE_RESUME, SAMPLE_JOB_FIT.roleTitle)} professional={SAMPLE_PROFILE} check={SAMPLE_JOB_FIT}
    signedIn={false} available={{ resume: true, linkedin: true, fit: true }} />;
  return <ApplyWorkspace name={name} photo={photo} role={journey?.progress?.role?.title ?? null}
    work={journey?.work ?? null} resume={resumeSnapshot(record?.profile?.preferences.resumeLedger)}
    professional={professional} check={latestCheck} signedIn
    available={{ resume: Boolean(record), linkedin: Boolean(professional), fit: Boolean(fit) }} />;
}
