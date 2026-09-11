import { CameraDemo } from "./camera-demo";

// Camera and gaze proctoring, examined honestly. Dead preview page.
//
// This exists because the ask — watch the student on camera and track their
// eye movements — is a well-established product category that also has a
// well-established record of harming the wrong people. Both halves belong in
// front of the decision.
//
// The load-bearing finding is the last section: the deterrent effect does not
// depend on the detector working. Telling somebody the camera is on changes
// what they do, whether or not anything downstream can tell where they are
// looking. That means the cheap, honest tier buys most of the value, and the
// expensive, inaccurate tier mostly buys false accusations.

export const metadata = { title: "Preview — Camera proctoring" };

type Row = { claim: string; real: string; ok: "yes" | "partly" | "no" };

const CLAIMS: Row[] = [
  {
    claim: "Face is present throughout",
    real: "Workable. Needs a face-detection model in the page — around 2 MB of WebAssembly, because iOS Safari has no built-in face detection.",
    ok: "yes",
  },
  {
    claim: "A second person appeared",
    real: "Workable, same model. High false-positive rate anywhere shared — a sibling crossing the room behind a student is indistinguishable from a helper.",
    ok: "partly",
  },
  {
    claim: "They looked away from the screen",
    real: "Coarse at best. Uncalibrated gaze from a front camera gives you roughly left / right / down, not a point on the screen — and phone users hold the device at angles that break the estimate outright.",
    ok: "partly",
  },
  {
    claim: "They read an answer off a second device",
    real: "No. The attack we were asked about is a phone held beside the screen. The eyes stay pointed at the screen. This is the specific thing gaze tracking does not catch.",
    ok: "no",
  },
  {
    claim: "The person is who they say they are",
    real: "Needs enrolment — a reference face captured earlier and stored. That is biometric data, with everything that follows.",
    ok: "partly",
  },
];

const OK: Record<Row["ok"], { label: string; chip: string }> = {
  yes: { label: "Deliverable", chip: "bg-teal-50 text-teal-800 ring-teal-600/25" },
  partly: { label: "Partly", chip: "bg-amber-50 text-amber-900 ring-amber-600/25" },
  no: { label: "No", chip: "bg-rose-50 text-rose-800 ring-rose-600/25" },
};

const HARMS = [
  {
    who: "Darker-skinned students",
    what: "Face detection fails measurably more often on darker skin, especially in poor light. A failure reads as absence, and absence reads as suspicion.",
  },
  {
    who: "Neurodivergent students",
    what: "Not making eye contact with a screen is a diagnostic trait for some people. A gaze detector marks it as evasion.",
  },
  {
    who: "Anyone without a private room",
    what: "A student sitting an assessment on a shared bed with family walking past is flagged for the room, not the conduct.",
  },
  {
    who: "Anyone on an old phone",
    what: "A 2 MB model plus continuous video processing on a budget handset means heat, battery drain and a slow page — against a product that has to work on 3G.",
  },
];

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-violet-deep">
        Preview · Camera proctoring
      </p>
      <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight text-brand-ink sm:text-4xl">
        The camera is a deterrent. It is a poor detector.
      </h1>
      <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-slate-700">
        Watching students on camera is a normal thing for an assessment product
        to do, and it can be built here. What follows is what it would actually
        catch, what it would cost, and who it would wrongly accuse — so the call
        is made with all three in view.
      </p>

      <section className="mt-8">
        <h2 className="font-display text-lg font-bold text-brand-ink">
          Meet it the way a student would
        </h2>
        <p className="mt-2 max-w-2xl text-[0.88rem] leading-relaxed text-slate-600">
          Your real camera, running locally. Nothing is recorded or uploaded.
        </p>
        <div className="mt-4">
          <CameraDemo />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg font-bold text-brand-ink">
          What proctoring claims, and what holds
        </h2>
        <ul className="mt-4 space-y-3">
          {CLAIMS.map((c) => (
            <li
              key={c.claim}
              className="rounded-2xl border border-slate-200 bg-surface p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h3 className="text-[0.95rem] font-bold text-brand-ink">
                  &ldquo;{c.claim}&rdquo;
                </h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide ring-1 ring-inset ${OK[c.ok].chip}`}
                >
                  {OK[c.ok].label}
                </span>
              </div>
              <p className="mt-2 text-[0.85rem] leading-relaxed text-slate-700">
                {c.real}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 rounded-2xl border border-rose-200 bg-rose-50/40 p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold text-brand-ink">
          Who gets wrongly flagged
        </h2>
        <p className="mt-2 text-[0.88rem] leading-relaxed text-slate-700">
          This is the part that decides whether the feature is worth having,
          because a false flag on a readiness result is not a small error — it
          is the product telling a student they are suspected of cheating.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {HARMS.map((h) => (
            <li key={h.who} className="rounded-xl bg-surface p-3.5">
              <p className="text-[0.85rem] font-bold text-brand-ink">{h.who}</p>
              <p className="mt-1 text-[0.82rem] leading-snug text-slate-600">
                {h.what}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 rounded-2xl border border-slate-200 bg-surface p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold text-brand-ink">
          What it obliges us to
        </h2>
        <ul className="mt-3 space-y-2.5 text-[0.87rem] leading-relaxed text-slate-700">
          <li>
            <strong>Consent that can be refused.</strong> A camera permission a
            student can decline is one a meaningful share will decline. The
            assessment has to produce a result without it, or the camera is a
            gate and not a check.
          </li>
          <li>
            <strong>A face is personal data.</strong> Under India&rsquo;s DPDP
            Act this needs a stated purpose, a retention limit and a deletion
            path — and if any user is under 18, verifiable parental consent.
            Frames analysed and discarded on the device are far lighter here
            than video uploaded and stored.
          </li>
          <li>
            <strong>A route to challenge.</strong> If a flag can affect a
            result, a student has to be able to see it and contest it. That is a
            support process, not a feature.
          </li>
        </ul>
      </section>

      <section className="mt-10 rounded-2xl border-2 border-brand-teal/30 bg-teal-50/40 p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold text-brand-ink">
          The recommendation
        </h2>
        <p className="mt-2.5 text-[0.9rem] leading-relaxed text-slate-800">
          <strong>The deterrent does not depend on the detector.</strong>{" "}
          Telling somebody the camera is on changes what they do, whether or not
          anything downstream can tell where they are looking. That is where
          nearly all of the value sits, and it costs a permission prompt.
        </p>
        <p className="mt-3 text-[0.9rem] leading-relaxed text-slate-800">
          So: turn the camera on, say plainly what it does, record{" "}
          <strong>presence only</strong>, process on the device and keep no
          video. Do not ship gaze tracking. It cannot catch the attack that
          prompted this — a phone held beside the screen keeps the eyes on the
          screen — and its main output would be false flags against the students
          least able to argue back.
        </p>
        <p className="mt-3 text-[0.9rem] leading-relaxed text-slate-800">
          Spend the effort on the follow-up probe instead. A student who pasted
          an answer cannot defend it under a clock, and that holds no matter
          which device the answer came from.
        </p>
      </section>
    </main>
  );
}
