// The one place the backend URL is decided.
//
// NEXT_PUBLIC_* must be read statically so Next.js can inline it into the
// browser bundle — never through a computed key.
const CONFIGURED_API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// In development the browser talks to the frontend's own origin and
// next.config.ts forwards /v1/* to the backend. That is not a data layer:
// nothing is read, written or decided here, the request is passed through
// untouched. It exists because a phone on the office wi-fi cannot resolve the
// developer's "localhost", cannot pass the backend's CORS allowlist, and — once
// the page is served over HTTPS for home-screen install testing — is forbidden
// by the browser from calling a plaintext http:// backend at all. Same-origin
// requests have none of those three problems.
//
// Server-side rendering always uses the configured URL: it runs on the same
// machine as the proxy would target, so a hop through it would be pure cost.
// Production always uses the configured URL, so the deployed frontend calls
// Render directly exactly as before and Vercel never proxies application data.
export const API_URL =
  process.env.NODE_ENV === "development" && typeof window !== "undefined"
    ? ""
    : CONFIGURED_API_URL;

// For error messages. `API_URL` is the empty string on the proxied path, and
// "Could not reach the server at ." helps nobody.
export const API_URL_LABEL = CONFIGURED_API_URL;
