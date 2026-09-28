"use client";

import { useId } from "react";
import "./assessment-workspace.css";
import type { InteractionResponse, RecordSide, SceneInteraction } from "@/lib/api";

export function AssessmentInteraction({ interaction, value, onChange, disabled = false }: {
  interaction: SceneInteraction;
  value: InteractionResponse | null;
  onChange: (next: InteractionResponse) => void;
  disabled?: boolean;
}) {
  const prefix = useId();
  if (interaction.kind === "routing") {
    const answer = value?.kind === "routing" ? value : { kind: "routing" as const, choiceId: "", message: "" };
    return <fieldset disabled={disabled} className="assessment-response"><legend>Choose your next action</legend><div className="assessment-action-cards">{interaction.choices.map(choice => <button type="button" key={choice.id} aria-pressed={answer.choiceId === choice.id} onClick={() => onChange({ ...answer, choiceId: choice.id })}><span aria-hidden>↗</span><strong>{choice.label}</strong>{choice.detail && <small>{choice.detail}</small>}</button>)}</div><label htmlFor={`${prefix}-message`}>{interaction.messageLabel}</label><textarea id={`${prefix}-message`} value={answer.message} onChange={e => onChange({ ...answer, message: e.target.value })} rows={3} maxLength={8000} placeholder="Write the message you would send…" /></fieldset>;
  }
  if (interaction.kind === "prioritisation") {
    const answer = value?.kind === "prioritisation" ? value : { kind: "prioritisation" as const, orderedIds: interaction.items.map(i => i.id), reason: "" };
    const move = (index: number, offset: number) => { const orderedIds = [...answer.orderedIds]; [orderedIds[index], orderedIds[index + offset]] = [orderedIds[index + offset], orderedIds[index]]; onChange({ ...answer, orderedIds }); };
    return <fieldset disabled={disabled} className="assessment-response"><legend>Put the work in priority order</legend><ol className="assessment-queue">{answer.orderedIds.map((id, index) => { const item = interaction.items.find(i => i.id === id); return item && <li key={id}><span className="queue-number">{index + 1}</span><div><strong>{item.label}</strong>{item.detail && <small>{item.detail}</small>}</div><button type="button" aria-label={`Move ${item.label} earlier`} disabled={disabled || index === 0} onClick={() => move(index, -1)}>↑</button><button type="button" aria-label={`Move ${item.label} later`} disabled={disabled || index === answer.orderedIds.length - 1} onClick={() => move(index, 1)}>↓</button></li>; })}</ol><label htmlFor={`${prefix}-reason`}>{interaction.reasonLabel}</label><textarea id={`${prefix}-reason`} value={answer.reason} onChange={e => onChange({ ...answer, reason: e.target.value })} rows={3} maxLength={8000} placeholder="One clear reason is enough…" /></fieldset>;
  }
  if (interaction.kind === "handover") {
    const answer = value?.kind === "handover" ? value : { kind: "handover" as const, values: {} };
    return <fieldset disabled={disabled} className="assessment-response"><legend>Leave a useful handover</legend><div className="assessment-handover">{interaction.fields.map(field => <label key={field.id} htmlFor={`${prefix}-${field.id}`}><span>{field.label}{field.required === false && <small>Optional</small>}</span>{field.options?.length ? <select id={`${prefix}-${field.id}`} value={answer.values[field.id] ?? ""} onChange={e => onChange({ ...answer, values: { ...answer.values, [field.id]: e.target.value } })}><option value="">Choose…</option>{field.options.map(option => <option key={option}>{option}</option>)}</select> : <input id={`${prefix}-${field.id}`} value={answer.values[field.id] ?? ""} maxLength={2000} onChange={e => onChange({ ...answer, values: { ...answer.values, [field.id]: e.target.value } })} />}</label>)}</div></fieldset>;
  }
  if (interaction.kind === "categorize") {
    const answer = value?.kind === "categorize" ? value : { kind: "categorize" as const, placements: {}, reason: "" };
    const bucketOf = (itemId: string) => answer.placements[itemId];
    const place = (itemId: string, bucketId: string) => onChange({ ...answer, placements: { ...answer.placements, [itemId]: bucketId } });
    const unplace = (itemId: string) => { const next = { ...answer.placements }; delete next[itemId]; onChange({ ...answer, placements: next }); };
    const unsorted = interaction.items.filter(item => !bucketOf(item.id));
    return <fieldset disabled={disabled} className="assessment-response"><legend>Sort each item</legend>
      <div className="assessment-categorize">
        {unsorted.length > 0 && <div className="assessment-categorize-pool">
          <p className="assessment-categorize-heading">Not sorted yet</p>
          {unsorted.map(item => <div key={item.id} className="assessment-categorize-item">
            <div><strong>{item.label}</strong>{item.detail && <small>{item.detail}</small>}</div>
            <div className="assessment-categorize-buckets">{interaction.buckets.map(bucket => <button type="button" key={bucket.id} onClick={() => place(item.id, bucket.id)}>{bucket.label}</button>)}</div>
          </div>)}
        </div>}
        {interaction.buckets.map(bucket => <div key={bucket.id} className="assessment-categorize-bucket">
          <p className="assessment-categorize-heading">{bucket.label}</p>
          <ul>{interaction.items.filter(item => bucketOf(item.id) === bucket.id).map(item => <li key={item.id}><span>{item.label}</span><button type="button" aria-label={`Move ${item.label} back to not sorted`} onClick={() => unplace(item.id)}>×</button></li>)}</ul>
        </div>)}
      </div>
      <label htmlFor={`${prefix}-categorize-reason`}>{interaction.reasonLabel}</label>
      <textarea id={`${prefix}-categorize-reason`} value={answer.reason} onChange={e => onChange({ ...answer, reason: e.target.value })} rows={3} maxLength={8000} placeholder="One clear reason is enough…" />
    </fieldset>;
  }
  // "spot": the last kind. Same field ids on both sides, so tapping either
  // side's version of a field selects that field id - there is only one
  // answer, not a left one and a right one.
  const answer = value?.kind === "spot" ? value : { kind: "spot" as const, fieldId: "", note: "" };
  const record = (side: RecordSide) => <div className="assessment-spot-record">
    <p className="assessment-categorize-heading">{side.title}</p>
    <dl>{side.fields.map(field => <div key={field.id}><dt>{field.label}</dt><dd><button type="button" aria-pressed={answer.fieldId === field.id} onClick={() => onChange({ ...answer, fieldId: field.id })}>{field.value}</button></dd></div>)}</dl>
  </div>;
  return <fieldset disabled={disabled} className="assessment-response"><legend>{interaction.promptLabel}</legend>
    <div className="assessment-spot">{record(interaction.left)}{record(interaction.right)}</div>
    <label htmlFor={`${prefix}-spot-note`}>{interaction.noteLabel}</label>
    <textarea id={`${prefix}-spot-note`} value={answer.note} onChange={e => onChange({ ...answer, note: e.target.value })} rows={2} maxLength={8000} placeholder="A short note is enough…" />
  </fieldset>;
}
