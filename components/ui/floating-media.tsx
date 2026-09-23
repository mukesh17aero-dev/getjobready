'use client';
import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {controllableYouTubeURL,videoOutsideViewport,youtubePlayerAPI,type YouTubePlayer} from './youtube-player';
import s from './floating-media.module.css';
type Media={element:HTMLVideoElement|HTMLIFrameElement;play:()=>void;pause:()=>void;playing:boolean};
type Commands={restore:()=>void;close:()=>void};
export function FloatingMedia(){
 const [floating,setFloating]=useState<{playing:boolean;canRestore:boolean}|null>(null),commands=useRef<Commands|null>(null);
 useEffect(()=>{
  let active:Media|null=null,placeholder:HTMLDivElement|null=null,disposed=false,returning=false,frame=0;
  const native=new Map<HTMLVideoElement,Media>(),embedded=new Map<HTMLIFrameElement,{player?:YouTubePlayer;media:Media}>();
  function restore(scroll=false){if(scroll)returning=true;const element=active?.element;if(placeholder){element?.classList.remove(s.floating);placeholder.remove();placeholder=null;}setFloating(null);if(scroll&&element?.isConnected){element.focus({preventScroll:true});element.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}}
  function check(){frame=0;if(!active)return;if(!active.element.isConnected){restore();active=null;return;}if(document.fullscreenElement){restore();return;}
   const rect=(placeholder??active.element).getBoundingClientRect(),outside=videoOutsideViewport(rect,innerHeight);
   if(!outside){returning=false;if(placeholder)restore();return;}if(returning)return;if(!active.playing&&!placeholder)return;
   if(!placeholder){const original=active.element.getBoundingClientRect();placeholder=document.createElement('div');placeholder.style.height=`${original.height}px`;placeholder.style.width='100%';placeholder.setAttribute('aria-hidden','true');active.element.before(placeholder);active.element.classList.add(s.floating);}
   const canRestore=active.element instanceof HTMLVideoElement;setFloating(old=>old?.playing===active?.playing&&old?.canRestore===canRestore?old:{playing:!!active?.playing,canRestore});
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(check);}
  function started(media:Media){if(active&&active!==media){active.pause();restore();}if(active!==media)returning=false;active=media;media.playing=true;schedule();}
  function stopped(media:Media,ended=false){media.playing=false;if(active===media){if(ended)restore();else if(placeholder)setFloating({playing:false,canRestore:media.element instanceof HTMLVideoElement});}}
  function nativeEvent(event:Event){const element=event.target;if(!(element instanceof HTMLVideoElement)||element.srcObject||element.getAttribute('aria-hidden')==='true'||(element.autoplay&&element.loop&&element.muted))return;let media=native.get(element);if(!media){media={element,playing:false,play:()=>{void element.play().catch(()=>{});},pause:()=>element.pause()};native.set(element,media);}if(event.type==='play')started(media);else stopped(media,event.type==='ended');}
  function scan(){
   for(const [element,entry] of embedded)if(!element.isConnected){entry.player?.destroy();embedded.delete(element);}
   for(const element of native.keys())if(!element.isConnected)native.delete(element);
   document.querySelectorAll<HTMLIFrameElement>('iframe[src]').forEach(element=>{
    if(embedded.has(element))return;const src=controllableYouTubeURL(element.src,location.origin);if(!src)return;
    const entry:{player?:YouTubePlayer;media:Media}={media:{element,playing:false,play:()=>entry.player?.playVideo(),pause:()=>entry.player?.pauseVideo()}};embedded.set(element,entry);
    // Existing embeds are API-enabled before the learner starts playback.
    if(element.src!==src)element.src=src;
    void youtubePlayerAPI().then(api=>{if(disposed||!element.isConnected)return;entry.player=new api.Player(element,{events:{onReady:event=>{entry.player=event.target;if(event.target.getPlayerState()===1)started(entry.media);},onStateChange:event=>{if(disposed||!element.isConnected)return;if(event.data===1)started(entry.media);else if(event.data===0||event.data===2)stopped(entry.media,event.data===0);}}});}).catch(()=>{/* The normal embedded controls remain usable if the API is blocked. */});
   });schedule();
  }
  commands.current={restore:()=>restore(true),close:()=>{active?.pause();restore();active=null;}};
  for(const event of ['play','pause','ended'])document.addEventListener(event,nativeEvent,true);
  document.addEventListener('scroll',schedule,true);window.addEventListener('resize',schedule);document.addEventListener('fullscreenchange',schedule);
  const observer=new MutationObserver(scan);observer.observe(document.body,{childList:true,subtree:true});scan();
  return()=>{disposed=true;observer.disconnect();cancelAnimationFrame(frame);restore();commands.current=null;for(const event of ['play','pause','ended'])document.removeEventListener(event,nativeEvent,true);document.removeEventListener('scroll',schedule,true);window.removeEventListener('resize',schedule);document.removeEventListener('fullscreenchange',schedule);};
 },[]);
 if(!floating)return null;
 return createPortal(<div className={s.controls} data-external={!floating.canRestore} role="group" aria-label="Floating video controls">{floating.canRestore&&<button onClick={()=>commands.current?.restore()} aria-label="Return to original video" title="Restore video"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M9 4H4v5M4 4l8 8M15 20h5v-5M20 20l-8-8"/></svg></button>}<button onClick={()=>commands.current?.close()} aria-label="Close and pause floating video" title="Close video"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div>,document.body);
}
