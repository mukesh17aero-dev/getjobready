"use client";

import { radioNavigation } from "@/components/ui/radio-navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { exportTemplate, type ResumeData, type ResumeTemplate } from "./resume-api";
import { CommentMarkers, DraftRequests, PickBox, requestsInstruction, useCommentMarks, useTextPick, type DraftRequest, type WriterReply } from "./draft-requests";
import { ResumeSuggestions } from "./resume-suggestions";
import { DemoLayer, useDraftDemo } from "./draft-demo";
import { A4Frame, MiniPreview, ResumeSheet, type SheetFocus } from "./resume-sheet";
import { TEMPLATES } from "./templates";
import { resumeSections, ResumeSectionEditor, type ResumeSection } from "./resume-section-editor";
import { ResumeAtsGuide } from "./resume-ats-guide";
import { sectionStatuses } from "./section-status";
import { SAMPLE_RESUME, STUDENT_SAMPLE } from "./starter-resumes";
import { standardFor } from "./track-standard";
import { CopyButton } from "@/components/ui/copy-button";
import { Alert, Check, LayoutAdd, Redo, Undo } from "@/components/ui/icons";
import s from "./resume-workbench.module.css";

export type WorkbenchTool = "content" | "draft" | "suggestions" | "ats";

/** What the Draft and Suggestions tools need from a signed-in page. */
export type WorkbenchWriter = {
  getToken: () => Promise<string | null>;
  /** The backend's writer: an instruction, and the resume to apply it to. */
  onAsk: (instruction: string, base: ResumeData) => Promise<WriterReply | null>;
};

