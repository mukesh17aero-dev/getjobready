import { getServerSession } from "@/lib/supabase-server";
import { getInterviewHome, type InterviewHome } from "@/features/interview";
import { InterviewFlow } from "./interview-flow";
import { SAMPLE_INTERVIEW } from "@/features/interview";

// What a signed-out visitor honestly has: no chosen role, no interview under
// way, nothing practised before. Every field is the truth about them.
//
// The one exception is history, which carries a worked example rather than an
// empty shelf. An empty shelf is an honest picture of their record and a
// useless picture of the product - somebody deciding whether to spend fifteen
// minutes here should be able to see what lands at the end of it. It renders
// under "What you get afterwards", badged Example, and says plainly that it
// belongs to nobody.
const NOTHING_YET: InterviewHome = {
  selectedRole: null,
  profileHints: { firstName: null, hasTrack: false, hasSkills: false },
  speechAvailable: false,
  session: null,
  pastCount: 0,
  lastSummary: null,
  workingOn: [],
  history: SAMPLE_INTERVIEW,
};

export const metadata = { title: "Interview practice" };
export const dynamic = "force-dynamic";

// One call for the whole setup screen: the Discovery-selected role, what the
// profile can contribute, any interview already running, and what earlier
// interviews said to work on.
export default async function InterviewPage({ searchParams }: { searchParams: Promise<{ focus?: string }> }) {
  const [{ focus }, session] = await Promise.all([searchParams, getServerSession()]);
  if (!session) {
    return <InterviewFlow initial={NOTHING_YET} exampleHistory initialFocus={focus ?? ""} />;
  }
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
  return <InterviewFlow initial={home} initialFocus={focus ?? ""} />;
}
