"use client";

import { useState, useSyncExternalStore } from "react";
import { applyTheme, readTheme, type Theme } from "@/lib/theme";

// Light / dark / follow-the-system, remembered per browser. Lives on the
// settings page; the header imports nothing but the link to get there.
export function ThemeSwitch() {
  // localStorage is external state — read it without setState-in-effect, and
  // keep a local override so a click responds instantly.
  const stored = useSyncExternalStore(
    () => () => {},
    readTheme,
    () => "dark" as Theme,
  );
  const [picked, setPicked] = useState<Theme | null>(null);
  const theme = picked ?? stored;

  const options: Array<{ id: Theme; label: string }> = [
    { id: "light", label: "Light" },
    { id: "dark", label: "Dark" },
    { id: "system", label: "System" },
  ];

  return (
    <div>
      <div className="flex rounded-lg border border-slate-200 p-0.5">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={theme === option.id}
            onClick={() => {
              setPicked(option.id);
              applyTheme(option.id);
            }}
            className={`flex-1 rounded-md px-2 py-1 text-[0.75rem] font-semibold transition-colors ${
              theme === option.id
                ? "bg-slate-900 text-surface"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
