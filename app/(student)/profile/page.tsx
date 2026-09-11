import { getServerSession } from "@/lib/supabase-server";
import { getCareerRecord } from "@/lib/api";
import { ProfileForm } from "./profile-form";

export const metadata = { title: "Your profile" };
export const dynamic = "force-dynamic";

// Open to a visitor, like every other tool: the form reads in full, and the
// account is asked for at the first thing that writes - saving, importing a
// resume, uploading a photo - by the same prompt the other tools use, rather
// than by a login page at the door.
export default async function ProfilePage() {
  const session = await getServerSession();
  if (!session) return <ProfileForm profile={null} suggestedName="" photo={null} />;

  const record = await getCareerRecord(session.access_token);
  const meta = session.user.user_metadata ?? {};
  const suggestedName = (meta.full_name as string | undefined) ?? "";
  // Written onto the auth user when they upload one, so this page needs no
  // second call to know about it.
  const photo =
    [meta.avatar_url, meta.picture].find(
      (v): v is string => typeof v === "string" && v.startsWith("http"),
    ) ?? null;
  return (
    <ProfileForm
      profile={record?.profile ?? null}
      suggestedName={suggestedName}
      photo={photo}
    />
  );
}
