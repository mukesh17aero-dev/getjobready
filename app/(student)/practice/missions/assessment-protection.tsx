'use client';
import {useEffect,useRef,useState} from 'react';
import {protectAssessmentCopy,protectAssessmentInputs} from '@/features/assessment';
import {ScreenGuard} from '@/features/assessment';
import {simulationRequest} from '@/features/simulation';
import s from './simulation.module.css';
export function AssessmentProtection({sessionId,taskId,children}:{sessionId:string;taskId:string;children:React.ReactNode}){
 const root=useRef<HTMLDivElement>(null),dialog=useRef<HTMLDialogElement>(null),[notice,setNotice]=useState('');
 useEffect(()=>{if(!root.current)return;let last=0;const report=(type:string)=>{const now=Date.now();if(now-last<500)return;last=now;void simulationRequest('/activity',{sessionId,taskId,event:{type,at:new Date().toISOString()}}).catch(()=>{});};
 const releaseCopy=protectAssessmentCopy(root.current,action=>{setNotice('Copying assessment questions, reference cards and answers is disabled. Type your own response.');report(action+'_blocked');});
 const releaseInput=protectAssessmentInputs(root.current,action=>{setNotice(action==='print'?'Printing assessment content is disabled.':action==='capture'?'Please do not capture or share assessment questions.':'Pasting and dropping text into assessment answers are disabled. Type your own response.');report(action+'_blocked');});
 const away=()=>{report('focus_left');dialog.current?.showModal();};const back=()=>report('focus_returned');const visibility=()=>{if(document.hidden)away();};
 window.addEventListener('blur',away);window.addEventListener('focus',back);document.addEventListener('visibilitychange',visibility);
 return()=>{releaseCopy();releaseInput();window.removeEventListener('blur',away);window.removeEventListener('focus',back);document.removeEventListener('visibilitychange',visibility);};
 },[sessionId,taskId]);
 return <><dialog ref={dialog} className={s.signInDialog}><h2>Stay in the assessment window</h2><p>A tab or window switch was recorded. Keep this window open while answering.</p><button className={s.primary} onClick={()=>{dialog.current?.close();void simulationRequest('/activity',{sessionId,taskId,event:{type:'focus_acknowledged',at:new Date().toISOString()}}).catch(()=>{});}}>I understand · Continue</button></dialog><ScreenGuard identity={`Ascend reassessment · ${sessionId.slice(0,8)}`}><div ref={root} className={s.protectedAssessment}>{notice&&<p role="alert" className={s.notice}>{notice}</p>}{children}</div></ScreenGuard></>;
}
