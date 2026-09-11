// Which hub the user came from, remembered for the tab so a module page can
// offer an accurate way back. Client-side navigation does not update
// document.referrer, so the hubs record themselves instead.

// Every hub a page can be reached through, named as the product names it.
//
// Two were missing, and they are the two that matter for pages with more than
// one way in: the resume and the profile both list the Professional Profile
// Builder, so without them here it had to declare a parent and be wrong for
// half its visitors.
//
// "Discovery" was the odd one out - the nav, the page and the URL all say
// Discover.
export const HUB_LABELS: Record<string, string> = {
  "/start": "Back to your goals",
  "/practice": "Back to Practice",
  "/discover": "Back to Discover",
  "/resume": "Back to Professional Presence",
  "/profile": "Back to Profile",
  "/interview": "Back to Interview",
};

const KEY = "ascend:last-hub";

export function rememberHub(path: string): void {
  if (!(path in HUB_LABELS)) return;
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    // Private mode or storage disabled: back links fall back to defaults.
  }
}

export function readHub(): string | null {
  try {
    const path = sessionStorage.getItem(KEY);
    return path && path in HUB_LABELS ? path : null;
  } catch {
    return null;
  }
}
