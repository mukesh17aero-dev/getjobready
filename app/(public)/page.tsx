import { getServerSession } from "@/lib/supabase-server";
import { adminAccess, getCareerRecord, getJourneyState } from "@/lib/api";
import type { Audience } from "@/features/welcome";
import { FeatureGrid } from "@/features/welcome";
import { COLLEGE, EMPLOYER } from "@/features/welcome";
import { StartRouter } from "@/app/(student)/start/start-router";
import { CollegeInvitations } from "@/features/institution";

// Home is the router, signed in or not.
//
// "/" belongs to the person: which of these sounds like you, and where you got
// to inside each one. That answers both questions a returning person has —
// what can I do here, and where did I leave off — without a dashboard standing
// between them and the thing they came for.
//
// Signed out it is the same screen with nothing filled in yet. Nobody is asked
// to make an account to look: /v1/journey/routes answers without a token, so
// the doors are real and openable, and the account is asked for further in, at
// the point where something has to belong to somebody (see GlimpseBanner).
//
// The pitch lives at /welcome, which is where the wordmark goes.
//
// One exception: an admin can append ?as=college or ?as=employer to look at
// the other audiences' home. The check is here on the server rather than in
// the component, so the parameter does nothing at all for anybody else.

export const dynamic = "force-dynamic";

const asAudience = (v: string | undefined): Audience =>
  v === "college" || v === "employer" ? v : "student";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ erased?: string; as?: string }>;
}) {
  const { erased, as: asParam } = await searchParams;
  const session = await getServerSession();

  // adminAccess rides alongside the two calls the page already makes rather
  // than adding a round trip to the critical path.
  // The journey answers without a token; the record and the admin check do
  // not, so they are only asked for when there is somebody to ask about.
  const [state, record, access] = session
    ? await Promise.all([
        getJourneyState(session.access_token),
        getCareerRecord(session.access_token),
        adminAccess(session.access_token),
      ])
    : [await getJourneyState(null), null, null];

  const isAdmin = access?.isAdmin ?? false;
  const viewing: Audience = isAdmin ? asAudience(asParam) : "student";

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
    // An admin looking at somebody else's home. The student router is skipped
    // entirely — this is the college or employer screen, not a student screen
    // wearing a costume.
    if (isAdmin && viewing !== "student") {
      return (
        <main className="mx-auto w-full max-w-(--page-max-width) px-4 pb-16 pt-6 sm:px-6">
          <FeatureGrid category={viewing === "college" ? COLLEGE : EMPLOYER} />
        </main>
      );
    }

    return (
      // No opaque ground of its own: the router sits on the app-wide
      // ambience, the same weather as the front door.
      <>
        {notice && (
          <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">{notice}</div>
        )}
        {session && <CollegeInvitations />}
        <StartRouter
          initialState={state}
          profile={record?.profile ?? null}
          fallbackName={
            (session?.user.user_metadata?.full_name as string | undefined) ?? ""
          }
        />
      </>
    );
  }

  // The journey could not be loaded at all - StartRouter renders its own
  // retry state for that, so hand it through rather than falling back to a
  // pitch the person did not ask for.
  return (
    <>
      {notice && (
        <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">{notice}</div>
      )}
      <StartRouter initialState={null} />
    </>
  );
}
