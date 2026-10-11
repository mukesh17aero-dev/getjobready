import {describe,it,expect} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JourneyActivityPlayer} from '@/features/simulation';
import type {LearnerJourneyActivity} from '@/lib/api';
const base:LearnerJourneyActivity={id:'step',type:'quiz',title:'Choose a response',instructions:'Use the policy.',body:'',mediaUrl:'',captionsUrl:'',altText:'',required:true,skillIds:['care'],durationSeconds:60,xp:20,passScore:70,attempts:3,watchedPercent:90,cards:[],questions:[{id:'question',prompt:'What do you do first?',multiple:false,options:[{id:'read',text:'Read the request'},{id:'guess',text:'Guess'}]}],locked:false,state:{answers:{},seen:[],position:0,attempts:0,score:null,completed:false,revision:0}};
const render=(activity:LearnerJourneyActivity)=>renderToStaticMarkup(createElement(JourneyActivityPlayer,{activity,draft:{answers:{question:['read']},seen:[],position:0,watchedSeconds:0},onChange:()=>{}}));
describe('simulation learning activity player',()=>{
 it('renders labelled single-choice controls and restores saved selection without an answer key',()=>{const html=render(base);expect(html).toContain('<legend>');expect(html).toContain('type="radio"');expect(html).toContain('checked=""');expect(html).toContain('Read the request');expect(html).not.toContain('correctOptionIds');});
 it('uses checkboxes for multiple-answer questions',()=>{const html=render({...base,questions:base.questions.map(q=>({...q,multiple:true}))});expect(html).toContain('type="checkbox"');expect(html).toContain('Choose all that apply');});
 it('keeps media captions, image alternatives and transcript accessible',()=>{expect(render({...base,type:'image',mediaUrl:'https://example.test/image.png',altText:'A service desk queue'})).toContain('alt="A service desk queue"');const html=render({...base,type:'video',mediaUrl:'https://example.test/video.mp4',captionsUrl:'https://example.test/captions.vtt',body:'Transcript of the lesson'});expect(html).toContain('kind="captions"');expect(html).toContain('Transcript of the lesson');});
 it('does not reveal flashcard answers until requested',()=>{const html=render({...base,type:'flashcard',cards:[{id:'one',front:'First action?',back:'Private card answer'}]});expect(html).toContain('First action?');expect(html).toContain('Reveal answer');expect(html).not.toContain('Private card answer');});
});
