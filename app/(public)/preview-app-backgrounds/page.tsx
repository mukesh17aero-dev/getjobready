// Temporary comparison page: six background treatments for the signed-in app
// screens (home, profile, resume, interview, discover), which today sit on a
// flat ground with two drifting blobs behind them.
//
// Every treatment is rendered under the same piece of app chrome - a page
// title, one card with a heading, two lines of copy, a stat and the teal
// primary action, and one line of muted text sitting directly on the bare
// background - so the judgement is about readability, not about how a
// coloured rectangle looks on its own.
//
// Self-contained: all six live in the <style> block below under .bgp-* class
// names. Nothing here touches components/ambience.tsx or app/globals.css, and
// nothing here is linked from the site. Deleted once a direction is chosen.
//
// The page itself is painted flat bg-surface, which covers the global
// Ambience layer - so the ground between the panels is exactly today's
// background, and each panel can be compared against it.

// The same film grain the landing sheets and Ambience already use: an inlined
// feTurbulence, a few hundred bytes of stylesheet instead of an image request.
// It also kills the banding that very low contrast gradients show on cheap
// 6-bit phone panels.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.42'/%3E%3C/svg%3E\")";

// Light values are the defaults; the dark set is repeated twice on purpose -
// once for the OS preference and once for the in-app toggle, which stamps
// data-theme on <html> and must win in both directions. Same shape as the
// cascade in app/globals.css.
const DARK_VARS = `
    --bgp-grid: rgba(255, 255, 255, 0.055);
    --bgp-grid-major: rgba(255, 255, 255, 0.085);
    --bgp-dot: rgba(255, 255, 255, 0.075);
    --bgp-contour: rgba(94, 234, 212, 0.1);
    --bgp-contour-far: rgba(94, 234, 212, 0.055);
    --bgp-aurora-a: rgba(34, 211, 238, 0.16);
    --bgp-aurora-b: rgba(52, 211, 153, 0.13);
    --bgp-wash: rgba(34, 211, 238, 0.15);
    --bgp-wash-far: rgba(0, 0, 0, 0.28);
    --bgp-vignette: rgba(0, 0, 0, 0.3);
    --bgp-edge: rgba(0, 0, 0, 0.32);
    --bgp-grain: 0.13;
`;

