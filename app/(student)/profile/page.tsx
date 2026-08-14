import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase-server";
import { getCareerRecord } from "@/lib/api";
import { ProfileForm } from "./profile-form";

export const metadata = { title: "Your profile" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getServerSession();
  if (!session) redirect("/login?next=/profile");
  const record = await getCareerRecord(session.access_token);
  const suggestedName =
    (session.user.user_metadata?.full_name as string | undefined) ?? "";

  return (
    <ProfileForm profile={record?.profile ?? null} suggestedName={suggestedName} />
  );
}
