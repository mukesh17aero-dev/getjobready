import type {PassportAchievement} from '@/lib/api';

export function CaseEvidence({achievement}:{achievement:PassportAchievement}){
 const evidence=achievement.verification;
 if(!evidence)return null;
 return <details className="mt-2 text-sm text-slate-700"><summary className="min-h-11 cursor-pointer py-3 font-semibold">View the actions behind this case result</summary>
  <p>Unseen independent case · Release {evidence.releaseVersion} · Scoring rule {evidence.ruleVersion}</p>
  <p className="my-2">This result describes one case. Confidence is limited to the recorded observations; it does not establish overall job readiness.</p>
  <ul>{evidence.criteria.map(c=><li key={c.id} className="my-3"><strong>{c.label}: {c.score}/100</strong><p>Weight {c.weight}% · {c.observations.length} observations; {c.required} required</p><ul className="list-disc pl-5">{c.observations.map((o,i)=><li key={`${o.actionId}-${i}`}>{o.evidence} ({o.points}/4)</li>)}</ul></li>)}</ul>
  <p className="break-all text-xs">Evidence reference: {achievement.id}</p>
 </details>;
}
