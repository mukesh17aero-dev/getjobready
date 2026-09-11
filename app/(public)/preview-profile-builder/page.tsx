import { Check } from "@/components/icons";

// Five ways to build the LinkedIn Profile Builder. Dead preview page.
//
// The brief: a LinkedIn profile for an Indian student going for a non-technical
// role - headline, About, skills, internship and project descriptions, a
// role-specific summary, recruiter keywords, and how to sit as open to work.
//
// The difference that matters: a LinkedIn optimiser scores a profile for
// visibility. This builds a professional identity out of things the person has
// actually done here - Discovery, the Passport, the role they chose, the
// simulations they finished, the interview stories they built. Optimising an
// empty profile for search is how you end up with a keyword-stuffed page that
// falls apart in the first conversation.
//
// The trap in all five: writing a profile that sounds better than the person.
// Every option has to be able to say "you have not done this yet" and mean it.

export const metadata = { title: "Preview — LinkedIn Profile Builder" };

const SECTIONS = [
  {
    id: "headline",
    name: "Headline",
    state: "weak",
    now: "Student at Ramaiah College | Looking for opportunities",
    fix: "Customer Success Associate in the making · Escalations, CRM, 50+ queries a day · Open to Bengaluru roles",
    why: "Recruiters search the role, not the college. Yours names neither.",
    from: "The role you chose in Discovery",
  },
  {
    id: "about",
    name: "About",
    state: "empty",
    now: "",
    fix: "I am aiming at customer-facing operations work. In a timed simulation I cleared 52 queries in a shift and handled three escalations end to end…",
    why: "Empty. This is the only place you get to sound like a person.",
    from: "Your simulation results and your tour notes",
  },
  {
    id: "experience",
    name: "Internship & projects",
    state: "thin",
    now: "Worked at family store. Handled customers.",
    fix: "Ran the counter alone on weekends, roughly 60 customers a day, and handled complaints without escalating to my father…",
    why: "Two sentences with no numbers in them. What you did is stronger than how you wrote it.",
    from: "Your resume, expanded",
  },
  {
    id: "skills",
    name: "Skills",
    state: "risky",
    now: "MS Office, Communication, Leadership, Teamwork, Hardworking",
    fix: "Escalation handling · CRM data entry · Customer communication · Shift coordination",
    why: "Three of these are things nobody can check, and one is not a skill. Named work beats adjectives.",
    from: "What your simulations actually tested",
  },
  {
    id: "open",
    name: "Open to work",
    state: "ok",
    now: "Open to work — all roles",
    fix: "Open to Customer Success and Operations roles in Bengaluru",
    why: "'All roles' reads as 'anything'. Naming two makes you findable for both.",
    from: "The role you chose, plus its neighbours",
  },
] as const;

const STATE_TONE: Record<string, string> = {
  weak: "bg-amber-50 text-amber-900 ring-amber-600/25",
  empty: "bg-rose-50 text-rose-800 ring-rose-500/25",
  thin: "bg-amber-50 text-amber-900 ring-amber-600/25",
  risky: "bg-rose-50 text-rose-800 ring-rose-500/25",
  ok: "bg-teal-50 text-teal-800 ring-teal-600/25",
};

const STATE_WORD: Record<string, string> = {
  weak: "Weak",
  empty: "Empty",
  thin: "Thin",
  risky: "Risky",
  ok: "Fine",
};

