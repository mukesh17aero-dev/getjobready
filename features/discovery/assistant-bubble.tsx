"use client";

// The assistant, as a bubble. One shell, used on the role page and on a tour
// stop, so the thing you tap to ask a question is in the same place, the same
// shape and the same colour wherever you meet it.
//
// It says what it is for rather than being a speech-bubble icon in a corner:
// an icon has to be guessed at, and the guess most people make is "support
// widget", which is the one thing this is not.

import { useState } from "react";
import { DiscoveryAssistant } from "./discovery-assistant";
import type { RoleDetail } from "@/lib/api";

export function AssistantBubble({
  role,
  label = "Ask about this role",
  scrollRef,
  onAsked,
  /** So the page can make room for the panel rather than be covered by it. */
  onOpenChange,
  openQuestions = false,
}: {
  role: RoleDetail;
  label?: string;
  /** Offer the tour's open questions - see DiscoveryAssistant. */
  openQuestions?: boolean;
  scrollRef?: React.RefObject<HTMLElement | null>;
  onAsked?: (question: string) => void;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const set = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  // The panel stays mounted and is hidden, never unmounted. Rendering it only
  // while open threw the conversation away every time somebody closed it -
  // which is the one thing a chat window must not do, because the answers you
  // have already been given are the reason you opened it again.
  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => set(true)}
          className="fixed bottom-5 right-5 z-40 inline-flex min-h-14 items-center gap-2.5 rounded-full bg-brand-violet pl-3 pr-5 text-[0.88rem] font-bold text-white shadow-[0_12px_30px_-8px_rgba(0,0,0,0.5)] transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
        >
          <span
            aria-hidden
            className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full ring-1 ring-white/40"
            style={{
              background:
                "radial-gradient(circle at 32% 28%, var(--color-brand-violet-soft) 0%, var(--color-brand-violet) 45%, var(--color-brand-violet-deep) 100%)",
            }}
          >
            <span className="absolute left-[18%] top-[14%] h-1.5 w-1.5 rounded-full bg-white/80 blur-[1px]" />
          </span>
          {label}
        </button>
      )}

      <div
        // A corner panel only where there is room for a corner panel. Below
        // that it spans the width, so it reads as a layer over the page
        // rather than a box sitting on half a paragraph.
        className={`fixed inset-x-4 bottom-4 z-40 max-h-[min(80vh,44rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-surface shadow-[0_18px_50px_-12px_rgba(0,0,0,0.5)] xl:left-auto xl:right-4 xl:w-[25rem] ${
          open ? "flex" : "hidden"
        }`}
      >
        <DiscoveryAssistant
          key={role.roleId}
          role={role}
          knowledge={role.knowledge}
          scrollRef={scrollRef}
          onAsked={onAsked}
          startOpen
          tall
          openQuestions={openQuestions}
          onClose={() => set(false)}
        />
      </div>
    </>
  );
}
