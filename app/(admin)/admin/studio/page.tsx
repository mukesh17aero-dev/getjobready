import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/supabase-server';
import { adminAccess } from '@/lib/api';
import { RoleStudio } from '../role-studio';
export const metadata = { title: 'Role studio' };
export const dynamic = 'force-dynamic';
export default async function Page() { const session = await getServerSession(); if (!session)
    redirect('/login?next=/admin/studio'); const access = await adminAccess(session.access_token); if (!access?.isAdmin)
    return <main className="p-10">Admin access is unavailable. Please sign in as an administrator and retry.</main>; return <RoleStudio />; }
