import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase-server";
import { adminAccess, adminContent } from "@/lib/api";
import { PicturesPanel } from "./pictures-panel";

export const metadata = { title: "Role pictures" };
export const dynamic = "force-dynamic";

type Catalogue = {
  roles?: Array<{ id: string; title: string }>;
  details?: Array<{ roleId: string; workMix?: Array<{ label: string; share: number; detail?: string }> }>;
};

export default async function RolePicturesPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?next=/admin/pictures");
  const token = session.access_token;
  const access = await adminAccess(token);
  if (!access?.isAdmin) return <main className="p-10">Admin access is unavailable. Sign in as an administrator and retry.</main>;

  const data = ((await adminContent(token, "role_catalogue"))?.published?.data ?? {}) as Catalogue;
  // A starting scene from each role's biggest share of the day; the admin can rewrite it.
  const roles = (data.roles ?? []).map((role) => {
    const top = [...(data.details?.find((d) => d.roleId === role.id)?.workMix ?? [])].sort((a, b) => b.share - a.share)[0];
    return {
      id: role.id,
      title: role.title,
      scene: top
        ? `A young Indian ${role.title} at work, ${top.label.toLowerCase()}${top.detail ? `: ${top.detail}` : ""}. Real props of the job in their hands.`
        : `A young Indian ${role.title} at work, mid-task, with the real props of the job.`,
    };
  });
  return <PicturesPanel roles={roles} />;
}
