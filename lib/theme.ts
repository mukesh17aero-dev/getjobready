export type Theme = "light" | "dark" | "system";

const KEY = "ascend:theme";

export function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(KEY);
    return stored === "light" || stored === "system" ? stored : "dark";
  } catch {
    return "dark";
  }
}

// Dark is the product's default: a first-time visitor gets the night theme
// regardless of their OS. "system" is an explicit choice now, so it is
// stored like the others rather than being the absence of one.
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // Storage unavailable: the choice simply does not persist.
  }
}

// Runs before first paint. No stored choice means dark - never a light
// flash for the default visitor.
export const THEME_BOOTSTRAP = `try{var t=localStorage.getItem("${KEY}");if(t==="light"){document.documentElement.setAttribute("data-theme","light")}else if(t!=="system"){document.documentElement.setAttribute("data-theme","dark")}}catch(e){document.documentElement.setAttribute("data-theme","dark")}`;
