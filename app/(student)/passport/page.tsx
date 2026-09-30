import { getServerSession } from "@/lib/supabase-server";
import { getApplicationReview, getPassportOverview } from "@/lib/api";
import { BackLink } from "@/components/ui/back-link";
import { ApplicationReviewCard, PassportOverview } from "@/features/passport";
import Link from "next/link";

// The Career Passport: a private, read-only record assembled from evidence
// that already exists in other modules - journey milestones, before/after
// skill comparisons, training, interviews and evidence. Sharing stays
// disabled until candidate approval, frozen snapshots and revocation exist.
//
// Two states, and the page is honest about both:
//
//   No role chosen - there is no record yet, because a passport nobody aimed
//   at is a cover with no name on it. Discovery is the way in.
//   Role chosen - the record is assembled live from whatever evidence is
//   connected so far; a missing source says so rather than showing a zero.
//
// Signed out this is a wall rather than a blur. Everything on the page is one
// person's own record; a blurred passport belonging to nobody would be a
// mock-up pretending to be a preview.

export const metadata = { title: "Your Passport" };
export const dynamic = "force-dynamic";

/**
 * Typed rather than inferred on purpose: a literal `false` lets TypeScript
 * prove the rest of the page unreachable and strip it from the build.
 */
const OPEN_TO_USERS: boolean = true;

export default async function PassportPage() {
  if (!OPEN_TO_USERS) {
    return (
      <Frame>
        <div className="rounded-2xl border border-slate-200 bg-brand-mist px-5 py-6">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-brand-violet-deep">
            In development
          </p>
          <h1 className="mt-1.5 font-display text-[1.4rem] font-bold text-brand-ink">
            Your Passport is being built
          </h1>
          <p className="mt-2 max-w-2xl text-[0.9rem] leading-relaxed text-slate-600">
            It will be a booklet with your name on it and a page for every skill
            you have proved, each one naming the work behind it. It is sealed
            from work that was marked - so it opens when there is enough of that
            to fill it, and not before.
          </p>
          <p className="mt-2 max-w-2xl text-[0.9rem] leading-relaxed text-slate-600">
            In the meantime, the readiness assessment is where measured work
            comes from, and everything it records will be in here when this
            opens.
          </p>
          <Link
            href="/practice"
            className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-brand-teal-deep px-5 text-[0.85rem] font-bold text-white transition-colors hover:bg-brand-teal"
          >
            Go to Practice
          </Link>
        </div>
      </Frame>
    );
  }

  const session = await getServerSession();

  if (!session) {
    return (
      <Frame>
        <div className="rounded-2xl border border-slate-200 bg-brand-mist px-5 py-6">
          <h1 className="font-display text-[1.4rem] font-bold text-brand-ink">
            Your Passport
          </h1>
          <p className="mt-2 max-w-2xl text-[0.9rem] leading-relaxed text-slate-600">
            A booklet with your name on it, and a page for every skill you have
            proved — each one naming the work behind it. It is made the moment
            you choose a role, and sealed by Ascend once there is measured work
            in it.
          </p>
          <Link
            href="/welcome?auth=signup&next=%2Fpassport"
            className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-brand-teal-deep px-5 text-[0.85rem] font-bold text-white transition-colors hover:bg-brand-teal"
          >
            Create an account
          </Link>
        </div>
      </Frame>
    );
  }

  const [result, review] = await Promise.all([
    getPassportOverview(session.access_token),
    getApplicationReview(session.access_token),
  ]);

  if (!result) {
    return (
      <Frame>
        <p className="rounded-2xl border border-slate-200 bg-brand-mist px-5 py-6 text-center text-[0.9rem] text-slate-600">
          Your passport could not load. The server may be waking up — give it a
          moment and reload.
        </p>
      </Frame>
    );
  }

  const { overview } = result;

  // No role chosen yet, so no record to show. Said plainly rather than shown
  // as an error: nothing has gone wrong, they have not aimed at anything yet.
  if (!overview.role) {
    return (
      <Frame>
        <div className="rounded-2xl border border-slate-200 bg-brand-mist px-5 py-6">
          <h1 className="font-display text-[1.4rem] font-bold text-brand-ink">
            No passport yet
          </h1>
          <p className="mt-2 max-w-2xl text-[0.9rem] leading-relaxed text-slate-600">
            A passport is made the moment you choose a role — it needs a name
            and an aim on the cover before it is anything at all. Choose one in
            Discovery and the record is yours, empty, that same minute.
          </p>
          <Link
            href="/discover"
            className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-brand-teal-deep px-5 text-[0.85rem] font-bold text-white transition-colors hover:bg-brand-teal"
          >
            Choose a role in Discovery
          </Link>
        </div>
      </Frame>
    );
  }

  const meta = session.user.user_metadata ?? {};
  const name =
    overview.candidate.data?.name ||
    (typeof meta.full_name === "string" && meta.full_name) ||
    "Your name";
  const photo =
    [meta.avatar_url, meta.picture].find(
      (v): v is string => typeof v === "string" && v.startsWith("http"),
    ) ?? null;

  return (
    <Frame>
      <header className="mb-4">
        <h1 className="font-display text-[clamp(1.6rem,3.2vw,2.1rem)] font-bold leading-tight tracking-tight text-brand-ink">
          Your Passport
        </h1>
        <p className="mt-1.5 max-w-2xl text-[0.9rem] leading-relaxed text-slate-600">
          A private record of your journey, built from work that was watched
          and marked. Nothing here is shared until you say so.
        </p>
      </header>

      <PassportOverview
        overview={overview}
        name={name}
        photo={photo}
        afterShowcase={review ? <ApplicationReviewCard status={review} /> : null}
      />
    </Frame>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-4 sm:px-6">
      <BackLink fallbackHref="/" fallbackLabel="Back to Home" />
      <div className="mt-4">{children}</div>
    </main>
  );
}
