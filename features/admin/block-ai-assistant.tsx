'use client';

import {useState} from 'react';
import type {JourneyActivity,JourneyQuestion,WorkCase} from '@/lib/api/simulation-journey';
import type {LearningStoryboard} from '@/lib/api/learning-studio';
import {studioRequest} from './admin-studio-api';
import s from './simulation-journey-editor.module.css';

type Proposal={title:string;body?:string;instructions?:string;altText?:string;storyboard?:LearningStoryboard;workcase?:WorkCase;cards?:{front:string;back:string}[];questions?:{prompt:string;explanation?:string;options:{text:string;correct?:boolean;weight?:number}[]}[]};
type Props={block:JourneyActivity;roleTitle:string;journeyTitle:string;lessonTitle:string;sectionTitle:string;objectives:string[];sources:{title:string;url:string}[];open:boolean;onOpenChange:(open:boolean)=>void;onApply:(block:JourneyActivity)=>void;disabled:boolean};

export function BlockAiAssistant({block,roleTitle,journeyTitle,lessonTitle,sectionTitle,objectives,sources,open,onOpenChange,onApply,disabled}:Props){
 const [prompt,setPrompt]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [proposal,setProposal]=useState<Proposal|null>(null);
 async function ask(){
  setBusy(true);setError('');setProposal(null);
  try{
   const response=await studioRequest<{proposal:Proposal}>('/studio/assist-block',{roleTitle,journeyTitle,lessonTitle,sectionTitle,objectives,sources,type:block.type,current:{title:block.title,body:block.body,instructions:block.instructions,altText:block.altText},request:prompt.trim()});
   setProposal(response.proposal);
  }catch(e){setError(e instanceof Error?e.message:'Could not draft this block. Try again.');}
  finally{setBusy(false);}
 }
 function apply(){
  if(!proposal)return;
  const questions:JourneyQuestion[]|undefined=proposal.questions?.map(q=>({id:crypto.randomUUID(),prompt:q.prompt,multiple:false,explanation:q.explanation??'',options:q.options.map(o=>({id:crypto.randomUUID(),text:o.text,correct:o.correct??false,weight:o.weight??0}))}));
  onApply({...block,title:proposal.title,body:proposal.body??block.body,instructions:proposal.instructions??block.instructions,altText:proposal.altText??block.altText,storyboard:proposal.storyboard??block.storyboard,workcase:proposal.workcase??block.workcase,...(['image','audio','video'].includes(block.type)?{mediaPath:'',captionsPath:'',mediaUrl:'',captionsUrl:'',renderJobId:undefined}:{}),cards:proposal.cards?.map(card=>({...card,id:crypto.randomUUID()}))??block.cards,questions:questions??block.questions});
  setProposal(null);onOpenChange(false);
 }
 return <section className={s.blockAi} aria-label={`Ask AI for ${block.type} block`}>
  <button type="button" className={s.blockAiToggle} aria-expanded={open} disabled={disabled} onClick={()=>onOpenChange(!open)}>✦ Ask AI <span>{open?'−':'+'}</span></button>
  {open&&<div className={s.blockAiBody}>
   <p>Describe what this {block.type==='workcase'?'workplace case':block.type} block should teach or help learners practise. Include the facts it should use. {block.type==='video'?'AI plans the scenes; generate and review the MP4 below.':block.type==='image'||block.type==='audio'?'Generate and review the media file below after applying the draft.':block.type==='workcase'?'Approve a source in Journey details before generating a complete case.':''}</p>
   <label>Your prompt<textarea rows={4} maxLength={2000} value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="For example: draft a customer handover example using these facts: …"/></label>
   <button type="button" disabled={disabled||busy||prompt.trim().length<12} onClick={()=>void ask()}>{busy?'Drafting…':'Generate suggestion'}</button>
   {error&&<p role="alert" className={s.aiError}>{error}</p>}
   {proposal&&<div className={s.blockAiProposal}>
    <p className={s.builderKicker}>AI suggestion · review before applying</p><h4>{proposal.title}</h4>
    {proposal.body&&<p className={s.blockAiCopy}>{proposal.body}</p>}
    {proposal.altText&&<p><strong>Image description:</strong> {proposal.altText}</p>}
    {proposal.instructions&&<p><strong>Instructions:</strong> {proposal.instructions}</p>}
    {proposal.storyboard&&<div><strong>{proposal.storyboard.scenes.length} video scenes</strong><ul>{proposal.storyboard.scenes.map((scene,index)=><li key={index}>{index+1}. {scene.visual} · {scene.seconds}s</li>)}</ul></div>}
    {proposal.workcase&&<div><strong>Workplace decisions · {proposal.workcase.states.length} situations</strong><ul>{proposal.workcase.states.flatMap(state=>state.actions.map(action=><li key={action.id}>{action.label} → {action.consequence}</li>))}</ul></div>}
    {proposal.cards?.map((card,index)=><p key={index}><strong>Card {index+1}:</strong> {card.front} → {card.back}</p>)}
    {proposal.questions?.map((question,index)=><div key={index}><strong>Question {index+1}: {question.prompt}</strong><ul>{question.options.map((option,optionIndex)=><li key={optionIndex}>{option.text}{option.correct||option.weight===100?' · preferred answer':''}</li>)}</ul>{question.explanation&&<p>{question.explanation}</p>}</div>)}
    <div className={s.blockAiActions}><button type="button" disabled={disabled} onClick={apply}>Apply to this block</button><button type="button" onClick={()=>setProposal(null)}>Discard</button></div>
    <small>Applying replaces the matching content in this block. No change is made until you apply it.</small>
   </div>}
  </div>}
 </section>;
}
