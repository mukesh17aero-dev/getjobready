import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">Welcome, {user.email}</h1>
      <p className="text-sm text-gray-600">
        You&apos;re logged in. The full dashboard (PRI dial, dimension
        statuses) is coming in a later session.
      </p>
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="rounded bg-gray-900 px-4 py-2 text-white"
        >
          Log out
        </button>
      </form>
    </main>
  );
}
