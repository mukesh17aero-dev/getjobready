import { getServerSession } from "@/lib/supabase-server";
import { getCareerRecord, getJourneyState } from "@/lib/api";
import { Landing } from "@/components/landing";
import { StartRouter } from "@/app/(student)/start/start-router";

// Home is two different screens, because two different people arrive here.
//
// Signed out, nobody wants a feature list — they want to know what this is for
// and whether it is for them.
//
// Signed in, it is the router: which of these sounds like you, with where you
// got to inside each one. That answers both questions a returning person has —
// what can I do here, and where did I leave off — without a separate dashboard
// standing between them and the thing they came to do.

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ erased?: string }>;
}) {
  const { erased } = await searchParams;
  const session = await getServerSession();
  const [state, record] = session
    ? await Promise.all([
        getJourneyState(session.access_token),
        getCareerRecord(session.access_token),
      ])
    : [null, null];

  const notice = erased ? (
    <p
      role="status"
      className="mx-auto mb-5 max-w-3xl rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[0.85rem] text-emerald-900"
    >
      <strong className="font-semibold">Your data has been deleted.</strong>{" "}
      Every version of your profile, your Discovery results and your activity
      have been removed. You can start again any time.
    </p>
  ) : null;

  if (state) {
    return (
      // No opaque ground of its own: the router sits on the app-wide
      // ambience, the same weather as the front door.
      <main>
        {notice && (
          <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">{notice}</div>
        )}
        <StartRouter initialState={state} profile={record?.profile ?? null} />
      </main>
    );
  }

  return (
    <main className="bg-brand-panel">
      {notice && <div className="px-4 pt-6 sm:px-6">{notice}</div>}
      <Landing signedIn={Boolean(session)} />
    </main>
  );
}
