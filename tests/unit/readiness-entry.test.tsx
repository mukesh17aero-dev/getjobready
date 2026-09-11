import {describe,it,expect,vi,beforeEach} from "vitest";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import Page from "@/app/(student)/practice/readiness/page";
const api=vi.hoisted(()=>({getJourneyState:vi.fn(),listAssessableRoles:vi.fn(),getPreviewAssessmentRoles:vi.fn()}));
const session=vi.hoisted(()=>vi.fn());
vi.mock("@/lib/api",()=>api);
vi.mock("@/lib/supabase-server",()=>({getServerSession:session}));
vi.mock("@/components/back-link",()=>({BackLink:()=>null}));
vi.mock("@/components/assessment-run",()=>({AssessmentRun:()=>createElement("p",null,"Assessment opened")}));
vi.mock("@/app/(student)/practice/readiness/start-screen",()=>({ReadinessStart:({initialRoleId}:{initialRoleId:string})=>createElement("p",null,`Selected: ${initialRoleId}`)}));
const current={id:"customer_success_associate",title:"Customer Success Associate"};
const role=(roleId:string)=>({roleId,roleTitle:roleId,chosen:false,current:false,hasAssessment:true,sittings:0,lastReadiness:null});
beforeEach(()=>{vi.clearAllMocks();session.mockResolvedValue({access_token:"test-token"});api.getJourneyState.mockResolvedValue({progress:{role:current}});api.listAssessableRoles.mockResolvedValue({roles:[role(current.id)]});});
async function render(params:{role?:string;begin?:string}={}){return renderToStaticMarkup(await Page({searchParams:Promise.resolve(params)}));}
describe("readiness entry",()=>{
 it("preserves a saved role when the assessment service fails",async()=>{
  api.listAssessableRoles.mockResolvedValue(null);const html=await render({begin:"1"});
  expect(html).toContain("Customer Success Associate");expect(html).toContain("couldn’t load your assessments");expect(html).toContain("do not need to choose it again");expect(html).not.toContain("Choose a job first");expect(html).not.toContain("Assessment opened");
 });
 it("distinguishes an empty published list from a failed request",async()=>{
  api.listAssessableRoles.mockResolvedValue({roles:[]});const html=await render();expect(html).toContain("No assessments are available yet");expect(html).not.toContain("couldn’t load");expect(html).toContain("Customer Success Associate");
 });
 it("preselects the saved direction even if it is not first in the API list",async()=>{
  api.listAssessableRoles.mockResolvedValue({roles:[role("operations_executive"),role(current.id)]});expect(await render()).toContain(`Selected: ${current.id}`);
 });
 it("honours an explicitly requested offered role",async()=>{
  api.listAssessableRoles.mockResolvedValue({roles:[role(current.id),role("operations_executive")]});expect(await render({role:"operations_executive"})).toContain("Selected: operations_executive");
 });
 it("shows a service error to guests when the public list fails",async()=>{
  session.mockResolvedValue(null);api.getPreviewAssessmentRoles.mockResolvedValue(null);const html=await render();expect(html).toContain("couldn’t load your assessments");expect(html).not.toContain("Choose a job first");
 });
});
