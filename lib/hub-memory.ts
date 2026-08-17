// Which hub the user came from, remembered for the tab so a module page can
// offer an accurate way back. Client-side navigation does not update
// document.referrer, so the hubs record themselves instead.

export const HUB_LABELS: Record<string, string> = {
  "/start": "Back to your goals",
  "/practice": "Back to Practice",
  "/discover": "Back to Discovery",
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
