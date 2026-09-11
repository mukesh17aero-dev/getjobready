import { Check } from "@/components/icons";

// The Passport as a booklet. Dead preview page - nothing is wired.
//
// Front and back are the identity pages: photo, the Ascend seal, who this
// person is, what they are aiming at, what they have studied and done. The
// inside pages are visa pages rather than stamp pages - a visa carries the
// date it was granted, what it permits, who issued it and a reference you can
// check. That is exactly the shape a skill needs.
//
// One page per skill. On it: the stamp, the level, the date attained, the work
// that earned it, and the reference an employer could ask us about.
//
// The rule the whole thing rests on: nothing self-reported is ever stamped. A
// passport with one indefensible page is worth less than an empty one, because
// it teaches the reader that none of the pages mean anything.

export const metadata = { title: "Preview — Passport" };

type Page = {
  skill: string;
  level: "Emerging" | "Working" | "Strong";
  score: number;
  attained: string;
  issuedBy: string;
  evidence: string[];
  ref: string;
  provisional?: boolean;
};

const PAGES: Page[] = [
  {
    skill: "Handling escalations",
    level: "Strong",
    score: 78,
    attained: "18 August 2026",
    issuedBy: "Assessment · Customer Operations · Day 3 and Day 18",
    evidence: [
      "Named the constraint before proposing anything, on the harder version",
      "Held the policy while conceding the earlier mistake plainly",
    ],
    ref: "ASC-ESC-4471",
  },
  {
    skill: "Written communication",
    level: "Working",
    score: 64,
    attained: "18 August 2026",
    issuedBy: "Assessment · the message to eleven customers",
    evidence: [
      "Said when the order would ship and what happens if it slips again",
      "Cut the assistant's opening paragraph entirely",
    ],
    ref: "ASC-WRC-4472",
  },
  {
    skill: "Working under pressure",
    level: "Working",
    score: 61,
    attained: "14 August 2026",
    issuedBy: "AI Interview · HR round, scored",
    evidence: ["Answered the outage question without losing the thread"],
    ref: "ASC-PRS-4310",
  },
  {
    skill: "Analytical thinking",
    level: "Emerging",
    score: 42,
    attained: "18 August 2026",
    issuedBy: "Assessment · Day 12 only",
    evidence: ["Ordered the backlog by impact, not by arrival time"],
    ref: "ASC-ANL-4473",
    provisional: true,
  },
];

const TONE: Record<Page["level"], string> = {
  Strong: "border-brand-teal text-teal-800",
  Working: "border-brand-teal/60 text-teal-700",
  Emerging: "border-amber-500/60 text-amber-800",
};

