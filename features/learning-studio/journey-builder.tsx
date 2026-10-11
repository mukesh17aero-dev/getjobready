"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  assistLearningStructure, getLearningJourney, publishLearningJourney, saveLearningJourney,
  type LearningLesson, type LearningStep, type LearningStepType, type LearningStructureProposal, type StudioJourney, type StudioJourneyData,
} from "@/lib/api";
import { StepPage } from "./step-page";
import { StepPreview } from "./step-preview";
import { STEP_KINDS, blankStep, kindOf, moveItem } from "./step-kinds";
import { lessonsOf, withLessonOrder } from "./lesson-structure";
import { useAdminToken } from "./use-admin-token";
import s from "./learning-studio.module.css";

export function JourneyBuilder({ id, onClose }: { id: string; onClose: () => void }) {
  const token = useAdminToken();
  const [journey, setJourney] = useState<StudioJourney | null>(null);
  const [data, setData] = useState<StudioJourneyData | null>(null);
  const [title, setTitle] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [menuAt, setMenuAt] = useState<number | null>(null);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<"" | "saving" | "publishing">("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiScope, setAiScope] = useState<"lesson" | "subsection">("lesson");
  const [aiBrief, setAiBrief] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  const [proposal, setProposal] = useState<LearningStructureProposal | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const canvas = useRef<HTMLElement>(null);

  const apply = useCallback((j: StudioJourney) => {
    setJourney(j);
    setData(j.data);
    setTitle(j.title);
    setRoleTitle(j.roleTitle);
    setDirty(false);
  }, []);

  useEffect(() => {
    let live = true;
    void (async () => {
      const t = await token();
      if (!t) return setError("Sign in again to use the Learning Studio.");
      const res = await getLearningJourney(t, id);
      if (!live) return;
      if (res.ok) { apply(res.data); heading.current?.focus(); } else setError(res.reason);
    })();
    return () => { live = false; };
  }, [id, token, apply]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  if (error && !journey) return <section className={s.root}><p className={s.error} role="alert">{error}</p><button type="button" className={s.secondary} onClick={onClose}>Back to journeys</button></section>;
  if (!journey || !data) return <section className={s.root}><p className={s.note}>Opening the journey…</p></section>;

  const lessons = lessonsOf(data);
  const lesson = lessons.find((item) => item.id === lessonId) ?? lessons[0];
  const section = lesson?.sections.find((item) => item.id === sectionId) ?? lesson?.sections[0];
  const blocks = section?.stepIds.map((blockId) => data.steps.find((item) => item.id === blockId)).filter((item): item is LearningStep => Boolean(item)) ?? [];
  const activeBlock = blocks.find((item) => item.id === selectedBlock) ?? blocks[0];
  const edit = (next: StudioJourneyData) => { setData(next); setDirty(true); setStatus(""); setError(""); };
  const setLessons = (next: LearningLesson[], steps = data!.steps) => edit(withLessonOrder({ ...data!, steps }, next));
  const updateLesson = (next: LearningLesson) => setLessons(lessons.map((item) => item.id === next.id ? next : item));
  const updateSection = (next: LearningLesson["sections"][number]) => {
    if (lesson) updateLesson({ ...lesson, sections: lesson.sections.map((item) => item.id === next.id ? next : item) });
  };
  const focusCanvas = () => window.requestAnimationFrame(() => canvas.current?.scrollIntoView({ block: "start", behavior: "smooth" }));

  function addLesson() {
    if (lessons.length >= 30) return;
    const next: LearningLesson = { id: crypto.randomUUID(), title: "Untitled lesson", sections: [{ id: crypto.randomUUID(), title: "First subsection", stepIds: [] }] };
    setLessons([...lessons, next]);
    setLessonId(next.id); setSectionId(next.sections[0]!.id); setSelectedBlock(null); setMenuAt(null); setMode("edit"); focusCanvas();
  }
  function addSection() {
    if (!lesson || lesson.sections.length >= 30) return;
    const next = { id: crypto.randomUUID(), title: "Untitled subsection", stepIds: [] as string[] };
    updateLesson({ ...lesson, sections: [...lesson.sections, next] });
    setSectionId(next.id); setSelectedBlock(null); setMenuAt(null); setMode("edit"); focusCanvas();
  }
  function addBlock(type: LearningStepType, at: number) {
    if (!section || data!.steps.length >= 60) return;
    const made = blankStep(type);
    setLessons(lessons.map((item) => ({ ...item, sections: item.sections.map((part) => part.id === section.id
      ? { ...part, stepIds: [...part.stepIds.slice(0, at), made.id, ...part.stepIds.slice(at)] } : part) })), [...data!.steps, made]);
    setSelectedBlock(made.id); setMenuAt(null); setMode("edit"); setStatus(`${kindOf(type).label} block added.`); focusCanvas();
  }
  function updateBlock(next: LearningStep) { edit({ ...data!, steps: data!.steps.map((item) => item.id === next.id ? next : item), lessons }); }
  function removeBlock(blockId: string) {
    if (!section) return;
    const remaining = section.stepIds.filter((item) => item !== blockId);
    setLessons(lessons.map((item) => ({ ...item, sections: item.sections.map((part) => part.id === section.id ? { ...part, stepIds: remaining } : part) })), data!.steps.filter((item) => item.id !== blockId));
    setSelectedBlock(remaining[0] ?? null);
  }
  function duplicateBlock(block: LearningStep) {
    if (!section || data!.steps.length >= 60) return;
    const made = { ...block, id: crypto.randomUUID(), title: `${block.title} (copy)` };
    const at = section.stepIds.indexOf(block.id) + 1;
    setLessons(lessons.map((item) => ({ ...item, sections: item.sections.map((part) => part.id === section.id
      ? { ...part, stepIds: [...part.stepIds.slice(0, at), made.id, ...part.stepIds.slice(at)] } : part) })), [...data!.steps, made]);
    setSelectedBlock(made.id);
  }

  async function createWithAi() {
    setAiBusy(true); setAiError(""); setProposal(null);
    const t = await token();
    const res = t ? await assistLearningStructure(t, id, { scope: aiScope, lessonTitle: lesson?.title, sectionTitle: section?.title, request: aiBrief.trim() }) : null;
    setAiBusy(false);
    if (!res) return setAiError("Sign in again to use AI help.");
    if (!res.ok) return setAiError(res.reason);
    setProposal(res.data.proposal);
  }

  function acceptProposal() {
    if (!proposal) return;
    const proposedSections = proposal.sections.map((part) => {
      const steps = part.blocks.map((block) => ({ ...blankStep(block.type),
        title: block.title ?? "", body: block.body ?? "", cards: block.cards ?? [], questions: block.questions ?? [],
        ai: { kind: "tailor" as const, promptVersion: "learning-studio-structure-v1", model: "claude-sonnet-5", source: "admin brief", status: "accepted" as const },
      }));
      return { section: { id: crypto.randomUUID(), title: part.title, stepIds: steps.map((step) => step.id) }, steps };
    });
    const added = proposedSections.flatMap((part) => part.steps);
    if (data!.steps.length + added.length > 60) return setAiError("This proposal would exceed the journey limit of 60 blocks.");
    if (aiScope === "lesson") {
      if (lessons.length >= 30) return setAiError("This journey already has 30 lessons.");
      const next = { id: crypto.randomUUID(), title: proposal.title, sections: proposedSections.map((part) => part.section) };
      setLessons([...lessons, next], [...data!.steps, ...added]);
      setLessonId(next.id); setSectionId(next.sections[0]?.id ?? null);
    } else {
      if (!lesson || !section) return setAiError("Choose a subsection first.");
      const part = proposedSections[0];
      if (!part) return setAiError("The proposal has no blocks.");
      setLessons(lessons.map((item) => ({ ...item, sections: item.sections.map((current) => current.id === section.id
        ? { ...current, stepIds: [...current.stepIds, ...part.section.stepIds] } : current) })), [...data!.steps, ...added]);
    }
    setSelectedBlock(added[0]?.id ?? null); setProposal(null); setAiOpen(false); setAiBrief(""); setMode("edit"); focusCanvas();
  }

  async function save(): Promise<StudioJourney | null> {
    setBusy("saving"); setError("");
    const t = await token();
    const next = withLessonOrder(data!, lessons);
    const res = t ? await saveLearningJourney(t, id, { revision: journey!.revision, title, roleTitle, data: next }) : null;
    setBusy("");
    if (!res) { setError("Sign in again to use the Learning Studio."); return null; }
    if (!res.ok) { setError(res.reason); return null; }
    apply(res.data); setStatus("Saved."); return res.data;
  }
  async function publish() {
    const saved = dirty ? await save() : journey;
    if (!saved) return;
    if (saved.issues.length) { setError(`Fix these before publishing:\n${saved.issues.map((issue) => `• ${issue}`).join("\n")}`); return; }
    setBusy("publishing");
    const t = await token();
    const res = t ? await publishLearningJourney(t, id, saved.revision) : null;
    setBusy("");
    if (!res) return setError("Sign in again to use the Learning Studio.");
    if (!res.ok) return setError(res.reason);
    apply(res.data); setStatus(`Published version ${res.data.version}.`);
  }

  return <section className={s.root} aria-labelledby="builder-title">
    <div className={s.bar}>
      <div className={s.row}>
        <button type="button" className={s.quiet} onClick={() => { if (!dirty || confirm("Leave without saving? Your unsaved changes will be lost.")) onClose(); }}>← Journeys</button>
        <h2 id="builder-title" ref={heading} tabIndex={-1}>{title || "Untitled journey"}</h2>
        <span className={s.status} data-status={journey.status}>{journey.status === "published" ? `Published v${journey.version}` : "Draft"}</span>
      </div>
      <div className={s.row}>
        <div className={s.modes} role="group" aria-label="View">
          <button type="button" aria-pressed={mode === "edit"} onClick={() => setMode("edit")}>Edit</button>
          <button type="button" aria-pressed={mode === "preview"} disabled={!blocks.length} onClick={() => setMode("preview")}>Preview as learner</button>
        </div>
        <span className={s.saveState} role="status">{busy === "saving" ? "Saving…" : busy === "publishing" ? "Publishing…" : dirty ? "Unsaved changes" : status || "All changes saved"}</span>
        <button type="button" className={s.secondary} disabled={Boolean(busy) || !dirty} onClick={() => void save()}>Save draft</button>
        <button type="button" className={s.primary} disabled={Boolean(busy) || !data.steps.length} onClick={() => void publish()}>Publish journey</button>
      </div>
    </div>
    {error && <p className={s.error} role="alert">{error}</p>}
    {!error && journey.issues.length > 0 && !dirty && <details className={s.notice}><summary>What this journey still needs before publishing</summary><ul className={s.issues}>{journey.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul></details>}
    <div className={s.builderIntro}><div><p className={s.builderKicker}>Build a learning journey</p><h2>Lessons first. Build each one from blocks.</h2><p>Name lessons in the side nav, add subsections inside them, then arrange the content of each subsection on the page.</p></div><button type="button" className={s.secondary} aria-expanded={aiOpen} onClick={() => { setAiOpen(!aiOpen); setMode("edit"); window.requestAnimationFrame(() => document.getElementById("learning-ai-help")?.scrollIntoView({ behavior: "smooth", block: "center" })); }}>✦ Create with AI</button></div>
    <details className={s.adminStrip}><summary><strong>Journey details</strong> · role, level and goals</summary>
      <div className={s.fields} style={{ marginTop: 10 }}>
        <label>For which role<input maxLength={160} value={roleTitle} onChange={(event) => { setRoleTitle(event.target.value); setDirty(true); }} placeholder="e.g. Retail Sales Associate" /></label>
        <label>Who is learning<select value={data.level} onChange={(event) => edit({ ...data, level: event.target.value as StudioJourneyData["level"] })}><option value="student">Students and first-job learners</option><option value="early_career">Up to three years at work</option><option value="experienced">Experienced workers</option></select></label>
      </div>
      <label style={{ marginTop: 10 }}>What learners will be able to do · one per line<textarea rows={3} value={data.objectives.join("\n")} onChange={(event) => edit({ ...data, objectives: event.target.value.split("\n").slice(0, 12) })} placeholder={"Calm an upset customer\nDecide when to escalate"} /></label>
    </details>
    <header className={s.hero}><p className={s.eyebrow}>Learn and practise</p><input className={s.heroTitle} aria-label="Journey title" maxLength={160} value={title} onChange={(event) => { setTitle(event.target.value); setDirty(true); }} placeholder="Name this journey" /><textarea className={s.heroText} aria-label="Journey description" rows={2} value={data.description} onChange={(event) => edit({ ...data, description: event.target.value })} placeholder="One or two sentences on what learners will practise." /></header>
    <div className={s.layout}>
      <nav className={s.map} aria-label="Lessons and subsections"><h2>Lessons</h2><p className={s.mapHelp}>Add and title a lesson here. Open it to add subsections.</p>
        {lessons.map((item, index) => <div key={item.id} className={s.lessonGroup} data-active={lesson?.id === item.id}>
          <button type="button" className={s.lessonSelect} aria-expanded={lesson?.id === item.id} onClick={() => { setLessonId(item.id); setSectionId(item.sections[0]?.id ?? null); setSelectedBlock(null); setMenuAt(null); }}><span className={s.stepNumber}>{index + 1}</span><span>{item.title || "Untitled lesson"}</span></button>
          {lesson?.id === item.id && <div className={s.lessonContents}>
            {mode === "edit" && <label>Lesson title<input maxLength={120} value={item.title} onChange={(event) => updateLesson({ ...item, title: event.target.value })} /></label>}
            {item.sections.map((part, partIndex) => <button key={part.id} type="button" className={s.sectionSelect} aria-current={section?.id === part.id ? "step" : undefined} onClick={() => { setSectionId(part.id); setSelectedBlock(null); setMenuAt(null); }}>{partIndex + 1}. {part.title || "Untitled subsection"}<small>{part.stepIds.length} {part.stepIds.length === 1 ? "block" : "blocks"}</small></button>)}
            {mode === "edit" && <button type="button" className={s.addSubsection} disabled={item.sections.length >= 30} onClick={addSection}>＋ Add subsection</button>}
          </div>}
        </div>)}
        {mode === "edit" && <button type="button" className={s.addLesson} disabled={lessons.length >= 30} onClick={addLesson}>＋ Add lesson</button>}
      </nav>
      <section className={s.lessonCanvas} aria-label="Selected subsection" ref={canvas}>
        {section && lesson ? <><div className={s.canvasHeading}><div><p className={s.builderKicker}>Lesson {lessons.indexOf(lesson) + 1} · Subsection {lesson.sections.indexOf(section) + 1}</p>{mode === "edit" ? <label>Subsection title<input className={s.sectionTitle} maxLength={120} value={section.title} onChange={(event) => updateSection({ ...section, title: event.target.value })} /></label> : <h2>{section.title}</h2>}<p>{lesson.title}</p></div>{mode === "edit" && <span className={s.badge}>Editing this subsection</span>}</div>
          {blocks.map((block, index) => <div key={block.id} className={s.blockWrap}>
            {mode === "edit" && <InsertBlock at={index} open={menuAt === index} onToggle={() => setMenuAt(menuAt === index ? null : index)} onAdd={addBlock} />}
            {mode === "preview" ? <StepPreview journey={journey} step={block} /> : activeBlock?.id === block.id ? <div className={s.activeBlock}><div className={s.blockTop}><span>{kindOf(block.type).label} block {index + 1}</span><div><button type="button" aria-label={`Move block ${index + 1} up`} disabled={index === 0} onClick={() => updateSection({ ...section, stepIds: moveItem(section.stepIds, index, index - 1) })}>↑</button><button type="button" aria-label={`Move block ${index + 1} down`} disabled={index === blocks.length - 1} onClick={() => updateSection({ ...section, stepIds: moveItem(section.stepIds, index, index + 2) })}>↓</button></div></div><StepPage journeyId={id} journey={journey} level={data.level} step={block} onChange={updateBlock} onDuplicate={() => duplicateBlock(block)} onRemove={() => removeBlock(block.id)} onSaved={apply} /></div> : <button type="button" className={s.blockSummary} onClick={() => { setSelectedBlock(block.id); setMenuAt(null); }}><span className={s.glyph}>{kindOf(block.type).glyph}</span><span><strong>{block.title || `Untitled ${kindOf(block.type).label.toLowerCase()}`}</strong><small>{kindOf(block.type).label} · {block.required ? "Required" : "Optional"}</small></span><span>Edit →</span></button>}
          </div>)}
          {mode === "edit" && <InsertBlock at={blocks.length} open={menuAt === blocks.length} onToggle={() => setMenuAt(menuAt === blocks.length ? null : blocks.length)} onAdd={addBlock} />}
          {mode === "edit" && aiOpen && <section id="learning-ai-help" className={s.structureAi} aria-label="Create with AI"><div><p className={s.builderKicker}>Optional authoring assistant</p><h3>✦ Create with AI</h3><p>Draft a complete lesson or blocks for the subsection you selected. Review everything before adding it.</p></div><label>What should AI help create?<select value={aiScope} onChange={(event) => { setAiScope(event.target.value as "lesson" | "subsection"); setProposal(null); }}><option value="lesson">A complete lesson</option><option value="subsection" disabled={!section}>Blocks for the selected subsection</option></select></label><p className={s.aiTarget}>Destination: {aiScope === "lesson" ? "a new lesson in this journey" : `${lesson.title} → ${section.title}`}</p><label>Give it direction<textarea rows={4} maxLength={2000} value={aiBrief} onChange={(event) => setAiBrief(event.target.value)} placeholder="Describe the skill, real workplace situation, source facts and the decision learners should practise." /></label><button type="button" className={s.primary} disabled={aiBusy || aiBrief.trim().length < 12} onClick={() => void createWithAi()}>{aiBusy ? "Creating a proposal…" : "Preview a proposal →"}</button>{aiError && <p role="alert" className={s.error}>{aiError}</p>}{proposal && <div className={s.aiProposal}><p className={s.builderKicker}>Proposal · not yet in your journey</p><h4>{proposal.title}</h4>{proposal.sections.map((part, partIndex) => <div key={`${part.title}-${partIndex}`}><strong>{partIndex + 1}. {part.title}</strong><ul>{part.blocks.map((block, blockIndex) => <li key={`${block.title}-${blockIndex}`}><strong>{block.title}</strong> · {kindOf(block.type).label}{block.body && <p>{block.body}</p>}{block.cards?.map((card) => <p key={card.id}>{card.front} — {card.back}</p>)}{block.questions?.map((question) => <p key={question.id}>{question.prompt} · {question.options.map((option) => option.text).join(" / ")}</p>)}</li>)}</ul></div>)}<div className={s.row}><button type="button" className={s.primary} onClick={acceptProposal}>Add this proposal</button><button type="button" className={s.secondary} onClick={() => setProposal(null)}>Discard</button></div></div>}</section>}
        </> : <div className={s.emptyCanvas}><h2>Start with a lesson</h2><p>Add a lesson in the side nav. Each lesson can hold subsections, and each subsection can hold any mix of content blocks.</p><button type="button" className={s.primary} onClick={addLesson}>＋ Add first lesson</button></div>}
      </section>
    </div>
  </section>;
}

function InsertBlock({ at, open, onToggle, onAdd }: { at: number; open: boolean; onToggle: () => void; onAdd: (type: LearningStepType, at: number) => void }) {
  return <div className={s.insertZone}><button type="button" className={s.insertTrigger} aria-expanded={open} onClick={onToggle}>＋ Add a block</button>{open && <div className={s.blockMenu} role="group" aria-label="Choose a block type"><p>What would help learners here?</p><div>{STEP_KINDS.map((kind) => <button key={kind.type} type="button" onClick={() => onAdd(kind.type, at)}><span className={s.glyph}>{kind.glyph}</span><span><strong>{kind.type === "text" ? "Text" : kind.label}</strong><small>{kind.hint}</small></span></button>)}</div></div>}</div>;
}
