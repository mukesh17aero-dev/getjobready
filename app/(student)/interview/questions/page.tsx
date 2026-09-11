import { getServerSession } from "@/lib/supabase-server";
import { getPracticeQuestions } from "@/lib/api";
import { InterviewWorkspaceFrame } from "@/components/interview-workspace-frame";
import { QuestionPractice } from "@/components/question-practice";

// Question practice. One call: the questions, and - when there is somebody
// to fetch for - where each one stands with them.
//
// Signed out this page reads in full. The questions are the same for everyone
// and there is nothing personal in them; what needs an account is sending an
// answer to be read, because that spends an AI's time on one person and the
// answer has to be kept somewhere to be worth anything.

export const metadata = { title: "Question practice" };
export const dynamic = "force-dynamic";

export default async function QuestionsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [{ q }, session] = await Promise.all([searchParams, getServerSession()]);
  const library = await getPracticeQuestions(session?.access_token ?? null);

  if (!library) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-display text-[1.5rem] font-bold text-brand-ink">
          The questions could not load
        </h1>
        <p className="mt-2 text-[0.9rem] text-slate-600">
          The server may just be waking up. Give it a moment and reload.
        </p>
      </main>
    );
  }

  const weak = library.questions.filter(item => item.state === "weak").length;
  return (
    <InterviewWorkspaceFrame current="questions" eyebrow="A FEW MINUTES. ONE BETTER ANSWER." title="Practise the question that matters next." subtitle={session ? (weak > 0 ? "Start with an answer that needs work, then try something new." : "Start with something you have not tried, then come back to it.") : "Browse freely. Sign in when you want feedback kept on your record."}>
      <QuestionPractice initial={library} signedOut={!session} openId={q} />
    </InterviewWorkspaceFrame>
  );
}
