"use client";
import {useState} from 'react';
import type {UserIdentity} from '@supabase/supabase-js';
import {supabaseBrowser} from '@/lib/supabase-browser';
import {getCareerRecord,saveNotificationPreferences,type NotificationPreferences} from '@/lib/api';
import {ConfirmDialog} from '@/components/ui/confirm-dialog';

export function AccountSettings({preferences,identities:initialIdentities}:{preferences:NotificationPreferences|null;identities:UserIdentity[]}){
 const [prefs,setPrefs]=useState(preferences);
 const [identities,setIdentities]=useState(initialIdentities);
 const [pending,setPending]=useState<UserIdentity|null>(null);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 async function token(){const {data}=await supabaseBrowser().auth.getSession();if(!data.session)throw new Error('Your session expired. Sign in again.');return data.session.access_token;}
 async function notification(value:boolean){setBusy(true);setMessage('');try{const result=await saveNotificationPreferences(await token(),value);if(!result)throw new Error('Could not save notification preferences. Try again.');setPrefs(result);setMessage('Notification preference saved.');}catch(e){setMessage(e instanceof Error?e.message:'Could not save.');}finally{setBusy(false);}}
 async function exportRecord(){setBusy(true);setMessage('');try{const record=await getCareerRecord(await token());if(!record)throw new Error('Could not download your career record. Try again.');const blob=new Blob([JSON.stringify({formatVersion:1,exportedAt:new Date().toISOString(),scope:['current profile','career claims','saved resumes and profile preferences'],...record},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='ascend-career-record.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage('Career record downloaded.');}catch(e){setMessage(e instanceof Error?e.message:'Download failed.');}finally{setBusy(false);}}
 async function unlink(){if(!pending)return;setBusy(true);setMessage('');try{const auth=supabaseBrowser().auth;const current=await auth.getUserIdentities();if(current.error)throw current.error;if(current.data.identities.length<2)throw new Error('Keep at least one sign-in method connected.');const result=await auth.unlinkIdentity(pending);if(result.error)throw result.error;setIdentities(current.data.identities.filter(item=>item.id!==pending.id));setPending(null);setMessage('Sign-in method disconnected.');}catch(e){setMessage(e instanceof Error?e.message:'Could not disconnect.');}finally{setBusy(false);}}
 const panel='mt-6 rounded-xl border border-slate-200 bg-surface p-5';
 const button='mt-3 min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold';
 return <>
 <section className={panel}><h2 className="font-semibold">Email preferences</h2><p className="my-2 text-sm">Choose whether to receive optional career and practice emails. Account security and privacy receipts are unaffected.</p>{prefs?<label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={prefs.optionalEmail} disabled={busy} onChange={e=>void notification(e.target.checked)}/>Optional career and practice emails</label>:<p role="alert">Preferences could not be loaded. Reload to try again.</p>}</section>
 <section className={panel}><h2 className="font-semibold">Connected sign-in methods</h2><p className="my-2 text-sm">Keep at least one method so you can access your account.</p><ul>{identities.map(identity=><li key={identity.id} className="flex min-h-11 items-center justify-between gap-3"><span>{identity.provider}</span>{identity.provider!=='email'&&<button className={button} disabled={busy||identities.length<2} onClick={()=>setPending(identity)}>Disconnect {identity.provider}</button>}</li>)}</ul>{!identities.length&&<p>No connected providers were returned. Your current session remains active.</p>}</section>
 <section className={panel}><h2 className="font-semibold">Download your career record</h2><p className="my-2 text-sm">Get your current profile, career claims, saved resumes and profile preferences as JSON. This download does not include interview recordings, assessment history or simulation attempts.</p><button className={button} disabled={busy} onClick={()=>void exportRecord()}>Download career record</button></section>
 {message&&<p className="mt-4" role="status">{message}</p>}
 {pending&&<ConfirmDialog title={`Disconnect ${pending.provider}?`} body="You will need one of your remaining sign-in methods next time. This does not delete your career record." confirmLabel="Disconnect" busy={busy} onConfirm={()=>void unlink()} onClose={()=>setPending(null)}/>}
 </>;
}
