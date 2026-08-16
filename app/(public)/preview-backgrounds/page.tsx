// Temporary comparison page: five background/gradient systems for the four
// landing sheets. Each row shows the system carried across all four sheets.
// Not linked from anywhere; deleted once a direction is chosen.

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.42'/%3E%3C/svg%3E\")";

type Panel = { label: string; bg: string };
type Theme = {
  tag: string;
  title: string;
  blurb: string;
  accent: string;
  btnFrom: string;
  btnTo: string;
  btnText: string;
  panels: Panel[];
};

const THEMES: Theme[] = [
  {
    tag: "A",
    title: "Graphite aurora (current)",
    accent: "#5eead4", btnFrom: "#5eead4", btnTo: "#0d9488", btnText: "#03201c",
    blurb:
      "Near-black navy, one cyan orb and one emerald orb drifting per sheet, film grain on top. Quiet and premium; the accents do the talking.",
    panels: [
      {
        label: "Sheet 1 · hero",
        bg: "radial-gradient(45rem 30rem at -10% -20%, rgba(34,211,238,0.30), transparent 65%), radial-gradient(40rem 26rem at 110% 120%, rgba(52,211,153,0.24), transparent 70%), #090d15",
      },
      {
        label: "Sheet 2 · employers",
        bg: "radial-gradient(40rem 26rem at -15% 40%, rgba(34,211,238,0.18), transparent 65%), radial-gradient(36rem 24rem at 115% 95%, rgba(52,211,153,0.16), transparent 70%), #0a1118",
      },
      {
        label: "Sheet 3 · offers",
        bg: "radial-gradient(40rem 26rem at -15% 40%, rgba(34,211,238,0.18), transparent 65%), radial-gradient(36rem 24rem at 115% 95%, rgba(52,211,153,0.16), transparent 70%), #0a121a",
      },
      {
        label: "Sheet 4 · closing",
        bg: "radial-gradient(45rem 30rem at -10% -20%, rgba(34,211,238,0.30), transparent 65%), radial-gradient(40rem 26rem at 110% 120%, rgba(52,211,153,0.24), transparent 70%), #081210",
      },
    ],
  },
  {
    tag: "B",
    title: "Ocean depth",
    accent: "#5eead4", btnFrom: "#5eead4", btnTo: "#0d9488", btnText: "#03201c",
    blurb:
      "A vertical dive: each sheet is a depth band, from surface-lit teal navy down to abyssal green-black. Scrolling the page literally descends.",
    panels: [
      {
        label: "Sheet 1 · hero",
        bg: "linear-gradient(180deg, #0b2230 0%, #081826 55%, #060f1a 100%)",
      },
      {
        label: "Sheet 2 · employers",
        bg: "linear-gradient(180deg, #081c26 0%, #071420 60%, #050d16 100%)",
      },
      {
        label: "Sheet 3 · offers",
        bg: "linear-gradient(180deg, #07171f 0%, #061019 60%, #040a12 100%)",
      },
      {
        label: "Sheet 4 · closing",
        bg: "linear-gradient(180deg, #06131a 0%, #051612 55%, #030a08 100%)",
      },
    ],
  },
  {
    tag: "C",
    title: "Keynote spotlight",
    accent: "#5eead4", btnFrom: "#5eead4", btnTo: "#0d9488", btnText: "#03201c",
    blurb:
      "One soft spotlight behind the content of every sheet, everything else falls to black vignette. The most theatrical; content floats in light.",
    panels: [
      {
        label: "Sheet 1 · hero",
        bg: "radial-gradient(50rem 32rem at 35% 40%, #12232e 0%, #0a141c 45%, #05080d 100%)",
      },
      {
        label: "Sheet 2 · employers",
        bg: "radial-gradient(46rem 30rem at 50% 45%, #10222a 0%, #091319 50%, #04070b 100%)",
      },
      {
        label: "Sheet 3 · offers",
        bg: "radial-gradient(50rem 30rem at 50% 35%, #0f2028 0%, #081218 50%, #04070b 100%)",
      },
      {
        label: "Sheet 4 · closing",
        bg: "radial-gradient(44rem 30rem at 50% 50%, #0f2321 0%, #081411 50%, #030705 100%)",
      },
    ],
  },
  {
    tag: "D",
    title: "Mesh dawn",
    accent: "#5eead4", btnFrom: "#5eead4", btnTo: "#0d9488", btnText: "#03201c",
    blurb:
      "Multi-point colour mesh - cyan, teal and deep blue pooling in different corners per sheet. The most modern-SaaS of the set; softly luminous.",
    panels: [
      {
        label: "Sheet 1 · hero",
        bg: "radial-gradient(38rem 26rem at 15% 10%, rgba(34,211,238,0.22), transparent 60%), radial-gradient(34rem 24rem at 85% 30%, rgba(45,212,191,0.16), transparent 60%), radial-gradient(40rem 28rem at 50% 110%, rgba(30,64,175,0.25), transparent 65%), #080e18",
      },
      {
        label: "Sheet 2 · employers",
        bg: "radial-gradient(36rem 24rem at 80% 15%, rgba(34,211,238,0.14), transparent 60%), radial-gradient(38rem 26rem at 10% 90%, rgba(45,212,191,0.16), transparent 60%), radial-gradient(36rem 24rem at 60% 50%, rgba(30,58,138,0.20), transparent 65%), #0a101a",
      },
      {
        label: "Sheet 3 · offers",
        bg: "radial-gradient(38rem 26rem at 20% 80%, rgba(34,211,238,0.16), transparent 60%), radial-gradient(36rem 26rem at 85% 70%, rgba(52,211,153,0.18), transparent 60%), radial-gradient(34rem 24rem at 50% 0%, rgba(30,64,175,0.22), transparent 65%), #0a121c",
      },
      {
        label: "Sheet 4 · closing",
        bg: "radial-gradient(40rem 28rem at 50% 20%, rgba(52,211,153,0.20), transparent 60%), radial-gradient(36rem 26rem at 15% 90%, rgba(34,211,238,0.16), transparent 60%), #081410",
      },
    ],
  },
  {
    tag: "E",
    title: "Horizon grid",
    accent: "#5eead4", btnFrom: "#5eead4", btnTo: "#0d9488", btnText: "#03201c",
    blurb:
      "A faint perspective grid meets a glowing horizon line low on every sheet - the network aesthetic carried into the atmosphere itself.",
    panels: [
      {
        label: "Sheet 1 · hero",
        bg: "linear-gradient(rgba(94,234,212,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(94,234,212,0.05) 1px, transparent 1px), radial-gradient(60rem 20rem at 50% 102%, rgba(45,212,191,0.22), transparent 70%), #080d14",
      },
      {
        label: "Sheet 2 · employers",
        bg: "linear-gradient(rgba(94,234,212,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(94,234,212,0.04) 1px, transparent 1px), radial-gradient(56rem 18rem at 50% 102%, rgba(34,211,238,0.18), transparent 70%), #091019",
      },
      {
        label: "Sheet 3 · offers",
        bg: "linear-gradient(rgba(94,234,212,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(94,234,212,0.04) 1px, transparent 1px), radial-gradient(56rem 18rem at 50% 102%, rgba(52,211,153,0.20), transparent 70%), #0a121a",
      },
      {
        label: "Sheet 4 · closing",
        bg: "linear-gradient(rgba(94,234,212,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(94,234,212,0.05) 1px, transparent 1px), radial-gradient(60rem 22rem at 50% 100%, rgba(52,211,153,0.26), transparent 70%), #071009",
      },
    ],
  },
  {
    tag: "F",
    title: "Sapphire night",
    blurb:
      "Deep blue-black with electric sapphire accents - the green family gone entirely. Cool, corporate-premium, very fintech.",
    accent: "#93c5fd", btnFrom: "#93c5fd", btnTo: "#2563eb", btnText: "#061431",
    panels: [
      { label: "Sheet 1 · hero", bg: "radial-gradient(45rem 30rem at -10% -20%, rgba(59,130,246,0.30), transparent 65%), radial-gradient(40rem 26rem at 110% 120%, rgba(96,165,250,0.20), transparent 70%), #070b16" },
      { label: "Sheet 2 · employers", bg: "radial-gradient(40rem 26rem at -15% 40%, rgba(59,130,246,0.18), transparent 65%), #080d19" },
      { label: "Sheet 3 · offers", bg: "radial-gradient(40rem 26rem at 115% 90%, rgba(96,165,250,0.18), transparent 65%), #090e1c" },
      { label: "Sheet 4 · closing", bg: "radial-gradient(45rem 30rem at 50% 110%, rgba(59,130,246,0.28), transparent 70%), #060a14" },
    ],
  },
  {
    tag: "G",
    title: "Ember graphite",
    blurb:
      "Warm charcoal with amber-copper light - the opposite temperature to everything above. Feels crafted, human, editorial.",
    accent: "#fcd34d", btnFrom: "#fcd34d", btnTo: "#d97706", btnText: "#2a1503",
    panels: [
      { label: "Sheet 1 · hero", bg: "radial-gradient(45rem 30rem at -10% -20%, rgba(251,191,36,0.16), transparent 65%), radial-gradient(40rem 26rem at 110% 120%, rgba(217,119,6,0.14), transparent 70%), #121013" },
      { label: "Sheet 2 · employers", bg: "radial-gradient(40rem 26rem at -15% 40%, rgba(251,191,36,0.10), transparent 65%), #14110f" },
      { label: "Sheet 3 · offers", bg: "radial-gradient(40rem 26rem at 115% 90%, rgba(217,119,6,0.12), transparent 65%), #151210" },
      { label: "Sheet 4 · closing", bg: "radial-gradient(45rem 30rem at 50% 110%, rgba(251,191,36,0.18), transparent 70%), #100d0b" },
    ],
  },
  {
    tag: "H",
    title: "Platinum mono",
    blurb:
      "No colour at all: pure graphite, silver light, white accents. The most restrained option - everything rides on typography and the 3D visuals.",
    accent: "#e2e8f0", btnFrom: "#ffffff", btnTo: "#cbd5e1", btnText: "#0f172a",
    panels: [
      { label: "Sheet 1 · hero", bg: "radial-gradient(45rem 30rem at -10% -20%, rgba(226,232,240,0.10), transparent 65%), radial-gradient(40rem 26rem at 110% 120%, rgba(148,163,184,0.08), transparent 70%), #0b0d10" },
      { label: "Sheet 2 · employers", bg: "radial-gradient(40rem 26rem at -15% 40%, rgba(226,232,240,0.07), transparent 65%), #0c0e12" },
      { label: "Sheet 3 · offers", bg: "radial-gradient(40rem 26rem at 115% 90%, rgba(203,213,225,0.07), transparent 65%), #0d0f13" },
      { label: "Sheet 4 · closing", bg: "radial-gradient(45rem 30rem at 50% 110%, rgba(226,232,240,0.12), transparent 70%), #0a0c0f" },
    ],
  },
  {
    tag: "I",
    title: "Ivory daylight",
    blurb:
      "The bold move: a light theme. Warm paper white with deep slate text and a single strong accent - the page that looks nothing like every dark AI site.",
    accent: "#0f766e", btnFrom: "#0d9488", btnTo: "#115e59", btnText: "#ffffff",
    panels: [
      { label: "Sheet 1 · hero", bg: "radial-gradient(45rem 30rem at -10% -20%, rgba(13,148,136,0.10), transparent 65%), linear-gradient(180deg, #fbfaf7 0%, #f4f2ec 100%)" },
      { label: "Sheet 2 · employers", bg: "linear-gradient(180deg, #f6f5f1 0%, #eeece5 100%)" },
      { label: "Sheet 3 · offers", bg: "radial-gradient(40rem 26rem at 115% 90%, rgba(13,148,136,0.08), transparent 65%), #f8f7f3" },
      { label: "Sheet 4 · closing", bg: "radial-gradient(45rem 30rem at 50% 110%, rgba(13,148,136,0.14), transparent 70%), #f3f1ea" },
    ],
  },
];

