import Link from "next/link";
import { getServerSession } from "@/lib/supabase-server";
import {
  getPracticeQuestions,
  getStoryBank,
  type StoryBank as Bank,
} from "@/lib/api";
import { SAMPLE_STORIES } from "@/features/story-bank";
import { BackLink } from "@/components/ui/back-link";
import { StoryBank } from "@/features/story-bank";

// The Story Bank - CLOSED TO USERS while it is finished.
//
// It drafts stories from work that was marked, and the modules producing that
// work are still being built - so a real visitor meets a shelf with nothing
// on it and no way to fill it, which is a promise the product cannot keep
// yet. The route stays so an old link lands somewhere that explains itself;
// flip OPEN_TO_USERS and the page below is exactly as it was.
//
// The Story Bank. One call when signed in: the stories, the question library
// and the coverage between them arrive together, because the screen shows all
// three at once and three fetches would show them at three different moments.
//
// Signed out this page still opens. The questions are the same for everybody,
// and three example stories stand in for a bank nobody has built yet - marked
// as an example, on the page and on every card. Somebody deciding whether an
// account is worth it should be able to see what they would get first.
//
// The account is asked for at the two points that cost something: drafting a
// story, which reads their record and spends an AI's time, and keeping one,
// which needs somewhere to keep it.

export const metadata = { title: "Your story bank" };
export const dynamic = "force-dynamic";

/** Typed, not inferred, so the page below is not stripped as unreachable. */
const OPEN_TO_USERS: boolean = false;

/** The signed-out bank: real questions, example stories, no coverage claims. */
function sampleBank(
  questions: NonNullable<Awaited<ReturnType<typeof getPracticeQuestions>>>,
): Bank {
  const stories = SAMPLE_STORIES;
  return {
    stories,
    competencies: questions.competencies,
    coverage: questions.competencies.map((competency) => {
      const mine = stories.filter((s) => s.competency === competency);
      return {
        competency,
        best: mine.length > 0 ? ("proven" as const) : null,
        storyIds: mine.map((s) => s.id),
        questions: questions.questions.filter(
          (q) => q.competency === competency,
        ).length,
      };
    }),
    questions: questions.questions.map((q) => ({
      ...q,
      storyIds: stories
        .filter((s) => s.answers.includes(q.id))
        .map((s) => s.id),
    })),
    roleId: null,
  };
}

export default async function StoriesPage() {
  if (!OPEN_TO_USERS) {
    return (
      <Frame>
        <div className="rounded-2xl border border-slate-200 bg-brand-mist px-5 py-6">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-brand-violet-deep">
            In development
          </p>
          <h1 className="mt-1.5 font-display text-[1.4rem] font-bold text-brand-ink">
            Your story bank is being built
          </h1>
          <p className="mt-2 max-w-2xl text-[0.9rem] leading-relaxed text-slate-600">
            It will hold the handful of real examples most interview questions
            are actually asking for, drafted from what you have done here rather
            than from a blank page. That drafting needs work of yours to read,
            so it opens when there is some.
          </p>
          <p className="mt-2 max-w-2xl text-[0.9rem] leading-relaxed text-slate-600">
            Until then, the practice questions are the place to work on answers,
            and anything you write there will be here when this opens.
          </p>
          <Link
            href="/interview/questions"
            className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-brand-teal-deep px-5 text-[0.85rem] font-bold text-white transition-colors hover:bg-brand-teal"
          >
            Go to practice questions
          </Link>
        </div>
      </Frame>
    );
  }

  const session = await getServerSession();

  if (!session) {
    const questions = await getPracticeQuestions();
    if (!questions) return <Unavailable />;
    return (
      <Frame>
        <StoryBank initial={sampleBank(questions)} signedOut />
      </Frame>
    );
  }

  const bank = await getStoryBank(session.access_token);
  if (!bank) return <Unavailable />;
  return (
    <Frame>
      <StoryBank initial={bank} />
    </Frame>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-4 sm:px-6">
      <BackLink fallbackHref="/interview" fallbackLabel="Back to Interview" />
      <div className="mt-4">{children}</div>
    </main>
  );
}

function Unavailable() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6">
      <h1 className="font-display text-[1.5rem] font-bold text-brand-ink">
        Your stories could not load
      </h1>
      <p className="mt-2 text-[0.9rem] text-slate-600">
        The server may just be waking up. Give it a moment and reload.
      </p>
    </main>
  );
}
