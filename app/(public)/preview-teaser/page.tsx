"use client";

// A preview, not a shipped screen: the teaser as one film. Six eight-second
// shots rendered by Sora, captions burned in, stitched into a single 48-second
// mp4 - so what plays here is one file, the way it would sit on the welcome
// page or go out to somebody on WhatsApp.

const TEASER =
  "https://polkexjgphmwtpwhmspk.supabase.co/storage/v1/object/public/teaser/ascend-teaser-v2.mp4";

const BEATS = [
  "Most people pick a career by guessing",
  "Ascend asks what you would rather do, in real situations",
  "Then it shows what that job is actually like",
  "Practise the interview out loud - ten minutes, any time",
  "A resume built only from what you have really done",
  "Honest feedback at every step. Start with one role.",
];

export default function PreviewTeaser() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-8 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-wide text-brand-violet-deep">
        Preview - not live
      </p>
      <h1 className="mt-1 text-[1.8rem] font-bold leading-tight text-brand-ink">
        The Ascend teaser
      </h1>
      <p className="mt-2 max-w-prose text-[0.9rem] leading-relaxed text-slate-600">
        One file, 48 seconds. Six shots rendered separately and stitched, with
        each line burned into a band across the bottom - so it can sit on the
        welcome page, be sent to somebody, or be posted anywhere a video goes.
      </p>

      <video
        src={TEASER}
        controls
        playsInline
        preload="metadata"
        className="mt-5 aspect-video w-full rounded-2xl border border-slate-200 bg-black"
      />

      <h2 className="mt-8 text-base font-bold text-brand-ink">What it says</h2>
      <ol className="mt-2 grid gap-1.5">
        {BEATS.map((beat, i) => (
          <li key={beat} className="flex gap-2.5 text-[0.88rem] leading-relaxed text-slate-600">
            <span className="tabular-nums text-slate-400">{i + 1}</span>
            {beat}
          </li>
        ))}
      </ol>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-surface p-5">
        <h2 className="text-base font-bold text-brand-ink">How it was made</h2>
        <ul className="mt-2 grid gap-2 text-[0.86rem] leading-relaxed text-slate-600">
          <li>
            Six shots of eight seconds each, rendered by Sora at 720p. One
            render takes about a hundred seconds, so they run together.
          </li>
          <li>
            Each line is drawn as a band and laid across the bottom of its
            shot, then the six are joined into one file.
          </li>
          <li>
            Nothing in the film claims a job, a salary or a number of users -
            there is no statistic in it to defend.
          </li>
        </ul>
      </section>
    </main>
  );
}
