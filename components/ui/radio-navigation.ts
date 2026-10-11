import type { KeyboardEvent } from "react";

/** Arrow keys select within a radio group; Tab leaves the group. */
export function radioNavigation(event: KeyboardEvent<HTMLElement>) {
  if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(event.key)) return;
  const radios = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button[role="radio"]:not(:disabled)')];
  if (!radios.length) return;
  const index = radios.indexOf(event.target as HTMLButtonElement);
  if (index < 0) return;
  event.preventDefault();
  const next = event.key === "Home" ? 0 : event.key === "End" ? radios.length - 1
    : (index + (["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1) + radios.length) % radios.length;
  radios[next].focus();
  radios[next].click();
}
