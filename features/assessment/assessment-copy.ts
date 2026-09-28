import { CAPTURE_GUARD } from "./capture-guard";

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

/** Browser deterrence only: operating-system screenshots cannot be prevented here. */
export function protectAssessmentInputs(root:HTMLElement,onBlocked:(action:'paste'|'drop'|'print'|'capture')=>void):()=>void{
 const doc=root.ownerDocument;
 const inside=(event:Event)=>event.target instanceof Node&&root.contains(event.target);
 const insertion=(event:Event)=>{if(!inside(event))return;const type=(event as InputEvent).inputType;if(['insertFromPaste','insertFromPasteAsQuotation','insertFromDrop','insertFromYank'].includes(type)){event.preventDefault();onBlocked(type==='insertFromDrop'?'drop':'paste');}};
 const paste=(event:Event)=>{if(inside(event)){event.preventDefault();onBlocked('paste');}};
 const drop=(event:Event)=>{if(inside(event)){event.preventDefault();onBlocked('drop');}};
 const menu=(event:Event)=>{if(inside(event))event.preventDefault();};
 const key=(event:Event)=>{const e=event as KeyboardEvent;const letter=e.key.toLowerCase();if((e.ctrlKey||e.metaKey)&&letter==='p'){e.preventDefault();onBlocked('print');}else if(CAPTURE_GUARD&&(e.key==='PrintScreen'||(e.metaKey&&e.shiftKey&&['3','4','5'].includes(letter)))){e.preventDefault();onBlocked('capture');}else if(inside(e)&&(((e.ctrlKey||e.metaKey)&&letter==='v')||(e.shiftKey&&e.key==='Insert'))){e.preventDefault();onBlocked('paste');}};
 const handlers:[string,EventListener][]=[['beforeinput',insertion],['paste',paste],['drop',drop],['contextmenu',menu],['keydown',key]];
 const options={capture:true};
 handlers.forEach(([name,handler])=>doc.addEventListener(name,handler,options));
 return()=>handlers.forEach(([name,handler])=>doc.removeEventListener(name,handler,options));
}
