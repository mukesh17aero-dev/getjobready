import { getServerSession } from "@/lib/supabase-server";
import { getResumeRecord, SavedResumes } from "@/features/resume";

export const metadata = { title: "My resumes" };
export const dynamic = "force-dynamic";

export default async function SavedResumesPage() {
  const session = await getServerSession();
  const record = session ? await getResumeRecord(session.access_token) : null;
  return <SavedResumes signedIn={Boolean(session)} profile={record?.profile ?? null} unavailable={Boolean(session && !record)} />;
}
