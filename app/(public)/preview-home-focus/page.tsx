import type { Metadata } from "next";
import { getServerSession } from "@/lib/supabase-server";
import { getCareerRecord, getJourneyState } from "@/lib/api";
import { HomePreview } from "./home-preview";
import { PreviewFrame } from "./preview-frame";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Home preview",
  robots: { index: false, follow: false },
};

export default async function HomeFocusPreview() {
  const session = await getServerSession();
  const [state, record] = await Promise.all([
    getJourneyState(session?.access_token ?? null),
    session ? getCareerRecord(session.access_token) : Promise.resolve(null),
  ]);
  const meta = session?.user.user_metadata ?? {};
  const name = typeof meta.full_name === "string" ? meta.full_name : "";
  const photo = [meta.avatar_url, meta.picture].find(
    (value): value is string => typeof value === "string" && value.startsWith("http"),
  );

  return <PreviewFrame>
    <HomePreview state={state} profile={record?.profile ?? null} fallbackName={name} photo={photo} />
  </PreviewFrame>;
}
