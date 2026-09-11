import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase-server";
import { adminAccess, adminContent } from "@/lib/api";
import { AdminConsole } from "./admin-console";

export const metadata = { title: "Admin console" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?next=/admin");

  const token = session.access_token;
  const [
    access,
    discovery,
    roles,
    skillModel,
    assessmentArc,
    interviewBank,
  ] = await Promise.all([
    adminAccess(token),
    adminContent(token, "discovery_content"),
    adminContent(token, "role_catalogue"),
    adminContent(token, "skill_model"),
    adminContent(token, "assessment_arc"),
    adminContent(token, "interview_bank"),
  ]);

  if (access && !access.isAdmin) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">
          You don&apos;t have access to the admin console
        </h1>
        <p className="mt-3 text-slate-600">
          Ask an administrator to add your account, then reload this page.
        </p>
      </main>
    );
  }

  return (
    <AdminConsole
      openToEveryone={access?.openToEveryone ?? true}
      aiConfigured={access?.aiConfigured ?? false}
      discovery={discovery}
      roles={roles}
      skillModel={skillModel}
      assessmentArc={assessmentArc}
      interviewBank={interviewBank}
    />
  );
}
