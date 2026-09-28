// Vercel preview deploys are the team's own test site, where screenshots are
// how reviews happen. Production keeps every capture deterrent.
export const CAPTURE_GUARD = process.env.NEXT_PUBLIC_VERCEL_ENV !== "preview";
