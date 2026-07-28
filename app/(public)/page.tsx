import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { getCurrentUser, homeRouteForRole } from "@/modules/identity";

// The four stages of the student journey, in the order the MVP specification
// fixes them: discovery before pathway (ADR-006), simulations before evidence,
// evidence before any readiness claim, and consent before an employer sees
// anything. Reordering these on the marketing page would describe a product we
// have deliberately not built.
const STEPS = [
  {
    title: "Discover",
    body: "Start with a short diagnostic and a look at what real roles ask for. You finish with a skills map — where you stand today, and the role you are working towards.",
  },
  {
    title: "Practise",
    body: "Work through scenarios drawn from that one role: read the brief, submit your attempt, get feedback within seconds, then revise. Your first attempt is kept, never overwritten.",
  },
  {
    title: "Prove",
    body: "Every submission becomes dated evidence. Fixed, published rules — not AI — decide where you stand on each skill, and always name the one thing to do next.",
  },
  {
    title: "Share",
    body: "Publish a readiness passport: a frozen snapshot of the evidence you have approved, sent as a link, switched off the moment you revoke it.",
  },
];

export default async function HomePage() {
  // Someone already signed in should not be shown a marketing page with a
  // "Sign in" button. Their role decides where they belong.
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-full flex-col bg-white">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <BrandMark size="lg" />
          {user ? (
            <Link
              href={homeRouteForRole(user.role)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Go to my account
            </Link>
          ) : (
            <nav className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow-md"
              >
                Create account
              </Link>
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1">
        {/* The decorative layer is a separate, aria-hidden sibling rather than a
            background on the section itself, so the gradients and blobs can
            never end up between a screen reader and the words. */}
        <section className="relative isolate overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <div className="absolute inset-0 bg-[radial-gradient(48rem_30rem_at_78%_-8%,#e0e7ff_0%,transparent_62%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(38rem_26rem_at_6%_18%,#e0f2fe_0%,transparent_58%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] opacity-30 [background-size:26px_26px] [mask-image:radial-gradient(44rem_28rem_at_50%_0%,#000_15%,transparent_78%)]" />
            <div className="animate-drift absolute -right-24 -top-28 size-96 rounded-full bg-indigo-300/25 blur-3xl" />
            <div className="animate-drift-slow absolute -left-32 top-36 size-80 rounded-full bg-sky-300/20 blur-3xl" />
          </div>

          <div className="mx-auto w-full max-w-5xl px-5 pb-20 pt-16 sm:pt-24">
            <p className="animate-fade-up text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">
              Talent Fulfillment Network
            </p>
            <h1 className="animate-fade-up mt-4 max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-slate-900 [animation-delay:90ms] sm:text-5xl">
              Prove you are ready for the job - not just that you took the course.
            </h1>
            <p className="animate-fade-up mt-5 max-w-2xl text-lg leading-relaxed text-slate-600 [animation-delay:180ms]">
              Ascend starts by working out which role fits you and where your gaps
              are. You practise on scenarios from that role, every attempt becomes
              dated evidence, and fixed rules — never a guess — decide when you are
              ready. What an employer finally sees is proof, not a certificate.
            </p>

            <div className="animate-fade-up mt-9 flex flex-col gap-3 [animation-delay:270ms] sm:flex-row">
              <Link
                href="/signup"
                className="rounded-lg bg-indigo-600 px-6 py-3 text-center text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg"
              >
                Get started — it&rsquo;s free
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-slate-300 bg-white/70 px-6 py-3 text-center text-sm font-semibold text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
              >
                I already have an account
              </Link>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto w-full max-w-5xl px-5 py-16">
            <h2 className="animate-fade-in text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
              How it works
            </h2>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((item, index) => (
                <div
                  key={item.title}
                  className="animate-fade-up group rounded-2xl border border-slate-200 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/60"
                  // Staggered so the cards arrive left to right rather than as
                  // one block. Inline because the delay comes from the list
                  // position, not from a fixed set of utility classes.
                  style={{ animationDelay: `${index * 110}ms` }}
                >
                  <span className="block h-1 w-8 rounded-full bg-indigo-500 transition-all duration-300 group-hover:w-14" />
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-5 py-20">
          <div className="animate-fade-in rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8 sm:p-12">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              What an employer sees
            </h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-slate-600">
              A readiness passport is a frozen snapshot, not a live page: the role
              you are ready for, where you stand on each skill, and how many pieces
              of dated evidence sit behind each claim. No raw submissions, no
              personal contact details, and nothing at all once you revoke the link.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200">
        <div className="mx-auto w-full max-w-5xl px-5 py-8 text-sm text-slate-500">
          Ascend — Talent Fulfillment Network
        </div>
      </footer>
    </div>
  );
}
