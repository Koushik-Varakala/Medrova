import type { Clinic } from "@/types";
import { VerificationBadge } from "@/components/shared/VerificationBadge";

interface ClinicDashboardHomeProps {
  clinic: Clinic;
  stats: {
    activeShifts: number;
    filledShifts: number;
    pendingApplications: number;
  };
}

export function ClinicDashboardHome({ clinic, stats }: ClinicDashboardHomeProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#64748B]">Welcome back</p>
            <h1 className="mt-1 text-2xl font-semibold text-[#0F172A]">
              {clinic.name}
            </h1>
          </div>
          <VerificationBadge status={clinic.verificationStatus} />
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Active shifts" value={String(stats.activeShifts)} />
        <StatCard label="Filled shifts" value={String(stats.filledShifts)} />
        <StatCard
          label="Pending applications"
          value={String(stats.pendingApplications)}
        />
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
      <p className="text-sm text-[#64748B]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#0F172A]">{value}</p>
    </div>
  );
}