export function ResumeWorkbench({ resume, template, role, jobDescription, track, onChange, onTemplate, writer, locked, onRequireAccount, onNext, disabled, example, saveLabel, saveFailed, onRetry, onDownload, initialSection = "header", tool: shownTool, onToolChange, templateChosen = false, saveScope = "profile" }: {
  resume: ResumeData; template: ResumeTemplate; role: string; track?: "student" | "early_career";
  onChange: (resume: ResumeData) => void; onTemplate: (template: ResumeTemplate) => void;
  /** The job posting the resume is tailored to, when one was given. */
  jobDescription?: string | undefined;
  /** The writer behind Draft and Suggestions. Absent where there is none -
      signed out, or an example - and `locked` says why instead. */
  writer?: WorkbenchWriter;
  onRequireAccount?: (action: "suggestions" | "regenerate") => void;
  locked?: ReactNode | ((tool: "draft" | "suggestions") => ReactNode);
  /** Where to go once the suggestions are done: Download. */
  onNext?: () => void;
  disabled: boolean;
  /** The tool showing, when the page around the workbench decides it - its
      footer moves the person from Edit sections to Request changes to Suggestions. */
  tool?: WorkbenchTool;
  onToolChange?: (tool: WorkbenchTool) => void; example: boolean; saveLabel: string; saveFailed: boolean;
  initialSection?: ResumeSection;
  onRetry: () => void;
  /**
   * Only where the editor is the whole page (the signed-out builder). In the
   * builder with steps, downloading is the last step and its own button.
   */
  onDownload?: () => void;
  /**
   * Whether a layout has already been picked for this resume. Until one is,
   * the page shows the layouts rather than a preview in a look nobody chose.
   */
  templateChosen?: boolean;
  saveScope?: "profile" | "browser";
}) {
  const sections = resumeSections(track);
  const [ownTool, setOwnTool] = useState<WorkbenchTool>("content");
  const tool = shownTool ?? ownTool;
  const setTool = (next: WorkbenchTool) => {
    if (next === "suggestions" && onRequireAccount) { onRequireAccount("suggestions"); return; }
    setOwnTool(next); onToolChange?.(next);
  };
  const [section, setSection] = useState<ResumeSection>(initialSection);
  // What the preview highlights: the part of the resume behind the box the
  // person is in - lit as soon as they click or tab into it, before they type.
  // Focus on anything else (a button, a section chip) or another section
  // clears it.
  const [editing, setEditing] = useState<SheetFocus | null>(null);
  const desk = useRef<HTMLDivElement>(null);
  const showSection = (next: ResumeSection) => { setSection(next); setEditing(null); };
  function noteField(event: React.SyntheticEvent<HTMLElement>) {
    const box = event.target as HTMLElement;
    if (!box.matches("input:not([type=checkbox]):not([type=radio]),textarea,select")) { setEditing(null); return; }
    const at = box.closest<HTMLElement>("[data-entry]");
    const part = box.closest<HTMLElement>("[data-section]")?.dataset.section ?? section;
    setEditing({ section: part, entry: at ? Number(at.dataset.entry) : undefined, field: box.dataset.field });
  }
  // Show the live document beside the content. Layout selection is optional.
  const [chosen, setChosen] = useState(templateChosen);
  // First time into Edit resume with no template chosen: open the layout gallery
  // straight away so they pick a look, rather than landing on a default nobody
  // chose. A saved/opened resume (templateChosen) goes to its preview instead.
  const [choosing, setChoosing] = useState(!templateChosen);
  const [rolls, setRolls] = useState(0);
  function pick(next: ResumeTemplate) {
    onTemplate(next);
    setChosen(true);
    setChoosing(false);
    setRolls(n => n + 1);
  }
  const controls = useRef<HTMLElement>(null);
  // The edit panel pins itself just under the toolbar, so it needs the
  // toolbar's real height - which changes when its buttons wrap.
  const bench = useRef<HTMLElement>(null);
  const toolbar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const bar = toolbar.current;
    if (!bar) return;
    const measure = () => bench.current?.style.setProperty("--toolbar-h", `${bar.offsetHeight}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);
  // Nothing reads as a warning before they have started: on an empty resume
  // the required sections are just sections, and the page waits for them.
  const started = Boolean(resume.header.name.trim() || resume.header.email.trim() || resume.summary.trim() || resume.experience.length || resume.education.length || resume.skills.some(group => group.items.length) || resume.projects?.length);
  const counted = sectionStatuses(resume);
  const statuses = started ? counted : Object.fromEntries(Object.entries(counted).map(([id, state]) => [id, state === "needed" ? "empty" : state])) as typeof counted;
  // The sections their level rarely needs fold under "More sections" - never
  // one that already has something in it, or the one open now.
  const standard = standardFor(track);
  const [moreSections, setMoreSections] = useState(false);
  const folded = sections.filter(([id]) => standard.need[id] === "more" && statuses[id] !== "done" && id !== section).map(([id]) => id);
  const listed = moreSections ? sections : sections.filter(([id]) => !folded.includes(id));
  // From the Suggestions tool to a section in Edit sections: the section
  // opens and its first empty required box takes focus, since the button
  // that was pressed is gone.
  function jumpTo(next: ResumeSection) {
    showSection(next); setTool("content");
    setTimeout(() => {
      const boxes = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[aria-label="Resume controls"] :is(input,textarea)[aria-required="true"]');
      ([...boxes].find(box => !box.value.trim()) ?? boxes[0])?.focus();
    }, 0);
  }
  function openSection(next: ResumeSection) {
    showSection(next); setTool("content");
    setTimeout(() => {
      const inputs = controls.current?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[aria-required="true"],textarea[aria-required="true"]');
      const target = inputs && ([...inputs].find(input => !input.value.trim()) ?? inputs[0]);
      if (target) { target.focus({ preventScroll: true }); target.scrollIntoView({ block: "center", behavior: "instant" }); }
      else controls.current?.scrollIntoView({ block: "start", behavior: "instant" });
    }, 0);
  }
  // Keep what is being edited in sight in the preview. Only when the preview
  // sits beside the editor: stacked on a phone, scrolling to it would move
  // the field being typed in off the screen. "nearest" leaves a part that is
  // already visible where it is, so typing does not jolt the page.
  useEffect(() => {
    if (!editing || tool !== "content" || !window.matchMedia("(min-width: 681px)").matches) return;
    const target = desk.current?.querySelector<HTMLElement>("[data-editing]");
    if (!target) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ block: "nearest", behavior: smooth ? "smooth" : "auto" });
  }, [editing, resume, tool]);
  const [pages, setPages] = useState(1);
  const [past, setPast] = useState<ResumeData[]>([]);
  const [future, setFuture] = useState<ResumeData[]>([]);
  function edit(next: ResumeData) {
    setPast(items => [...items.slice(-49), resume]); setFuture([]); onChange(next);
  }
  function undo() {
    const previous = past.at(-1); if (!previous) return;
    setFuture(items => [...items, resume]); setPast(items => items.slice(0, -1)); onChange(previous);
  }
  // ---- Draft: words picked in the preview, and the requests made of them ----
  const [requests, setRequests] = useState<DraftRequest[]>([]);
  const [draftReply, setDraftReply] = useState<{ text: string; undo: boolean } | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const nextRequest = useRef(1);
  // Draft asks first whether they want to edit it; words on the page can be
  // picked only once they have said yes - or already have requests.
  const [draftEditing, setDraftEditing] = useState(false);
  const editingDraft = draftEditing || requests.length > 0;
  const picking = tool === "draft" && Boolean(writer || onRequireAccount) && !disabled && !example && editingDraft;
  const { pick: picked, clear: clearPick } = useTextPick(desk, picking);
  // Words asked about stay picked out on the page until the draft is
  // regenerated, Quip-style; hovering a request or its marker brings it forward.
  const [activeRequest, setActiveRequest] = useState<number | null>(null);
  const marks = useCommentMarks(desk, requests, picked, activeRequest, tool === "draft" && !choosing, resume);
  // The walk-through starts only when "Show me how to edit" is pressed. Its
  // requests are examples - shown in the list, never sent, gone when it ends.
  const demo = useDraftDemo({
    bench, desk,
    onAdd: (ask, at) => addRequest(ask, at?.quote ?? "", at?.where ?? "Whole resume", at ? { section: at.section, entry: at.entry, range: at.range } : {}, true),
    onEnd: () => setRequests(list => list.filter(item => !item.demo)),
  });
  // Leaving Draft stops it, and takes its examples with it.
  const stopDemo = demo.stop;
  const demoRunning = demo.running;
  useEffect(() => {
    if (picking || !demoRunning) return;
    const timer = setTimeout(stopDemo, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picking, demoRunning]);
  function addRequest(ask: string, quote = "", where = "Whole resume", place: { section?: string; entry?: string; range?: Range } = {}, demo = false) {
    setRequests(list => [...list, { id: nextRequest.current++, quote, where, ask, ...place, ...(demo ? { demo } : {}) }]);
    setDraftReply(null);
  }
  async function regenerate() {
    if (onRequireAccount) { onRequireAccount("regenerate"); return; }
    if (!writer || demo.running || !requests.some(item => !item.demo)) return;
    setRegenerating(true); setDraftReply(null);
    const reply = await writer.onAsk(requestsInstruction(requests.filter(item => !item.demo)), resume);
    setRegenerating(false);
    if (!reply) { setDraftReply({ text: "Your resume could not be regenerated just now. Your resume and your list are as they were - try again in a moment.", undo: false }); return; }
    if (reply.changed) { edit(reply.resume); setRequests([]); }
    const claims = reply.added.length ? ` Added from what you said: ${reply.added.join("; ")}. Be ready to talk about it in an interview.` : "";
    setDraftReply({ text: `${reply.message}${claims}`, undo: reply.changed });
  }
  function redo() {
    const next = future.at(-1); if (!next) return;
    setPast(items => [...items, resume]); setFuture(items => items.slice(0, -1)); onChange(next);
  }
  return <section ref={bench} className={s.workbench} aria-label="Resume editing workspace">
    {tool === "draft" && <DemoLayer demo={demo} />}
    <div ref={toolbar} className={s.toolbar}>
      <div className={s.toolTabs} role="group" aria-label="Resume tools">
        {([ ["content", "Edit sections"], ["draft", "Request changes"], ["suggestions", "Suggestions"], ["ats", "ATS guide"] ] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={tool === id} onClick={() => setTool(id)}>{tool === id && <Check size={16} className={s.segmentTick} />}{label}</button>)}
      </div>
      <div className={s.toolbarActions}>
        <button type="button" aria-label="Undo edit" disabled={!past.length || disabled || example} onClick={undo}><Undo size={22} /></button>
        <button type="button" aria-label="Redo edit" disabled={!future.length || disabled || example} onClick={redo}><Redo size={22} /></button>
        <button type="button" aria-pressed={choosing} aria-controls="resume-layouts" onClick={() => setChoosing(true)}><LayoutAdd size={18} />Select template</button>
        {onDownload && <button type="button" className={s.downloadButton} onClick={onDownload}>Download PDF</button>}
      </div>
    </div>
    <div className={s.workspace}>
      <aside ref={controls} className={s.controls} aria-label="Resume controls" onFocus={noteField} onInput={noteField}>
        {tool === "content" && <>
          <nav className={s.sectionTabs} aria-label="Resume sections">{listed.map(([id, label]) => { const state = statuses[id]; return <button type="button" key={id} aria-current={section === id ? "true" : undefined} data-state={state} onClick={() => showSection(id)}>{state === "done" && <Check size={16} className={s.tabMark} />}{state === "needed" && <Alert size={16} className={s.tabDot} />}{label}<span className="sr-only">{state === "needed" ? " (needed before download)" : state === "done" ? " (has content)" : standard.need[id] === "required" ? " (required)" : standard.need[id] === "recommended" ? " (recommended)" : " (optional)"}</span></button>; })}{folded.length > 0 && <button type="button" className={s.moreSections} aria-expanded={moreSections} onClick={() => setMoreSections(open => !open)}>{moreSections ? "Fewer sections" : "+ More sections"}</button>}</nav>
          <ResumeSectionEditor track={track} role={role} section={section} resume={resume} onChange={edit} disabled={disabled || example} />
          <div className={s.sectionNav}><button type="button" disabled={section === "header"} onClick={() => showSection(sections[Math.max(0, sections.findIndex(([id]) => id === section) - 1)][0])}>← Previous</button>{section === sections[sections.length - 1][0]
            ? <button type="button" onClick={() => setTool("draft")}>Request changes →</button>
            : <button type="button" onClick={() => showSection(sections[Math.min(sections.length - 1, sections.findIndex(([id]) => id === section) + 1)][0])}>Next section →</button>}</div>
        </>}
        {tool === "ats" && <ResumeAtsGuide template={template} disabled={disabled} onTemplate={onTemplate} onSection={openSection} />}
        {(tool === "draft" || tool === "suggestions") && !writer && !onRequireAccount && <div className={s.assistant}>{typeof locked === "function" ? locked(tool) : locked}</div>}
        {tool === "draft" && (writer || onRequireAccount) && <DraftRequests requests={requests} onAdd={ask => addRequest(ask)} onRemove={id => setRequests(list => list.filter(item => item.id !== id))}
          onRegenerate={() => void regenerate()} onUndo={() => { undo(); setDraftReply(null); }} canUndo={Boolean(draftReply?.undo)} reply={draftReply?.text ?? ""}
          busy={regenerating} disabled={disabled} onContinue={() => setTool("suggestions")} active={activeRequest} onActive={setActiveRequest} demoAsk={demo.askText} editing={editingDraft} onEdit={() => setDraftEditing(true)} onShowMe={demo.start} showing={demo.running} />}
        {/* Kept in the page once there is a writer, so ticks and ignores survive a move to another tool. */}
        {writer && <div hidden={tool !== "suggestions"}><ResumeSuggestions active={tool === "suggestions"} resume={resume} template={exportTemplate(template)} targetRole={role || undefined} jobDescription={jobDescription} track={track}
          getToken={writer.getToken} onAsk={writer.onAsk} onApply={edit} onUndo={undo} onOpenSection={jumpTo} disabled={disabled || example} {...(onNext ? { onNext } : {})} /></div>}
      </aside>
      <div ref={desk} className={s.desk} data-choosing={choosing} data-picking={picking || undefined}>
        {picking && !choosing && <p className={s.pickHint}>Select any words on the page to ask for a change.</p>}
        {demo.pick && !choosing && <PickBox key="demo" pick={demo.pick} demoText={demo.pickText} onClose={() => {}} onAdd={() => {}} />}
        {picked && !choosing && !demo.running && <PickBox key={`${picked.quote}-${picked.top}`} pick={picked} onClose={clearPick} onAdd={ask => { addRequest(ask, picked.quote, picked.where, { section: picked.section, entry: picked.entry, range: picked.range }); clearPick(); window.getSelection()?.removeAllRanges(); }} />}
        {!choosing && <CommentMarkers marks={marks} active={activeRequest} onActive={setActiveRequest} />}
        {choosing && <div className={s.gallery} id="resume-layouts">
          <div className={s.controlHeader}><span className={s.eyebrow}>CHOOSE A LAYOUT</span><h2>Same story. Your style.</h2></div>
          <div className={s.templates} role="radiogroup" aria-label="Resume layout" onKeyDown={radioNavigation}>{TEMPLATES.map((item, index) => { const current = chosen && item.id === template; return <button type="button" key={item.id} disabled={disabled} role="radio" aria-checked={current} tabIndex={current || (!chosen && index === 0) ? 0 : -1} onClick={() => pick(item.id)}><MiniPreview id={item.id} resume={started ? resume : track === "early_career" ? SAMPLE_RESUME : STUDENT_SAMPLE} roleLine={started ? role : ""} track={track} /><strong>{item.name}{current ? " ✓" : ""}</strong><small>{item.blurb}</small></button>; })}</div>
        </div>}
        {/* Always in the page, hidden while choosing, so printing prints the resume. Re-keyed on each pick so it unrolls again. */}
        <div className={s.sheet} key={rolls} data-rolled={rolls > 0}>
          {example && <div className={s.documentMeta}><span>EXAMPLE DOCUMENT</span><span>{TEMPLATES.find(item => item.id === template)?.name} · A4</span></div>}
          {/* Before the first word, the page says what will appear, not a blank sheet. */}
          {started || example
            ? <><div className={s.paper}><A4Frame><ResumeSheet resume={resume} template={template} roleLine={role} track={track} onPages={setPages} watermark={example ? "Example" : undefined} focus={tool === "content" ? editing : null} /></A4Frame></div>
              <p className={s.pageCount}>{pages} {pages === 1 ? "page" : "pages"} · Check names, dates and claims before sharing.</p></>
            : <div className={s.emptySheet}><span className={s.emptyLines} aria-hidden="true"><i /><i /><i /><i /><i /></span><strong>Your resume appears here as you type</strong><p>Start with your name and email, then fill in each section.</p></div>}
        </div>
      </div>
    </div>
    <div className={s.saveBar} role="status"><span data-failed={saveFailed}>{example ? "Example only · Build your own resume to edit and save." : saveLabel}</span>{saveFailed && <><button type="button" onClick={onRetry}>Retry save</button><CopyButton label="unsaved resume" value={JSON.stringify(resume, null, 2)} /></>}<span>{saveScope === "browser" ? "This draft stays in this browser until you sign in and import it." : "Your name, contact details, education, jobs and skills also update your profile."}</span></div>
  </section>;
}
