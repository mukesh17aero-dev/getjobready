import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { protectAssessmentCopy } from "../../lib/assessment-copy";

class FakeNode extends EventTarget {
  nodes = new Set<unknown>();
  editable = false;
  contains(node: unknown) { return node === this || this.nodes.has(node); }
  matches() { return this.editable; }
}
class FakeDocument extends FakeNode {
  activeElement: FakeNode | null = null;
  intersects = false;
  getSelection() { return { rangeCount: 1, getRangeAt: () => ({ intersectsNode: () => this.intersects }) }; }
}
let doc: FakeDocument;
let root: FakeNode & { ownerDocument: FakeDocument };
beforeEach(() => { vi.stubGlobal("Node", FakeNode); doc = new FakeDocument(); root = Object.assign(new FakeNode(), { ownerDocument: doc }); });
afterEach(() => vi.unstubAllGlobals());
function copy(type = "copy", target: FakeNode = doc) {
  const event = new Event(type, { cancelable: true });
  Object.defineProperty(event, "target", { value: target });
  doc.dispatchEvent(event);
  return event;
}
describe("assessment content copy protection", () => {
  it("blocks document-targeted copies when the selection includes the question", () => {
    const blocked = vi.fn(); protectAssessmentCopy(root as unknown as HTMLElement, blocked);
    doc.intersects = true;
    expect(copy().defaultPrevented).toBe(true);
    expect(blocked).toHaveBeenCalledExactlyOnceWith("copy");
  });
  it("blocks direct answer cuts and dragging selected assessment text out", () => {
    const blocked = vi.fn(); protectAssessmentCopy(root as unknown as HTMLElement, blocked);
    const answer = new FakeNode(); root.nodes.add(answer);
    expect(copy("cut", answer).defaultPrevented).toBe(true);
    expect(copy("dragstart", answer).defaultPrevented).toBe(true);
    expect(blocked.mock.calls).toEqual([["cut"], ["copy"]]);
  });
  it("leaves unrelated selections and other input fields alone", () => {
    const blocked = vi.fn(); protectAssessmentCopy(root as unknown as HTMLElement, blocked);
    expect(copy().defaultPrevented).toBe(false);
    const chat = new FakeNode(); chat.editable = true; doc.activeElement = chat;
    doc.intersects = true; // A stale page selection must not override the input.
    expect(copy("copy", chat).defaultPrevented).toBe(false);
    expect(blocked).not.toHaveBeenCalled();
  });
  it("removes protection when the assessment closes", () => {
    const blocked = vi.fn(); const stop = protectAssessmentCopy(root as unknown as HTMLElement, blocked);
    stop(); doc.intersects = true;
    expect(copy().defaultPrevented).toBe(false);
    expect(blocked).not.toHaveBeenCalled();
  });
});
