// The Ascend mark: a rising "A" drawn as two nested chevrons in the brand
// gradient. Vector rather than a bitmap so it stays sharp at any size and
// picks up the current theme.
export function BrandLogo({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="Ascend"
    >
      <defs>
        <linearGradient id="ascend-mark" x1="6" y1="42" x2="42" y2="6" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7b5cf0" />
          <stop offset="55%" stopColor="#5b6ef5" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      {/* outer rise */}
      <path
        d="M6 41 L24 8 L42 41"
        stroke="url(#ascend-mark)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* inner rise, echoing the first step of the climb */}
      <path
        d="M16 41 L24 26 L32 41"
        stroke="url(#ascend-mark)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
    </svg>
  );
}
