"use client";
import {useEffect,useRef,useState} from "react";
const KEY="ascend:role-filters:v1";
export function useBrowseFilters() {
 const [search,setSearch]=useState("");const [industry,setIndustry]=useState("all");
 const [experience,setExperience]=useState("all");
 const ready=useRef(false);
 useEffect(()=>{
  const timer=setTimeout(()=>{
   try {const value=JSON.parse(sessionStorage.getItem(KEY)??"null") as {search?:unknown;industry?:unknown;experience?:unknown}|null;if(value){if(typeof value.search==="string")setSearch(value.search);if(typeof value.industry==="string")setIndustry(value.industry);if(["student","early_career","all"].includes(String(value.experience)))setExperience(String(value.experience));}}catch{/* Filters are optional when storage is unavailable. */}
   ready.current=true;
  },0);
  return()=>clearTimeout(timer);
 },[]);
 useEffect(()=>{if(ready.current)try{sessionStorage.setItem(KEY,JSON.stringify({search,industry,experience}));}catch{/* Keep the current filters in memory. */}},[search,industry,experience]);
 return {search,setSearch,industry,setIndustry,experience,setExperience};
}
