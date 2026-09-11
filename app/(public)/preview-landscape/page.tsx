// What the assessment market already does, and where the gap actually is.
// Dead preview page — built to be shown to stakeholders, not to run anything.
//
// The uncomfortable finding is at the top: "tasks, not questions" is not an
// idea we would be introducing. Arctic Shores markets that exact phrase and
// claims to be future-proofed against generative AI. So the work-sample
// direction is right and is not, on its own, a differentiator.
//
// The real gap is further down and is about who the assessment is FOR.

export const metadata = { title: "Preview — The landscape" };

type Player = {
  name: string;
  where: string;
  format: string;
  length: string;
  forWhom: "Employer" | "Employer + student";
  gap: string;
};

const PLAYERS: Player[] = [
  {
    name: "Arctic Shores",
    where: "UK / global",
    format:
      "Task-based. Markets itself on “Tasks, not questions” and claims candidates “show us” rather than tell us.",
    length: "25–35 min",
    forWhom: "Employer",
    gap: "Already owns the position we were about to claim as new. Also claims AI-resistance — the same claim we would be making.",
  },
  {
    name: "pymetrics",
    where: "US / global",
    format:
      "Twelve neuroscience mini-games measuring traits from behaviour rather than answers.",
    length: "~25 min",
    forWhom: "Employer",
    gap: "An entire paid prep industry exists to coach these games. “Cannot be faked” has not survived contact with the market.",
  },
  {
    name: "Vervoe",
    where: "Global",
    format: "AI-graded job simulations and skill tasks.",
    length: "Varies",
    forWhom: "Employer",
    gap: "Closest to our work-sample format. Built for screening volume, not for telling the candidate anything.",
  },
  {
    name: "AMCAT",
    where: "India",
    format:
      "Adaptive battery: communication, logical reasoning, quantitative, domain. Score valid one year.",
    length: "2–3 hrs",
    forWhom: "Employer + student",
    gap: "1,000+ employers already accept it. This is the format the feedback asked us to copy, in a market where it is already commoditised.",
  },
  {
    name: "Mettl / CoCubes / eLitmus",
    where: "India",
    format: "Aptitude and domain batteries, largely multiple choice.",
    length: "2–3 hrs",
    forWhom: "Employer",
    gap: "Hundreds of employers each. Competing here means competing on price against incumbents with distribution we do not have.",
  },
];

const FINDINGS = [
  {
    n: "01",
    title: "“Tasks, not questions” is taken",
    body: "Arctic Shores uses that phrase as its headline and claims to be one of the only assessments future-proofed against generative AI. Our work-sample direction is sound — it is not novel. We should stop planning to sell it as the innovation.",
  },
  {
    n: "02",
    title: "Game-based assessment has a thriving cheat industry",
    body: "There are paid prep products dedicated to passing pymetrics, Arctic Shores and HireVue games. Any format that becomes a gate acquires a coaching market. Designing for “unfakeable” is designing for something that does not exist.",
  },
  {
    n: "03",
    title: "The Indian incumbents are the format we were asked to copy",
    body: "AMCAT, Mettl, CoCubes and eLitmus are multiple-choice aptitude batteries with employer networks measured in the hundreds. Moving toward option cards moves us into the most crowded, least defensible part of this market.",
  },
  {
    n: "04",
    title: "Proctoring is an arms race that has already moved off-camera",
    body: "The documented 2026 pattern is AI overlays, second screens and hidden earbuds — none of which a webcam sees, and much of which leaves no behavioural trace. A credible proctored baseline runs roughly $15–25 per candidate. That economics does not work for a student-side product.",
  },
  {
    n: "05",
    title: "Behavioural choice is where AI is genuinely weaker",
    body: "Published work in 2026 finds model performance degrades on tasks requiring the simulation of a behavioural choice — risky choices and moral dilemmas specifically. That is a real, research-backed reason a consequence-driven format holds up better than a knowledge one.",
  },
  {
    n: "06",
    title: "Nobody tells the candidate anything",
    body: "Every platform above sells to the employer. The candidate is the measured object, not the customer, and the standing complaint is that results are never shared — while employers who do give feedback are viewed more positively by 57% of candidates even after rejection.",
  },
];

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-violet-deep">
        Preview · Market landscape
      </p>
      <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight text-brand-ink sm:text-4xl">
        The format is not the moat
      </h1>
      <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-slate-700">
        Six findings from what is already shipping. The first three are bad news
        for the plan we were forming, the last one is the opening.
      </p>

      <ol className="mt-8 space-y-4">
        {FINDINGS.map((f) => (
          <li
            key={f.n}
            className="rounded-2xl border border-slate-200 bg-surface p-5"
          >
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-xs font-bold text-slate-400">
                {f.n}
              </span>
              <h2 className="font-display text-base font-bold text-brand-ink sm:text-lg">
                {f.title}
              </h2>
            </div>
            <p className="mt-2 text-[0.88rem] leading-relaxed text-slate-700">
              {f.body}
            </p>
          </li>
        ))}
      </ol>

      <section className="mt-10">
        <h2 className="font-display text-lg font-bold text-brand-ink">
          Who is already there
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[44rem] border-collapse text-left text-[0.82rem]">
            <thead>
              <tr className="border-b border-slate-300 text-[0.72rem] uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-3 font-semibold">Who</th>
                <th className="py-2 pr-3 font-semibold">Format</th>
                <th className="py-2 pr-3 font-semibold">Length</th>
                <th className="py-2 pr-3 font-semibold">Built for</th>
                <th className="py-2 font-semibold">What it means for us</th>
              </tr>
            </thead>
            <tbody>
              {PLAYERS.map((p) => (
                <tr key={p.name} className="border-b border-slate-200 align-top">
                  <td className="py-3 pr-3">
                    <span className="block font-semibold text-brand-ink">
                      {p.name}
                    </span>
                    <span className="block text-[0.72rem] text-slate-500">
                      {p.where}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-slate-700">{p.format}</td>
                  <td className="py-3 pr-3 whitespace-nowrap text-slate-600">
                    {p.length}
                  </td>
                  <td className="py-3 pr-3 text-slate-600">{p.forWhom}</td>
                  <td className="py-3 text-slate-700">{p.gap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10 rounded-2xl border-2 border-brand-teal/30 bg-teal-50/40 p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold text-brand-ink">
          Where that leaves us
        </h2>
        <p className="mt-2.5 text-[0.9rem] leading-relaxed text-slate-800">
          Every product above sells a prediction to an employer. The student is
          the thing being measured and is told nothing at the end. Ascend is the
          only one of these where the student is the customer — and that is the
          difference worth building on, because it is a position, not a feature
          anybody can copy next quarter.
        </p>
        <p className="mt-3 text-[0.9rem] leading-relaxed text-slate-800">
          It also resolves the cheating argument. Split the two things we have
          been treating as one:{" "}
          <strong>practice, where cheating only cheats yourself</strong> — no
          lockdown, no proctoring, rich feedback, sit it as often as you like —
          and <strong>a short verified moment</strong> that the passport rests
          on, where integrity is worth paying for because it is rare.
        </p>
        <p className="mt-3 text-[0.9rem] leading-relaxed text-slate-800">
          On that split, the honest pitch to an employer stops being &ldquo;they
          could not have cheated&rdquo; and becomes &ldquo;here is a month of
          how this person works, and here is the part we watched.&rdquo; No
          incumbent can say the second thing, because none of them ever meet the
          student twice.
        </p>
      </section>
    </main>
  );
}
