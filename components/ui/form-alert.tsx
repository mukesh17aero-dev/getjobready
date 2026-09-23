"use client";

// What is missing, said at the top of the form rather than the bottom.
//
// The problem this solves: a form that reports "name the role you are aiming
// at" under a two-column layout leaves the person looking at a button that
// will not work, with the reason somewhere off screen. They have to hunt for
// it, and on a phone they may never find it at all.
//
// So this sits above the fields, and when it appears it scrolls itself into
// view and takes focus. Focus is what makes it work for everyone: a screen
// reader announces it, and a keyboard user's next Tab lands on the first
// thing that needs fixing rather than back at the top of the page.
//
// Each missing field is a button, not a sentence. Pressing it moves focus to
// that input, so the fix is one key away from the complaint.

import { useEffect, useRef } from "react";

export type MissingField = {
  /** The id of the input this refers to, so the person can be sent to it. */
  id: string;
  /** What the field is called on screen. */
  label: string;
};

export function FormAlert({
  message,
  missing = [],
  className = "",
}: {
  /** The headline. Null or empty hides the whole thing. */
  message: string | null;
  /** Fields to offer as shortcuts. Omit for a plain message. */
  missing?: MissingField[];
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const shown = Boolean(message);

  useEffect(() => {
    if (!shown) return;
    const node = box.current;
    if (!node) return;
    // Focus first, then correct the scroll position: focusing can itself
    // scroll, and browsers differ on where it lands.
    node.focus({ preventScroll: true });
    node.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [shown, message]);

  if (!shown) return null;

  const jump = (id: string) => {
    const field = document.getElementById(id);
    if (!field) return;
    field.focus({ preventScroll: true });
    field.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  return (
    <div
      ref={box}
      role="alert"
      aria-live="assertive"
      tabIndex={-1}
      className={`rounded-xl border border-rose-600/35 bg-rose-50 px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-rose-600/40 ${className}`}
    >
      <p className="flex items-start gap-2 text-[0.85rem] font-semibold leading-snug text-rose-700">
        <span aria-hidden="true" className="mt-px shrink-0">
          !
        </span>
        <span>{message}</span>
      </p>
      {missing.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {missing.map((field) => (
            <li key={field.id}>
              <button
                type="button"
                onClick={() => jump(field.id)}
                className="text-[0.8rem] font-semibold text-rose-700 underline underline-offset-2 hover:text-rose-600"
              >
                {field.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
