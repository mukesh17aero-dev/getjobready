'use client';
import {CaseAppeal} from "./case-appeal";
import {useRef,useState} from 'react';
import type {LearnerJourneyActivity,LearningJourneyView} from '@/lib/api/simulation-journey';
import {simulationRequest} from './simulation-api';
import s from './journey.module.css';
export function WorkCasePlayer({journey,activity,onSaved,onNext}:{journey:LearningJourneyView;activity:LearnerJourneyActivity;onSaved:(v:LearningJourneyView)=>void;onNext:()=>void}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const pending=useRef<{eventId:string;actionId:string;revision:number}|null>(null);
 const view=activity.caseView;
 async function act(actionId:string){if(busy)return;setBusy(true);setError('');
  const request=pending.current?.actionId===actionId?pending.current:{actionId,eventId:crypto.randomUUID(),revision:activity.state.revision};pending.current=request;
  try{const updated=await simulationRequest<LearningJourneyView>('/journeys/activity',{runId:journey.runId,activityId:activity.id,eventId:request.eventId,revision:request.revision,submit:true,caseActionId:actionId,answers:{},seen:[],position:0,watchedSeconds:0});pending.current=null;onSaved(updated);}catch(e){setError(e instanceof Error?e.message:'Action could not be saved. Retry the same action.');}finally{setBusy(false);}}
 if(!view)return <p>This workplace case is locked. Finish the earlier required activity.</p>;
 return <><h2>{activity.title}</h2><p className={s.muted}>{view.mode==='baseline'?'Starting sample':view.mode==='coached'?'Coached practice':'Independent verification'} · Version {journey.version}</p><p>{activity.instructions}</p>
 <section className={s.card} aria-label="Current workplace situation"><h3>What is happening now</h3><p>{view.description}</p></section>
 <details><summary className="min-h-11 cursor-pointer py-3">Policy and reference materials</summary>{view.references.map((text,i)=><p key={i}>{text}</p>)}</details>
 {error&&<p role="alert" className={s.error}>{error}</p>}
 {!view.completed&&!journey.readOnly&&<section aria-label="Available workplace actions"><h3>What will you do?</h3><p>Each action changes the situation and is saved. Review the facts and policy before choosing.</p><div className={s.cards}>{view.actions.map(action=><button className={s.secondary} key={action.id} disabled={busy} onClick={()=>void act(action.id)}>{action.label}</button>)}</div></section>}
 {!!view.timeline.length&&<section aria-label="Your action replay"><h3>Your actions and what happened</h3><ol>{view.timeline.map((action,index)=><li className="my-4" key={`${action.actionId}-${index}`}><strong>{index+1}. {action.label}</strong><p>{action.consequence}</p>{action.coaching&&<p className={s.muted}>{action.coaching}</p>}</li>)}</ol></section>}
 {view.completed&&<section className={s.card}><h3>{view.mode==='verification'?'Independent result':view.mode==='baseline'?'Starting performance':'Practice performance'}</h3><p>{view.performanceScore===null?'No scored actions observed':`${view.performanceScore} / 100 on observed criteria`}</p>{view.mode==='verification'&&<p>{view.verificationPassed?'This case met its published verification rules. This is case-level evidence, not an overall role-readiness claim.':'Verification not passed. Review the coverage, critical errors and rubric feedback below.'}</p>}<ul>{view.criteria.map(criterion=><li className="my-3" key={criterion.id}><strong>{criterion.label}: {criterion.score===null?'Not observed':`${criterion.score}/100`}</strong><p>{criterion.observations.length}/{criterion.required} required observations · weight {criterion.weight}%</p><ul>{criterion.observations.map((item,index)=><li key={index}>{item.evidence} ({item.points}/4)</li>)}</ul></li>)}</ul>{view.criticalErrors.length>0&&<div role="alert"><h4>Critical errors — verification blocked</h4><ul>{view.criticalErrors.map(reason=><li key={reason}>{reason}</li>)}</ul></div>}{!view.coverageMet&&<p>Some rubric criteria have insufficient evidence. Missing evidence is not a zero score.</p>}<button className={s.primary} onClick={onNext}>Continue →</button></section>}
 {view.completed&&<CaseAppeal journey={journey} activity={activity} onSaved={onSaved}/>}
 </>;
}
