import { getServerSession } from "@/lib/supabase-server";
import { getProfessionalProfile } from "@/lib/api";
import { SAMPLE_PROFILE } from "@/lib/samples";
import { ProfessionalStudio } from "./professional-studio";

// The LinkedIn Profile Builder.
//
// Signed out the page reads in full against a worked example, labelled as
// somebody else's. The comparison is the whole screen, so showing it is the
// only way to say what this does.
//
// The account is asked for at the points that cost something: writing, which
// reads the whole record and spends an AI call, keeping a section, and the
// photo.

export const metadata = { title: "LinkedIn Profile Builder" };
export const dynamic = "force-dynamic";

export default async function ProfessionalProfilePage() {
  const session = await getServerSession();

  if (!session) return <ProfessionalStudio initial={SAMPLE_PROFILE} signedOut />;

  const state = await getProfessionalProfile(session.access_token);
  if (!state) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-display text-[1.5rem] font-bold text-brand-ink">
          Your profile could not load
        </h1>
        <p className="mt-2 text-[0.9rem] text-slate-600">
          The server may just be waking up. Give it a moment and reload.
        </p>
      </main>
    );
  }

  return <ProfessionalStudio initial={state} />;
}