const CSS = `
:root {
  --bgp-grain-img: ${GRAIN};
  --bgp-grid: rgba(28, 26, 41, 0.06);
  --bgp-grid-major: rgba(28, 26, 41, 0.1);
  --bgp-dot: rgba(28, 26, 41, 0.11);
  --bgp-contour: rgba(13, 148, 136, 0.13);
  --bgp-contour-far: rgba(13, 148, 136, 0.07);
  --bgp-aurora-a: rgba(13, 148, 136, 0.15);
  --bgp-aurora-b: rgba(45, 212, 191, 0.13);
  --bgp-wash: rgba(13, 148, 136, 0.16);
  --bgp-wash-far: rgba(28, 26, 41, 0.06);
  --bgp-vignette: rgba(28, 26, 41, 0.055);
  --bgp-edge: rgba(28, 26, 41, 0.05);
  --bgp-grain: 0.05;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {${DARK_VARS}  }
}

:root[data-theme="dark"] {${DARK_VARS}}

/* The stage: an opaque slab of the app's own ground with one or two
   decorative layers on it and the mock chrome above them. */
.bgp-stage {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  background-color: var(--color-surface);
}

.bgp-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.bgp-content {
  position: relative;
  z-index: 1;
}

.bgp-grain-layer {
  background-image: var(--bgp-grain-img);
  opacity: var(--bgp-grain);
  mix-blend-mode: overlay;
}

/* A - refined aurora. Two wide fields whose centres sit outside the panel,
   so only their falloff is ever on screen. No blur filter: a radial gradient
   is already soft, and blurring one costs a full-size filter pass for
   nothing. The layer is oversized so the slow travel never exposes an edge. */
.bgp-a-field {
  inset: -12%;
  background-image:
    radial-gradient(38rem 26rem at 14% -8%, var(--bgp-aurora-a), transparent 70%),
    radial-gradient(34rem 24rem at 90% 106%, var(--bgp-aurora-b), transparent 72%);
  animation: bgp-drift 52s ease-in-out infinite;
}

@keyframes bgp-drift {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(-2.4%, 1.6%, 0); }
}

/* B - graph paper. A fine 28px rule with a heavier 140px rule over it, both
   masked so the paper is only ever a hint at the edges of vision and fades
   out entirely before it reaches the column the text sits in. */
.bgp-b-grid {
  background-image:
    linear-gradient(var(--bgp-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--bgp-grid) 1px, transparent 1px),
    linear-gradient(var(--bgp-grid-major) 1px, transparent 1px),
    linear-gradient(90deg, var(--bgp-grid-major) 1px, transparent 1px);
  background-size: 28px 28px, 28px 28px, 140px 140px, 140px 140px;
  -webkit-mask-image: radial-gradient(ellipse 82% 78% at 50% 44%, #000 18%, transparent 100%);
  mask-image: radial-gradient(ellipse 82% 78% at 50% 44%, #000 18%, transparent 100%);
}

/* C - contour lines. Two sets of concentric rings from centres outside the
   panel; where they cross they read as terrain rather than as ripples. The
   whole thing is tilted a few degrees so no ring runs parallel to an edge,
   and masked to the foot of the panel: ground below, clear air above. */
.bgp-c-topo {
  inset: -22%;
  transform: rotate(-7deg);
  background-image:
    repeating-radial-gradient(ellipse 58% 44% at 16% 112%, transparent 0 4.4%, var(--bgp-contour) 4.4% 4.8%),
    repeating-radial-gradient(ellipse 66% 50% at 88% 128%, transparent 0 5.6%, var(--bgp-contour-far) 5.6% 5.95%);
  -webkit-mask-image: linear-gradient(to top, #000 0%, rgba(0, 0, 0, 0.35) 52%, transparent 88%);
  mask-image: linear-gradient(to top, #000 0%, rgba(0, 0, 0, 0.35) 52%, transparent 88%);
}

/* D - dot matrix. 22px pitch, masked to a soft field around the content, with
   a separate vignette closing the corners down so the panel has a middle. */
.bgp-d-dots {
  background-image: radial-gradient(var(--bgp-dot) 1.1px, transparent 1.2px);
  background-size: 22px 22px;
  -webkit-mask-image: radial-gradient(ellipse 72% 66% at 50% 42%, #000 15%, transparent 92%);
  mask-image: radial-gradient(ellipse 72% 66% at 50% 42%, #000 15%, transparent 92%);
}

.bgp-d-vignette {
  background-image: radial-gradient(ellipse 118% 100% at 50% 44%, transparent 42%, var(--bgp-vignette));
}

/* E - one wash, anchored top left, plus a long fall towards the opposite
   corner. Two gradients, no mask, no blend, no animation. */
.bgp-e-wash {
  background-image:
    radial-gradient(122% 96% at 0% 0%, var(--bgp-wash), transparent 62%),
    linear-gradient(158deg, transparent 42%, var(--bgp-wash-far));
}

/* F - the reading column. The margins recede and the column the content
   lives in stays at the app's own ground colour, so the card is the brightest
   thing on screen without painting anything behind it. The top edge carries
   the faintest lift of brand colour - the direction of travel, not weather.
   Grain over the whole thing, because a 5% gradient bands badly on cheap
   panels and grain is what hides it. */
.bgp-f-column {
  background-image:
    linear-gradient(90deg, var(--bgp-edge) 0%, transparent 17%, transparent 83%, var(--bgp-edge) 100%),
    radial-gradient(70% 34% at 50% -6%, var(--bgp-aurora-a), transparent 72%);
}

/* Only A moves. The global reduced-motion rule already collapses it to its
   first frame, which is the untransformed one; this states it outright. */
@media (prefers-reduced-motion: reduce) {
  .bgp-a-field {
    animation: none;
  }
}
`;

// ---- the sample chrome ----
//
// The same content on all six: a page title, a card carrying the three
// questions every screen owes (stake, why me, one action), and one line of
// muted copy on the bare ground so the background is judged with text
// directly on it, not only through a card.

function AppChrome() {
  return (
    <div className="bgp-content px-4 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-xl">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-slate-400">
            Your next step
          </p>
          <p className="text-[0.72rem] text-slate-500">Nithin K. · Coimbatore</p>
        </div>
        <h3 className="mt-1 font-display text-xl font-bold text-brand-ink">
          Hub Supervisor
        </h3>

        <div className="mt-3 rounded-3xl border border-slate-200 bg-surface p-4 shadow-sm sm:p-5">
          <p className="text-[0.95rem] font-bold text-brand-ink">
            Finish the interview you started on Tuesday
          </p>
          <p className="mt-1.5 text-[0.82rem] leading-relaxed text-slate-600">
            You answered four of the seven questions and stopped at the one
            about a shift going wrong. Your answers are saved exactly as you
            left them.
          </p>
          <p className="mt-1 text-[0.82rem] leading-relaxed text-slate-600">
            Employers read this before anything else in your record, so it is
            the fastest thing you own to improve.
          </p>

          <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-200 pt-3.5">
            <div>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-slate-400">
                Answered
              </p>
              <p className="text-[0.95rem] font-bold text-teal-700">
                4 of 7
                <span className="ml-1.5 text-[0.72rem] font-semibold text-slate-500">
                  about 9 minutes left
                </span>
              </p>
            </div>
            <span className="ml-auto flex min-h-11 items-center justify-center rounded-full bg-brand-teal-deep px-5 text-sm font-bold text-white shadow-sm">
              Continue the interview
            </span>
          </div>
        </div>

        <p className="mt-3 text-[0.75rem] leading-relaxed text-slate-500">
          Saved as you go. You can stop at any question and pick it up later -
          nothing is lost and nothing is sent anywhere until you say so.
        </p>
      </div>
    </div>
  );
}