function Stamp({ page, tilt = -6 }: { page: Page; tilt?: number }) {
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-full border-2 border-dashed px-3.5 py-2.5 text-center ${TONE[page.level]} ${
        page.provisional ? "opacity-70" : ""
      }`}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <span className="text-[0.55rem] font-bold uppercase tracking-[0.14em]">
        Ascend
      </span>
      <span className="text-[0.8rem] font-bold uppercase leading-tight tracking-wide">
        {page.level}
      </span>
      <span className="text-[0.5rem] font-semibold uppercase tracking-wide opacity-70">
        {page.attained}
      </span>
    </span>
  );
}

function Section({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10 border-t border-slate-200 pt-7">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-brand-violet-deep">
        {label}
      </p>
      <h2 className="mt-0.5 font-display text-[1.35rem] font-bold leading-tight text-brand-ink">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function PreviewPassport() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-8 sm:px-6">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-slate-400">
        Preview — not built
      </p>
      <h1 className="mt-1 font-display text-[2.1rem] font-bold leading-tight tracking-tight text-brand-ink">
        The Passport
      </h1>
      <p className="mt-2 max-w-3xl text-[0.95rem] leading-relaxed text-slate-600">
        A booklet. Front and back carry who you are; the inside pages are visa
        pages, one per skill — the stamp, the date it was attained, the score,
        the work behind it and a reference an employer can check.
      </p>

      <div className="mt-4 grid max-w-4xl gap-2.5 sm:grid-cols-2">
        <p className="rounded-xl border border-slate-200 bg-brand-mist px-4 py-3 text-[0.85rem] leading-relaxed text-slate-600">
          <strong className="font-semibold text-brand-ink">
            Nothing self-reported is ever stamped.
          </strong>{" "}
          A page comes from work that was watched and marked. One indefensible
          page does not cost you one page — it teaches whoever is reading that
          none of them mean anything.
        </p>
        <p className="rounded-xl border border-slate-200 bg-brand-mist px-4 py-3 text-[0.85rem] leading-relaxed text-slate-600">
          <strong className="font-semibold text-brand-ink">
            Created early, sealed late.
          </strong>{" "}
          The booklet is made the moment somebody chooses a role in Discovery —
          their name, their aim, blank pages. It is not issued by Ascend, and
          cannot be shared, until there is measured work in it.
        </p>
      </div>

      {/* -------------------------------------------------- front page */}
      <Section label="Page 1" title="The identity page">
        <p className="mt-1.5 max-w-3xl text-[0.9rem] leading-relaxed text-slate-600">
          The inside front cover, laid out the way a passport&apos;s data page
          is: photograph, seal, and the fields in a fixed order so any two
          passports read the same way. This is the issued version — the one
          created at Discovery carries the same fields with the seal absent and
          the status saying so.
        </p>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-brand-mist p-4 sm:p-5">
          <div className="mx-auto max-w-md overflow-hidden rounded-xl border-4 border-brand-panel bg-[#fdfbf5]">
            <div className="flex items-center justify-between gap-2 bg-brand-panel px-4 py-2">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.28em] text-white/70">
                Ascend
              </p>
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-white/50">
                Career Passport
              </p>
            </div>

            <div className="flex gap-4 p-4">
              <div className="shrink-0">
                <span
                  aria-hidden
                  className="grid h-24 w-20 place-items-center rounded-sm bg-slate-200 text-[0.65rem] font-bold uppercase tracking-wide text-slate-500"
                >
                  Photo
                </span>
                <span
                  aria-hidden
                  className="mt-2 grid h-12 w-20 place-items-center rounded-full border-2 border-dashed border-brand-teal/60 text-[0.5rem] font-bold uppercase leading-tight tracking-widest text-teal-700"
                >
                  Ascend
                  <br />
                  Verified
                </span>
              </div>

              <dl className="min-w-0 flex-1 grid gap-1.5">
                {[
                  ["Name", "Nithin Issac Daniel"],
                  ["Aiming at", "Customer Success Associate"],
                  ["Qualification", "B.Com, Ramaiah College, 2026"],
                  ["Experience", "Family retail · weekends, 2 years"],
                  ["Skills stamped", "4 of 9 for this role"],
                  ["Issued", "18 August 2026"],
                  ["Passport no.", "ASC-2026-004471"],
                ].map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[7rem_minmax(0,1fr)]">
                    <dt className="text-[0.58rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                      {k}
                    </dt>
                    <dd className="text-[0.78rem] font-semibold leading-snug text-slate-800">
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <p className="border-t border-slate-200 px-4 py-2 font-mono text-[0.6rem] tracking-[0.08em] text-slate-400">
              ASC&lt;&lt;DANIEL&lt;&lt;NITHIN&lt;ISSAC&lt;&lt;CSA&lt;&lt;20260818&lt;&lt;4OF9
            </p>
          </div>
        </div>
      </Section>

      {/* -------------------------------------------------- visa pages */}
      <Section label="Pages 2 onward" title="One skill, one page">
        <p className="mt-1.5 max-w-3xl text-[0.9rem] leading-relaxed text-slate-600">
          A visa page rather than a stamp: the date it was attained, what it
          permits somebody to conclude, who issued it, the evidence, and a
          reference. Scroll and the pages go by, newest last, the way a passport
          fills up.
        </p>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-brand-mist p-4 sm:p-5">
          <div className="grid gap-3">
            {PAGES.slice(0, 2).map((p, i) => (
              <div
                key={p.skill}
                className="overflow-hidden rounded-xl border-2 border-slate-200 bg-[#fdfbf5]"
              >
                <div className="flex items-center justify-between gap-2 border-b border-dashed border-slate-300 px-4 py-1.5">
                  <p className="text-[0.55rem] font-bold uppercase tracking-[0.22em] text-slate-400">
                    Ascend · Skill {i + 1}
                  </p>
                  <p className="font-mono text-[0.58rem] tracking-wide text-slate-400">
                    {p.ref}
                  </p>
                </div>

                <div className="flex gap-4 p-4">
                  <Stamp page={p} tilt={i % 2 === 0 ? -7 : 5} />

                  <div className="min-w-0 flex-1">
                    <p className="text-[1rem] font-bold leading-tight text-brand-ink">
                      {p.skill}
                    </p>

                    <dl className="mt-1.5 grid gap-1">
                      {[
                        ["Attained", p.attained],
                        ["Issued by", p.issuedBy],
                        ["Proficiency", `${p.score} of 100 · ${p.level}`],
                      ].map(([k, v]) => (
                        <div
                          key={k}
                          className="grid grid-cols-[5.5rem_minmax(0,1fr)]"
                        >
                          <dt className="text-[0.56rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                            {k}
                          </dt>
                          <dd className="text-[0.76rem] leading-snug text-slate-700">
                            {v}
                          </dd>
                        </div>
                      ))}
                    </dl>

                    <p className="mt-2 text-[0.56rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Evidence
                    </p>
                    <ul className="mt-0.5 grid gap-0.5">
                      {p.evidence.map((e) => (
                        <li
                          key={e}
                          className="flex gap-1.5 text-[0.75rem] leading-snug text-slate-600"
                        >
                          <span
                            aria-hidden
                            className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400"
                          />
                          {e}
                        </li>
                      ))}
                    </ul>

                    <p className="mt-2 text-[0.68rem] font-semibold text-brand-violet-deep">
                      See the work behind this →
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* the provisional one, marked on its face */}
            <div className="overflow-hidden rounded-xl border-2 border-amber-300 bg-[#fdfbf5]">
              <div className="flex items-center justify-between gap-2 border-b border-dashed border-amber-300 bg-amber-50 px-4 py-1.5">
                <p className="text-[0.55rem] font-bold uppercase tracking-[0.22em] text-amber-800">
                  Provisional · one sitting only
                </p>
                <p className="font-mono text-[0.58rem] tracking-wide text-amber-700">
                  {PAGES[3]!.ref}
                </p>
              </div>
              <div className="flex gap-4 p-4">
                <Stamp page={PAGES[3]!} tilt={3} />
                <div className="min-w-0 flex-1">
                  <p className="text-[1rem] font-bold leading-tight text-brand-ink">
                    {PAGES[3]!.skill}
                  </p>
                  <p className="mt-1 text-[0.76rem] leading-relaxed text-amber-900">
                    Measured once, on Day 12. It stands until a second sitting
                    agrees with it — and it says so here, so nobody reading this
                    can mistake it for a settled level.
                  </p>
                </div>
              </div>
            </div>

            {/* what is not stamped yet, at the end rather than the front */}
            <div className="rounded-xl border border-dashed border-slate-300 bg-surface/60 p-4">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
                Blank pages
              </p>
              <p className="mt-1 text-[0.82rem] leading-relaxed text-slate-600">
                Five skills this role needs are not stamped yet — coordinating
                with others, accuracy under volume, systems and tools, planning
                ahead, handling ambiguity. They sit at the back rather than the
                front, because the book should open on what you have done.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* --------------------------------------------------- back page */}
      <Section label="Last page" title="Who to ask, and what this is not">
        <div className="mt-4 rounded-2xl border border-slate-200 bg-brand-mist p-4 sm:p-5">
          <div className="mx-auto max-w-md overflow-hidden rounded-xl border-4 border-brand-panel bg-[#fdfbf5] p-4">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-slate-400">
              Verification
            </p>
            <p className="mt-1 text-[0.82rem] leading-relaxed text-slate-700">
              Every page in this passport rests on work done inside Ascend and
              kept. Any reference on any page can be checked against the task
              that produced it and what this person actually wrote.
            </p>

            <p className="mt-3 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-slate-400">
              What this is not
            </p>
            <p className="mt-1 text-[0.82rem] leading-relaxed text-slate-700">
              Not a qualification, not an endorsement, and not a prediction that
              this person will do well in your role. It says what they were
              measured doing, when, and how well — and nothing beyond that.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
              <span className="inline-flex min-h-9 items-center rounded-lg bg-brand-teal-deep px-3.5 text-[0.76rem] font-bold text-white">
                Share this passport
              </span>
              <span className="inline-flex min-h-9 items-center rounded-lg border border-slate-300 px-3.5 text-[0.76rem] font-bold text-brand-ink">
                Download as PDF
              </span>
              <span className="text-[0.7rem] text-slate-500">
                A link that expires, and can be withdrawn.
              </span>
            </div>
          </div>
        </div>
      </Section>

      {/* -------------------------------------------------- the states */}
      <Section label="Its life" title="Created at Discovery, sealed by work">
        <p className="mt-1.5 max-w-3xl text-[0.9rem] leading-relaxed text-slate-600">
          Choosing a role is the moment somebody has said what they are aiming
          at, which is exactly enough to make a booklet with their name in it —
          and nowhere near enough for Ascend to put its seal on one. So the
          passport has two lives, and the difference is visible on every page.
        </p>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {/* created, unsealed */}
          <div>
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-amber-800">
              State one · created, not issued
            </p>
            <p className="mt-0.5 text-[0.82rem] leading-relaxed text-slate-600">
              Made the moment they choose a role in Discovery.
            </p>
            <div className="mt-2 overflow-hidden rounded-xl border-4 border-dashed border-slate-300 bg-[#fdfbf5]">
              <div className="flex items-center justify-between gap-2 bg-slate-200 px-4 py-2">
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.28em] text-slate-500">
                  Ascend
                </p>
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-amber-800">
                  Not issued
                </p>
              </div>
              <div className="relative flex gap-4 p-4">
                {/* Said across the page itself, not in a footnote - this is
                    the state most likely to be screenshotted early. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 grid place-items-center text-[1.4rem] font-bold uppercase tracking-[0.3em] text-slate-900/[0.06]"
                  style={{ transform: "rotate(-12deg)" }}
                >
                  Unissued
                </span>
                <div className="relative shrink-0">
                  <span
                    aria-hidden
                    className="grid h-20 w-16 place-items-center rounded-sm bg-slate-200 text-[0.6rem] font-bold uppercase tracking-wide text-slate-500"
                  >
                    Photo
                  </span>
                  <span
                    aria-hidden
                    className="mt-2 grid h-10 w-16 place-items-center rounded-full border-2 border-dashed border-slate-300 text-[0.45rem] font-bold uppercase leading-tight tracking-widest text-slate-400"
                  >
                    Seal
                    <br />
                    pending
                  </span>
                </div>
                <dl className="relative min-w-0 flex-1 grid gap-1">
                  {[
                    ["Name", "Nithin Issac Daniel"],
                    ["Aiming at", "Customer Success Associate"],
                    ["Chosen", "12 August 2026"],
                    ["Skills stamped", "None yet"],
                    ["Status", "Not issued by Ascend"],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="grid grid-cols-[6rem_minmax(0,1fr)]"
                    >
                      <dt className="text-[0.55rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                        {k}
                      </dt>
                      <dd className="text-[0.74rem] font-semibold leading-snug text-slate-700">
                        {v}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="border-t border-dashed border-slate-300 px-4 py-3">
                <p className="text-[0.8rem] leading-relaxed text-slate-600">
                  Yours, and empty. Ascend has not put its name to anything in
                  here because there is nothing in here yet — you chose a role,
                  which is a start and is not evidence.
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex min-h-10 items-center rounded-xl bg-brand-teal-deep px-4 text-[0.8rem] font-bold text-white">
                    Start your first thirty days
                  </span>
                  <span className="inline-flex min-h-10 cursor-not-allowed items-center rounded-xl border border-slate-200 px-4 text-[0.8rem] font-bold text-slate-300">
                    Share
                  </span>
                </div>
                <p className="mt-1.5 text-[0.72rem] text-slate-500">
                  Sharing is off until it is issued. An unissued passport in an
                  employer&apos;s hands is worse than none.
                </p>
              </div>
            </div>
          </div>

          {/* issued */}
          <div>
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-teal-800">
              State two · issued and sealed
            </p>
            <p className="mt-0.5 text-[0.82rem] leading-relaxed text-slate-600">
              The first assessment puts measured work in it.
            </p>
            <div className="mt-2 overflow-hidden rounded-xl border-4 border-brand-panel bg-[#fdfbf5]">
              <div className="flex items-center justify-between gap-2 bg-brand-panel px-4 py-2">
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.28em] text-white/70">
                  Ascend
                </p>
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-brand-teal-soft">
                  Issued 18 Aug 2026
                </p>
              </div>
              <div className="flex gap-4 p-4">
                <div className="shrink-0">
                  <span
                    aria-hidden
                    className="grid h-20 w-16 place-items-center rounded-sm bg-slate-200 text-[0.6rem] font-bold uppercase tracking-wide text-slate-500"
                  >
                    Photo
                  </span>
                  <span
                    aria-hidden
                    className="mt-2 grid h-10 w-16 place-items-center rounded-full border-2 border-dashed border-brand-teal/60 text-[0.45rem] font-bold uppercase leading-tight tracking-widest text-teal-700"
                  >
                    Ascend
                    <br />
                    Verified
                  </span>
                </div>
                <dl className="min-w-0 flex-1 grid gap-1">
                  {[
                    ["Name", "Nithin Issac Daniel"],
                    ["Aiming at", "Customer Success Associate"],
                    ["Chosen", "12 August 2026"],
                    ["Skills stamped", "4 of 9 for this role"],
                    ["Status", "Issued · 1 provisional"],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="grid grid-cols-[6rem_minmax(0,1fr)]"
                    >
                      <dt className="text-[0.55rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                        {k}
                      </dt>
                      <dd className="text-[0.74rem] font-semibold leading-snug text-slate-700">
                        {v}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="border-t border-slate-200 px-4 py-3">
                <p className="text-[0.8rem] leading-relaxed text-slate-600">
                  Four pages, each naming the day and the work behind it. One is
                  marked provisional on its face.
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex min-h-10 items-center rounded-xl bg-brand-teal-deep px-4 text-[0.8rem] font-bold text-white">
                    Share this passport
                  </span>
                  <span className="inline-flex min-h-10 items-center rounded-xl border border-slate-300 px-4 text-[0.8rem] font-bold text-brand-ink">
                    Download as PDF
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-3 max-w-3xl rounded-xl border border-brand-violet/30 bg-brand-violet/[0.06] px-4 py-3 text-[0.85rem] leading-relaxed text-slate-700">
          <strong className="font-semibold text-brand-ink">
            What the two states buy:
          </strong>{" "}
          somebody leaves Discovery holding something with their name on it,
          which is worth more than a locked page they have not earned — and the
          seal stays worth something because it arrives only when there is work
          under it. The gap between the two is the clearest possible statement
          of what Ascend counts as evidence.
        </p>
      </Section>

      {/* ------------------------------------------------------ flagged */}
      <section className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-amber-900">
          Three things to decide before this is built
        </h2>
        <ul className="mt-2 grid gap-2.5 text-[0.87rem] leading-relaxed text-amber-900">
          <li>
            <strong className="font-semibold">
              The passport cannot exist before the assessment does.
            </strong>{" "}
            Nothing in Ascend currently produces a defensible level — the career
            record holds what people tell us, which is exactly what must never
            be stamped. Built first, this launches empty for everybody with no
            honest way to fill it.
          </li>
          <li>
            <strong className="font-semibold">
              A score out of 100 on a page is a strong claim.
            </strong>{" "}
            Fifteen minutes cannot support two significant figures. Either the
            page carries the level and the date only, or the number appears with
            what it was measured on and how many sittings — which is why 78 sits
            beside &ldquo;Day 3 and Day 18&rdquo; here rather than alone.
          </li>
          <li>
            <strong className="font-semibold">
              What exactly issues it needs deciding.
            </strong>{" "}
            One finished assessment is the obvious trigger. But an assessment
            where somebody answered two of six scenes produces two thin pages —
            issuing on that makes the seal mean &ldquo;turned up&rdquo;. A floor
            of three skills at Working or better is defensible; whatever it is,
            it has to be a rule rather than a judgement, and it has to be said
            on the unissued passport so the goal is visible.
          </li>
          <li>
            <strong className="font-semibold">
              A book at 360px is two designs.
            </strong>{" "}
            The identity page and visa pages work as a scroll on a phone; the
            bound object with turning pages is the PDF an employer downloads,
            where pages are real. Building the phone version first and the
            booklet as the export is the cheaper order.
          </li>
        </ul>
      </section>

      <p className="mt-8 flex items-center gap-2 text-[0.8rem] text-slate-400">
        <Check size={13} />
        None of this is wired up. Say yes to the shape and it gets built.
      </p>
    </main>
  );
}
