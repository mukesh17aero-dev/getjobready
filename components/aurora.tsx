// The atmosphere behind the dark sections.
//
// Two slow-drifting fields of colour and a layer of grain. Both are doing a
// job: the colour keeps a large dark area from reading as a flat black
// rectangle, and the grain stops the gradients banding on the cheap panels
// most of our users are looking at.
//
// Everything is CSS — no canvas, no library, no image request. The drift is
// slow enough (18–26s) to read as depth rather than as something demanding
// attention, and globals.css stops it entirely for anyone who has asked their
// system for less motion.

// feTurbulence, inlined. A tiled PNG would be another request and another
// thing to cache; this is a few hundred bytes in the stylesheet.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.42'/%3E%3C/svg%3E\")";

/**
 * `variant` places the colour relative to the section it sits in.
 *
 * "hero" throws light from the top-left corner, which is where a page wants it.
 * A second section directly below cannot do the same — a bright field starting
 * at its top edge draws a line across the page and the two halves read as two
 * screens. "low" keeps the light away from that boundary entirely.
 */
export function Aurora({ variant = "hero" }: { variant?: "hero" | "low" }) {
  const hero = variant === "hero";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <span
        className={`absolute h-[38rem] w-[38rem] animate-drift rounded-full blur-3xl ${
          hero ? "-left-[15%] -top-[35%]" : "-left-[22%] top-[30%]"
        }`}
        style={{
          background: `radial-gradient(circle, rgb(109 92 231 / ${
            hero ? 0.55 : 0.32
          }) 0%, rgb(109 92 231 / 0) 68%)`,
        }}
      />
      <span
        className={`absolute h-[34rem] w-[34rem] animate-drift-slow rounded-full blur-3xl ${
          hero ? "-bottom-[45%] right-[-10%]" : "-bottom-[30%] right-[-14%]"
        }`}
        style={{
          background: `radial-gradient(circle, rgb(25 184 176 / ${
            hero ? 0.4 : 0.28
          }) 0%, rgb(25 184 176 / 0) 70%)`,
        }}
      />
      <span
        className="absolute inset-0 opacity-[0.16] mix-blend-overlay"
        style={{ backgroundImage: GRAIN }}
      />
    </div>
  );
}
