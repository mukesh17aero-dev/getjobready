import {getServerSession} from "@/lib/supabase-server";
import { getSharedPassport } from "@/lib/api";
import { PassportOverview, RecipientOutcome } from "@/features/passport";
import Link from "next/link";

// A Passport, opened by whoever holds this link - no account, no session.
// What they see is a frozen copy the candidate chose to share, not their
// live record: nothing here changes if the candidate keeps working, and the
// link stops resolving the moment it is revoked or expires.

export const metadata = { title: "Shared Passport", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function SharedPassportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const restricted=token.startsWith("r_");
  const session=restricted?await getServerSession():null;
  const result = restricted?await getSharedPassport(token,session?.access_token):await getSharedPassport(token);

  if (!result) {
    return (
      <main className="mx-auto w-full max-w-(--page-max-width) px-4 py-16 text-center sm:px-6">
        <h1 className="font-display text-[1.4rem] font-bold text-brand-ink">This link is not available</h1>
        <p className="mt-2 text-[0.9rem] leading-relaxed text-slate-600">
          It may have expired, been revoked, contain evidence under review, or never existed. Ask them for a current link if you
          still need one.
        </p>
        {restricted&&<><p className="mt-3">This link requires the recipient’s verified sign-in email. Successful opens are recorded for the candidate.</p><Link className="inline-flex min-h-11 items-center underline" href={`/login?next=${encodeURIComponent(`/passport/${token}`)}`}>Sign in as the recipient</Link></>}
        <Link
          href="/"
          className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-5 text-[0.85rem] font-bold text-brand-ink"
        >
          Go to Ascend
        </Link>
      </main>
    );
  }

  const { overview } = result;
  const name = overview.candidate.data?.name ?? "This candidate";

  return (
    <main className="mx-auto w-full max-w-(--page-max-width) px-4 pb-16 pt-6 sm:px-6">
      <p className="mb-3 rounded-lg bg-brand-mist px-3 py-2 text-[0.75rem] font-semibold text-slate-600">
        Shared with you by {name} — a private, frozen snapshot, not a live record.
      </p>
      <PassportOverview overview={overview} name={name} photo={null} shareControls={false} />
      {restricted&&session&&<RecipientOutcome shareToken={token} achievements={overview.achievements??[]}/>}
    </main>
  );
}
