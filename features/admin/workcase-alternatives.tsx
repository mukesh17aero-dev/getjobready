'use client';

import type {JourneyActivity} from '@/lib/api/simulation-journey';
import {WorkCaseEditor} from './workcase-editor';

export function WorkCaseAlternatives({activity,onChange}:{activity:JourneyActivity;onChange:(value:JourneyActivity)=>void}){
 const base=activity.workcase,alternatives=activity.workcaseVariants??[];
 if(!base||base.mode!=='verification')return alternatives.length?<p role="alert">Fresh-case alternatives require an independent verification activity. Switch the mode back or remove the alternatives before publishing.</p>:null;
 return <section className="my-5 rounded-xl border p-4"><h4>Fresh cases for repeat attempts</h4>
  <p>A repeat attempt uses an alternative whose facts the candidate has not seen. Keep the same rubric and difficulty; change the situation and choices. Every alternative is included in the publication review. Copying a case alone does not make it fresh.</p>
  {alternatives.map((alternative,index)=><details key={index} className="my-3 rounded-lg border p-3"><summary className="min-h-11 cursor-pointer py-3">Fresh case {index+1}</summary><WorkCaseEditor value={alternative} onChange={next=>onChange({...activity,workcaseVariants:alternatives.map((c,i)=>i===index?next:c)})}/><button type="button" className="min-h-11" onClick={()=>onChange({...activity,workcaseVariants:alternatives.filter((_,i)=>i!==index)})}>Remove fresh case {index+1} from draft</button></details>)}
  <button type="button" className="min-h-11" disabled={alternatives.length>=10} onClick={()=>onChange({...activity,workcaseVariants:[...alternatives,structuredClone(base)]})}>Add a fresh-case draft from this rubric</button>
  {!alternatives.length&&<p>No alternatives yet. Candidates can complete the first attempt, but cannot repeat verification until a fresh case is published.</p>}
 </section>;
}
