import {describe,it,expect} from "vitest";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {previewTemplate,previewTemplates} from "@/features/resume";
import {ResumeStudio} from "@/app/(student)/resume/build/resume-studio";
import type {PlanId} from "@/features/resume";

function render(plan:PlanId|null,signedOut=false){
 return renderToStaticMarkup(createElement(ResumeStudio,{target:null,signedOut,profile:{version:1,createdAt:"2026-09-11",education:[],experience:[],projects:[],achievements:[],preferences:plan?{resumePlan:plan}:{}}}));
}
describe("selected-plan template preview",()=>{
 it("keeps guests on Basic even with a plan choice",()=>{
  for(const plan of [null,"starter","plus","pro"] as const) expect(previewTemplates(plan,true)).toEqual(["classic"]);
 });
 it("does not unlock a default highlighted plan before it is chosen",()=>{
  expect(previewTemplates(null,false)).toEqual(["classic"]);
 });
 it("offers three layouts for Starter and six for Plus and Pro",()=>{
  expect(previewTemplates("starter",false)).toEqual(["classic","compact","sidebar"]);
  expect(previewTemplates("plus",false)).toHaveLength(6);expect(previewTemplates("pro",false)).toHaveLength(6);
 });
 it("clamps a saved premium layout when the current choice no longer includes it",()=>{
  expect(previewTemplate("professional",previewTemplates("starter",false))).toBe("classic");
  expect(previewTemplate("sidebar",previewTemplates("starter",false))).toBe("sidebar");
  expect(previewTemplate("professional",previewTemplates("plus",false))).toBe("professional");
 });
 it("renders one clear Basic card and five inert thumbnails for an unsigned visitor",()=>{
  const html=render("plus",true);expect(html.match(/data-locked="true"/g)).toHaveLength(5);expect(html.match(/data-locked="false"/g)).toHaveLength(1);expect(html.match(/inert=""/g)).toHaveLength(5);expect(html).toContain('aria-label="Preview Basic"');expect(html).toContain("Preview · Basic");
 });
 it("renders the correct locks for signed-in plan selections",()=>{
  expect(render(null).match(/data-locked="true"/g)).toHaveLength(5);
  expect(render("starter").match(/data-locked="true"/g)).toHaveLength(3);
  expect(render("plus")).not.toContain('data-locked="true"');
 });
});
