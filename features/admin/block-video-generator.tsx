'use client';

import {useEffect,useState} from 'react';
import type {JourneyActivity} from '@/lib/api/simulation-journey';
import {studioRequest} from './admin-studio-api';
import s from './simulation-journey-editor.module.css';

type Style='openai_stills'|'higgsfield'|'illustrated';
type Render={jobId:string;state:'queued'|'running'|'completed'|'failed'|'outdated'|'none';phase:string;error:string|null;provider:Style;video?:string;captions?:string;videoPath?:string;captionsPath?:string;durationSeconds?:number};

export function BlockVideoGenerator({block,roleId,roleTitle,journeyTitle,disabled,onApply}:{block:JourneyActivity;roleId:string;roleTitle:string;journeyTitle:string;disabled:boolean;onApply:(next:JourneyActivity)=>void}){
 const [style,setStyle]=useState<Style>('openai_stills');
 const [render,setRender]=useState<Render|null>(null);
 const [source,setSource]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const fingerprint=JSON.stringify(block.storyboard??null);
 const current=Boolean(render&&source===fingerprint);
 useEffect(()=>{
  if(!block.renderJobId||render?.jobId===block.renderJobId)return;
  void studioRequest<Render>('/studio/block-video-status',{roleId,blockId:block.id,jobId:block.renderJobId}).then(next=>{setSource(fingerprint);setRender(next);}).catch(e=>setError(e instanceof Error?e.message:'Unable to restore video status.'));
 },[block.renderJobId,block.id,roleId,render?.jobId,fingerprint]);
 useEffect(()=>{
  if(!render||!current||!['queued','running'].includes(render.state))return;
  const timer=window.setInterval(()=>{void studioRequest<Render>('/studio/block-video-status',{roleId,blockId:block.id,jobId:render.jobId}).then(setRender).catch(e=>setError(e instanceof Error?e.message:'Unable to check video status.'));},6000);
  return()=>window.clearInterval(timer);
 },[render,current,roleId,block.id]);
 async function start(){if(!block.storyboard)return;setBusy(true);setError('');setRender(null);try{const next=await studioRequest<Render>('/studio/render-block-video',{roleId,blockId:block.id,roleTitle,journeyTitle,blockTitle:block.title,storyboard:block.storyboard,provider:style});setSource(fingerprint);setRender(next);onApply({...block,renderJobId:next.jobId,mediaPath:'',captionsPath:'',mediaUrl:'',captionsUrl:''});}catch(e){setError(e instanceof Error?e.message:'Unable to start video generation.');}finally{setBusy(false);}}
 function useVideo(){if(!current||!render?.videoPath||!render.captionsPath)return;onApply({...block,mediaPath:render.videoPath,captionsPath:render.captionsPath,mediaUrl:render.video??'',captionsUrl:render.captions??'',body:render.provider==='higgsfield'?block.storyboard?.scenes.slice(0,4).map(scene=>scene.visual).join(' ' )??block.body:block.body,durationSeconds:render.durationSeconds??block.durationSeconds});}
 return <section className={s.videoGenerator} aria-label="Generate video for this block">
  <h4>Generate the video</h4>
  <p>Ask AI above for a scene plan, review the shots and narration, then make an MP4. The film stays a draft until you review and use it here.</p>
  <label>Video style<select value={style} disabled={disabled||busy} onChange={e=>setStyle(e.target.value as Style)}><option value="openai_stills">Cinematic photo scenes with movement and narration</option><option value="higgsfield">Cinematic moving footage · silent, about 20 seconds</option><option value="illustrated">Illustrated film</option></select></label>
  <button type="button" disabled={disabled||busy||!block.storyboard||!block.title.trim()} onClick={()=>void start()}>{busy?'Starting…':'Generate MP4'}</button>
  {!block.storyboard&&<p>Use Ask AI to make a scene plan for this video block first.</p>}
  {current&&render&&<p role="status">{render.state==='completed'?'Video ready to review':render.state==='failed'?'Video generation failed':render.phase||'Preparing video…'}</p>}
  {current&&render?.error&&<p role="alert" className={s.aiError}>{render.error}</p>}
  {error&&<p role="alert" className={s.aiError}>{error}</p>}
  {current&&render?.state==='completed'&&render.video&&<div className={s.generatedVideo}><video controls preload="metadata" src={render.video}>{render.captions&&<track kind="captions" src={render.captions} srcLang="en" label="English"/>}</video><p>Review the footage and captions before adding them to the block.</p><button type="button" disabled={disabled||!render.captionsPath} onClick={useVideo}>Use this video in the block</button>{!render.captionsPath&&<p>This render has no captions yet. Add a WebVTT captions file before publishing.</p>}</div>}
 </section>;
}
