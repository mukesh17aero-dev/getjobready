import {describe,it,expect,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import type {PassportAchievement} from '@/lib/api';
import {CaseEvidence} from './case-evidence';
import {PassportShowcase} from './passport-showcase';

vi.mock('next/navigation',()=>({useRouter:()=>({refresh:vi.fn()})}));
const item:PassportAchievement={id:'workcase:run:case',kind:'training',title:'Independent case',detail:'One case only',at:'2026-10-03T00:00:00Z',state:'scored',score:100,verification:{roleId:'support',runId:'run',activityId:'case',releaseVersion:2,ruleVersion:3,equivalenceGroup:'policy',caseFingerprint:'hash',confidence:'medium',scope:'case',unseen:true,criteria:[{id:'policy',label:'Policy check',score:100,weight:100,required:1,observations:[{points:4,actionId:'inspect',evidence:'Checked <private> record & authority.'}]}]}};
describe('case-level Passport evidence',()=>{
 it('shows exact observations and rule versions without promoting one case to role readiness',()=>{const html=renderToStaticMarkup(<CaseEvidence achievement={item}/>);expect(html).toContain('Scoring rule 3');expect(html).toContain('Release 2');expect(html).toContain('Checked &lt;private&gt; record &amp; authority.');expect(html).toContain('does not establish overall job readiness');expect(html).toContain('Evidence reference');});
 it('adds no verification wording to an ordinary submitted training achievement',()=>{expect(renderToStaticMarkup(<CaseEvidence achievement={{...item,verification:undefined}}/>)).toBe('');});
 it('links owners to the exact attempt and never gives recipients private report links',()=>{const props={showcase:[{kind:'training' as const,pinned:false,item}],roleTitle:'Support'};const owner=renderToStaticMarkup(<PassportShowcase {...props} editable/>);expect(owner).toContain('/practice/missions?role=support&amp;run=run&amp;activity=case');const shared=renderToStaticMarkup(<PassportShowcase {...props} editable={false}/>);expect(shared).not.toContain('/practice/missions?');expect(shared).toContain('Policy check');});
});
