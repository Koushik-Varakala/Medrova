"use client";

import { useEffect, useState } from "react";
import { 
  Building2, 
  IndianRupee, 
  Stethoscope, 
  Landmark, 
  Bell, 
  UserCheck,
  Clock,
  ArrowRight
} from "lucide-react";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { StatCard } from "@/components/shared/StatCard";
import { adminNavigation } from "@/lib/constants";
import { formatCurrencyInr } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";

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
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  return (
    <DashboardShell items={adminNavigation}>
      {/* HERO BANNER */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 overflow-hidden rounded-2xl bg-[#0F172A] p-6 shadow-lg sm:p-8 relative"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Landmark className="w-48 h-48 text-white" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Medrova</h1>
              <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-black tracking-widest text-red-400 border border-red-500/30 uppercase">
                Admin
              </span>
            </div>
            <p className="mt-2 text-slate-400 text-sm sm:text-base font-medium">Platform operations overview</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-md px-4 py-2 border border-white/10 w-fit">
            <Clock className="w-4 h-4 text-slate-300" />
            <span className="text-sm font-semibold text-white tracking-widest">
              {time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>
      </motion.div>

      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 font-medium">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 rounded-xl bg-slate-200 animate-pulse border border-slate-300" />
            ))}
          </div>
        </div>
      ) : stats ? (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          {/* STATS ROW */}
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard 
              icon={Stethoscope} 
              label="Doctors" 
              value={stats.doctorCount.toString()} 
              caption="Total registered"
              iconColor="text-blue-600"
              iconBg="bg-blue-100"
              borderColor="border-l-4 border-l-blue-600 border-slate-200"
            />
            <StatCard 
              icon={Building2} 
              label="Clinics" 
              value={stats.clinicCount.toString()} 
              caption="Total registered"
              iconColor="text-purple-600"
              iconBg="bg-purple-100"
              borderColor="border-l-4 border-l-purple-600 border-slate-200"
            />
            <StatCard 
              icon={IndianRupee} 
              label="Total Revenue" 
              value={formatCurrencyInr(stats.totalRevenue)} 
              caption="Platform gross"
              iconColor="text-emerald-600"
              iconBg="bg-emerald-100"
              borderColor="border-l-4 border-l-emerald-500 border-slate-200"
              valueColorClass="text-emerald-700"
            />
            <StatCard 
              icon={Landmark} 
              label="Fees Retained" 
              value={formatCurrencyInr(stats.feesRetained)} 
              caption="Net platform profit"
              iconColor={stats.feesRetained < 0 ? "text-red-600" : "text-emerald-600"}
              iconBg={stats.feesRetained < 0 ? "bg-red-100" : "bg-emerald-100"}
              borderColor={`border-l-4 ${stats.feesRetained < 0 ? 'border-l-red-500' : 'border-l-emerald-500'} border-slate-200`}
              valueColorClass={stats.feesRetained < 0 ? "text-red-600" : "text-emerald-700"}
            />
          </section>

          {/* OPERATIONS QUEUE */}
          <section>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#0F172A]">Operations Queue</h2>
                <p className="text-sm text-slate-500">Action items requiring admin attention</p>
              </div>
              {(stats.pendingDoctors > 0 || stats.pendingClinics > 0) && (
                <span className="ml-auto flex items-center justify-center h-8 w-8 rounded-full bg-red-100 text-red-600 font-bold text-sm">
                  {stats.pendingDoctors + stats.pendingClinics}
                </span>
              )}
            </div>

            {stats.pendingDoctors === 0 && stats.pendingClinics === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm">
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <UserCheck className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-emerald-800">All verifications up to date</h3>
                <p className="mt-1 text-sm text-emerald-600">There are no pending doctors or clinics to review.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <Link href="/dashboard/admin/doctors" className="group block">
                  <div className="relative overflow-hidden rounded-xl border border-amber-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md border-l-4 border-l-amber-500 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                        <Stethoscope className="h-6 w-6 text-amber-600" />
                      </div>
                      {stats.pendingDoctors > 0 && (
                        <span className="relative flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
                        </span>
                      )}
                    </div>
                    <div className="mt-auto">
                      <p className="text-4xl font-black text-[#0F172A]">{stats.pendingDoctors}</p>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wide mt-1">Doctors awaiting verification</p>
                    </div>
                    <div className="mt-6 flex items-center justify-between text-[#1E40AF] font-bold text-sm bg-blue-50 p-3 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      Review Now <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>

                <Link href="/dashboard/admin/clinics" className="group block">
                  <div className="relative overflow-hidden rounded-xl border border-amber-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md border-l-4 border-l-amber-500 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                        <Building2 className="h-6 w-6 text-amber-600" />
                      </div>
                      {stats.pendingClinics > 0 && (
                        <span className="relative flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
                        </span>
                      )}
                    </div>
                    <div className="mt-auto">
                      <p className="text-4xl font-black text-[#0F172A]">{stats.pendingClinics}</p>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wide mt-1">Clinics awaiting verification</p>
                    </div>
                    <div className="mt-6 flex items-center justify-between text-[#1E40AF] font-bold text-sm bg-blue-50 p-3 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      Review Now <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </section>

          {/* RECENT ACTIVITY PLACEHOLDER */}
          <section className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#0F172A] mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0 last:pb-0">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">System initialized</p>
                  <p className="text-xs text-slate-500">All services operating normally</p>
                </div>
                <div className="text-xs text-slate-400 font-medium shrink-0">Just now</div>
              </div>
            </div>
          </section>
        </motion.div>
      ) : null}
    </DashboardShell>
  );
}
