import type { MetadataRoute } from "next";

// The blueprint's non-goals rule out native apps, and this does not breach
// them: a manifest is browser furniture, not a build target. What it buys is
// the one native affordance a web app is allowed to have - a student can add
// Ascend to their home screen and open it without a browser bar, which is
// what "app" means to most people on a phone.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ascend — Talent Fulfillment Network",
    // Home screens truncate at roughly 12 characters. Anything longer is
    // decided for us, and badly.
    short_name: "Ascend",
    description:
      "Practise the skills a job needs, build auditable evidence that you have them, and share a verified readiness passport with employers.",
    // "/" is the journey router: it decides where a person belongs based on
    // where they left off. Opening the installed app anywhere else would be
    // guessing on their behalf.
    start_url: "/",
    display: "standalone",
    // The colour behind the app while it launches. Matched to the dark theme
    // so the splash does not flash white before the page paints.
    background_color: "#0a121a",
    theme_color: "#0a121a",
    // Orientation is left unlocked deliberately. Locking to portrait breaks
    // the experience for anyone using a phone mounted in a stand or a
    // switch-access rig.
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Android crops icons to whatever shape the launcher uses. The maskable
      // pair keeps the mark inside the safe circle so it is never clipped.
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Long-pressing the installed icon jumps straight to a destination. These
    // are the header's own nav entries, minus Home, which is already start_url.
    shortcuts: [
      { name: "Discover", url: "/discover" },
      { name: "Practice", url: "/practice" },
      { name: "Opportunities", url: "/opportunities" },
    ],
  };
}
