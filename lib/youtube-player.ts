/** The official YouTube IFrame API; loaded only on pages with embedded videos. */
export type YouTubePlayer={playVideo:()=>void;pauseVideo:()=>void;getPlayerState:()=>number;destroy:()=>void};
type Events={onReady?:(event:{target:YouTubePlayer})=>void;onStateChange?:(event:{data:number;target:YouTubePlayer})=>void};
type YouTubeAPI={Player:new(element:HTMLIFrameElement,options:{events:Events})=>YouTubePlayer};
declare global {interface Window {YT?:YouTubeAPI;onYouTubeIframeAPIReady?:()=>void}}
let pending:Promise<YouTubeAPI>|undefined;
export function youtubePlayerAPI(){
 if(window.YT?.Player)return Promise.resolve(window.YT);
 if(pending)return pending;
 pending=new Promise<YouTubeAPI>((resolve,reject)=>{
  const previous=window.onYouTubeIframeAPIReady;
  const timer=window.setTimeout(()=>{pending=undefined;reject(new Error('YouTube controls could not load.'));},15000);
  window.onYouTubeIframeAPIReady=()=>{try{previous?.();}finally{clearTimeout(timer);if(window.YT)resolve(window.YT);}};
  if(!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')){const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.async=true;script.onerror=()=>{clearTimeout(timer);pending=undefined;script.remove();reject(new Error('YouTube controls could not load.'));};document.head.append(script);}
 });return pending;
}
export function controllableYouTubeURL(src:string,origin:string){
 try{const url=new URL(src);if(!['www.youtube.com','youtube.com','www.youtube-nocookie.com','youtube-nocookie.com'].includes(url.hostname)||!url.pathname.startsWith('/embed/'))return null;url.searchParams.set('enablejsapi','1');url.searchParams.set('origin',origin);return url.href;}catch{return null;}
}
export function videoOutsideViewport(rect:{top:number;bottom:number},height:number){return rect.bottom<=0||rect.top>=height;}
