"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  CalendarCheck, 
  CheckCircle, 
  Users, 
  AlertCircle, 
  CalendarPlus, 
  ClipboardList, 
  Wallet, 
  ChevronRight,
  Calendar,
  MapPin
} from "lucide-react";
import type { Clinic, Shift } from "@/types";
import { cn, formatDate } from "@/lib/utils";

interface ClinicDashboardHomeProps {
  clinic: Clinic;
  stats: {
    activeShifts: number;
    filledShifts: number;
    pendingApplications: number;
  };
  recentShifts: Shift[];
}

export function ClinicDashboardHome({ clinic, stats, recentShifts }: ClinicDashboardHomeProps) {
  // Determine greeting based on time
  const hour = new Date().getHours();
  let greeting = "Good evening";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 18) greeting = "Good afternoon";

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={container} 
      initial="hidden" 
      animate="show" 
      className="space-y-8"
    >
      {/* HERO WELCOME CARD */}
      <motion.div variants={item} className="space-y-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E40AF] to-[#1D4ED8] p-6 text-white shadow-md sm:p-8">
          <div className="absolute -right-10 -top-24 h-64 w-64 rounded-full bg-white opacity-5 blur-3xl"></div>
          <div className="absolute -bottom-24 -left-10 h-40 w-40 rounded-full bg-[#60A5FA] opacity-20 blur-2xl"></div>
          
          <div className="relative z-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {greeting}, {clinic.name}
              </h1>
              <p className="mt-2 text-sm text-blue-100 sm:text-base">
                Manage your shifts and find verified professionals
              </p>
            </div>
            
            <div className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 font-medium shadow-sm backdrop-blur-md",
              clinic.verificationStatus === "verified" ? "bg-white/20 text-white" : "bg-amber-500/20 text-amber-50"
            )}>
              {clinic.verificationStatus === "verified" ? (
                <>
                  <div className="h-2 w-2 rounded-full bg-emerald-400"></div>
                  Verified
                </>
              ) : (
                <>
                  <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></div>
                  Pending Verification
                </>
              )}
            </div>
          </div>
        </div>

        {clinic.verificationStatus !== "verified" && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-500" />
            <p>Your clinic is under review. You&apos;ll be notified once verified.</p>
          </div>
        )}
      </motion.div>

      {/* STATS ROW */}
      <motion.section variants={item} className="grid gap-4 sm:grid-cols-3">
        <StatCard 
          icon={CalendarCheck} 
          label="Active Shifts" 
          value={String(stats.activeShifts)} 
          accent="blue" 
        />
        <StatCard 
          icon={CheckCircle} 
          label="Filled Shifts" 
          value={String(stats.filledShifts)} 
          accent="emerald" 
        />
        <StatCard 
          icon={Users} 
          label="Pending Applications" 
          value={String(stats.pendingApplications)} 
          accent="amber" 
        />
      </motion.section>

      {/* QUICK ACTIONS ROW */}
      <motion.section variants={item}>
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 sm:grid sm:grid-cols-3 sm:snap-none sm:overflow-visible sm:pb-0">
          <Link href="/dashboard/clinic/post-shift" className="min-w-[280px] shrink-0 snap-center sm:min-w-0">
            <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 shadow-sm ring-1 ring-blue-100 transition-all hover:-translate-y-1 hover:shadow-md hover:ring-blue-200">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white shadow-inner">
                <CalendarPlus className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-[#0F172A] group-hover:text-blue-700 transition-colors">Post a Shift</h3>
                <p className="mt-1 text-sm text-[#64748B]">Find verified professionals</p>
              </div>
              <ChevronRight className="absolute bottom-6 right-6 h-5 w-5 text-blue-400 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
            </div>
          </Link>

          <Link href="/dashboard/clinic/shifts" className="min-w-[280px] shrink-0 snap-center sm:min-w-0">
            <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/50 p-6 shadow-sm ring-1 ring-purple-100 transition-all hover:-translate-y-1 hover:shadow-md hover:ring-purple-200">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500 text-white shadow-inner">
                <ClipboardList className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-[#0F172A] group-hover:text-purple-700 transition-colors">My Shifts</h3>
                <p className="mt-1 text-sm text-[#64748B]">Manage applicants</p>
              </div>
              <ChevronRight className="absolute bottom-6 right-6 h-5 w-5 text-purple-400 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
            </div>
          </Link>

          <Link href="/dashboard/clinic/payments" className="min-w-[280px] shrink-0 snap-center sm:min-w-0">
            <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6 shadow-sm ring-1 ring-emerald-100 transition-all hover:-translate-y-1 hover:shadow-md hover:ring-emerald-200">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-inner">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-[#0F172A] group-hover:text-emerald-700 transition-colors">View Payments</h3>
                <p className="mt-1 text-sm text-[#64748B]">Track staffing spend</p>
              </div>
              <ChevronRight className="absolute bottom-6 right-6 h-5 w-5 text-emerald-400 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
            </div>
          </Link>
        </div>
      </motion.section>

      {/* RECENT ACTIVITY */}
      <motion.section variants={item}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-[#0F172A]">Recent Shifts</h2>
          {recentShifts.length > 0 && (
            <Link 
              href="/dashboard/clinic/shifts" 
              className="text-sm font-semibold text-[#1E40AF] hover:text-[#1D4ED8]"
            >
              View All
            </Link>
          )}
        </div>

        {recentShifts.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {recentShifts.map((shift) => (
              <div 
                key={shift.id} 
                className="flex flex-col gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {shift.specialty}
                  </span>
                  <span className={cn(
                    "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wider",
                    shift.status === "active" ? "bg-blue-100 text-blue-700" :
                    shift.status === "confirmed" ? "bg-purple-100 text-purple-700" :
                    shift.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                    shift.status === "pending_payment" ? "bg-amber-100 text-amber-700" :
                    "bg-slate-100 text-slate-700"
                  )}>
                    {shift.status.replace("_", " ")}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-[#0F172A]">
                    <Calendar className="h-4 w-4 text-[#64748B]" />
                    {formatDate(shift.date)}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-sm text-[#64748B]">
                    <MapPin className="h-4 w-4" />
                    {clinic.area}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E2E8F0] bg-white py-12 text-center shadow-sm">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-500">
              <Calendar className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-[#0F172A]">No shifts posted yet</h3>
            <p className="mt-1 max-w-sm text-sm text-[#64748B]">
              You haven&apos;t posted any shifts yet. Create your first shift to hire verified professionals.
            </p>
            <Link 
              href="/dashboard/clinic/post-shift" 
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E40AF] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#1D4ED8] hover:shadow-lg"
            >
              <CalendarPlus className="h-4 w-4" />
              Post your first shift
            </Link>
          </div>
        )}
      </motion.section>
    </motion.div>
  );
}

// ----- SUBCOMPONENTS -----

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  accent 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string;
  accent: "blue" | "emerald" | "amber";
}) {
  const accentColors = {
    blue: "border-l-blue-500 bg-blue-50 text-blue-600",
    emerald: "border-l-emerald-500 bg-emerald-50 text-emerald-600",
    amber: "border-l-amber-500 bg-amber-50 text-amber-600",
  };

  return (
    <div className={cn(
      "group flex items-center gap-4 rounded-2xl border border-[#E2E8F0] border-l-4 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md",
      accentColors[accent].split(" ")[0]
    )}>
      <div className={cn(
        "flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-transform group-hover:scale-110",
        accentColors[accent].split(" ").slice(1).join(" ")
      )}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-[#64748B]">{label}</p>
        <p className="text-2xl font-bold tracking-tight text-[#0F172A]">{value}</p>
      </div>
    </div>
  );
}
