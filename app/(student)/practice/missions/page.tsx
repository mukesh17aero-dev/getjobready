import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Role missions" };

export default function MissionsPage() {
  return (
    <ComingSoon
      stage="Practice · Simulation"
      title="Role missions"
      delivers="Realistic role missions with feedback and retries. Repeated, verified actions become your final Role Proficiency Score."
      backHref={"/practice"}
      backLabel={"Back to Practice"}
    />
  );
}
