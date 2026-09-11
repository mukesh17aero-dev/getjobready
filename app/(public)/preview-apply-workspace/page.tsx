import type { Metadata } from "next";
import { getServerSession } from "@/lib/supabase-server";
import { getCareerRecord, getJourneyState, getJobFit, getProfessionalProfile } from "@/lib/api";
import { ApplyPreview } from "./apply-preview";
import { resumeExcerpt } from "./preview-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Application workspace preview", robots: { index: false, follow: false } };

export default async function ApplyWorkspacePreview() {
  const session = await getServerSession();
  const [journey, record, professional, fit] = session ? await Promise.all([
    getJourneyState(session.access_token), getCareerRecord(session.access_token),
    getProfessionalProfile(session.access_token), getJobFit(session.access_token),
  ]) : [null, null, null, null];
  const meta = session?.user.user_metadata ?? {};
  const photo = [meta.avatar_url, meta.picture].find((v): v is string => typeof v === "string" && v.startsWith("http"));
  const name = professional?.name || journey?.progress?.name || (typeof meta.full_name === "string" ? meta.full_name : "");
  const latestCheck = fit?.checks.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
  return <ApplyPreview name={name} photo={photo} role={journey?.progress?.role?.title ?? null}
    work={journey?.work ?? null} resume={resumeExcerpt(record?.profile?.preferences.resumeLedger)}
    professional={professional} check={latestCheck} signedIn={Boolean(session)}
    available={{ resume: Boolean(record), linkedin: Boolean(professional), fit: Boolean(fit) }} />;
}
