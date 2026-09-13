import {describe, it, expect} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ReviewSnapshot} from '@/app/(admin)/admin/review-snapshot';
import {youtubeVideoId, playbackSeconds, youtubeEmbedUrl} from '@/lib/youtube-playback';
const render = (resource: string, value: unknown) => renderToStaticMarkup(createElement(ReviewSnapshot, {resource, value}));
describe('fixed revision UI previews', () => {
 it('shows submitted role details and preserves additional fields without raw JSON', () => {
  const html = render('content:role_catalogue', {roles:[{id:'retail',title:'Retail role',summary:'Submitted summary'}],details:[{roleId:'retail',pitch:'Submitted pitch',description:'Submitted description',responsibilities:['Count stock'],skills:[{name:'Accuracy',why:'Protect stock'}],hardTruths:['Busy weekends'],customNote:'Review this too'}]});
  for(const content of ['Submitted summary','Submitted pitch','Submitted description','Count stock','Busy weekends','Review this too']) expect(html).toContain(content);
  expect(html).not.toContain('<pre>');
 });
 it('limits an interview bank to five visible question cards with page navigation', () => {
  const html = render('content:interview_bank', {sets:[{roleTitle:'Sales',questions:Array.from({length:8},(_,i)=>({question:`Scenario ${i+1}`,round:'hr',looksLike:'Listen before proposing'}))}]});
  expect(html).toContain('Scenario 5'); expect(html).not.toContain('Scenario 6'); expect(html).toContain('Page 1 of 2'); expect(html).toContain('Listen before proposing');
 });
 it('separates assessment instructions and reviewer criteria', () => {
  const html=render('content:assessment_arc',{arcs:[{roleTitle:'Retail',company:'Example store',scenes:[{title:'Stock check',brief:'Compare these records',fields:['Variance note'],criteria:['Find the missing unit'],measures:['accuracy']}]}]});
  for(const content of ['Compare these records','Variance note','Skills &amp; reviewer guidance','Find the missing unit']) expect(html).toContain(content);
 });
});
describe('YouTube playback configuration', () => {
 it('accepts supported YouTube links and rejects lookalike hosts',()=>{
  expect(youtubeVideoId('https://youtu.be/M7lc1UVf-VE?t=20')).toBe('M7lc1UVf-VE');
  expect(youtubeVideoId('https://www.youtube.com/watch?v=M7lc1UVf-VE')).toBe('M7lc1UVf-VE');
  expect(youtubeVideoId('https://youtube.com.evil.test/watch?v=M7lc1UVf-VE')).toBeUndefined();
 });
 it('uses absolute end timestamps and supports full-video playback',()=>{
  expect(playbackSeconds('4:00')).toBe(240); expect(playbackSeconds('4:70')).toBeUndefined();
  const url=new URL(youtubeEmbedUrl({videoId:'M7lc1UVf-VE',startSeconds:30,endSeconds:240})!); expect(url.searchParams.get('start')).toBe('30'); expect(url.searchParams.get('end')).toBe('240'); expect(url.searchParams.get('playsinline')).toBe('1');
  expect(youtubeEmbedUrl({videoId:'M7lc1UVf-VE'})).not.toContain('end=');
 });
});

import {GenerationPanel} from '@/app/(admin)/admin/generation-panel';
describe('central role generation controls',()=>{
 const props={roleTitle:'Customer Success Associate',skills:[{id:'care',name:'Customer care'},{id:'writing',name:'Writing'}],scope:'',mode:'materials' as const,guidance:'',busy:false,dirty:false,running:false,pausing:false,plan:null,onScope:()=>{},onMode:()=>{},onGuidance:()=>{},onGenerate:()=>{},onPause:()=>{}};
 it('offers all skills and individual skills with only one generation button',()=>{const html=renderToStaticMarkup(createElement(GenerationPanel,props));expect(html).toContain('All 2 skills for this role');expect(html).toContain('Customer care');expect(html).toContain('Generate role simulations');expect(html.match(/<button/g)).toHaveLength(1);});
 it('shows checkpoint progress and pause instead of a second generation action',()=>{const html=renderToStaticMarkup(createElement(GenerationPanel,{...props,busy:true,running:true,plan:{total:2,completed:1,remaining:1,steps:[{skillId:'writing',skillName:'Writing',action:'generate',label:'Writing · lesson and three simulations'}]}}));expect(html).toContain('1 of 2');expect(html).toContain('Pause after current item');expect(html).not.toContain('Generate role simulations');});
});
