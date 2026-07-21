import { Suspense } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import {
  getDimensionCards,
  getNextBestAction,
  getPriScore,
} from "@/lib/dashboard-data";
import { PriDial } from "@/components/dashboard/pri-dial";
import { PriDialSkeleton } from "@/components/dashboard/pri-dial-skeleton";
import { NextBestActionCard } from "@/components/dashboard/next-best-action-card";
import { NextBestActionSkeleton } from "@/components/dashboard/next-best-action-skeleton";
import { DimensionCards } from "@/components/dashboard/dimension-cards";
import { DimensionCardsSkeleton } from "@/components/dashboard/dimension-cards-skeleton";
import { DashboardSectionError } from "@/components/dashboard/dashboard-section-error";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-purple-900">
            Welcome, {user.email}
          </h1>
          <p className="text-sm text-gray-500">Your employability readiness</p>
        </div>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="rounded bg-gray-900 px-3 py-1.5 text-sm text-white"
          >
            Log out
          </button>
        </form>
      </div>

      <Suspense fallback={<PriDialSkeleton />}>
        <PriDialSection supabase={supabase} studentId={user.id} />
      </Suspense>

      <Suspense fallback={<NextBestActionSkeleton />}>
        <NextBestActionSection supabase={supabase} studentId={user.id} />
      </Suspense>

      <Suspense fallback={<DimensionCardsSkeleton />}>
        <DimensionCardsSection supabase={supabase} studentId={user.id} />
      </Suspense>
    </main>
  );
}

interface SectionProps {
  supabase: SupabaseClient;
  studentId: string;
}

async function PriDialSection({ supabase, studentId }: SectionProps) {
  const result = await getPriScore(supabase, studentId);
  if (!result.ok) {
    return (
      <DashboardSectionError message="We couldn't load your readiness score. Please refresh the page." />
    );
  }
  return <PriDial score={result.data} />;
}

async function NextBestActionSection({ supabase, studentId }: SectionProps) {
  const result = await getNextBestAction(supabase, studentId);
  if (!result.ok) {
    return (
      <DashboardSectionError message="We couldn't load your next step. Please refresh the page." />
    );
  }
  return <NextBestActionCard recommendation={result.data} />;
}

async function DimensionCardsSection({ supabase, studentId }: SectionProps) {
  const result = await getDimensionCards(supabase, studentId);
  if (!result.ok) {
    return (
      <DashboardSectionError message="We couldn't load your dimension statuses. Please refresh the page." />
    );
  }
  return <DimensionCards cards={result.data} />;
}
