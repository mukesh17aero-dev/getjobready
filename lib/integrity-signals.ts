// Browser observations, not cheating verdicts. No clipboard contents, window
// titles, destination URLs or typed characters are collected.
export type IntegrityEvent = {
  type: "focus_left" | "focus_returned" | "tab_hidden" | "tab_visible" | "copy_blocked" | "cut_blocked" | "paste_blocked" | "drop_blocked";
  at: string;
  seconds?: number;
};
export type AnswerSignals = {
  pastes: number; longestPaste: number; pastedChars: number;
  hiddenSeconds: number; hiddenCount: number;
  secondsToFirstKey: number | null; keystrokes: number; deletions: number; finalChars: number;
  awayCount: number; awaySeconds: number; blockedCopies: number; blockedCuts: number; blockedPastes: number; blockedDrops: number;
  events: IntegrityEvent[]; omittedEvents: number;
};
export type IntegrityWatch = {
  paste: (chars: number) => void;
  block: (action: "copy" | "cut" | "paste" | "drop") => void;
  key: (key: string) => void;
  read: (finalChars: number) => AnswerSignals;
  stop: () => void;
};
const MAX_EVENTS = 100;
export function watchAnswer(options: { initial?: AnswerSignals; onEvent?: (event: IntegrityEvent) => void } = {}): IntegrityWatch {
  const initial = options.initial;
  const values: AnswerSignals = {
    pastes: 0, longestPaste: 0, pastedChars: 0, hiddenSeconds: 0, hiddenCount: 0,
    secondsToFirstKey: null, keystrokes: 0, deletions: 0, finalChars: 0,
    awayCount: 0, awaySeconds: 0, blockedCopies: 0, blockedCuts: 0, blockedPastes: 0, blockedDrops: 0,
    ...initial, events: [...(initial?.events ?? [])].slice(-MAX_EVENTS), omittedEvents: initial?.omittedEvents ?? 0,
  };
  const opened = Date.now();
  let hiddenSince: number | null = null;
  let awaySince: number | null = null;
  let hiddenMs = values.hiddenSeconds * 1000;
  let awayMs = values.awaySeconds * 1000;
  let hidden = false;
  let blurred = false;
  let stopped = false;
  function emit(type: IntegrityEvent["type"], seconds?: number) {
    const event: IntegrityEvent = { type, at: new Date().toISOString(), ...(seconds === undefined ? {} : { seconds }) };
    if (values.events.length === MAX_EVENTS) { values.events.shift(); values.omittedEvents++; }
    values.events.push(event);
    options.onEvent?.(event);
  }
  function reconcile() {
    const away = hidden || blurred;
    if (away && awaySince === null) { awaySince = Date.now(); values.awayCount++; emit("focus_left"); }
    else if (!away && awaySince !== null) {
      const elapsed = Date.now() - awaySince;
      awayMs += elapsed; awaySince = null;
      emit("focus_returned", Math.round(elapsed / 1000));
    }
  }
  function visibility() {
    if (document.hidden === hidden) return;
    hidden = document.hidden;
    if (hidden) { hiddenSince = Date.now(); values.hiddenCount++; reconcile(); emit("tab_hidden"); }
    else {
      const elapsed = hiddenSince === null ? 0 : Date.now() - hiddenSince;
      hiddenMs += elapsed; hiddenSince = null;
      blurred = !document.hasFocus();
      emit("tab_visible", Math.round(elapsed / 1000)); reconcile();
    }
  }
  function blur() { blurred = true; reconcile(); }
  function focus() { blurred = false; reconcile(); }
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", blur);
    window.addEventListener("focus", focus);
    // Do not invent a switch event merely because monitoring started while hidden.
    hidden = document.hidden; blurred = !document.hasFocus();
    if (hidden) hiddenSince = opened;
    if (hidden || blurred) awaySince = opened;
  }
  return {
    paste(chars) { if (stopped) return; values.pastes++; values.pastedChars += chars; values.longestPaste = Math.max(values.longestPaste, chars); },
    block(action) {
      if (stopped) return;
      const key = { copy: "blockedCopies", cut: "blockedCuts", paste: "blockedPastes", drop: "blockedDrops" } as const;
      values[key[action]]++;
      emit(`${action}_blocked`);
    },
    key(key) {
      if (stopped) return;
      if (values.secondsToFirstKey === null && (key.length === 1 || key === "Backspace" || key === "Delete")) values.secondsToFirstKey = Math.round((Date.now() - opened) / 1000);
      if (key === "Backspace" || key === "Delete") values.deletions++;
      else if (key.length === 1) values.keystrokes++;
    },
    read(finalChars) {
      return { ...values, events: [...values.events], finalChars,
        hiddenSeconds: Math.round((hiddenMs + (hiddenSince === null ? 0 : Date.now() - hiddenSince)) / 1000),
        awaySeconds: Math.round((awayMs + (awaySince === null ? 0 : Date.now() - awaySince)) / 1000) };
    },
    stop() {
      if (stopped) return;
      if (hiddenSince !== null) { hiddenMs += Date.now() - hiddenSince; hiddenSince = null; }
      if (awaySince !== null) { awayMs += Date.now() - awaySince; awaySince = null; }
      stopped = true;
      if (typeof document !== "undefined") { document.removeEventListener("visibilitychange", visibility); window.removeEventListener("blur", blur); window.removeEventListener("focus", focus); }
    },
  };
}
