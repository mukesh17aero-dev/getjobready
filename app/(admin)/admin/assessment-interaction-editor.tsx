"use client";

import { useState } from "react";
import type { ArcScene, InteractionResponse, SceneInteraction } from "@/lib/api";
import { AssessmentQuestion } from "@/components/assessment-question";
import { AssessmentInteraction } from "@/components/assessment-interaction";

const input = "mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800";
const button = "min-h-11 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40";
const newItem = () => ({ id: crypto.randomUUID(), label: "", detail: "" });

export function AssessmentInteractionEditor({ scene, onChange }: { scene: ArcScene; onChange: (patch: Partial<ArcScene>) => void }) {
  const [preview, setPreview] = useState(false);
  const interaction = scene.interaction;
  function selectFormat(format: string) {
    if (format === "routing") onChange({ answer: "typed", interaction: { kind: "routing", choices: [newItem(), newItem()], messageLabel: "What would you say?" } });
    else if (format === "prioritisation") onChange({ answer: "typed", interaction: { kind: "prioritisation", items: [newItem(), newItem()], reasonLabel: "Why did you choose this order?" } });
    else if (format === "handover") onChange({ answer: "artefact", interaction: { kind: "handover", fields: [{ id: crypto.randomUUID(), label: "", required: true }] } });
    else if (format === "typed" || format === "spoken" || format === "artefact") onChange({ interaction: undefined, answer: format });
  }
  const collection = interaction?.kind === "routing" ? interaction.choices : interaction?.kind === "prioritisation" ? interaction.items : null;
  function updateItems(items: Array<{ id: string; label: string; detail?: string }>) {
    if (interaction?.kind === "routing") onChange({ interaction: { ...interaction, choices: items } });
    if (interaction?.kind === "prioritisation") onChange({ interaction: { ...interaction, items } });
  }
  return <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/30 p-4">
    <label className="block text-sm font-semibold text-slate-800">How the student responds
      <select className={input} value={interaction?.kind ?? scene.answer} onChange={e => selectFormat(e.target.value)}>
        <option value="typed">Write a response</option><option value="spoken">Record a customer update</option><option value="artefact">Create a written deliverable</option><option value="routing">Choose an action + write a message</option><option value="prioritisation">Put work in priority order + explain</option><option value="handover">Complete a handover</option>
      </select>
    </label>
    <p className="mt-2 text-xs leading-relaxed text-slate-600">Choose the format that fits this work moment. Keep the situation in the brief above and the skills below. Changing format replaces its current response setup.</p>
    {collection && <div className="mt-3 space-y-3">
      {collection.map((item, index) => <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="flex items-center justify-between gap-2"><h4 className="text-xs font-bold text-slate-600">{interaction?.kind === "routing" ? "Action" : "Work item"} {index + 1}</h4><button type="button" className={button} disabled={collection.length <= 2} onClick={() => updateItems(collection.filter(entry => entry.id !== item.id))}>Remove</button></div>
        <label className="block text-xs font-medium text-slate-600">{interaction?.kind === "routing" ? "Action or person to contact" : "Task name"}<input className={input} value={item.label} maxLength={240} onChange={e => updateItems(collection.map(entry => entry.id === item.id ? { ...entry, label: e.target.value } : entry))} /></label>
        <label className="mt-2 block text-xs font-medium text-slate-600">Context the student can see <span className="font-normal">(optional)</span><textarea className={input} rows={2} maxLength={600} value={item.detail ?? ""} onChange={e => updateItems(collection.map(entry => entry.id === item.id ? { ...entry, detail: e.target.value } : entry))} /></label>
      </div>)}
      <button type="button" className={button} disabled={collection.length >= 8} onClick={() => updateItems([...collection, newItem()])}>Add {interaction?.kind === "routing" ? "action" : "work item"}</button>
      <label className="block text-xs font-medium text-slate-600">{interaction?.kind === "routing" ? "Message instruction" : "Reason instruction"}<input className={input} value={interaction?.kind === "routing" ? interaction.messageLabel : interaction?.kind === "prioritisation" ? interaction.reasonLabel : ""} maxLength={300} onChange={e => {
        if (interaction?.kind === "routing") onChange({ interaction: { ...interaction, messageLabel: e.target.value } });
        if (interaction?.kind === "prioritisation") onChange({ interaction: { ...interaction, reasonLabel: e.target.value } });
      }} /></label>
      <p className="text-xs text-slate-600">Keep at least two items. Describe meaningful alternatives without revealing a preferred answer.</p>
    </div>}
    {interaction?.kind === "handover" && <div className="mt-3 space-y-3">{interaction.fields.map((field, index) => {
      const updateField = (patch: Partial<typeof field>) => onChange({ interaction: { ...interaction, fields: interaction.fields.map(entry => entry.id === field.id ? { ...entry, ...patch } : entry) } });
      return <div key={field.id} className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="flex items-center justify-between gap-2"><h4 className="text-xs font-bold text-slate-600">Handover field {index + 1}</h4><button type="button" className={button} disabled={interaction.fields.length <= 1} onClick={() => onChange({ interaction: { ...interaction, fields: interaction.fields.filter(entry => entry.id !== field.id) } })}>Remove field</button></div>
        <label className="block text-xs font-medium text-slate-600">Field label<input className={input} value={field.label} maxLength={240} onChange={e => updateField({ label: e.target.value })} /></label>
        <div className="mt-2 flex flex-wrap items-center gap-4"><label className="min-h-11 content-center text-sm"><input type="checkbox" checked={field.required !== false} onChange={e => updateField({ required: e.target.checked })} /> Required response</label><label className="min-h-11 content-center text-sm"><input type="checkbox" checked={Boolean(field.options)} onChange={e => updateField({ options: e.target.checked ? ["", ""] : undefined })} /> Student chooses from options</label></div>
        {field.options && <div className="space-y-2">{field.options.map((option, optionIndex) => <div key={optionIndex} className="flex items-end gap-2"><label className="min-w-0 flex-1 text-xs font-medium text-slate-600">Option {optionIndex + 1}<input className={input} value={option} maxLength={240} onChange={e => updateField({ options: field.options?.map((value, i) => i === optionIndex ? e.target.value : value) })} /></label><button type="button" className={button} disabled={field.options!.length <= 2} onClick={() => updateField({ options: field.options?.filter((_, i) => i !== optionIndex) })}>Remove</button></div>)}<button type="button" className={button} disabled={field.options.length >= 12} onClick={() => updateField({ options: [...field.options!, ""] })}>Add option</button></div>}
      </div>;
    })}<button type="button" className={button} disabled={interaction.fields.length >= 8} onClick={() => onChange({ interaction: { ...interaction, fields: [...interaction.fields, { id: crypto.randomUUID(), label: "", required: true }] } })}>Add handover field</button></div>}
    {!interaction && scene.answer === "artefact" && <label className="mt-3 block text-xs font-medium text-slate-600">Deliverable sections (one per line)<textarea rows={3} className={input} value={scene.fields.join("\n")} onChange={e => onChange({ fields: e.target.value.split("\n") })} /></label>}
    <button type="button" className={`${button} mt-4`} aria-expanded={preview} onClick={() => setPreview(!preview)}>{preview ? "Close student preview" : "Preview this response format"}</button>
    {preview && <div className="assessment-workspace mt-3 rounded-xl border border-slate-200 bg-white p-4"><p className="mb-3 text-xs text-slate-500">Local preview only. Responses entered here are not saved or scored.</p><h4 className="font-semibold text-slate-900">{scene.title}</h4><AssessmentQuestion brief={scene.brief} />{interaction ? <InteractionPreview key={JSON.stringify(interaction)} interaction={interaction} /> : scene.answer === "spoken" ? <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">The student records a spoken update for this situation. Microphone recording is available in the student assessment; this author preview does not request microphone access.</p> : <label className="text-sm text-slate-700">{scene.answer === "artefact" ? "Your deliverable" : "Your response"}<textarea className={input} rows={4} placeholder={scene.answer === "artefact" ? scene.fields.filter(Boolean).join(" · ") : "Write your response…"} /></label>}</div>}
  </div>;
}

function InteractionPreview({ interaction }: { interaction: SceneInteraction }) {
  const [value, setValue] = useState<InteractionResponse | null>(null);
  return <AssessmentInteraction interaction={interaction} value={value} onChange={setValue} />;
}
