/** Protect both direct copies and page-wide selections containing assessment content. */
export function protectAssessmentCopy(root: HTMLElement, onBlocked: (action: "copy" | "cut") => void): () => void {
  const doc = root.ownerDocument;
  function protectedSelection(event: Event): boolean {
    if (event.target instanceof Node && root.contains(event.target)) return true;
    // A focused input elsewhere (such as AI chat) owns its own selection.
    const active = doc.activeElement;
    if (active?.matches("input, textarea, [contenteditable=true]") && !root.contains(active)) return false;
    const selection = doc.getSelection();
    if (!selection) return false;
    for (let i = 0; i < selection.rangeCount; i++) {
      if (selection.getRangeAt(i).intersectsNode(root)) return true;
    }
    return false;
  }
  function block(event: Event) {
    if (!protectedSelection(event)) return;
    event.preventDefault();
    onBlocked(event.type === "cut" ? "cut" : "copy");
  }
  // Copy can target document/body when the user selects a question or uses
  // Select All, so a textarea-only or React subtree handler is insufficient.
  const options = { capture: true };
  doc.addEventListener("copy", block, options);
  doc.addEventListener("cut", block, options);
  doc.addEventListener("dragstart", block, options);
  return () => {
    doc.removeEventListener("copy", block, options);
    doc.removeEventListener("cut", block, options);
    doc.removeEventListener("dragstart", block, options);
  };
}
