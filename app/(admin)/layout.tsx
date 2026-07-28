import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { AppHeader } from "@/components/app-header";
import { PreviewSwitcher } from "@/components/preview-switcher";
import { authorizeRole, homeRouteForRole } from "@/modules/identity";
import { setPreviewRoleAction, signOutAction } from "../auth-actions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await authorizeRole("admin");
  if (!result.ok) redirect(result.redirectTo);

  const { user } = result.viewer;

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader
        name={user.fullName ?? user.username ?? user.email}
        email={user.email}
        role={user.role}
        homeHref={homeRouteForRole("admin")}
        signOutAction={signOutAction}
        actions={
          // Reaching this layout at all means the effective role is admin, so
          // the switcher always starts from "Admin" here.
          <PreviewSwitcher current="admin" action={setPreviewRoleAction} />
        }
      />
      <AdminNav />
      {children}
    </div>
  );
}
