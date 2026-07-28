import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/modules/identity";

export const metadata: Metadata = { title: "Admin" };

const SECTIONS = [
  {
    href: "/admin/users",
    title: "Users",
    body: "Everyone who has signed in. Search them, and promote or demote between student, admin and employer.",
  },
  {
    href: "/admin/employers/new",
    title: "Register employer",
    body: "Create an employer account and email them an invitation. Employers cannot register themselves.",
  },
];

export default async function AdminHomePage() {
  const user = await getCurrentUser();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Admin console
      </h1>
      <p className="mt-2 text-slate-600">
        Signed in as {user?.username ?? user?.email}.
      </p>

      {user?.isBootstrapAdmin ? (
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-800">
            You are using the setup account
          </h2>
          <p className="mt-3 leading-relaxed text-amber-900">
            This is a shared username and password, and it stays working
            permanently. Once this platform is on the internet, that login form
            is reachable by anyone — so promote your own account to admin from
            the user list and use that day to day. To switch this account off
            entirely, remove <code>ADMIN_BOOTSTRAP_USERNAME</code> from the
            environment; there is no other off-switch.
          </p>
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group rounded-2xl border border-slate-200 bg-white p-6 transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
          >
            <h2 className="font-semibold text-slate-900 group-hover:text-indigo-700">
              {section.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {section.body}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Not built yet
        </h2>
        <p className="mt-3 leading-relaxed text-slate-600">
          Dimensions and thresholds, the readiness rule versions, the student
          list and the audit viewer all belong here. They arrive with the
          modules that own them.
        </p>
      </div>
    </main>
  );
}
