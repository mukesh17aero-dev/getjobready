import {afterEach,describe,it,expect,vi} from 'vitest';
import {readGuestResume} from './guest-resume';
import {resumeCompleteness} from './resume-api';
import {SAMPLE_RESUME} from './starter-resumes';
afterEach(()=>vi.unstubAllGlobals());
describe('guest resume continuity',()=>{
 it('restores a browser draft without adding example facts',()=>{
  const resume={...SAMPLE_RESUME,header:{name:'',city:'',email:''}};
  vi.stubGlobal('localStorage',{getItem:()=>JSON.stringify({resume,template:'professional'})});
  expect(readGuestResume()?.resume.header.name).toBe('');expect(readGuestResume()?.template).toBe('professional');
 });
 it('rejects corrupt and invalid stored drafts safely',()=>{
  for(const raw of ['{broken',JSON.stringify({resume:{header:{name:'Test'}},template:'classic'})]){vi.stubGlobal('localStorage',{getItem:()=>raw});expect(readGuestResume()).toBeNull();}
 });
 it('does not require paid employment when a real project is described',()=>{
  const resume={...SAMPLE_RESUME,experience:[],projects:[{title:'Course project',detail:'Built and tested a task tracker.',tools:[]}]};
  expect(resumeCompleteness(resume).missing.map(item=>item.section)).not.toContain('What you have done');
  expect(resumeCompleteness({...resume,projects:[]}).missing.map(item=>item.section)).toContain('What you have done');
 });
});