export default function PreviewBackgroundsPage() {
  return (
    <main className="bg-[#0a121a] pb-20">
      <div className="mx-auto max-w-6xl px-5 pt-12">
        <p className="text-[0.7rem] font-semibold tracking-[0.25em] text-teal-300/80">
          PREVIEW · NOT LINKED FROM THE SITE
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-white">
          Backgrounds, five ways across the four sheets
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/60">
          Each row is one atmosphere system carried across all four sheets.
          The sample content is identical everywhere - judge the mood, the
          depth, and how the accents sit on it.
        </p>

        <div className="mt-10 space-y-12">
          {THEMES.map((theme) => (
            <section key={theme.tag}>
              <p className="font-display text-sm font-bold text-teal-300">
                {theme.tag} · {theme.title}
              </p>
              <p className="mt-1 max-w-2xl text-[0.82rem] text-white/55">
                {theme.blurb}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {theme.panels.map((panel) => (
                  <div
                    key={panel.label}
                    className="relative flex h-52 flex-col justify-between overflow-hidden rounded-2xl border border-white/10 p-4"
                    style={{
                      background: panel.bg,
                      backgroundSize:
                        theme.tag === "E"
                          ? "34px 34px, 34px 34px, auto, auto"
                          : undefined,
                    }}
                  >
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 opacity-[0.16] mix-blend-overlay"
                      style={{ backgroundImage: GRAIN }}
                    />
                    <p className="relative text-[0.6rem] font-bold uppercase tracking-[0.18em] text-white/40">
                      {panel.label}
                    </p>
                    <div className="relative">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.56rem] font-bold uppercase tracking-[0.14em]"
                        style={{
                          color: theme.accent,
                          borderColor: theme.tag === "I" ? "rgba(15,23,42,0.15)" : "rgba(255,255,255,0.15)",
                          background: theme.tag === "I" ? "rgba(15,23,42,0.04)" : "rgba(255,255,255,0.05)",
                        }}
                      >
                        <span className="h-1 w-1 rounded-full" style={{ background: theme.accent }} />
                        Badge
                      </span>
                      <p
                        className="mt-2 font-display text-[1.05rem] font-semibold leading-tight"
                        style={{ color: theme.tag === "I" ? "#1e293b" : "#ffffff" }}
                      >
                        Every career start asks
                      </p>
                      <p
                        className="mt-1 text-[0.7rem] leading-snug"
                        style={{ color: theme.tag === "I" ? "rgba(30,41,59,0.65)" : "rgba(255,255,255,0.55)" }}
                      >
                        Work that fits how you think, and proof employers
                        trust.
                      </p>
                      <span
                        className="mt-2.5 inline-block rounded-lg px-3 py-1.5 text-[0.66rem] font-bold"
                        style={{
                          background: `linear-gradient(to bottom right, ${theme.btnFrom}, ${theme.btnTo})`,
                          color: theme.btnText,
                        }}
                      >
                        Begin your climb
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
