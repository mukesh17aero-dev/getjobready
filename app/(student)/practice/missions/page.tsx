import {SimulationLearning} from '@/features/simulation';
import {SimulationPreview} from './simulation-preview';
import {getJourneyState} from '@/lib/api';
import {getServerSession} from '@/lib/supabase-server';
import {SimulationWorkspace} from './simulation-workspace';
export const metadata={title:'Simulation workspace'};
export const dynamic='force-dynamic';
export default async function MissionsPage({searchParams}:{searchParams:Promise<{role?:string;preview?:string;task?:string;mode?:string}>}){
 const session=await getServerSession();const {role,preview,task,mode}=await searchParams;
 if(!session||preview==='1')return <SimulationPreview signedIn={!!session}/>;
 const journey=role?null:await getJourneyState(session.access_token);
 const initialRole=role||journey?.progress?.role?.id||'';
 return <SimulationLearning initialRole={initialRole} initialClassic={mode==='missions'} legacy={<SimulationWorkspace initialRole={initialRole} initialTask={task}/>}/>;
}
