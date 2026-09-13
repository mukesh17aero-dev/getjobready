'use client';

import {useEffect,useRef,type ReactNode,type MouseEvent} from 'react';
import s from './simulation.module.css';

export function SimulationLayout({children,pinned}:{children:ReactNode;pinned:boolean}){
 const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const layout=root.current;
  if(!layout)return;
  const header=document.querySelector('body > header');
  const rail=layout.querySelector('aside');
  const measure=()=>{
   layout.style.setProperty('--app-header-height',`${header?.getBoundingClientRect().height??0}px`);
   layout.style.setProperty('--simulation-nav-height',`${rail?.getBoundingClientRect().height??0}px`);
  };
  const observer=new ResizeObserver(measure);
  if(header)observer.observe(header);
  if(rail)observer.observe(rail);
  measure();
  return()=>observer.disconnect();
 },[]);
 function navigate(event:MouseEvent<HTMLDivElement>){
  if(!window.matchMedia('(max-width:900px)').matches||!(event.target instanceof Element)||!event.target.closest('aside button'))return;
  const layout=root.current;
  if(!layout)return;
  layout.querySelectorAll<HTMLDetailsElement>('aside details[open]').forEach(details=>{details.open=false;});
  // Wait for the selected lesson and collapsed navigation to finish laying out.
  requestAnimationFrame(()=>{
   if(!layout.isConnected||document.querySelector('dialog[open]'))return;
   const rail=layout.querySelector('aside');
   layout.style.setProperty('--simulation-nav-height',`${rail?.getBoundingClientRect().height??0}px`);
   const workspace=layout.querySelector<HTMLElement>(':scope > section');
   workspace?.focus({preventScroll:true});
   workspace?.scrollIntoView({block:'start',behavior:'instant'});
  });
 }
 return <div ref={root} className={s.layout} data-pinned={pinned} onClick={navigate}>{children}</div>;
}