// ---- the six stages ----

function StageA() {
  return (
    <div className="bgp-stage rounded-3xl border border-slate-200">
      <span aria-hidden className="bgp-layer bgp-a-field" />
      <span aria-hidden className="bgp-layer bgp-grain-layer" />
      <AppChrome />
    </div>
  );
}

function StageB() {
  return (
    <div className="bgp-stage rounded-3xl border border-slate-200">
      <span aria-hidden className="bgp-layer bgp-b-grid" />
      <AppChrome />
    </div>
  );
}

function StageC() {
  return (
    <div className="bgp-stage rounded-3xl border border-slate-200">
      <span aria-hidden className="bgp-layer bgp-c-topo" />
      <AppChrome />
    </div>
  );
}

function StageD() {
  return (
    <div className="bgp-stage rounded-3xl border border-slate-200">
      <span aria-hidden className="bgp-layer bgp-d-dots" />
      <span aria-hidden className="bgp-layer bgp-d-vignette" />
      <AppChrome />
    </div>
  );
}

function StageE() {
  return (
    <div className="bgp-stage rounded-3xl border border-slate-200">
      <span aria-hidden className="bgp-layer bgp-e-wash" />
      <AppChrome />
    </div>
  );
}

function StageF() {
  return (
    <div className="bgp-stage rounded-3xl border border-slate-200">
      <span aria-hidden className="bgp-layer bgp-f-column" />
      <span aria-hidden className="bgp-layer bgp-grain-layer" />
      <AppChrome />
    </div>
  );
}

// ---- the page ----

