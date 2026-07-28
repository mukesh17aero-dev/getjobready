const TONES = {
  error: "border-red-200 bg-red-50 text-red-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  info: "border-slate-200 bg-slate-50 text-slate-700",
} as const;

export type BannerTone = keyof typeof TONES;

export function FormBanner({
  tone,
  children,
}: {
  tone: BannerTone;
  children: React.ReactNode;
}) {
  return (
    <p
      // Errors are announced to screen readers when they appear; the form has
      // already been submitted by then, so the message is the only feedback.
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-lg border px-3 py-2 text-sm ${TONES[tone]}`}
    >
      {children}
    </p>
  );
}
