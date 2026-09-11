// Exam lockdown: the browser-side restrictions applied while a scene is open.
//
// Scope is deliberately narrow. Copy, cut, paste and the context menu are
// blocked, the page is put into fullscreen, and leaving the tab is noticed and
// counted. Text selection is NOT blocked: it would break screen readers and
// magnifiers outright, and reading your own scene back is not the thing being
// prevented.
//
// Two facts the caller has to design around rather than wish away:
//
//   Fullscreen is unavailable on iPhone. Safari on iOS implements the
//   Fullscreen API for <video> only, so requestFullscreen() rejects on the one
//   device most students will use. `fullscreenSupported` reports this so the
//   UI can say something true instead of failing silently or, worse, blocking
//   the sitting on a capability the phone does not have.
//
//   None of this stops a second device. A phone photographing the screen never
//   touches the page. This raises the cost of the casual cheat and produces a
//   record of the obvious one; it is not a proof of anything.

export type LockdownEvent =
  | { kind: "copy" }
  | { kind: "cut" }
  | { kind: "paste"; chars: number }
  | { kind: "contextmenu" }
  | { kind: "left-tab" }
  | { kind: "returned-to-tab"; awaySeconds: number }
  | { kind: "left-fullscreen" };

export type LockdownTotals = {
  copyAttempts: number;
  pasteAttempts: number;
  contextMenuAttempts: number;
  tabExits: number;
  awaySeconds: number;
  fullscreenExits: number;
};

export type Lockdown = {
  /** Ask for fullscreen. Resolves false when the browser refuses or cannot. */
  enterFullscreen: () => Promise<boolean>;
  /** True when the page is in fullscreen right now. */
  isFullscreen: () => boolean;
  totals: () => LockdownTotals;
  /** Remove every listener and leave fullscreen. Always call this. */
  release: () => void;
};

/** False on iPhone, where the Fullscreen API covers <video> only. */
export function fullscreenSupported(): boolean {
  if (typeof document === "undefined") return false;
  return (
    document.fullscreenEnabled === true &&
    typeof document.documentElement.requestFullscreen === "function"
  );
}

const NOOP: Lockdown = {
  enterFullscreen: async () => false,
  isFullscreen: () => false,
  totals: () => ({
    copyAttempts: 0,
    pasteAttempts: 0,
    contextMenuAttempts: 0,
    tabExits: 0,
    awaySeconds: 0,
    fullscreenExits: 0,
  }),
  release: () => {},
};

/**
 * Engages the restrictions immediately. `onEvent` fires for each attempt so the
 * caller can warn the student and record it; the totals are also kept here.
 */
export function engageLockdown(
  onEvent: (event: LockdownEvent) => void,
): Lockdown {
  if (typeof document === "undefined") return NOOP;

  let copyAttempts = 0;
  let pasteAttempts = 0;
  let contextMenuAttempts = 0;
  let tabExits = 0;
  let awayMs = 0;
  let fullscreenExits = 0;
  let leftAt: number | null = null;

  const block = (e: Event) => {
    e.preventDefault();
    if (e.type === "paste") {
      pasteAttempts += 1;
      const chars =
        e instanceof ClipboardEvent
          ? (e.clipboardData?.getData("text").length ?? 0)
          : 0;
      onEvent({ kind: "paste", chars });
    } else if (e.type === "contextmenu") {
      contextMenuAttempts += 1;
      onEvent({ kind: "contextmenu" });
    } else {
      copyAttempts += 1;
      onEvent({ kind: e.type === "cut" ? "cut" : "copy" });
    }
  };

  const onVisibility = () => {
    if (document.hidden) {
      leftAt = Date.now();
      tabExits += 1;
      onEvent({ kind: "left-tab" });
    } else if (leftAt !== null) {
      const away = Date.now() - leftAt;
      awayMs += away;
      leftAt = null;
      onEvent({ kind: "returned-to-tab", awaySeconds: Math.round(away / 1000) });
    }
  };

  const onFullscreenChange = () => {
    if (document.fullscreenElement === null) {
      fullscreenExits += 1;
      onEvent({ kind: "left-fullscreen" });
    }
  };

  for (const type of ["copy", "cut", "paste", "contextmenu"]) {
    document.addEventListener(type, block);
  }
  document.addEventListener("visibilitychange", onVisibility);
  document.addEventListener("fullscreenchange", onFullscreenChange);

  return {
    async enterFullscreen() {
      if (!fullscreenSupported()) return false;
      try {
        await document.documentElement.requestFullscreen();
        return true;
      } catch {
        // Browsers reject this unless it came from a real click, and some
        // refuse regardless. Neither is worth an error in the student's face.
        return false;
      }
    },
    isFullscreen: () => document.fullscreenElement !== null,
    totals: () => ({
      copyAttempts,
      pasteAttempts,
      contextMenuAttempts,
      tabExits,
      awaySeconds: Math.round(
        (awayMs + (leftAt === null ? 0 : Date.now() - leftAt)) / 1000,
      ),
      fullscreenExits,
    }),
    release() {
      for (const type of ["copy", "cut", "paste", "contextmenu"]) {
        document.removeEventListener(type, block);
      }
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      if (document.fullscreenElement !== null) {
        void document.exitFullscreen().catch(() => {});
      }
    },
  };
}
