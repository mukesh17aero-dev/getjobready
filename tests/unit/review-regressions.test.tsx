import {describe,it,expect,vi} from 'vitest';
import {createElement,type KeyboardEvent} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {radioNavigation} from '@/components/ui/radio-navigation';
import {TourReflection,TOUR_LENGTHS,MINUTES_PER_ROLE} from '@/features/discovery';

describe('UX review regressions',()=>{
 it('moves, selects and wraps radio choices with arrow keys while leaving Tab alone',()=>{
  const radios=Array.from({length:3},()=>({focus:vi.fn(),click:vi.fn()}));
  const event=(key:string,index:number)=>({key,target:radios[index],currentTarget:{querySelectorAll:()=>radios},preventDefault:vi.fn()}) as unknown as KeyboardEvent<HTMLElement>;
  radioNavigation(event('ArrowRight',2));expect(radios[0].focus).toHaveBeenCalledOnce();expect(radios[0].click).toHaveBeenCalledOnce();
  radioNavigation(event('End',0));expect(radios[2].click).toHaveBeenCalledOnce();
  const tab=event('Tab',0);radioNavigation(tab);expect(tab.preventDefault).not.toHaveBeenCalled();
 });
 it('summarises only expressed preferences and supplies a next action',()=>{
  const html=renderToStaticMarkup(createElement(TourReflection,{notes:[{roleId:'ops',title:'Operations',thoughts:'I like coordinating work',reaction:'curious',asked:[]},{roleId:'sales',title:'Sales',thoughts:'Not for me',reaction:'not-for-me',asked:[]}],roles:[],selectedRole:null,busy:false,onChoose:()=>{},onOpen:()=>{},onBrowse:()=>{}}));
  expect(html).toContain('You marked Operations as interesting.');expect(html).toContain('You marked Sales as not for you.');expect(html).toContain('Explore Operations next');expect(html).not.toContain('dream role');expect(html).toContain('not an ability assessment');
 });
 it('uses consistent tour duration estimates',()=>{for(const length of TOUR_LENGTHS)expect(length.minutes).toBe(length.roles*MINUTES_PER_ROLE);});
});
