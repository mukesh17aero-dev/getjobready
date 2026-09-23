"use client";

import { Dialog } from "./dialog";

// A yes-or-no in the app's own dialog rather than the browser's: the same
// panel, focus handling and theme as every other dialog here, and a message
// that can say what the choice actually does.

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel = "Keep it as it is",
  busy = false,
  onConfirm,
  onClose,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog
      title={title}
      onClose={onClose}
      footer={
        <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-full border border-slate-300 px-5 text-sm font-bold text-brand-ink transition-colors hover:border-slate-400 motion-reduce:transition-none"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="min-h-11 rounded-full bg-brand-teal-deep px-5 text-sm font-bold text-white transition-colors hover:bg-brand-teal disabled:opacity-60 motion-reduce:transition-none"
          >
            {busy ? "One moment…" : confirmLabel}
          </button>
        </div>
      }
    >
      <p className="text-[0.92rem] leading-relaxed text-slate-700">{body}</p>
    </Dialog>
  );
}
