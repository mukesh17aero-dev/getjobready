import { Suspense } from "react";
import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { isAdminEmail } from "@/lib/admin-auth";
import { getAdminDimensions } from "@/lib/admin-data";
import { AdminPageSkeleton } from "@/components/admin/admin-page-skeleton";
import { DimensionEditForm } from "@/components/admin/dimension-edit-form";
import { DashboardSectionError } from "@/components/dashboard/dashboard-section-error";

interface AdminPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }
  // Defense-in-depth beyond middleware, same pattern as /dashboard.
  if (!isAdminEmail(user.email)) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-purple-900">
            Admin: Dimensions
          </h1>
          <p className="text-sm text-gray-500">Signed in as {user.email}</p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-purple-700 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-700"
        >
          Dashboard
        </Link>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <Suspense fallback={<AdminPageSkeleton />}>
        <DimensionsSection supabase={supabase} />
      </Suspense>
    </main>
  );
}

async function DimensionsSection({ supabase }: { supabase: SupabaseClient }) {
  const result = await getAdminDimensions(supabase);

  if (!result.ok) {
    return (
      <DashboardSectionError message="We couldn't load dimensions. Please refresh the page." />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {result.data.map((dimension) => (
        <DimensionEditForm key={dimension.dimensionId} dimension={dimension} />
      ))}
    </div>
  );
}
