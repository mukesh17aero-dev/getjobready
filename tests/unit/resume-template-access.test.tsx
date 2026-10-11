import {describe,it,expect} from "vitest";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {previewTemplate,previewTemplates} from "@/features/resume";
import {ResumeStudio} from "@/features/resume";
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
 // While payments are off the studio has no plan step and locks nothing.
 it("defers layout selection until the draft, without a payment gate",()=>{
  for(const html of [render(null,true),render(null),render("starter")]){
   expect(html).not.toContain("data-locked");expect(html).not.toContain('inert=""');
   expect(html).not.toContain('aria-label="Template selection"');expect(html).not.toContain("Your preview");
  }
 });
});
