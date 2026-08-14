export type Theme = "light" | "dark" | "system";

const KEY = "ascend:theme";

export function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

// "system" removes the attribute so the OS preference (a media query in
// globals.css) takes over again.
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
  try {
    if (theme === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, theme);
  } catch {
    // Storage unavailable: the choice simply does not persist.
  }
}

// Runs before first paint so a dark-mode user never sees a white flash.
export const THEME_BOOTSTRAP = `try{var t=localStorage.getItem("${KEY}");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}`;
