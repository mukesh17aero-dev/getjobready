import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { PreviewBar } from "@/components/preview-bar";
import { PreviewSwitcher } from "@/components/preview-switcher";
import { authorizeRole, homeRouteForRole } from "@/modules/identity";
import {
  exitPreviewAction,
  setPreviewRoleAction,
  signOutAction,
} from "../auth-actions";

export default async function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await authorizeRole("employer");
  if (!result.ok) redirect(result.redirectTo);

  const { user, previewRole, effectiveRole } = result.viewer;
  const isAdminLooking = user.role === "admin";

  return (
    <div className="flex min-h-full flex-col">
      {isAdminLooking ? (
        <PreviewBar area="employer" exitAction={exitPreviewAction} />
      ) : null}

      <AppHeader
        name={user.fullName ?? user.email}
        email={user.email}
        role={user.role}
        homeHref={homeRouteForRole(effectiveRole)}
        signOutAction={signOutAction}
        actions={
          isAdminLooking ? (
            <PreviewSwitcher
              current={previewRole ?? "admin"}
              action={setPreviewRoleAction}
            />
          ) : undefined
        }
      />
      {children}
    </div>
  );
}
