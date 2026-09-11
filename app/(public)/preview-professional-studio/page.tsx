import type { Metadata } from "next";
import { getServerSession } from "@/lib/supabase-server";
import { getProfessionalProfile } from "@/lib/api";
import { SAMPLE_PROFILE } from "@/lib/samples";
import { ProfessionalStudio } from "./professional-studio";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Professional profile studio preview", robots: { index: false, follow: false } };

export default async function ProfessionalStudioPreview() {
  const session = await getServerSession();
  const profile = session ? await getProfessionalProfile(session.access_token) : null;
  return <ProfessionalStudio initial={profile ?? SAMPLE_PROFILE} example={!profile} unavailable={Boolean(session && !profile)} />;
}
