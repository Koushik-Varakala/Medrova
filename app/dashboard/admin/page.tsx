"use client";

import { useEffect, useState } from "react";
import { BriefcaseMedical, IndianRupee, Stethoscope, Users } from "lucide-react";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { StatCard } from "@/components/shared/StatCard";
import { adminNavigation } from "@/lib/constants";
import { formatCurrencyInr } from "@/lib/utils";

interface AdminStats {
  doctorCount: number;
  clinicCount: number;
  pendingDoctors: number;
  pendingClinics: number;
  totalRevenue: number;
  totalPayouts: number;
  feesRetained: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const [doctorsRes, clinicsRes, paymentsRes] = await Promise.all([
          fetch("/api/admin/doctors"),
          fetch("/api/admin/clinics"),
          fetch("/api/admin/payments"),
        ]);

        const [doctorsJson, clinicsJson, paymentsJson] = await Promise.all([
          doctorsRes.json() as Promise<{ doctors?: { verification_status: string }[] }>,
          clinicsRes.json() as Promise<{ clinics?: { verification_status: string }[] }>,
          paymentsRes.json() as Promise<{ summary?: { totalRevenue: number; totalPayouts: number; platformFeesRetained: number } }>,
        ]);

        if (!isMounted) return;

        const doctors = doctorsJson.doctors ?? [];
        const clinics = clinicsJson.clinics ?? [];
        const summary = paymentsJson.summary;

        setStats({
          doctorCount: doctors.length,
          clinicCount: clinics.length,
          pendingDoctors: doctors.filter((d) => d.verification_status === "pending").length,
          pendingClinics: clinics.filter((c) => c.verification_status === "pending").length,
          totalRevenue: summary?.totalRevenue ?? 0,
          totalPayouts: summary?.totalPayouts ?? 0,
          feesRetained: summary?.platformFeesRetained ?? 0,
        });
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : "Unable to load stats.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();
    return () => { isMounted = false; };
  }, []);

  return (
    <DashboardShell items={adminNavigation}>
      <Header
        description="Platform overview for verification, postings, and payments."
        title="Admin dashboard"
      />
      {error ? (
        <p className="mb-4 rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#B91C1C]">
          {error}
        </p>
      ) : null}
      {isLoading ? (
        <p className="rounded-xl border border-[#E2E8F0] bg-white p-6 text-sm text-[#64748B] shadow-sm">
          Loading stats...
        </p>
      ) : stats ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Stethoscope} label="Doctors" value={String(stats.doctorCount)} />
            <StatCard icon={Users} label="Clinics" value={String(stats.clinicCount)} />
            <StatCard icon={BriefcaseMedical} label="Total revenue" value={formatCurrencyInr(stats.totalRevenue)} />
            <StatCard icon={IndianRupee} label="Fees retained" value={formatCurrencyInr(stats.feesRetained)} />
          </section>
          <section className="mt-6 rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[#0F172A]">Operations queue</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <QueueItem label="Pending doctor verifications" value={stats.pendingDoctors} />
              <QueueItem label="Pending clinic verifications" value={stats.pendingClinics} />
            </div>
          </section>
        </>
      ) : null}
    </DashboardShell>
  );
}

function Header({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-semibold tracking-normal text-[#0F172A]">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-[#64748B]">{description}</p>
    </div>
  );
}

function QueueItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[#E2E8F0] p-4">
      <p className="text-sm text-[#64748B]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#0F172A]">{value}</p>
    </div>
  );
}
