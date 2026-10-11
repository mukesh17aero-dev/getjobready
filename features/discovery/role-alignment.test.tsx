import {describe,it,expect} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {AlignmentContent,RoleAlignment,type Alignment} from './role-alignment';
const empty:Alignment={roleId:'support',interest:[],background:[],strengths:[],growth:[],unassessed:['Prioritisation'],next:{label:'Explore your role readiness',href:'/practice/readiness?role=support'}};
describe('role alignment explanations',()=>{
 it('hides sections without evidence and unassessed requirement lists',()=>{
  const html=renderToStaticMarkup(createElement(AlignmentContent,{alignment:empty}));
  expect(html).not.toContain('<h3>');expect(html).not.toContain('No demonstrated strengths');expect(html).not.toContain('No development feedback');expect(html).not.toContain('Still to explore');expect(html).not.toContain('Prioritisation');expect(html).not.toMatch(/\bscore\b|\d+%|STRONG FIT/);
 });
 it('shows provenance and links back to the recorded evidence',()=>{
  const html=renderToStaticMarkup(createElement(AlignmentContent,{alignment:{...empty,strengths:[{text:'You explained the next steps clearly.',source:'Assessment feedback · 2026-10-07',href:'/practice/readiness/results/own-run'}]}}));
  expect(html).toContain('Assessment feedback');expect(html).toContain('/practice/readiness/results/own-run');expect(html).toContain('Explore jobs');expect(html).toContain('href="/opportunities"');expect(html).not.toContain('Use my experience to assess fit');expect(html).not.toContain('Explore your role readiness');expect(html).not.toContain('href="/job-fit"');
 });
 it('shows provided background without the profile skills source link or empty groups',()=>{
  const html=renderToStaticMarkup(createElement(AlignmentContent,{alignment:{...empty,background:[{text:'You list Communication.',source:'Profile skills · self-reported',href:'/profile'}],growth:[{text:'  ',source:'Assessment'}]}}));
  expect(html).toContain('What you bring');expect(html).toContain('You list Communication.');expect(html).not.toContain('Profile skills');expect(html).not.toContain('href="/profile"');expect(html).not.toContain('Areas to develop');expect(html).not.toContain('Strengths demonstrated');
 });
 it('hides industry and profile source labels while keeping the explanation',()=>{
  const html=renderToStaticMarkup(createElement(AlignmentContent,{alignment:{...empty,interest:[{text:'This role is in an industry you selected.',source:'Your industry preference'},{text:'Your stated career goal.',source:'Profile · self-reported',href:'/profile'}]}}));
  expect(html).toContain('This role is in an industry you selected.');expect(html).toContain('Your stated career goal.');expect(html).not.toContain('Your industry preference');expect(html).not.toContain('self-reported');expect(html).not.toContain('href="/profile"');
 });
 it('asks guests to sign in without inventing personal findings',()=>{
  const html=renderToStaticMarkup(createElement(RoleAlignment,{roleId:'support',signedOut:true}));expect(html).toContain('Sign in');expect(html).not.toContain('Strengths demonstrated');
 });
});
