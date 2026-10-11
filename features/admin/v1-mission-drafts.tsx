'use client';

import {useEffect,useState} from 'react';
import type {LearningJourney} from '@/lib/api/simulation-journey';
import {studioRequest} from './admin-studio-api';
type Catalogue={status:'unreviewed';roles:{title:string;sector:string;missions:{title:string;kind:string}[]}[];limitations:string[]};
export function V1MissionDrafts({roleTitle,skills,hasJourney,onLoad,disabled}:{roleTitle:string;skills:{id:string;name:string}[];hasJourney:boolean;onLoad:(value:LearningJourney)=>void;disabled:boolean}){
 const [catalogue,setCatalogue]=useState<Catalogue|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[confirm,setConfirm]=useState(false);
 useEffect(()=>{let active=true;studioRequest<Catalogue>('/studio/v1-drafts').then(value=>{if(active)setCatalogue(value);}).catch(()=>{if(active)setError('The mission draft library could not be loaded. Reopen this role to retry.');});return()=>{active=false;};},[]);
 const matching=catalogue?.roles.find(r=>r.title.toLowerCase()===roleTitle.trim().toLowerCase());
 async function load(){setBusy(true);setError('');try{const draft=await studioRequest<LearningJourney>('/studio/v1-draft',{roleTitle,skillIds:skills.map(s=>s.id)});onLoad(draft);setConfirm(false);}catch(e){setError(e instanceof Error?e.message:'Could not load mission drafts.');}finally{setBusy(false);}}
 return <details className="my-4 rounded-xl border p-4"><summary className="min-h-11 cursor-pointer py-3 font-semibold">V1 mission draft library · 10 roles, 40 master missions</summary>
  <p>Original fictional starter scenarios for editorial review. These are not approved role packs. Loaded drafts autosave after 30 seconds; publication still requires review.</p>
  {catalogue?.limitations.map(line=><p className="my-2" key={line}>{line}</p>)}
  {matching?<><h4 className="mt-3 font-semibold">{matching.title}</h4><ul className="list-disc pl-5">{matching.missions.map(m=><li key={m.title}>{m.kind}: {m.title}</li>)}</ul><p className="my-3">Includes a text lesson, starting sample, coached case, independent case and two fresh alternatives for each mission. Check the skill mapping and replace the simplified scenario records with role-owner-approved detail before review.</p>
   {!confirm?<button type="button" disabled={disabled||busy} className="min-h-11" onClick={()=>hasJourney?setConfirm(true):void load()}>Load this role’s mission drafts</button>:<div role="alert"><p>This replaces the journey in your draft. The studio autosaves after 30 seconds and invalidates earlier draft approvals. Published versions stay unchanged. Use Discard unsaved edits before autosave if you change your mind.</p><button type="button" disabled={disabled||busy} className="min-h-11" onClick={()=>void load()}>{busy?'Loading…':'Replace draft with these missions'}</button><button type="button" className="min-h-11" onClick={()=>setConfirm(false)}>Keep current draft</button></div>}
  </>:catalogue&&<p className="my-3">This package’s role does not match a V1 role. Choose the exact role in the catalogue; another role’s scenarios will not be substituted.</p>}
  <details className="mt-3"><summary className="min-h-11 cursor-pointer py-3">See all V1 roles and missions</summary>{catalogue?.roles.map(role=><section className="my-3" key={role.title}><h4 className="font-semibold">{role.title} · {role.sector}</h4><ul className="list-disc pl-5">{role.missions.map(m=><li key={m.title}>{m.kind}: {m.title}</li>)}</ul></section>)}</details>
  {error&&<p role="alert">{error}</p>}
 </details>;
}
