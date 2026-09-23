// The welcome page's weather, carried through the rest of the app.
//
// A fixed layer behind every screen: two slow-drifting fields of brand colour
// and the same grain the landing sections use. The intensity comes from theme
// tokens (--ambience-violet / --ambience-teal in globals.css) — faint over the
// light ground, fuller over the dark one — so signed-in screens share the
// front door's atmosphere without the content cards losing contrast.
//
// It sits at -z-10 behind the page, so any section that paints its own opaque
// ground (the landing's dark slabs, dialogs) simply covers it.

// feTurbulence, inlined — same trade as components/aurora.tsx: a few hundred
// bytes in the stylesheet instead of another image request.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.42'/%3E%3C/svg%3E\")";

export function Ambience() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <span
        className="absolute -left-[12%] -top-[20%] h-[42rem] w-[42rem] animate-drift rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--ambience-violet) 0%, rgb(109 92 231 / 0) 68%)",
        }}
      />
      <span
        className="absolute -bottom-[28%] right-[-12%] h-[36rem] w-[36rem] animate-drift-slow rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--ambience-teal) 0%, rgb(25 184 176 / 0) 70%)",
        }}
      />
      <span
        className="absolute inset-0 opacity-[0.14] mix-blend-overlay"
        style={{ backgroundImage: GRAIN }}
      />
    </div>
  );
}
