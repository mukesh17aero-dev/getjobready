"use client";

import { useCallback, useEffect, useRef, useState, type ClipboardEvent, type DragEvent, type FormEvent, type KeyboardEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { askPreviewAssistant, askSceneAssistant, beginAssessmentRun, finishAssessmentRun, getAssessmentPreview, saveAssessmentDraft, sendSceneAnswer, startAssessmentRun, transcribeSceneAnswer, type AssessmentAnswerDraft, type AssistTurn, type InteractionResponse, type Readout, type RunState, type StudentScene } from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { emptyInteraction, interactionComplete, interactionText } from "./assessment-presentation";
import { AssessmentInteraction } from "./assessment-interaction";
import { AssessmentReadout } from "./assessment-readout";
import { RichText } from "@/components/ui/rich-text";
import { SignUpPrompt, type GatedAction } from "@/components/auth/signup-gate";
import { Mic } from "@/components/ui/icons";
import { AssessmentFocusPrompt } from "./assessment-focus-prompt";
import { AssessmentIntroduction } from "./assessment-introduction";
import { AssessmentQuestion } from "./assessment-question";
import { track, flushFootprints } from "@/lib/footprints";
import { watchAnswer, type IntegrityWatch, type AnswerSignals } from "./integrity-signals";
import {ScreenGuard} from "./screen-guard";
import { protectAssessmentCopy,protectAssessmentInputs } from "./assessment-copy";
import "./assessment-workspace.css";

type Helper = "assistant" | "buddy";

export function AssessmentRun({ roleId, roleTitle, backHref, signedOut = false }: { roleId: string; roleTitle: string; backHref: string; signedOut?: boolean }) {
  const router = useRouter();
  const [run, setRun] = useState<RunState | null>(null);
  const [scene, setScene] = useState<StudentScene | null>(null);
  const [response, setResponse] = useState("");
  const [dirty, setDirty] = useState(false);
  const [interaction, setInteraction] = useState<InteractionResponse | null>(null);
  const [via, setVia] = useState<"typed" | "spoken" | "artefact">("typed");
  const [begun, setBegun] = useState(false);
  const [sending, setSending] = useState(false);
  const [completionPending, setCompletionPending] = useState(false);
  const [readout, setReadout] = useState<Readout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gate, setGate] = useState<GatedAction | null>(null);
  const [saveState, setSaveState] = useState("Autosave on");
  const [dock, setDock] = useState<Helper | null>(null);
  const [asking, setAsking] = useState("");
  const [thinking, setThinking] = useState(false);
  const [chats, setChats] = useState<Record<Helper, AssistTurn[]>>({ assistant: [], buddy: [] });
  const [reached, setReached] = useState<Partial<Record<Helper, number>>>({});
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [writtenAlternative, setWrittenAlternative] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const media = useRef<MediaStream | null>(null);
  const recordingGeneration = useRef(0);
  const audioRef = useRef<string | null>(null);
  const alive = useRef(true);
  const sceneStart = useRef(0);
  const closed = useRef(false);
  const watch = useRef<IntegrityWatch | null>(null);
  const assessmentTask = useRef<HTMLDivElement | null>(null);
  const initialIntegrity = useRef<AnswerSignals | undefined>(undefined);
  const [integrityRevision, setIntegrityRevision] = useState(0);
  const [integrityWarning, setIntegrityWarning] = useState<string | null>(null);
  const [focusNotice, setFocusNotice] = useState<string | null>(null);
  const pendingSave = useRef<Promise<boolean>>(Promise.resolve(true));
  const latestDraft = useRef<AssessmentAnswerDraft | null>(null);
  const currentScene = useRef<string | null>(null);
  const latestRun = useRef<RunState | null>(null);

  const token = useCallback(async () => {
    const { data } = await supabaseBrowser().auth.getSession();
    return data.session?.access_token ?? null;
  }, []);
  const clearRecording = useCallback(() => {
    recordingGeneration.current++;
    if (recorder.current?.state === "recording") recorder.current.stop();
    recorder.current = null;
    media.current?.getTracks().forEach(track => track.stop());
    media.current = null;
    if (audioRef.current) URL.revokeObjectURL(audioRef.current);
    audioRef.current = null;
  }, []);
  useEffect(() => { alive.current = true; return () => { alive.current = false; clearRecording(); }; }, [clearRecording]);

  const showScene = useCallback((next: StudentScene, draft?: AssessmentAnswerDraft | null) => {
    clearRecording();
    setRecording(false); setTranscribing(false); setAudioUrl(null);
    currentScene.current = next.id;
    sceneStart.current = Date.now() - ((draft?.sceneId === next.id ? draft.seconds : 0) ?? 0) * 1000;
    setDirty(false);
    setScene(next);
    const kept = draft?.sceneId === next.id ? draft : null;
    initialIntegrity.current = kept?.integrity;
    setIntegrityWarning(null);
    setFocusNotice(null);
    setResponse(kept?.response ?? "");
    setInteraction(kept?.interactionResponse ?? emptyInteraction(next.interaction));
    setVia(kept?.answeredVia ?? (next.answer === "artefact" ? "artefact" : "typed"));
    setWrittenAlternative(next.answer === "spoken" && kept?.answeredVia === "typed");
    setChats({ assistant: kept?.helpLog?.assistant ?? [], buddy: kept?.helpLog?.buddy ?? [] });
    setReached({ assistant: kept?.askedAssistantAtSeconds, buddy: kept?.askedBuddyAtSeconds });
    setDock(null); setAsking("");
    setSaveState(kept ? "Saved work restored" : "Autosave on");
  }, [clearRecording]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const t = await token();
      if (cancelled) return;
      if (!t) {
        if (!signedOut) { router.push(`/login?next=${encodeURIComponent(`/practice/readiness?role=${roleId}&begin=1`)}`); return; }
        const preview = await getAssessmentPreview(roleId);
        if (cancelled) return;
        if (!preview) { setError("This role does not have a published assessment yet. Return to the role list to choose another."); return; }
        const state: RunState = { runId: "", roleId, company: preview.company, buddy: preview.buddy, scene: preview.scene, answered: 0, estimatedRemaining: 0, startedAt: "", finishedAt: null };
        setRun(state); latestRun.current = state; showScene(preview.scene); return;
      }
      const state = await startAssessmentRun(t, roleId);
      if (cancelled) return;
      if (!state) { setError("We couldn’t open this assessment. Please try again."); return; }
      setRun(state); latestRun.current = state;
      if (state.finishedAt || !state.scene) { const done = await finishAssessmentRun(t, state.runId); if (done) setReadout(done); else setError("We couldn’t load your completed assessment. Refresh to retry."); return; }
      showScene(state.scene, state.draft);
      if (state.begunAt) setBegun(true);
    })();
    return () => { cancelled = true; };
  }, [roleId, signedOut, token, showScene, router]);

  const sceneId = scene?.id;
  useEffect(() => {
    if (!sceneId || !begun || readout) return;
    const observer = watchAnswer({ initial: initialIntegrity.current, onEvent: event => {
      if (!alive.current) return;
      const active = latestRun.current;
      if (active?.runId) {
        track({ family: "scenario", event: "assessment_activity", module: "assessment", target: sceneId, meta: { runId: active.runId, sceneId, ...event } });
        if (event.type === "focus_left" || event.type === "tab_hidden") void flushFootprints();
      }
      if (event.type === "focus_left" || event.type === "tab_hidden") setFocusNotice("You switched away from the assessment tab or window. Please stay in this window while answering.");
      else if (event.type === "focus_returned" || event.type === "tab_visible") setFocusNotice(`The assessment was out of view or lost focus for ${event.seconds ?? 0} seconds. Please acknowledge this activity to continue.`);
      else if (event.type === "copy_blocked" || event.type === "cut_blocked") setIntegrityWarning("Copying assessment questions, context cards or answers is disabled. This attempt was recorded.");
      else if (event.type.endsWith("_blocked")) setIntegrityWarning("Copy, cut, paste and dropping text are disabled in answer boxes. Type your own response. This attempt was recorded.");
      setDirty(true); setIntegrityRevision(value => value + 1);
    } });
    watch.current = observer;
    const releaseCopyProtection = assessmentTask.current ? protectAssessmentCopy(assessmentTask.current, action => observer.block(action)) : () => {};
    const releaseInputProtection=assessmentTask.current?protectAssessmentInputs(assessmentTask.current,action=>{if(action==='paste'||action==='drop')observer.block(action);else setIntegrityWarning(action==='print'?'Printing assessment content is disabled.':'Please do not capture or share assessment questions.');}):()=>{};
    const interval = setInterval(() => { setDirty(true); setIntegrityRevision(value => value + 1); }, 5000);
    return () => { releaseInputProtection();releaseCopyProtection(); clearInterval(interval); observer.stop(); if (watch.current === observer) watch.current = null; };
  }, [sceneId, begun, readout]);

  const queueSave = useCallback((draft: AssessmentAnswerDraft) => {
    const state = latestRun.current;
    if (!state?.runId || closed.current) return Promise.resolve(true);
    const job = pendingSave.current.catch(() => false).then(async () => {
      if (currentScene.current !== draft.sceneId || closed.current) return false;
      const t = await token();
      if (!t) { if (alive.current) setSaveState("Sign in again to save. Your text remains on this screen."); return false; }
      const result = await saveAssessmentDraft(t, state.runId, draft);
      if (alive.current && currentScene.current === draft.sceneId) setSaveState(result?.saved ? "Saved" : "Not saved yet. Check your connection; keep this page open.");
      return result?.saved === true;
    });
    pendingSave.current = job;
    return job;
  }, [token]);

  useEffect(() => {
    if (!scene || !begun || readout || sending || completionPending || !run?.runId || !dirty) return;
    const draft: AssessmentAnswerDraft = { sceneId: scene.id, response: scene.interaction ? interactionText(scene.interaction, interaction) : response, answeredVia: via, interactionResponse: interaction ?? undefined, seconds: Math.max(0, Math.round((Date.now() - sceneStart.current) / 1000)), askedAssistantAtSeconds: reached.assistant, askedBuddyAtSeconds: reached.buddy, helpLog: chats, integrity: watch.current?.read(scene.interaction ? interactionText(scene.interaction, interaction).length : response.length) };
    latestDraft.current = draft;
    const id = setTimeout(() => { void queueSave(draft); }, 400);
    return () => clearTimeout(id);
  }, [scene, begun, response, interaction, via, reached, chats, run, readout, sending, completionPending, queueSave, dirty, integrityRevision]);

  const finish = useCallback(async (expired = false) => {
    const state = latestRun.current;
    if (!state?.runId) return;
    setSending(true); setError(null);
    if (expired) { closed.current = true; clearRecording(); setRecording(false); setTranscribing(false); }
    else if (latestDraft.current && !(await queueSave({ ...latestDraft.current, integrity: watch.current?.read(latestDraft.current.response.length) ?? latestDraft.current.integrity }))) { setError("Your latest work has not saved. Please check your connection and retry finishing."); setSending(false); return; }
    await pendingSave.current;
    const t = await token();
    const done = t ? await finishAssessmentRun(t, state.runId) : null;
    if (!alive.current) return;
    if (done) { setReadout(done); clearRecording(); }
    else setError(expired ? "We couldn’t finish saving your assessment. Retry below to open your report." : "We couldn’t finish your assessment. Your work is still here; please retry.");
    setSending(false);
  }, [clearRecording, queueSave, token]);


  async function begin() {
    if (!run || sending) return;
    if (!run.runId) { setBegun(true); return; }
    setSending(true); setError(null);
    const t = await token();
    const result = t ? await beginAssessmentRun(t, run.runId) : null;
    if (!result?.begunAt) { setError("We couldn’t start the assessment. Please try again; your work is still here."); setSending(false); return; }
    const next = { ...run, ...result }; setRun(next); latestRun.current = next;
    sceneStart.current = Date.now();
    setBegun(true); setSending(false);
  }

  async function submit() {
    if (!scene || !run || sending || thinking || transcribing || recording || closed.current) return;
    if (scene.interaction ? !interactionComplete(scene.interaction, interaction) : !response.trim()) return;
    if (!run.runId) { setGate({ what: "your assessment response", why: "Create an account to start your 10-question assessment and keep your work." }); return; }
    setSending(true); setError(null);
    await pendingSave.current;
    const t = await token();
    if (!t) { setError("Your session expired. Sign in again to continue."); setSending(false); return; }
    const draft: AssessmentAnswerDraft = { sceneId: scene.id, response: scene.interaction ? interactionText(scene.interaction, interaction) : response, answeredVia: via, interactionResponse: interaction ?? undefined, seconds: Math.max(0, Math.round((Date.now() - sceneStart.current) / 1000)), askedAssistantAtSeconds: reached.assistant, askedBuddyAtSeconds: reached.buddy, helpLog: chats, integrity: watch.current?.read(scene.interaction ? interactionText(scene.interaction, interaction).length : response.length) };
    if (watch.current) track({ family: "scenario", event: "answer_signals", module: "assessment", target: scene.id, meta: { runId: run.runId, sceneId: scene.id, ...watch.current.read(draft.response.length), via } });
    const accepted = await sendSceneAnswer(t, run.runId, draft);
    if (!accepted) { setError("Your response was not confirmed. It is still here—please retry."); setSending(false); return; }
    if (accepted.expired || !accepted.scene) { latestDraft.current = null; setCompletionPending(true); await finish(Boolean(accepted.expired)); return; }
    const next = { ...run, scene: accepted.scene, answered: accepted.answered }; setRun(next); latestRun.current = next;
    latestDraft.current = null; showScene(accepted.scene); setSending(false);
  }

  async function ask() {
    if (dock !== "assistant" || !run || !scene || run.answered >= 2 || !["assistant", "both"].includes(scene.support) || !asking.trim() || sending || thinking || closed.current) return;
    if (chats[dock].filter(turn => turn.who === "them").length >= 3) return;
    // The preview lets a visitor try the assistant on this one situation;
    // nothing is kept, and the server holds it to the same three questions.
    const t = run.runId ? await token() : null;
    if (run.runId && !t) { setError("Sign in again to ask for support."); return; }
    const askedScene = scene.id;
    const who = dock, question = asking.trim(), history = chats[who]; setThinking(true); setAsking("");
    setReached(old => ({ ...old, [who]: old[who] ?? Math.round((Date.now() - sceneStart.current) / 1000) }));
    const result = run.runId && t
      ? await askSceneAssistant(t, run.runId, { sceneId: scene.id, question, conversation: history, who })
      : await askPreviewAssistant(run.roleId, { sceneId: scene.id, question, conversation: history });
    if (!alive.current || currentScene.current !== askedScene || closed.current) { setThinking(false); return; }
    setDirty(true);
    setChats(old => ({ ...old, [who]: [...history, { who: "them", text: question }, { who: "assistant", text: result.ok ? result.reply : result.reason }] })); setThinking(false);
  }

  async function record() {
    if (recording) { recorder.current?.stop(); return; }
    if (closed.current || sending) return;
    if (!run?.runId) { setGate({ what: "your spoken response", why: "Sign in to record and transcribe an answer for your assessment." }); return; }
    const generation = ++recordingGeneration.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (generation !== recordingGeneration.current || !alive.current || closed.current) { stream.getTracks().forEach(track => track.stop()); return; }
      media.current = stream;
      const rec = new MediaRecorder(stream); recorder.current = rec;
      const chunks: Blob[] = [];
      rec.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach(track => track.stop()); media.current = null;
        if (generation !== recordingGeneration.current || !alive.current) return;
        setRecording(false); setTranscribing(true);
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        if (audioRef.current) URL.revokeObjectURL(audioRef.current);
        const url = URL.createObjectURL(blob); audioRef.current = url; setAudioUrl(url);
        const t = await token();
        const result = t ? await transcribeSceneAnswer(t, run.runId, blob) : null;
        if (generation !== recordingGeneration.current || !alive.current || closed.current) return;
        setTranscribing(false);
        if (result && "text" in result) { setDirty(true); setResponse(result.text); setVia("spoken"); setWrittenAlternative(false); }
        else setError(result && "error" in result ? result.error : "We couldn’t transcribe that recording. Replay it and try recording again.");
      };
      rec.onerror = () => { clearRecording(); setRecording(false); setTranscribing(false); setError("The microphone stopped. Please try recording again."); };
      rec.start(); setRecording(true); setError(null);
    } catch { clearRecording(); setRecording(false); setTranscribing(false); setError("Microphone access is unavailable. Check your browser permission or use the written response option."); }
  }

  const isAnswerField = (target: EventTarget) => target instanceof HTMLElement && Boolean(target.closest(".assessment-response textarea, .assessment-response input"));
  function blockClipboard(event: ClipboardEvent<HTMLElement>, action: "copy" | "cut" | "paste") {
    if (!isAnswerField(event.target)) return;
    event.preventDefault(); watch.current?.block(action);
  }
  function blockDrop(event: DragEvent<HTMLElement>) {
    if (!isAnswerField(event.target)) return;
    event.preventDefault(); watch.current?.block("drop");
  }
  function blockInsertion(event: FormEvent<HTMLElement>) {
    const input = event.nativeEvent as InputEvent;
    if (!isAnswerField(event.target) || !["insertFromPaste", "insertFromDrop", "insertFromYank"].includes(input.inputType)) return;
    event.preventDefault(); watch.current?.block(input.inputType === "insertFromDrop" ? "drop" : "paste");
  }
  function recordKey(event: KeyboardEvent<HTMLElement>) {
    if (isAnswerField(event.target) && !event.metaKey && !event.ctrlKey && !event.altKey) watch.current?.key(event.key);
  }

  const errorPanel = error && <div className="assessment-error" role="alert"><p>{error}</p>{completionPending ? <button disabled={sending} onClick={() => void finish()}>Retry finishing</button> : (!run || !scene) && <button onClick={() => window.location.reload()}>Try again</button>}</div>;
  if (readout) return <AssessmentReadout readout={readout} roleTitle={roleTitle} backHref={backHref} fresh />;
  if (!run || !scene) return <div className="assessment-workspace">{errorPanel || <p role="status">Getting your workplace ready…</p>}</div>;
  const disabled = sending || completionPending;
  const questionLimit = run.questionLimit ?? 10;
  const complete = scene.interaction ? interactionComplete(scene.interaction, interaction) : Boolean(response.trim());
  const offered: Helper[] = run.answered < 2 && ["assistant", "both"].includes(scene.support) ? ["assistant"] : [];
  const textChange = (text: string) => { setDirty(true); setResponse(text); setVia(scene.answer === "artefact" ? "artefact" : "typed"); };

  return <ScreenGuard identity={`Ascend assessment · ${run.runId.slice(0,8)||'preview'}`}><section className="assessment-workspace">
    {begun && focusNotice && <AssessmentFocusPrompt message={focusNotice} onAcknowledge={() => {
      if (run.runId) { track({ family: "scenario", event: "assessment_focus_acknowledged", module: "assessment", target: scene.id, meta: { runId: run.runId, sceneId: scene.id, at: new Date().toISOString() } }); void flushFootprints(); }
      setFocusNotice(null);
    }} />}
    {gate && <SignUpPrompt action={gate} onClose={() => setGate(null)} />}
    {!begun ? <AssessmentIntroduction roleId={roleId} roleTitle={roleTitle} company={run.company} fullAssessment={Boolean(run.runId)} busy={sending} error={errorPanel} onStart={() => void begin()} /> : <>
      <header className="assessment-top"><div><p className="assessment-eyebrow">{run.company} · SIMULATED WORKPLACE</p><h1>{roleTitle}</h1></div><div className="assessment-time"><span>{run.runId ? `Question ${Math.min(run.answered + 1, questionLimit)} of ${questionLimit}` : "First question"}</span><small>{run.runId ? "No time limit" : "Free preview"}</small></div></header>
      {errorPanel}
      {integrityWarning && <div className="assessment-notice" role="alert"><p>{integrityWarning}</p><button type="button" onClick={() => setIntegrityWarning(null)}>I understand</button></div>}
      <div className="assessment-layout"><aside className="assessment-context"><h2>{run.answered === 0 ? "Your shift starts here." : `${run.answered} ${run.answered === 1 ? "moment" : "moments"} completed.`}</h2><div className="assessment-progress" role="progressbar" aria-label="Questions completed" aria-valuemin={0} aria-valuemax={questionLimit} aria-valuenow={run.answered}><span style={{ width: `${Math.min(100, run.answered / questionLimit * 100)}%` }} /></div><details><summary>How this works</summary><p>Respond as you would at work. Complete all {questionLimit} questions at your own pace. Your responses autosave, so you can resume unfinished work.</p></details>{offered.length > 0 && <details><summary>AI assistance · question {run.answered + 1} of 2</summary><p>The AI assistant can help you think through this question. You decide what to use and write the answer yourself. Up to three requests; your conversation stays with your response.</p><div className="assessment-support"><button disabled={disabled} aria-expanded={dock === "assistant"} onClick={() => setDock(dock === "assistant" ? null : "assistant")}>Ask AI assistant ↗</button></div></details>}</aside>
      <div ref={assessmentTask} className="assessment-task" onContextMenuCapture={event => { if (!isAnswerField(event.target)) event.preventDefault(); }} onPasteCapture={event => blockClipboard(event, "paste")} onDropCapture={blockDrop} onBeforeInputCapture={blockInsertion} onKeyDownCapture={recordKey}><p className="assessment-eyebrow">Question {run.answered + 1} · {offered.length ? "AI assistance available" : "Your independent response"}</p><h2>{scene.title}</h2>{scene.image && <div className="assessment-image"><Image src={scene.image} alt="Workplace situation" fill sizes="(max-width: 700px) 100vw, 600px" className="object-contain" /></div>}<AssessmentQuestion brief={scene.brief} responseText={[scene.title, ...scene.fields, scene.interaction ? JSON.stringify(scene.interaction) : ""].join(" ")} />
      {scene.interaction ? <AssessmentInteraction interaction={scene.interaction} value={interaction} onChange={next => { setDirty(true); setInteraction(next); }} disabled={disabled} /> : <fieldset className="assessment-response" disabled={disabled}><legend>{scene.answer === "spoken" ? "Leave your spoken update" : "Your response"}</legend>{scene.answer === "spoken" && <div className="assessment-recorder"><p>Speak as you would to the person in this situation.</p><button type="button" disabled={transcribing} onClick={() => void record()} className="assessment-record">{recording ? <><span className="assessment-record-dot" aria-hidden="true" /> Stop recording</> : transcribing ? "Transcribing your update…" : <><Mic size={16} aria-hidden="true" /> Record my update</>}</button><small>Press Record to enable your microphone. Stop to transcribe.</small>{audioUrl && <audio src={audioUrl} controls />}<button type="button" disabled={recording || transcribing} className="assessment-text-link" onClick={() => { setWrittenAlternative(true); setVia("typed"); }}>Use a written response</button></div>}
      {(scene.answer !== "spoken" || writtenAlternative || response) && <><label htmlFor="assessment-answer">{scene.answer === "spoken" && !writtenAlternative ? "Transcript of your recording" : "What would you do or say?"}</label><textarea id="assessment-answer" value={response} rows={4} maxLength={12000} readOnly={via === "spoken" && !writtenAlternative} onChange={e => textChange(e.target.value)} placeholder="A short, clear response is enough…" />{scene.answer === "spoken" && <small>{via === "spoken" ? "Spoken response" : "Written response · not assessed as speaking"}</small>}</>}
      {scene.fields.length > 0 && <details><summary>What to include</summary><ul>{scene.fields.map(field => <li key={field}>{field}</li>)}</ul></details>}</fieldset>}
      <div className="assessment-submit"><button className="assessment-primary" disabled={disabled || !complete || recording || transcribing || thinking} onClick={() => void submit()}>{sending ? "Saving…" : run.runId && run.answered + 1 >= questionLimit ? "Submit & see my report →" : "Save & continue →"}</button><span role="status">{run.runId ? saveState : "Sign in to keep your response."}</span></div>
      </div></div>
      {dock && offered.includes(dock) && <section className="assessment-chat" aria-label="Workplace support"><header><h2>{dock === "buddy" ? run.buddy : "AI assistant"}</h2><button aria-label="Close support" onClick={() => setDock(null)}>×</button></header><ol aria-live="polite">{chats[dock].map((turn, i) => <li key={i}><strong>{turn.who === "them" ? "You" : dock === "buddy" ? run.buddy : "Assistant"}</strong><RichText text={turn.text} /></li>)}</ol><p>{Math.max(0, 3 - chats[dock].filter(turn => turn.who === "them").length)} questions remaining for this task.</p><form onSubmit={event => { event.preventDefault(); void ask(); }}><label htmlFor="assessment-help">Your question</label><input id="assessment-help" value={asking} maxLength={2000} disabled={disabled || thinking} onChange={e => setAsking(e.target.value)} /><button disabled={disabled || thinking || !asking.trim() || chats[dock].filter(turn => turn.who === "them").length >= 3}>{thinking ? "Thinking…" : "Ask"}</button></form></section>}
    </>}
  </section></ScreenGuard>;
}
