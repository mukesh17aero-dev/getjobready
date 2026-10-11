"use client";
import {useEffect,useState,type Dispatch,type SetStateAction} from 'react';
import {z} from 'zod';
import type {TourNote} from './role-tour';
type Stage='roles'|'itinerary'|'role'|'tour'|'tour-done';
const KEY='ascend:tour-memory:v1';
const note=z.object({roleId:z.string(),title:z.string(),thoughts:z.string().max(20000),reaction:z.enum(['curious','not-for-me']).optional(),leastWanted:z.string().optional(),asked:z.array(z.string()).max(100)});
export const tourMemorySchema=z.object({stage:z.enum(['roles','itinerary','role','tour','tour-done']),picks:z.array(z.string()).max(20),itinerary:z.array(z.string()).max(20).nullable(),at:z.number().int().min(0).max(19),notes:z.array(note).max(20),savedAt:z.number()});
export function useTourMemory(stage:Stage,setStage:Dispatch<SetStateAction<Stage>>,initialRole:string|null){
 const [tourPicks,setTourPicks]=useState<string[]>([]);
 const [itinerary,setItinerary]=useState<string[]|null>(null);
 const [tourAt,setTourAt]=useState(0);
 const [tourNotes,setTourNotes]=useState<TourNote[]>([]);
 const [ready,setReady]=useState(false);
 useEffect(()=>{
  // Hydrate tab-scoped browser state after SSR; never store account tokens or publish notes here.
  try{const parsed=tourMemorySchema.safeParse(JSON.parse(sessionStorage.getItem(KEY)??'null'));
   if(parsed.success&&Date.now()-parsed.data.savedAt<86400000){const saved=parsed.data;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTourPicks(saved.picks);setItinerary(saved.itinerary);setTourAt(saved.at);setTourNotes(saved.notes);
    if(!initialRole&&['tour','tour-done','itinerary'].includes(saved.stage))setStage(saved.stage);
   }
  }catch{ /* Browsing remains usable when tab storage is unavailable. */ }
  setReady(true);
 },[initialRole,setStage]);
 useEffect(()=>{if(!ready)return;try{sessionStorage.setItem(KEY,JSON.stringify({stage,picks:tourPicks,itinerary,at:tourAt,notes:tourNotes,savedAt:Date.now()}));}catch{/* Keep the current tour usable in memory. */}},[ready,stage,tourPicks,itinerary,tourAt,tourNotes]);
 return {tourPicks,setTourPicks,itinerary,setItinerary,tourAt,setTourAt,tourNotes,setTourNotes};
}
