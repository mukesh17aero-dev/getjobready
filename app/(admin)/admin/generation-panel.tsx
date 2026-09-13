'use client';
import type {GenerationPlan} from '@/lib/admin-studio-api';
import s from './studio.module.css';

type Props = {
 roleTitle:string;
 skills:{id:string;name:string}[];
 scope:string;
 mode:'materials'|'assignments';
 guidance:string;
 busy:boolean;
 dirty:boolean;
 running:boolean;
 pausing:boolean;
 plan:GenerationPlan|null;
 onScope:(value:string)=>void;
 onMode:(value:'materials'|'assignments')=>void;
 onGuidance:(value:string)=>void;
 onGenerate:()=>void;
 onPause:()=>void;
};
export function GenerationPanel(p:Props){return <section className={s.generation} aria-labelledby="generation-title" aria-busy={p.running}>
 <div><span className={s.eyebrow}>Generate for this role</span><h3 id="generation-title">{p.roleTitle}</h3><p>Build role-specific lessons and three workplace simulations for every selected skill. Completed drafts are kept.</p></div>
 <div className={s.cards}>
  <label>Skills to generate<select className={s.previewSelect} disabled={p.busy||p.dirty} value={p.scope} onChange={e=>p.onScope(e.target.value)}><option value="">All {p.skills.length} skills for this role</option>{p.skills.map(skill=><option key={skill.id} value={skill.id}>{skill.name}</option>)}</select></label>
  <label>What to create<select className={s.previewSelect} disabled={p.busy||p.dirty} value={p.mode} onChange={e=>p.onMode(e.target.value as Props['mode'])}><option value="materials">Learning & simulations</option><option value="assignments">Additional assessment sets</option></select></label>
 </div>
 <details><summary>Workplace guidance (optional)</summary><label>Details the generator should follow<textarea disabled={p.busy} value={p.guidance} onChange={e=>p.onGuidance(e.target.value)} placeholder="Industry, products, daily tasks, tools and limits on this role’s authority…"/></label></details>
 {p.mode==='materials'?<p>Includes worked examples, source cards, baseline and reassessment questions, and video storyboards. In Curriculum, admins can optionally render a video after reviewing the storyboard.</p>:<p>Creates the missing alternate question sets from existing skill modules, for three different assessment sets in total.</p>}
 {p.plan&&<div role="status" aria-live="polite"><p><strong>{p.plan.completed} of {p.plan.total} {p.mode==='materials'?'skills':'assessment sets'} saved</strong>{p.running&&p.plan.steps[0]?` · ${p.plan.steps[0].label}`:''}</p><progress aria-label="Generation progress" value={p.plan.completed} max={p.plan.total||1}/></div>}
 <div className={s.actions}>
  <p>{p.dirty?'Save your edits before generating.':'Keep this page open while generating. You can resume saved progress after an interruption.'}</p>
  {p.running?<button className={s.button} disabled={p.pausing} onClick={p.onPause}>{p.pausing?'Pausing after current item…':'Pause after current item'}</button>:<button className={s.primary} disabled={p.busy||p.dirty||!p.skills.length||p.plan?.remaining===0} onClick={p.onGenerate}>{p.plan?.remaining===0?'Selected material is ready':p.mode==='assignments'?'Generate assessment sets':p.scope?'Generate selected skill':'Generate role simulations'} →</button>}
 </div>
</section>;}
