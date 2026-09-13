import {SimulationPreview} from './simulation-preview';
import {getServerSession} from '@/lib/supabase-server';
import {SimulationWorkspace} from './simulation-workspace';
export const metadata={title:'Simulation workspace'};
export const dynamic='force-dynamic';
export default async function MissionsPage({searchParams}:{searchParams:Promise<{role?:string;preview?:string}>}){
 const session=await getServerSession();const {role,preview}=await searchParams;
 if(!session||preview==='1')return <SimulationPreview signedIn={!!session}/>;
 return <SimulationWorkspace initialRole={role||''}/>;
}
