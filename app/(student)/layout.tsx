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

/**
 * The authorisation gate for every student page. It sits in the layout so a new
 * page under `(student)/` is protected by existing, not by remembering to add a
 * check.
 *
 * The rule itself lives in `modules/identity`; this decides only what to do
 * with its answer, which is the routing layer's job.
 */
export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await authorizeRole("student");
  if (!result.ok) redirect(result.redirectTo);

  const { user, previewRole, effectiveRole } = result.viewer;
  // True whether they arrived through the preview switcher or simply typed the
  // address — either way they are not seeing their own data, and should know.
  const isAdminLooking = user.role === "admin";

  return (
    <div className="flex min-h-full flex-col">
      {isAdminLooking ? (
        <PreviewBar area="student" exitAction={exitPreviewAction} />
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