function Chip({ state }: { state: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide ring-1 ring-inset ${STATE_TONE[state]}`}
    >
      {STATE_WORD[state]}
    </span>
  );
}

function Option({
  n,
  title,
  idea,
  cost,
  children,
}: {
  n: number;
  title: string;
  idea: string;
  cost: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10 border-t border-slate-200 pt-7">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-brand-violet-deep">
        Option {n}
      </p>
      <h2 className="mt-0.5 font-display text-[1.35rem] font-bold leading-tight text-brand-ink">
        {title}
      </h2>
      <p className="mt-1.5 max-w-3xl text-[0.9rem] leading-relaxed text-slate-600">
        {idea}
      </p>
      <p className="mt-1 max-w-3xl text-[0.82rem] leading-relaxed text-slate-500">
        <strong className="font-semibold text-slate-600">The cost:</strong>{" "}
        {cost}
      </p>
      <div className="mt-4 rounded-2xl border border-slate-200 bg-brand-mist p-4 sm:p-5">
        {children}
      </div>
    </section>
  );
}

function AiNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 flex gap-2 rounded-xl border border-brand-violet/30 bg-brand-violet/[0.06] px-3 py-2.5 text-[0.8rem] leading-relaxed text-slate-700">
      <span
        aria-hidden
        className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-brand-violet text-[0.55rem] font-bold text-white"
      >
        A
      </span>
      <span>{children}</span>
    </p>
  );
}

/** A LinkedIn-ish profile card, used by the options that show one. */
function ProfileCard({ improved = false }: { improved?: boolean }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-surface">
      <div className="h-12 bg-gradient-to-r from-teal-700 to-emerald-700" />
      <div className="px-4 pb-4">
        <span
          aria-hidden
          className="-mt-7 grid h-14 w-14 place-items-center rounded-full border-4 border-white bg-brand-mist text-[1.1rem] font-bold text-brand-teal-deep"
        >
          AK
        </span>
        <p className="mt-1.5 text-[1rem] font-bold leading-tight text-brand-ink">
          Anjali Kumar
        </p>
        <p
          className={`mt-0.5 text-[0.82rem] leading-snug ${
            improved ? "text-brand-ink" : "text-slate-400"
          }`}
        >
          {improved ? SECTIONS[0].fix : SECTIONS[0].now}
        </p>
        <p className="mt-0.5 text-[0.72rem] text-slate-400">
          Bengaluru, Karnataka
        </p>

        <div className="mt-3 border-t border-slate-200 pt-2.5">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-slate-400">
            About
          </p>
          {improved ? (
            <p className="mt-1 text-[0.8rem] leading-relaxed text-slate-600">
              {SECTIONS[1].fix}
            </p>
          ) : (
            <p className="mt-1 rounded-lg bg-slate-100 px-2.5 py-2 text-[0.78rem] italic text-slate-400">
              Nothing here yet.
            </p>
          )}
        </div>

        <div className="mt-3 border-t border-slate-200 pt-2.5">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-slate-400">
            Skills
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {(improved ? SECTIONS[3].fix : SECTIONS[3].now)
              .split(improved ? " · " : ", ")
              .map((s) => (
                <span
                  key={s}
                  className={`rounded-full px-2.5 py-1 text-[0.72rem] font-semibold ${
                    improved
                      ? "bg-teal-50 text-teal-800"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {s}
                </span>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PreviewProfileBuilder() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-8 sm:px-6">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-slate-400">
        Preview — not built
      </p>
      <h1 className="mt-1 font-display text-[2.1rem] font-bold leading-tight tracking-tight text-brand-ink">
        Make your profile sound professional
      </h1>
      <p className="mt-2 max-w-3xl text-[0.95rem] leading-relaxed text-slate-600">
        Build a LinkedIn profile that shows who you are, what you can do, and
        what roles you are ready for. Five ways to build it. They differ in what
        the person is asked to do — approve, answer, choose, or talk.
      </p>
      <p className="mt-3 max-w-3xl rounded-xl border border-slate-200 bg-brand-mist px-4 py-3 text-[0.85rem] leading-relaxed text-slate-600">
        <strong className="font-semibold text-brand-ink">
          What separates this from a LinkedIn optimiser:
        </strong>{" "}
        an optimiser scores a profile for search. This writes an identity out of
        what the person actually did here — the role they chose, the simulations
        they finished, the stories they built. The failure mode to design
        against is a profile that sounds better than the person, because the
        first phone call finds that out.
      </p>

      {/* ------------------------------------------------------------ 1 */}
      <Option
        n={1}
        title="Before and after, section by section"
        idea="Their real profile on the left, the rewritten one on the right, one section at a time. Nothing is applied until they press accept - and they can see exactly what changed."
        cost="Requires them to have a profile already. Somebody starting from nothing sees an empty left column and learns nothing from the comparison."
      >
        <div className="grid gap-3 lg:grid-cols-2">
          <div>
            <p className="mb-1.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
              Yours now
            </p>
            <ProfileCard />
          </div>
          <div>
            <p className="mb-1.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-teal-800">
              Rewritten from what you have done
            </p>
            <ProfileCard improved />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex min-h-9 items-center rounded-xl bg-brand-teal-deep px-4 text-[0.8rem] font-bold text-white">
            Use this headline
          </span>
          <span className="inline-flex min-h-9 items-center rounded-xl border border-slate-300 px-4 text-[0.8rem] font-bold text-brand-ink">
            Try another
          </span>
          <span className="inline-flex min-h-9 items-center px-1 text-[0.8rem] font-semibold text-slate-500">
            Keep mine
          </span>
        </div>
      </Option>

      {/* ------------------------------------------------------------ 2 */}
      <Option
        n={2}
        title="A scorecard with one fix per row"
        idea="Every section graded, worst first, each with the single change that would move it. Closest to what Careerflow does - and the most immediately legible."
        cost="A grade invites gaming. People will fix the score rather than the profile, and a keyword-stuffed About scores well."
      >
        <div className="rounded-xl border border-slate-200 bg-surface p-4">
          <div className="flex flex-wrap items-center gap-4 border-b border-slate-200 pb-3">
            <div className="flex items-baseline gap-1">
              <span className="font-display text-[2.2rem] font-bold leading-none text-amber-600">
                34
              </span>
              <span className="text-[0.9rem] font-bold text-slate-400">
                /100
              </span>
            </div>
            <p className="min-w-0 flex-1 text-[0.85rem] leading-snug text-slate-600">
              Two sections are empty and one is working against you. The
              headline is the half-hour that moves this most.
            </p>
          </div>
          <ul className="mt-3 grid gap-2.5">
            {SECTIONS.map((s) => (
              <li key={s.id} className="flex flex-wrap items-start gap-2.5">
                <Chip state={s.state} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.85rem] font-semibold text-brand-ink">
                    {s.name}
                  </span>
                  <span className="block text-[0.78rem] leading-snug text-slate-500">
                    {s.why}
                  </span>
                </span>
                <span className="inline-flex min-h-8 shrink-0 items-center rounded-lg border border-slate-300 px-3 text-[0.74rem] font-bold text-brand-ink">
                  Fix
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Option>

      {/* ------------------------------------------------------------ 3 */}
      <Option
        n={3}
        title="Identity first, sections second"
        idea="One question before anything else - who are you professionally, in a sentence - answered by Ascend from the role they chose and what they finished. Approve that, and every section is written from it, consistently."
        cost="If the one sentence is wrong, everything downstream is wrong together. It needs a real edit step, not a confirm button."
      >
        <div className="rounded-xl border border-brand-teal/40 bg-teal-50/50 p-4">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-teal-800">
            Who you are, professionally
          </p>
          <p className="mt-1.5 font-display text-[1.2rem] font-bold leading-snug text-brand-ink">
            Someone going into customer-facing operations, who has already
            handled a full shift of queries and three escalations under timed
            conditions.
          </p>
          <p className="mt-1.5 text-[0.78rem] leading-relaxed text-slate-600">
            Built from: the role you chose in Discovery · Busy shift simulation
            · Escalation call · your two Passport entries.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex min-h-9 items-center rounded-xl bg-brand-teal-deep px-4 text-[0.8rem] font-bold text-white">
              That is right — write my profile
            </span>
            <span className="inline-flex min-h-9 items-center rounded-xl border border-slate-300 bg-surface px-4 text-[0.8rem] font-bold text-brand-ink">
              Not quite — let me change it
            </span>
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {SECTIONS.slice(0, 3).map((s) => (
            <div
              key={s.id}
              className="rounded-xl border border-slate-200 bg-surface p-3"
            >
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
                {s.name}
              </p>
              <p className="mt-1 line-clamp-4 text-[0.78rem] leading-snug text-slate-600">
                {s.fix}
              </p>
              <p className="mt-1.5 text-[0.68rem] font-semibold text-brand-violet-deep">
                Follows the sentence above
              </p>
            </div>
          ))}
        </div>
      </Option>

      {/* ------------------------------------------------------------ 4 */}
      <Option
        n={4}
        title="Recruiter's view"
        idea="Show the profile the way a recruiter meets it - a search result, six seconds, then the skim. What is missing becomes obvious without anybody grading anything."
        cost="It is a simulation of someone else's behaviour, and we would be asserting how recruiters read. That claim needs to be true and defensible."
      >
        <div className="rounded-xl border border-slate-200 bg-surface p-4">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
            A recruiter searching &ldquo;customer success bengaluru
            fresher&rdquo;
          </p>
          <ul className="mt-2 grid gap-2">
            {[
              {
                name: "Rahul M.",
                head: "Customer Success Associate · Escalations, CRM · Open to Bengaluru",
                you: false,
              },
              {
                name: "Anjali Kumar",
                head: "Student at Ramaiah College | Looking for opportunities",
                you: true,
              },
              {
                name: "Sneha P.",
                head: "Customer Support | 50+ tickets/day | Immediate joiner",
                you: false,
              },
            ].map((r) => (
              <li
                key={r.name}
                className={`rounded-lg border px-3 py-2.5 ${
                  r.you
                    ? "border-amber-300 bg-amber-50"
                    : "border-slate-200 bg-surface"
                }`}
              >
                <p className="text-[0.85rem] font-bold text-brand-ink">
                  {r.name}
                  {r.you && (
                    <span className="ml-2 rounded-full bg-amber-200/70 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-amber-900">
                      You
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-[0.78rem] leading-snug text-slate-600">
                  {r.head}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[0.82rem] leading-relaxed text-slate-600">
            Two of these three say what work they do. Yours says where you
            study. Nothing about you is weaker — the sentence is.
          </p>
        </div>
        <AiNote>
          The rewrite is the AI&apos;s job, but the ranking is not: this
          compares your headline against the pattern of the postings you are
          aiming at, never against real people&apos;s profiles.
        </AiNote>
      </Option>

      {/* ------------------------------------------------------------ 5 */}
      <Option
        n={5}
        title="Interviewed by the assistant"
        idea="It asks a handful of questions it cannot answer from your record - what you actually did at the store, what you would rather not do again - and writes the profile from your answers, in your words."
        cost="Slowest of the five, and it fails badly for somebody who types two words. Needs the same minimum-answer rule the tour uses."
      >
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-surface">
          <ol className="grid gap-2.5 p-3.5">
            {[
              {
                who: "a",
                text: "I can see the simulations and the role you picked. What I cannot see is the store job. On a bad Saturday, what were you actually doing?",
              },
              {
                who: "you",
                text: "Running the counter alone. Maybe 60 people. Handling the ones who came back angry about something.",
              },
              {
                who: "a",
                text: "That last part is the whole of the job you are applying for. Did you sort those yourself or hand them over?",
              },
              { who: "you", text: "Myself, mostly. Dad was in the back." },
              {
                who: "a",
                text: "Then your About section starts there, not with your degree. I will write it and you can cut anything that overstates it.",
              },
            ].map((line, i) => (
              <li
                key={i}
                className={
                  line.who === "you" ? "flex justify-end" : "flex gap-2"
                }
              >
                {line.who === "a" && (
                  <span
                    aria-hidden
                    className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-violet text-[0.6rem] font-bold text-white"
                  >
                    A
                  </span>
                )}
                <p
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-[0.82rem] leading-relaxed ${
                    line.who === "you"
                      ? "rounded-tr-sm bg-teal-50 text-slate-700"
                      : "rounded-tl-sm border border-slate-200 text-slate-800"
                  }`}
                >
                  {line.text}
                </p>
              </li>
            ))}
          </ol>
          <div className="border-t border-slate-200 bg-slate-50 px-3.5 py-2.5">
            <span className="text-[0.72rem] text-slate-400">
              4 of 6 questions · about two minutes left
            </span>
          </div>
        </div>
      </Option>

      {/* ---------------------------------------------------------- rec */}
      <section className="mt-10 rounded-2xl border border-brand-teal/40 bg-brand-teal-deep/[0.05] p-5">
        <h2 className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-teal-800">
          If you want a recommendation
        </h2>
        <p className="mt-1.5 text-[0.9rem] leading-relaxed text-slate-700">
          <strong className="font-semibold text-brand-ink">
            Option 3, with Option 1 as the way each section is approved.
          </strong>{" "}
          Identity first is the only one of the five that produces a profile
          that hangs together — the headline, the About and the skills all
          saying the same thing about the same person. Section-by-section
          rewriting without it produces five well-written fragments that do not
          agree.
        </p>
        <p className="mt-2 text-[0.9rem] leading-relaxed text-slate-700">
          Option 2&apos;s score is the one to be careful with. It is the most
          satisfying screen here and the easiest to game — and a profile
          optimised for our number rather than for a recruiter is worse than the
          one it replaced.
        </p>
      </section>

      <p className="mt-8 flex items-center gap-2 text-[0.8rem] text-slate-400">
        <Check size={13} />
        None of this is wired up. Pick one and it gets built properly.
      </p>
    </main>
  );
}
