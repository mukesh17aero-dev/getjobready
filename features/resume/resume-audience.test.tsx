import {describe,it,expect} from "vitest";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {ResumeSetup} from "./resume-setup";
import {resumeSections} from "./resume-section-editor";
const props={profile:null,suggestions:[],token:async()=>null,onSaved:()=>{},step:"experience" as const,onStep:()=>{}};
describe("audience-specific resume guidance",()=>{
 it("asks for professional evidence before education for working users",()=>{
  const html=renderToStaticMarkup(createElement(ResumeSetup,{...props,track:"early_career"}));
  expect(html.indexOf("Work experience")).toBeLessThan(html.indexOf("Your education"));
  for(const field of ["Employer", "Scope and responsibilities", "Tools used", "Achievements and outcomes", "Evidence source"])expect(html).toContain(field);
  expect(html).toContain('value="job" selected=""');expect(html).not.toContain("No job yet?");expect(html).not.toContain("Registration desk lead, college fest");
 });
 it("keeps education and projects early for students",()=>{
  const html=renderToStaticMarkup(createElement(ResumeSetup,{...props,track:"student"}));
  expect(html).toContain("family-business contribution counts");expect(html).toContain('value="project" selected=""');
  const sections=resumeSections("student").map(item=>item[0]);expect(sections.indexOf("education")).toBeLessThan(sections.indexOf("experience"));
 });
 it("only reorders sections and never removes content options when switching",()=>{
  expect(resumeSections("early_career").map(item=>item[0]).sort()).toEqual(resumeSections("student").map(item=>item[0]).sort());
 });
});
