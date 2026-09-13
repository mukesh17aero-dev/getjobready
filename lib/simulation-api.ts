import {API_URL,requestHeaders} from './api';
import {supabaseBrowser} from './supabase-browser';
export type CourseSummary={roleId:string;title:string;version:number;isTest:boolean;skills:number;missions:number;status:'Not started'|'Started'|'In progress'|'Completed';percent:number;completed?:number;total?:number};
export type LearningTask={id:string;title:string;brief:string;cards:{title:string;body:string}[];deliverable:string;stage?:string;hint?:string|null};
export type PracticeFeedback={strengths:{quote:string;note:string}[];improvements:string[];nextAction:string};
export type LearningMedia={expiresAt?:number;video:string;captions:string;poster:string;illustrations:string[];durationSeconds:number};
export type DailyPlanTask={id:string;skillId:string;title:string;kind:'introduction'|'lesson'|'mission'|'reassessment';minutes:number;reason:string;part:number;parts:number};
export type DailyPlan={scheduleStatus?:{state:'on-track'|'behind'|'complete';overdueTasks:number;overdueMinutes:number;dueTasks:number;completedDueTasks:number};version:string;startDate:string;targetDate:string;projectedFinish:string;minutesPerDay:number;remainingMinutes:number;requiredMinutesPerDay:number;fitsTarget:boolean;personalized:boolean;notes:string[];days:{date:string;minutes:number;tasks:DailyPlanTask[]}[]};
export type CourseIntroduction={title:string;objective:string;responsibilities:string[];recruiterExpectations:string[];lesson:{explanation:string;steps:string[];workedExample:string;commonMistakes:string[];illustration:{title:string;body:string}[]};video:{renderId?:string;assetUrl?:string;captionsUrl?:string;reviewed:boolean}};
export type ProgressDestination={view:'introduction'|'learn'|'work'|'reassessment';skillId:string;taskId?:string;title:string};
export type SimulationProgressOverview={version:string;completed:number;total:number;percent:number;status:'Not started'|'Started'|'In progress'|'Completed';drafts:number;stages:{id:string;label:string;completed:number;total:number;locked:boolean}[];skills:{skillId:string;name:string;lesson:boolean;missions:number;totalMissions:number;drafts:number;status:string}[];next:ProgressDestination|null};
export type CourseView={overview:SimulationProgressOverview;roleId:string;title:string;sector:string;version:number;isTest:boolean;session:{id:string;minutesPerDay:number;daysPerWeek:number;learnedSkills:string[];targetDate:string|null;timeZone:string;personalized:boolean;introductionCompleted:boolean}|null;dailyPlan:DailyPlan|null;introduction:CourseIntroduction|null;modules:{skillId:string;name:string;title:string;objective:string;lesson:{explanation:string;steps:string[];workedExample:string;commonMistakes:string[];illustration:{title:string;body:string}[]};video:{renderId?:string;assetUrl?:string;captionsUrl?:string;reviewed:boolean}|null;youtube:{videoId:string;title:string;startSeconds?:number;endSeconds?:number;whyRelevant:string;reviewed:boolean}[];missions:LearningTask[]}[];works:{taskId:string;answer:string;submittedAt:string|null;revision:number;feedback:PracticeFeedback|null}[];reassessment:{unlocked:boolean;count:number;tasks:LearningTask[];previouslySeen:number};progress:{lessons:number;totalLessons:number;missions:number;totalMissions:number;reassessment:number}};
export async function simulationRequest<T>(path:string,body?:unknown,token?:string):Promise<T>{
 if(!token){const {data}=await supabaseBrowser().auth.getSession();token=data.session?.access_token;}
 if(!token)throw new Error('Sign in to open your practice plan.');
 const response=await fetch(`${API_URL}/v1/simulations${path}`,{method:body===undefined?'GET':'POST',headers:requestHeaders({token,json:body!==undefined}),body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(body&&path==='/feedback'?120000:15000)});
 const json=await response.json().catch(()=>null);if(response.status===401&&typeof window!=='undefined')window.location.assign('/login?next='+encodeURIComponent(window.location.pathname+window.location.search));if(!response.ok)throw new Error(json?.error||'Your practice is temporarily unavailable. Please retry.');return json as T;
}

// UI resource cache only. The backend still checks ownership before issuing links.
const lessonMedia=new Map<string,{until:number;value:Promise<LearningMedia>}>();
export function getLessonMedia(sessionId:string,renderId:string):Promise<LearningMedia>{
 const key=`${sessionId}:${renderId}`,cached=lessonMedia.get(key);if(cached&&cached.until>Date.now())return cached.value;
 const entry={until:Date.now()+5*60*1000,value:simulationRequest<LearningMedia>('/media',{sessionId,renderId})};lessonMedia.set(key,entry);if(lessonMedia.size>30)lessonMedia.delete(lessonMedia.keys().next().value!);
 void entry.value.then(media=>{entry.until=Math.min(entry.until,(media.expiresAt??Date.now()+1800000)-60000);}).catch(()=>lessonMedia.delete(key));return entry.value;
}
export function prefetchLessonMedia(course:CourseView){if(!course.session)return;const first=course.modules.find(m=>!course.session?.learnedSkills.includes(m.skillId))||course.modules[0];for(const video of [course.introduction?.video,first?.video])if(video?.renderId)void getLessonMedia(course.session.id,video.renderId).catch(()=>{});}

export type PreviewMedia=Pick<LearningMedia,'video'|'captions'|'durationSeconds'>&{poster?:string;expiresAt?:number};
export type SimulationSample={roleId:string;title:string;version:number;introduction:Omit<CourseIntroduction,'video'>&{media:PreviewMedia|null};lesson:Omit<CourseView['modules'][number],'video'|'youtube'>&{media:PreviewMedia|null;youtube:{videoId:string;title:string;startSeconds?:number;endSeconds?:number}[]};assessment:LearningTask;plan:{view:'introduction'|'learn'|'work'|'assess';title:string;minutes:number}[]};
export async function getSimulationSample():Promise<SimulationSample>{
 const response=await fetch(`${API_URL}/v1/simulations/preview`,{headers:requestHeaders({}),cache:'no-store',signal:AbortSignal.timeout(15000)});
 const data=await response.json().catch(()=>null);
 if(!response.ok)throw new Error(data?.error||'The simulation preview is temporarily unavailable. Please retry.');
 return data as SimulationSample;
}
