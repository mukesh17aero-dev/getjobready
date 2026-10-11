'use client';

import {useEffect,useRef,useState} from 'react';
import type {LearnerJourneyActivity,JourneyActivityState} from '@/lib/api/simulation-journey';
import s from './journey.module.css';

export type ActivityDraft={answers:Record<string,string[]>;seen:string[];position:number;watchedSeconds:number;textAlternative?:boolean};
export function JourneyActivityPlayer({activity,draft,onChange,disabled=false}:{activity:LearnerJourneyActivity;draft:ActivityDraft;onChange:(value:ActivityDraft)=>void;disabled?:boolean}){
 const media=useRef<HTMLMediaElement|null>(null),previous=useRef<number|null>(null);
 const [revealed,setRevealed]=useState<string[]>(draft.seen);
 useEffect(()=>{previous.current=null;},[activity.id]);
 function updatePlayback(){const element=media.current;if(!element)return;const position=element.currentTime,delta=previous.current===null?0:position-previous.current;previous.current=position;
  const played=delta>0&&delta<2&&!element.seeking?delta:0;
  onChange({...draft,position,watchedSeconds:Math.min(activity.durationSeconds,draft.watchedSeconds+played)});
 }
 function resume(){if(media.current&&draft.position>0)media.current.currentTime=draft.position;}
 function answer(questionId:string,optionId:string,multiple:boolean){const selected=draft.answers[questionId]??[];onChange({...draft,answers:{...draft.answers,[questionId]:multiple?(selected.includes(optionId)?selected.filter(id=>id!==optionId):[...selected,optionId]):[optionId]}});}
 return <>
  {activity.instructions&&<p>{activity.instructions}</p>}
  {activity.type==='image'&&/* The admin supplies a reviewed HTTPS image; arbitrary hosts cannot use next/image. */
   // eslint-disable-next-line @next/next/no-img-element
   <img className={s.media} src={activity.mediaUrl} alt={activity.altText}/>}
  {activity.type==='video'&&<video ref={node=>{media.current=node;}} className={s.media} controls playsInline preload="metadata" src={activity.mediaUrl} onLoadedMetadata={resume} onTimeUpdate={updatePlayback} onSeeking={()=>{previous.current=null;}}><track kind="captions" src={activity.captionsUrl} srcLang="en" label="Captions" default/></video>}
  {activity.type==='audio'&&<audio ref={node=>{media.current=node;}} className={s.media} controls preload="metadata" src={activity.mediaUrl} onLoadedMetadata={resume} onTimeUpdate={updatePlayback} onSeeking={()=>{previous.current=null;}}/>}
  {['video','audio'].includes(activity.type)&&<p className={s.muted}>Play at least {activity.watchedPercent}%, or read the equivalent transcript below. Both routes count equally toward lesson completion.</p>}
  {activity.body&&(['video','audio'].includes(activity.type)?<details><summary>Read the transcript</summary><p className={s.content}>{activity.body}</p><label className={s.option}><input type="checkbox" disabled={disabled} checked={draft.textAlternative??false} onChange={e=>onChange({...draft,textAlternative:e.target.checked})}/>I have read the transcript instead of playing the media</label></details>:activity.type==='callout'?<aside className={s.keyPoint}>{activity.body}</aside>:<p className={s.content}>{activity.body}</p>)}
  {activity.type==='flashcard'&&<div className={s.flashcard}>{activity.cards.map(card=><article key={card.id}><h3>{card.front}</h3>{revealed.includes(card.id)&&<p className={s.content}>{card.back}</p>}<button className={s.secondary} disabled={disabled} aria-expanded={revealed.includes(card.id)} onClick={()=>{setRevealed(old=>old.includes(card.id)?old.filter(id=>id!==card.id):[...old,card.id]);if(!draft.seen.includes(card.id))onChange({...draft,seen:[...draft.seen,card.id]});}}>{revealed.includes(card.id)?'Show front':'Reveal answer'}</button>{draft.seen.includes(card.id)&&<small> · Reviewed</small>}</article>)}</div>}
  {['quiz','scenario'].includes(activity.type)&&<div className={s.questions}>{activity.questions.map((q,index)=><fieldset className={s.question} key={q.id} disabled={disabled}><legend>{index+1}. {q.prompt}</legend><p className={s.muted}>{q.multiple?'Choose all that apply.':'Choose one answer.'}</p>{q.options.map(option=><label className={s.option} key={option.id}><input type={q.multiple?'checkbox':'radio'} name={q.id} checked={(draft.answers[q.id]??[]).includes(option.id)} onChange={()=>answer(q.id,option.id,q.multiple)}/><span>{option.text}</span></label>)}</fieldset>)}</div>}
 </>;
}
export function JourneyFeedback({state}:{state:JourneyActivityState}){
 if(!state.feedback)return null;
 return <section className={s.feedback} aria-label="Your feedback"><h3>{state.score===100?'Correct':'Review your answers'} · {state.score}/100</h3>{state.feedback.map(item=><p key={item.questionId}>{item.explanation}</p>)}</section>;
}
