import {describe,it,expect} from "vitest";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {ServiceEntry} from "./service-entry";
describe("direct service entry",()=>{
 it("gives first-job users direct access without requiring a full plan",()=>{
  const html=renderToStaticMarkup(createElement(ServiceEntry,{}));
  expect(html).toContain("Find a direction and build proof.");
  expect(html).toContain("Build my first resume");expect(html).toContain('href="/resume/build?profileType=student"');expect(html).toContain("Start with:");expect(html).toContain("Leave with:");
 });
 it("keeps the exact selected role in experienced entry links",()=>{
  const html=renderToStaticMarkup(createElement(ServiceEntry,{initialTrack:"early_career",role:{id:"operations_executive",title:"Operations Executive",pitch:"",payMonthly:null,next:null}}));
  expect(html).toContain("Turn your experience into your next opportunity.");expect(html).toContain("Improve my resume");expect(html).toContain("roleId=operations_executive");expect(html).not.toContain("Customer Success");expect(html).not.toContain("79/100");
 });
 it("ends each card at what you leave with, with no readiness footnote, on both tracks",()=>{
  for(const initialTrack of ["student","early_career"] as const){
   const html=renderToStaticMarkup(createElement(ServiceEntry,{initialTrack}));
   for(const gone of ["no readiness score","separate from role readiness","Does not change readiness","Readiness impact explained"]) expect(html).not.toContain(gone);
   expect(html).toMatch(/<b>Leave with:<\/b> [^<]*<\/p><\/a>/);
  }
 });
 it("shows an explicit disclosure action for the preparation path",()=>{
  const closed=renderToStaticMarkup(createElement(ServiceEntry,{}));
  const open=renderToStaticMarkup(createElement(ServiceEntry,{pathOpen:true}));
  expect(closed).toContain("Show your preparation path");
  expect(closed).toContain('aria-controls="full-path"');
  expect(closed).toContain('aria-expanded="false"');
  expect(open).toContain("Hide your preparation path");
  expect(open).toContain('aria-expanded="true"');
  expect(open).not.toContain("↓");
 });
 it("shows the five more tools in the requested order",()=>{
  const html=renderToStaticMarkup(createElement(ServiceEntry,{}));
  const labels=["Check job fit","Browse jobs","Skills Passport","Interview stories","Roleplay"];
  const positions=labels.map(label=>html.indexOf(`${label} <span aria-hidden="true">↗</span>`));
  expect(positions.every(position=>position>=0)).toBe(true);
  expect(positions).toEqual([...positions].sort((a,b)=>a-b));
  for(const path of ["/job-fit","/opportunities","/passport","/stories","/roleplay"]){
   expect(html).toContain(`href="${path}?profileType=student"`);
  }
 });
});
