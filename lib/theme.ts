export type Theme = "light" | "dark" | "system";

const KEY = "ascend:theme";

export function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(KEY);
    return stored === "dark" || stored === "system" ? stored : "light";
  } catch {
    return "light";
  }
}

// The reference canvas is light. Keep explicit dark and system preferences.
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

// Match the initial paint to the saved preference, or the reference canvas.
export const THEME_BOOTSTRAP = `try{var t=localStorage.getItem("${KEY}");if(t==="dark"){document.documentElement.setAttribute("data-theme","dark")}else if(t!=="system"){document.documentElement.setAttribute("data-theme","light")}}catch(e){document.documentElement.setAttribute("data-theme","light")}`;
