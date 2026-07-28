const SIZES = {
  // Used in the signed-in header and on the auth card, where the wordmark is
  // furniture and the page title should lead.
  sm: { name: "text-lg", tagline: "text-xs" },
  // Used in the public site header, where the wordmark *is* the brand and has
  // to hold its own against a 48px headline.
  lg: { name: "text-2xl", tagline: "text-[0.7rem]" },
} as const;

export function BrandMark({
  size = "sm",
  subdued = false,
}: {
  size?: keyof typeof SIZES;
  subdued?: boolean;
}) {
  const scale = SIZES[size];

  return (
    <span className="inline-flex items-baseline gap-2">
      <span
        className={`${scale.name} font-semibold tracking-tight ${
          subdued ? "text-slate-900" : "text-indigo-700"
        }`}
      >
        Ascend
      </span>
      <span
        className={`${scale.tagline} hidden font-medium uppercase tracking-[0.14em] text-slate-500 sm:inline`}
      >
        Talent Fulfillment Network
      </span>
    </span>
  );
}
