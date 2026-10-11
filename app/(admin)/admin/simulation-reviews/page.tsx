import {redirect} from 'next/navigation';
import {getServerSession} from '@/lib/supabase-server';
import {adminAccess} from '@/lib/api';
import {SimulationReviews} from '@/features/admin';
export const metadata={title:'Simulation reviews'};
export const dynamic='force-dynamic';
export default async function Page(){const session=await getServerSession();if(!session)redirect('/login?next=/admin/simulation-reviews');const access=await adminAccess(session.access_token);return access?.isAdmin?<SimulationReviews/>:<main className="p-6">Administrator access is required.</main>;}
