"use client";

import { useEffect, useId, useRef } from "react";

export function AssessmentFocusPrompt({ message, onAcknowledge }: { message: string; onAcknowledge: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const messageId = useId();
  useEffect(() => {
    const panel = dialog.current;
    panel?.showModal();
    return () => { panel?.close(); };
  }, []);

  return <dialog ref={dialog} className="assessment-focus-prompt" role="alertdialog" aria-labelledby={titleId} aria-describedby={messageId} onCancel={event => event.preventDefault()}>
    <h2 id={titleId}>Keep this assessment in view</h2>
    <div id={messageId}>
      <p>{message}</p>
      <p>Avoid switching tabs or windows while answering.</p>
    </div>
    <button type="button" onClick={onAcknowledge}>I understand — continue assessment</button>
  </dialog>;
}
