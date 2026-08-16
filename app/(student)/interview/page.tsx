import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase-server";
import { getInterviewHome } from "@/lib/interview-api";
import { InterviewFlow } from "./interview-flow";

export const metadata = { title: "Interview practice" };
export const dynamic = "force-dynamic";

// One call for the whole setup screen: the Discovery-selected role, what the
// profile can contribute, any interview already running, and what earlier
// interviews said to work on.
export default async function InterviewPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?next=/interview");
  const home = await getInterviewHome(session.access_token);
  if (!home) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6">
        <h1 className="text-xl font-bold text-brand-ink">
          The interview room is not answering
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Nothing is lost - give it a moment and refresh this page.
        </p>
      </main>
    );
  }
  return <InterviewFlow initial={home} />;
}
