import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase-server";
import { adminAccess, adminContent } from "@/lib/api";
import { RoleStudio } from "./role-studio";
import { AdminConsole } from "./admin-console";

export const metadata = { title: "Admin console" };
export const dynamic = "force-dynamic";

export default async function AdminPage({searchParams}:{searchParams:Promise<{view?:string;role?:string;add?:string}>}) {
  const query=await searchParams;
  const session = await getServerSession();
  if (!session) redirect("/login?next=/admin");

  const token = session.access_token;
  if(query.view!=="content"&&!query.role&&!query.add){const access=await adminAccess(token);if(!access?.isAdmin)return <main className="p-10">Admin access is unavailable. Sign in as an administrator and retry.</main>;return <RoleStudio/>;}
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
      initialRoleId={query.role}
      startAdding={query.add==="1"}
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
