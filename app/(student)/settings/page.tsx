import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase-server";
import { BackLink } from "@/components/ui/back-link";
import { DeleteProfile } from "./delete-profile";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

// Settings holds the preferences that are not part of the career record, plus
// the one irreversible action. Editing who you are stays on /profile.
export default async function SettingsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?next=/settings");

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-16 sm:px-6">
      <div className="pt-4">
        <BackLink fallbackHref="/" fallbackLabel="Back to Home" />
      </div>

      <header className="mt-5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Settings
        </h1>
        <p className="mt-1.5 text-[0.9rem] text-slate-600">
          Signed in as {session.user.email}.
        </p>
      </header>

      <section className="mt-6 rounded-xl border border-slate-200 bg-surface p-4 sm:p-5">
        <h2 className="text-[0.95rem] font-semibold text-slate-900">
          Your details
        </h2>
        <Link
          href="/profile"
          className="mt-3 inline-block rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900"
        >
          Edit your profile
        </Link>
      </section>

      <DeleteProfile />
    </main>
  );
}
