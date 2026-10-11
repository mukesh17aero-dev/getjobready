'use client';

import {useState} from 'react';
import Image from 'next/image';
import type {JourneyActivity} from '@/lib/api/simulation-journey';
import {studioRequest} from './admin-studio-api';
import s from './simulation-journey-editor.module.css';

type Result={kind:'image'|'audio';mediaPath:string;mediaUrl:string};

export function BlockMediaGenerator({block,roleTitle,disabled,onApply}:{block:JourneyActivity;roleTitle:string;disabled:boolean;onApply:(next:JourneyActivity)=>void}){
 const kind=block.type==='image'?'image':'audio';
 const [result,setResult]=useState<Result|null>(null);
 const [source,setSource]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const fingerprint=JSON.stringify([block.title,block.body,block.altText]);
 const current=result&&source===fingerprint;
 async function create(){setBusy(true);setError('');setResult(null);try{const made=await studioRequest<Result>('/studio/generate-block-media',{kind,roleTitle,title:block.title,body:block.body,altText:block.altText});setSource(fingerprint);setResult(made);}catch(e){setError(e instanceof Error?e.message:`Could not generate ${kind}.`);}finally{setBusy(false);}}
 return <section className={s.videoGenerator} aria-label={`Generate ${kind} for this block`}>
  <h4>Generate {kind}</h4>
  <p>{kind==='image'?'Review the image description above, then generate and inspect the actual image.':'Review the spoken transcript above, then generate and listen to the actual audio.'}</p>
  <button type="button" disabled={disabled||busy||!block.title.trim()||(kind==='image'?!block.altText.trim():!block.body.trim())} onClick={()=>void create()}>{busy?'Generating…':`Generate ${kind}`}</button>
  {error&&<p role="alert" className={s.aiError}>{error}</p>}
  {current&&result&&<div className={s.generatedVideo}>{kind==='image'?<Image unoptimized src={result.mediaUrl} alt={block.altText||'Generated block image'} width={640} height={400}/>:<audio controls src={result.mediaUrl}/>}
   <button type="button" disabled={disabled} onClick={()=>onApply({...block,mediaPath:result.mediaPath,mediaUrl:result.mediaUrl})}>Use this {kind} in the block</button>
  </div>}
 </section>;
}
