// Temporary comparison page: five styles for the landing's auth dialog.
// Static mockups - no live auth. Not linked from anywhere; deleted once a
// direction is chosen.

function GoogleMark() {
  return (
    <svg aria-hidden width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

const FIELD_DARK =
  "w-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-[0.95rem] text-white/40";

export default function PreviewAuthPage() {
  return (
    <main className="bg-[#0a121a] pb-20">
      <div className="mx-auto max-w-6xl px-5 pt-12">
        <p className="text-[0.7rem] font-semibold tracking-[0.25em] text-teal-300/80">
          PREVIEW · NOT LINKED FROM THE SITE
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-white">
          The auth dialog, five ways
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/60">
          Static mockups of the popup&apos;s look - same fields everywhere,
          different personalities. The winner gets wired to the real form.
        </p>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-2">
          {/* A · Night glass (current) */}
          <section>
            <p className="font-display text-sm font-bold text-teal-300">
              A · Night glass (current)
            </p>
            <p className="mt-1 text-[0.8rem] text-white/55">
              Dark panel, teal top-glow, quiet sea-green action.
            </p>
            <div className="mt-3 rounded-3xl border border-white/12 bg-[#0b131c] p-7 shadow-[0_40px_90px_-20px_rgba(0,0,0,0.9)]">
              <h2 className="font-display text-2xl font-bold text-white">Welcome back</h2>
              <p className="mt-2 text-sm text-white/55">Log in to continue your journey.</p>
              <div className="mt-6 flex items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/85">
                <GoogleMark /> Continue with Google
              </div>
              <div className="mt-4 flex items-center gap-3 text-xs uppercase tracking-wide text-white/35">
                <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
              </div>
              <div className="mt-4 space-y-3">
                <div className={FIELD_DARK}>Email</div>
                <div className={FIELD_DARK}>Password</div>
              </div>
              <div className="mt-4 rounded-xl border border-[#2dd4bf]/35 bg-[#123a34] px-5 py-2.5 text-center text-sm font-bold text-[#c7f5ea]">
                Log in
              </div>
            </div>
          </section>

          {/* B · Split brand panel */}
          <section>
            <p className="font-display text-sm font-bold text-teal-300">
              B · The two-door split
            </p>
            <p className="mt-1 text-[0.8rem] text-white/55">
              Brand story on the left, form on the right - the widescreen
              premium pattern.
            </p>
            <div className="mt-3 grid overflow-hidden rounded-3xl border border-white/12 sm:grid-cols-[0.9fr_1.1fr]">
              <div className="relative flex flex-col justify-between bg-gradient-to-br from-[#0c2b33] via-[#0a1f28] to-[#0a1420] p-6">
                <p className="font-display text-lg font-bold text-white">ASCEND</p>
                <div>
                  <p className="font-display text-[1.05rem] font-semibold leading-snug text-white">
                    Your dream career, built together.
                  </p>
                  <p className="mt-2 text-[0.75rem] leading-snug text-white/55">
                    One account. One career record. Every module.
                  </p>
                </div>
                <span aria-hidden className="mt-6 block h-1 w-16 rounded-full bg-gradient-to-r from-[#22d3ee] to-[#34d399]" />
              </div>
              <div className="bg-[#0b131c] p-6">
                <h2 className="font-display text-xl font-bold text-white">Welcome back</h2>
                <div className="mt-4 flex items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/85">
                  <GoogleMark /> Continue with Google
                </div>
                <div className="mt-3 space-y-3">
                  <div className={FIELD_DARK}>Email</div>
                  <div className={FIELD_DARK}>Password</div>
                </div>
                <div className="mt-3 rounded-xl border border-[#2dd4bf]/35 bg-[#123a34] px-5 py-2.5 text-center text-sm font-bold text-[#c7f5ea]">
                  Log in
                </div>
              </div>
            </div>
          </section>

          {/* C · Minimal centered */}
          <section>
            <p className="font-display text-sm font-bold text-teal-300">
              C · Quiet minimal
            </p>
            <p className="mt-1 text-[0.8rem] text-white/55">
              Mark on top, centered, underline fields - the Linear school:
              nothing decorative, everything typographic.
            </p>
            <div className="mt-3 rounded-3xl border border-white/10 bg-[#0c1218] p-8 text-center">
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#22d3ee] to-[#34d399] font-display text-lg font-bold text-[#03201c]">
                A
              </span>
              <h2 className="mt-4 font-display text-xl font-bold text-white">Welcome back</h2>
              <p className="mt-1 text-[0.8rem] text-white/45">Log in to continue your journey.</p>
              <div className="mx-auto mt-6 max-w-xs space-y-5 text-left">
                <div className="border-b border-white/15 pb-2 text-[0.95rem] text-white/40">Email</div>
                <div className="border-b border-white/15 pb-2 text-[0.95rem] text-white/40">Password</div>
              </div>
              <div className="mx-auto mt-6 max-w-xs rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#0f172a]">
                Log in
              </div>
              <div className="mx-auto mt-3 flex max-w-xs items-center justify-center gap-2.5 text-[0.82rem] font-semibold text-white/60">
                <GoogleMark /> or continue with Google
              </div>
            </div>
          </section>

          {/* D · Aurora frame */}
          <section>
            <p className="font-display text-sm font-bold text-teal-300">
              D · Aurora frame
            </p>
            <p className="mt-1 text-[0.8rem] text-white/55">
              The panel wears a slow-turning cyan→emerald light around its
              border - the landing&apos;s signature glow, promoted to a frame.
            </p>
            <div className="relative mt-3 overflow-hidden rounded-3xl p-px">
              <span
                aria-hidden
                className="absolute inset-[-150%]"
                style={{
                  animation: "beam-spin 6s linear infinite",
                  background:
                    "conic-gradient(from 0deg, transparent 0deg, transparent 280deg, rgba(34,211,238,0.8) 320deg, rgba(52,211,153,0.8) 350deg, transparent 360deg)",
                }}
              />
              <style>{`@keyframes beam-spin { to { transform: rotate(360deg); } }`}</style>
              <div className="relative rounded-[calc(1.5rem-1px)] bg-[#0b131c] p-7">
                <h2 className="font-display text-2xl font-bold text-white">Welcome back</h2>
                <p className="mt-2 text-sm text-white/55">Log in to continue your journey.</p>
                <div className="mt-6 flex items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/85">
                  <GoogleMark /> Continue with Google
                </div>
                <div className="mt-4 space-y-3">
                  <div className={FIELD_DARK}>Email</div>
                  <div className={FIELD_DARK}>Password</div>
                </div>
                <div className="mt-4 rounded-xl border border-[#2dd4bf]/35 bg-[#123a34] px-5 py-2.5 text-center text-sm font-bold text-[#c7f5ea]">
                  Log in
                </div>
              </div>
            </div>
          </section>

          {/* E · Frosted glass */}
          <section>
            <p className="font-display text-sm font-bold text-teal-300">
              E · Frosted glass
            </p>
            <p className="mt-1 text-[0.8rem] text-white/55">
              A lighter, heavily blurred pane - the page glows through the
              dialog itself. Airy; the least &ldquo;box&rdquo; of the five.
            </p>
            <div
              className="mt-3 rounded-3xl border border-white/20 p-7 backdrop-blur-2xl"
              style={{
                background:
                  "linear-gradient(160deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05) 55%), radial-gradient(24rem 10rem at 80% -10%, rgba(45,212,191,0.18), transparent)",
              }}
            >
              <h2 className="font-display text-2xl font-bold text-white">Welcome back</h2>
              <p className="mt-2 text-sm text-white/60">Log in to continue your journey.</p>
              <div className="mt-6 flex items-center justify-center gap-2.5 rounded-xl border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white">
                <GoogleMark /> Continue with Google
              </div>
              <div className="mt-4 space-y-3">
                <div className="w-full rounded-xl border border-white/25 bg-white/10 px-3.5 py-2.5 text-[0.95rem] text-white/50">Email</div>
                <div className="w-full rounded-xl border border-white/25 bg-white/10 px-3.5 py-2.5 text-[0.95rem] text-white/50">Password</div>
              </div>
              <div className="mt-4 rounded-xl bg-white/90 px-5 py-2.5 text-center text-sm font-bold text-[#0f172a]">
                Log in
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
