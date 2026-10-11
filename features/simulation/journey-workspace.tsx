'use client';

import {useCallback,useEffect,useRef,useState,type ReactNode} from 'react';
import {JourneyOverview} from "./journey-overview";
import {WorkCasePlayer} from "./workcase-player";
import Link from 'next/link';
import type {LearningJourneyView,LearningJourneySummary,LearnerJourneyActivity} from '@/lib/api/simulation-journey';
import {simulationRequest} from './simulation-api';
import {JourneyActivityPlayer,JourneyFeedback,type ActivityDraft} from './journey-activity';
import s from './journey.module.css';

type CachedDraft=ActivityDraft&{revision:number;savedAt:number};
function JourneyMap({journey,selected,onChoose}:{journey:LearningJourneyView;selected:string;onChoose:(activity:LearnerJourneyActivity)=>void}){
 const byId=new Map(journey.activities.map(activity=>[activity.id,activity]));
 const groups=journey.lessons?.length?journey.lessons.map(lesson=>({id:lesson.id,title:lesson.title,sections:lesson.sections.map(section=>({id:section.id,title:section.title,activities:section.activityIds.map(id=>byId.get(id)).filter((item):item is LearnerJourneyActivity=>Boolean(item))}))})):[{id:'activities',title:'',sections:[{id:'all',title:'',activities:journey.activities}]}];
 let number=0;
 return <nav className={s.map} aria-label="Learning journey"><h2>Your journey</h2>{groups.map(group=><div className={s.lessonGroup} key={group.id}>{group.title&&<h3>{group.title}</h3>}{group.sections.map(section=><div className={s.sectionGroup} key={section.id}>{section.title&&<h4>{section.title}</h4>}<ol>{section.activities.map(activity=>{number++;return <li key={activity.id}><button className={s.step} data-done={activity.state.completed} aria-current={selected===activity.id?'step':undefined} aria-disabled={activity.locked} onClick={()=>onChoose(activity)}><span className={s.stepNumber}>{activity.state.completed?'✓':number}</span><span>{activity.title}<small>{activity.locked?'Locked':activity.state.completed?'Completed':activity.required?'Required':'Optional'}</small></span></button></li>;})}</ol></div>)}</div>)}</nav>;
}
function ActivityRoom({journey,activity,onSaved,onNext}:{journey:LearningJourneyView;activity:LearnerJourneyActivity;onSaved:(value:LearningJourneyView)=>void;onNext:()=>void}){
 const storageKey=`ascend:simulation-draft:${journey.runId}:${activity.id}`;
 const [initial]=useState(()=>{
  const base:ActivityDraft={answers:activity.state.answers,seen:activity.state.seen,position:activity.state.position,watchedSeconds:activity.state.watchedSeconds??0,textAlternative:activity.state.textAlternative??false};
  try{const raw=typeof window==='undefined'?null:localStorage.getItem(storageKey);if(raw){const cached=JSON.parse(raw) as CachedDraft;if(cached.revision===activity.state.revision&&Date.now()-cached.savedAt<7*86400000&&!activity.state.completed&&cached.answers&&Array.isArray(cached.seen))return {draft:cached,dirty:true};}}catch{}
  return {draft:base,dirty:false};
 });
 const [draft,setDraft]=useState<ActivityDraft>(initial.draft),[dirty,setDirty]=useState(initial.dirty),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const revision=useRef(activity.state.revision),saving=useRef(false),changeVersion=useRef(0),pendingEvent=useRef<string|null>(null);
 function change(value:ActivityDraft){if(activity.state.completed)return;changeVersion.current++;pendingEvent.current=null;setDraft(value);setDirty(true);setError('');setMessage('Saving your progress…');try{localStorage.setItem(storageKey,JSON.stringify({...value,revision:revision.current,savedAt:Date.now()}));}catch{}}
 const save=useCallback(async(submit:boolean)=>{
  if(saving.current||activity.state.completed)return;saving.current=true;setBusy(true);setError('');const version=changeVersion.current;
  const eventId=pendingEvent.current??crypto.randomUUID();pendingEvent.current=eventId;
  try{const updated=await simulationRequest<LearningJourneyView>('/journeys/activity',{runId:journey.runId,activityId:activity.id,eventId,revision:revision.current,submit,...draft});
   const state=updated.activities.find(a=>a.id===activity.id)!.state;revision.current=state.revision;pendingEvent.current=null;
   if(version===changeVersion.current){setDirty(false);try{localStorage.removeItem(storageKey);}catch{}}
   else{try{const cached=localStorage.getItem(storageKey);if(cached)localStorage.setItem(storageKey,JSON.stringify({...JSON.parse(cached),revision:state.revision}));}catch{}}
   onSaved(updated);setMessage(submit?(state.completed?'Activity completed. Your progress is saved.':'Your answer is saved. Review the feedback and try again.'):'Progress saved.');
  }catch(e){setError(e instanceof Error?e.message:'Unable to save. Your answer is kept here.');}finally{saving.current=false;setBusy(false);}
 },[activity.id,activity.state.completed,draft,journey.runId,onSaved,storageKey]);
 useEffect(()=>{if(!dirty||busy||error)return;const timer=setTimeout(()=>void save(false),800);return()=>clearTimeout(timer);},[dirty,busy,error,save]);
 useEffect(()=>{function warn(event:BeforeUnloadEvent){if(dirty){event.preventDefault();}}window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
 if(activity.type==='workcase')return <WorkCasePlayer journey={journey} activity={activity} onSaved={onSaved} onNext={onNext}/>;
 const assessed=['quiz','scenario'].includes(activity.type);
 return <><h2>{activity.title}</h2><p className={s.muted}>{activity.type} · {Math.ceil(activity.durationSeconds/60)} min · {activity.xp} XP{!activity.required?' · Optional':''}</p>
  <JourneyActivityPlayer activity={activity} draft={draft} onChange={change} disabled={busy||activity.state.completed||journey.readOnly}/>
  <JourneyFeedback state={activity.state}/>
  {error&&<p role="alert" className={s.error}>{error} <button className={s.secondary} onClick={()=>void save(false)} disabled={busy}>Retry save</button></p>}
  {message&&<p role="status" className={s.muted}>{message}</p>}
  <div className={s.actions}>{journey.readOnly?<p>This earlier attempt is read-only. Your answers and feedback are preserved.</p>:activity.state.completed?<button className={s.primary} onClick={onNext}>Continue →</button>:<><button className={s.primary} disabled={busy} onClick={()=>{pendingEvent.current=null;void save(true);}}>{busy?'Saving…':assessed?'Check my answers':'Complete activity'}</button>{dirty&&<button className={s.secondary} disabled={busy} onClick={()=>void save(false)}>Save progress</button>}</>}</div>
  {assessed&&!activity.state.completed&&<p className={s.muted}>{Math.max(0,activity.attempts-activity.state.attempts)} attempts remaining · Pass mark {activity.passScore}%. You can continue after using all attempts.</p>}
 </>;
}
export function SimulationLearning({initialRole,legacy,initialClassic=false}:{initialRole:string;legacy:ReactNode;initialClassic?:boolean}){
 const [list,setList]=useState<LearningJourneySummary[]|null>(null),[journey,setJourney]=useState<LearningJourneyView|null>(null),[selected,setSelected]=useState(''),[classic,setClassic]=useState(initialClassic),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{let active=true;simulationRequest<LearningJourneySummary[]>('/journeys/list').then(async items=>{if(!active)return;setList(items);const query=new URLSearchParams(window.location.search),roleId=query.get('role'),runId=query.get('run');if(roleId&&runId&&items.some(item=>item.roleId===roleId)){const saved=await simulationRequest<LearningJourneyView>(`/journeys/${encodeURIComponent(roleId)}/history/${encodeURIComponent(runId)}`);if(active){setJourney(saved);setSelected(saved.activities.find(a=>a.id===query.get('activity'))?.id??saved.activities[0]?.id??'');}}}).catch(e=>{if(active)setError(e instanceof Error?e.message:'Unable to load journeys.');});return()=>{active=false;};},[]);
 async function open(roleId:string){setBusy(true);setError('');try{const next=await simulationRequest<LearningJourneyView>(`/journeys/${encodeURIComponent(roleId)}`);setJourney(next);setSelected(next.activities.find(a=>!a.locked&&!a.state.completed)?.id??next.activities[0]?.id??'');}catch(e){setError(e instanceof Error?e.message:'Unable to open this journey.');}finally{setBusy(false);}}
 async function retake(){if(!journey?.runId)return;setBusy(true);setError('');try{const value=await simulationRequest<LearningJourneyView>('/journeys/retake',{runId:journey.runId});setJourney(value);setSelected(value.activities.find(a=>!a.locked&&!a.state.completed)?.id??'');}catch(e){setError(e instanceof Error?e.message:'Unable to start a fresh attempt.');}finally{setBusy(false);}}
 async function openHistory(runId:string){if(!journey)return;setBusy(true);setError('');try{const value=await simulationRequest<LearningJourneyView>(`/journeys/${encodeURIComponent(journey.roleId)}/history/${encodeURIComponent(runId)}`);setJourney(value);setSelected(value.activities[0]?.id??'');}catch(e){setError(e instanceof Error?e.message:'Unable to open this attempt.');}finally{setBusy(false);}}
 async function start(){if(!journey)return;setBusy(true);try{setJourney(await simulationRequest<LearningJourneyView>('/journeys/start',{roleId:journey.roleId,timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone}));}catch(e){setError(e instanceof Error?e.message:'Unable to start.');}finally{setBusy(false);}}
 const save=useCallback((value:LearningJourneyView)=>setJourney(value),[]);
 if(classic||list?.length===0)return <>{classic&&<div className={s.root}><button className={s.secondary} onClick={()=>setClassic(false)}>← Learning journeys</button></div>}{legacy}</>;
 const activity=journey?.activities.find(a=>a.id===selected);
 function next(){if(!journey)return;const index=journey.activities.findIndex(a=>a.id===selected);const target=journey.activities.slice(index+1).find(a=>!a.locked&&!a.state.completed)??journey.activities.find(a=>!a.locked&&!a.state.completed);if(target)setSelected(target.id);else setSelected('');}
 return <main className={s.root}><Link href="/practice">← Practice</Link><header className={s.heading}><div><p className={s.eyebrow}>Simulation · Learn and practise</p><h1>{journey?.title??'Simulation practice'}</h1><p>{journey?.description??'Explore a short lesson, practise a decision, and keep your progress for next time.'}</p></div></header>
  {error&&<div role="alert" className={s.error}>{error}<button className={s.secondary} onClick={()=>window.location.reload()}>Retry</button></div>}
  {!list&&!error&&<div className={s.skeleton} role="status" aria-label="Loading your learning journeys"/>}
  {!journey&&list&&<JourneyOverview journeys={list} initialRole={initialRole} busy={busy} onOpen={roleId=>void open(roleId)}/>}
  {journey&&<><div className={s.actions}><button className={s.secondary} onClick={()=>{setJourney(null);setSelected('');}}>All journeys</button><span className={s.muted}>Version {journey.version} · {journey.xp} XP earned · {journey.activities.filter(a=>a.state.completed).length}/{journey.activities.length} activities</span></div>
   {!journey.runId?<section className={s.card}><h2>What you will practise</h2><ul>{journey.objectives.map((objective,i)=><li key={i}>{objective}</li>)}</ul><p>Your answers and progress are saved to your account. Completed activities earn XP; XP records participation, not verified job readiness.</p><button className={s.primary} disabled={busy} onClick={()=>void start()}>{busy?'Starting…':'Start this journey'}</button></section>:<>
    {journey.history&&journey.history.length>1&&<label className={s.notice}>Saved attempts<select className="ml-3 min-h-11 max-w-full rounded-lg border px-3" value={journey.runId??''} disabled={busy} onChange={e=>void openHistory(e.target.value)}>{journey.history.map((attempt,index)=><option key={attempt.id} value={attempt.id}>Attempt {journey.history!.length-index} · Version {attempt.version}{attempt.current?' · Current':' · Earlier'}</option>)}</select></label>}
    {journey.readOnly&&<p role="status" className={s.notice}>You are reviewing an earlier attempt. <button className={s.secondary} onClick={()=>void open(journey.roleId)}>Return to current attempt</button></p>}
    {journey.completedAt&&<section className={s.completion}><p className={s.eyebrow}>Journey completed</p><h2>You finished the required activities.</h2><p><strong>{journey.xp} XP earned</strong></p><p>Your answers and feedback are saved. Review any activity below, or choose another journey.</p>{!journey.readOnly&&<><p>{journey.retakeReason}</p>{journey.canRetake&&<button className={s.secondary} disabled={busy} onClick={()=>void retake()}>{busy?'Starting…':'Practise again with a fresh verification case'}</button>}</>}</section>}
    <div className={s.layout}><JourneyMap journey={journey} selected={selected} onChoose={a=>{if(a.locked){setError('Complete the earlier required activities to unlock this step.');return;}setError('');setSelected(a.id);}}/><section className={s.player} aria-label="Activity">{activity?<ActivityRoom key={`${journey.runId}:${activity.id}`} journey={journey} activity={activity} onSaved={save} onNext={next}/>:<p>Choose an activity to review your work.</p>}</section></div>
   </>}
  </>}
  {!journey&&list&&<details className={s.otherPractice}><summary>Looking for workplace missions?</summary><p>Open the role-based lessons, daily plan and guided missions.</p><button className={s.secondary} onClick={()=>setClassic(true)}>Open workplace missions →</button></details>}
 </main>;
}