function Concept({
  label,
  title,
  rationale,
  tradeoff,
  children,
}: {
  label: string;
  title: string;
  rationale: string;
  tradeoff: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto mt-14 max-w-3xl first:mt-10">
      <p className="text-sm font-bold text-teal-700">
        {label} · {title}
      </p>
      <p className="mt-1 text-[0.85rem] text-slate-600">{rationale}</p>
      <p className="mt-1.5 text-[0.8rem] text-slate-500">
        <span className="font-semibold text-slate-600">Trade-off:</span>{" "}
        {tradeoff}
      </p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export const metadata = { title: "App backgrounds - six treatments" };

export default function PreviewAppBackgroundsPage() {
  return (
    <main className="relative min-h-dvh bg-surface px-5 pb-24 pt-12">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="mx-auto max-w-3xl">
        <p className="text-[0.7rem] font-semibold tracking-[0.25em] text-teal-700">
          PREVIEW - NOT LINKED FROM THE SITE
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-brand-ink">
          Six backgrounds for the signed-in screens
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Six ways to stop the app reading as a blank sheet, each carrying the
          same piece of chrome so the question is whether the text still reads,
          not whether the rectangle looks nice. The ground this page is painted
          on is today&rsquo;s flat background, so every panel can be compared
          against the thing it would replace. Switch the theme in the header -
          all six are built in both.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          The card, the button and the stat are the real app chrome. The card
          is opaque, so no treatment can change the contrast of anything inside
          it; the page title above it and the muted line below it sit directly
          on the background, which is where readability is actually decided.
        </p>
        <p className="mt-2 text-[0.8rem] leading-relaxed text-slate-500">
          Baseline for the contrast notes: body copy at slate-600 measures
          7.1:1 on the light ground and 10.6:1 on the dark one, against a 4.5:1
          requirement - so there is room to tint the ground before anything is
          at risk. Separately, and true today with no background at all: the
          white label on the teal button measures about 3.5:1 in light mode,
          which passes only at large sizes. That is a button colour question,
          not a background one, but it is worth fixing.
        </p>
      </div>

      <Concept
        label="A"
        title="Refined aurora"
        rationale="Today's idea, taken down a stop: two fields whose centres sit off the panel so only their falloff is ever visible, moving 2% of the width over 52 seconds, with grain on top. It drops the 64px blur the current version pays for - a radial gradient is already soft, and blurring one buys nothing. Contrast: the strongest point of the tint puts the ground at #d7ebe6 in light and #0e3335 in dark, where slate-600 body copy still measures 5.9:1 and 7.6:1; inside the panel it never reaches that, because the bright centres are outside it."
        tradeoff="It is the only one here that never stops moving, so it is the only one that keeps a compositor layer alive forever - on a cheap phone that is a small, permanent battery cost for something nobody is meant to notice. It is also the least distinctive: soft coloured blobs are what every SaaS product shipped in 2024."
      >
        <StageA />
      </Concept>

      <Concept
        label="B"
        title="Graph paper"
        rationale="A 28px rule with a heavier 140px rule over it, masked so it fades out before it reaches the column the text sits in and survives only at the edges of vision. It reads as a workbench: a surface you do work on rather than a surface you are shown things on, which is the right word for a screen where someone rewrites their own resume. Contrast: the lines are 1px at 6-10% alpha and are masked away from the content entirely, so the ground under every piece of text is the untouched surface colour - 7.1:1 and 10.6:1, unchanged."
        tradeoff="Grids carry an office association, and this codebase has already had one round of moving the palette away from looking like an admin panel. At odd device pixel ratios the 1px rules land on half pixels and shimmer slightly when the page scrolls. Cost is moderate: the mask forces the layer to be composited separately, and the pattern is re-rasterised on every resize."
      >
        <StageB />
      </Concept>

      <Concept
        label="C"
        title="Contour lines"
        rationale="Two sets of rings from centres below the panel, tilted seven degrees so nothing runs parallel to an edge, masked to the foot of the screen: terrain at the bottom, clear air where the reading happens. It is the only option that means something - a contour map is a climb, and the product is called Ascend. Contrast: the lines peak at 13% teal in light and 10% in dark, they are sub-pixel to 2px wide, and the mask has already taken them to near nothing by the height the card starts, so text ground stays at the base 7.1:1 and 10.6:1."
        tradeoff="Repeating radial gradients are the most expensive thing on this page to paint the first time - per-pixel maths over an oversized, rotated layer - and at some window widths the two ring sets interfere into a faint moiré. It is also the treatment most likely to date: the day the metaphor stops feeling earned it will read as decoration."
      >
        <StageC />
      </Concept>

      <Concept
        label="D"
        title="Dot matrix with a vignette"
        rationale="A 22px dot field masked to a soft island around the content, with a second layer closing the corners down so the panel has a middle to look at. The vignette is what does the work: it gives the screen a centre without putting anything behind the words. Contrast: the dots are masked out under the content and the vignette only ever darkens, and only at the edges - in light it takes the far corners to #f0efed where slate-600 still measures 6.4:1, and in dark it deepens the corners, which improves contrast rather than costing it."
        tradeoff="Two full-size layers, one of them masked, is the heaviest static composition here. Dot fields also read as presentation software to anyone who has seen a deck template, and at 360px the mask covers nearly the whole panel, so on a phone the treatment nearly disappears - it is a desktop idea."
      >
        <StageD />
      </Concept>

      <Concept
        label="E"
        title="One corner wash"
        rationale="A single wide field anchored to the top left and a long fall towards the opposite corner. No mask, no blend mode, no animation - two gradients and nothing else, which makes it the cheapest thing on this page by a wide margin and the only one with no cost at all after first paint. Contrast: the wash peaks at 16% in the corner, where slate-600 measures 5.9:1 in light and 7.4:1 in dark; everywhere the content actually sits it is weaker than that."
        tradeoff="It is the closest to doing nothing. A single diagonal wash may not answer the complaint that started this - the screen is still, essentially, one colour - and because it has a direction it will look different on a short screen than on a tall one, so the same page can feel like two different rooms."
      >
        <StageE />
      </Concept>

      <Concept
        label="F"
        title="The reading column"
        rationale="Instead of painting something behind the words, this recedes everything that is not the words: the outer margins darken slightly and the column the content lives in stays at the app's own ground colour, so the card becomes the brightest thing on screen without a single pixel drawn under it. The faintest lift of brand colour along the top edge gives the page a direction of travel. Grain over the whole thing, because a 5% gradient bands visibly on the cheap 6-bit panels this has to run on and grain is what hides it. Contrast: the content column is untouched at 7.1:1 and 10.6:1; the darkest point of the margins is #f0efed in light, 6.4:1, and in dark the margins only get deeper."
        tradeoff="It is a wide-screen effect. Below about 700px the margins are gone and the treatment is honestly nothing but grain, so a phone user gets no benefit from it - defensible, since a phone screen is already one column, but it does mean most Indian users would never see it. It also only works if every screen keeps its content in a centred column."
      >
        <StageF />
      </Concept>
    </main>
  );
}
