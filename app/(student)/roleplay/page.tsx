import { getServerSession } from "@/lib/supabase-server";
import { getRoleplayHome, SAMPLE_ROLEPLAY, type RoleplayHome } from "@/features/roleplay";
import { RoleplayFlow } from "./roleplay-flow";

export const metadata = { title: "AI Roleplay" };
export const dynamic = "force-dynamic";

export default async function RoleplayPage() {
  const session = await getServerSession();
  const home = await getRoleplayHome(session?.access_token);

  if (!home) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6">
        <h1 className="text-xl font-bold text-brand-ink">Roleplay is not answering</h1>
        <p className="mt-2 text-sm text-slate-600">
          Nothing is lost — give it a moment and refresh this page.
        </p>
      </main>
    );
  }

  // Signed out, the scenario catalogue is real but there is no history yet —
  // a worked example stands in, badged as one, so a visitor can see what
  // lands at the end before deciding to start.
  const withSample: RoleplayHome = session ? home : { ...home, history: SAMPLE_ROLEPLAY };

  return (
    <RoleplayFlow initial={withSample} signedIn={Boolean(session)} exampleHistory={!session} />
  );
}
