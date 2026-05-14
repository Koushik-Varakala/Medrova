"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  CalendarCheck, 
  IndianRupee, 
  ClipboardList, 
  MapPin, 
  Calendar, 
  Clock, 
  Search, 
  Wallet,
  AlertCircle
} from "lucide-react";
import type { Doctor, Shift } from "@/types";
import { formatCurrencyInr } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface DoctorDashboardHomeProps {
  doctor: Doctor;
  recentShifts: Shift[];
  stats: {
    shiftsCompleted: number;
    totalEarned: number;
    pendingApplications: number;
  };
}

export function DoctorDashboardHome({
  doctor,
  recentShifts,
  stats
}: DoctorDashboardHomeProps) {
  // Determine greeting based on time
  const hour = new Date().getHours();
  let greeting = "Good evening";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 18) greeting = "Good afternoon";

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
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
                {greeting}, Dr. {doctor.name.split(" ")[0]}
              </h1>
              <p className="mt-2 text-sm text-blue-100 sm:text-base">
                Here&apos;s your activity overview
              </p>
            </div>
            
            <div className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 font-medium shadow-sm backdrop-blur-md",
              doctor.verificationStatus === "verified" ? "bg-white/20 text-white" : "bg-amber-500/20 text-amber-50"
            )}>
              {doctor.verificationStatus === "verified" ? (
                <>
                  <div className="h-2 w-2 rounded-full bg-emerald-400"></div>
                  ✓ Verified
                </>
              ) : (
                <>
                  <div className="h-2 w-2 animate-pulse rounded-full bg-amber-400"></div>
                  ⏳ Pending Verification
                </>
              )}
            </div>
          </div>
        </div>

        {doctor.verificationStatus !== "verified" && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-500" />
            <p>Your profile is under review. You&apos;ll be notified once verified and can then apply to shifts.</p>
          </div>
        )}
      </motion.div>

      {/* STATS CARDS ROW */}
      <motion.section variants={item} className="grid gap-4 sm:grid-cols-3">
        <StatCard 
          icon={CalendarCheck} 
          label="Shifts Completed" 
          value={String(stats.shiftsCompleted)} 
          accent="blue" 
        />
        <StatCard 
          icon={IndianRupee} 
          label="Total Earned" 
          value={formatCurrencyInr(stats.totalEarned)} 
          accent="green" 
        />
        <StatCard 
          icon={ClipboardList} 
          label="Pending Applications" 
          value={String(stats.pendingApplications)} 
          accent="amber" 
        />
      </motion.section>

      {/* QUICK ACTIONS ROW */}
      <motion.section variants={item}>
        <div className="grid gap-4 sm:grid-cols-3">
          <ActionCard 
            href="/dashboard/doctor/shifts" 
            icon={Search} 
            title="Browse Shifts" 
            color="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:border-blue-300" 
          />
          <ActionCard 
            href="/dashboard/doctor/applications" 
            icon={ClipboardList} 
            title="My Applications" 
            color="bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100 hover:border-purple-300" 
          />
          <ActionCard 
            href="/dashboard/doctor/payments" 
            icon={Wallet} 
            title="View Payments" 
            color="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300" 
          />
        </div>
      </motion.section>

      {/* RECENT SHIFTS SECTION */}
      <motion.section variants={item} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-[#0F172A]">Recent Shifts</h2>
          <Link href="/dashboard/doctor/shifts" className="text-sm font-semibold text-[#1E40AF] hover:underline">
            View All
          </Link>
        </div>

        {recentShifts.length > 0 ? (
          <div className="space-y-4">
            {recentShifts.map((shift) => (
              <RecentShiftCard key={shift.id} shift={shift} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E2E8F0] bg-white py-12 text-center shadow-sm">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-500">
              <Calendar className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-[#0F172A]">No shifts yet</h3>
            <p className="mt-1 max-w-sm text-sm text-[#64748B]">
              You haven&apos;t completed any shifts yet. Browse available shifts in Hyderabad to get started.
            </p>
            <Link 
              href="/dashboard/doctor/shifts" 
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E40AF] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#1D4ED8] hover:shadow-lg"
            >
              <Search className="h-4 w-4" />
              Browse available shifts
            </Link>
          </div>
        )}
      </motion.section>
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent: "blue" | "green" | "amber" }) {
  const accentColors = {
    blue: "border-l-blue-500 text-blue-500 bg-blue-50",
    green: "border-l-emerald-500 text-emerald-500 bg-emerald-50",
    amber: "border-l-amber-500 text-amber-500 bg-amber-50"
  };

  return (
    <div className={cn("group flex flex-col justify-center rounded-2xl border-y border-r border-l-4 border-[#E2E8F0] bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md", accentColors[accent].split(" ")[0])}>
      <div className="flex items-center gap-4">
        <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full", accentColors[accent].split(" ")[2], accentColors[accent].split(" ")[1])}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-[#64748B]">{label}</p>
          <p className="text-2xl font-bold tracking-tight text-[#0F172A]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ActionCard({ href, icon: Icon, title, color }: { href: string; icon: any; title: string; color: string }) {
  return (
    <Link 
      href={href}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border p-5 text-center transition-all hover:-translate-y-1 shadow-sm hover:shadow-md",
        color
      )}
    >
      <Icon className="h-6 w-6" />
      <span className="font-semibold text-sm">{title}</span>
    </Link>
  );
}

function RecentShiftCard({ shift }: { shift: Shift }) {
  // Helper to format date nicely
  const formattedDate = new Date(shift.date).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric"
  });

  return (
    <div className="group relative flex flex-col justify-between gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md sm:flex-row sm:items-center">
      {shift.isUrgent && (
        <div className="absolute -right-2 -top-2 flex h-6 items-center justify-center rounded-full bg-red-500 px-3 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
          URGENT
        </div>
      )}
      
      <div className="flex flex-col items-start gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
            {shift.specialty}
          </span>
          <span className={cn(
            "inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold capitalize",
            shift.status === "completed" ? "bg-emerald-100 text-emerald-700" :
            shift.status === "confirmed" ? "bg-blue-100 text-blue-700" :
            shift.status === "active" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"
          )}>
            {shift.status}
          </span>
        </div>
        <h3 className="text-lg font-bold text-[#0F172A]">
          {shift.clinic?.name || "Clinic"}
        </h3>
        <div className="flex items-center gap-1 text-sm font-medium text-[#64748B]">
          <MapPin className="h-4 w-4" />
          {shift.clinic?.area || shift.area}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:items-end">
        <div className="flex items-center gap-4 text-sm font-medium text-[#0F172A]">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-[#64748B]" />
            {formattedDate}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-[#64748B]" />
            {shift.startTime} - {shift.endTime}
          </div>
        </div>
        <div className="mt-2 text-xl font-bold tracking-tight text-emerald-600 sm:mt-0">
          {formatCurrencyInr(shift.pay)}
        </div>
      </div>
    </div>
  );
}
