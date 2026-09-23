// What the browser observed while an answer was written.
//
// These are the shapes sent to the API, so they live with the rest of the
// contract. The watching itself is a browser concern and stays in
// features/assessment/integrity-signals.ts.
//
// Observations, not cheating verdicts: no clipboard contents, window titles,
// destination URLs or typed characters are collected.

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
