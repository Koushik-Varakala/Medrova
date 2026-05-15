import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, CalendarCheck, IndianRupee, ClipboardList, ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";
import type { HealthcareProfessional, Shift } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  professional: HealthcareProfessional;
  recentShifts: Shift[];
  stats: {
    shiftsCompleted: number;
    totalEarned: number;
    pendingApplications: number;
  };
  config: { label: string; color: string };
}

function getGradient(role: string) {
  if (role === "doctor") return "from-blue-600 to-indigo-600";
  if (role === "nurse") return "from-emerald-500 to-teal-600";
  return "from-purple-600 to-fuchsia-600";
}

function getCardHighlight(role: string) {
  if (role === "doctor") return "bg-blue-50 text-blue-700";
  if (role === "nurse") return "bg-emerald-50 text-emerald-700";
  return "bg-purple-50 text-purple-700";
}

export function ProfessionalDashboardHome({ professional, recentShifts, stats, config }: Props) {
  return (
    <div className="space-y-6">
      {/* Hero / Welcome */}
      <div className={cn("relative overflow-hidden rounded-2xl bg-gradient-to-r p-8 text-white", getGradient(professional.role))}>
        <div className="relative z-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="mb-2 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              {config.label}
            </span>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back, {professional.name.split(" ")[0]}</h1>
            <p className="mt-2 text-white/80">
              {professional.verificationStatus === "verified"
                ? "Your profile is verified. You can apply for shifts and jobs."
                : professional.verificationStatus === "rejected"
                ? "Your profile verification was rejected. Please check your documents."
                : "Your profile is under review. You can browse, but cannot apply yet."}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/professional/shifts" className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-white/90">
              Find Shifts
            </Link>
            <Link href="/dashboard/professional/jobs" className="rounded-xl bg-black/20 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-black/30">
              Browse Jobs
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Completed Shifts", value: stats.shiftsCompleted.toString(), icon: CalendarCheck },
          { label: "Total Earned", value: `₹${stats.totalEarned.toLocaleString()}`, icon: IndianRupee },
          { label: "Pending Apps", value: stats.pendingApplications.toString(), icon: ClipboardList }
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ y: -3 }}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", getCardHighlight(professional.role))}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{item.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{item.value}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { href: "/dashboard/professional/shifts", label: "Browse Shifts", icon: CalendarCheck },
          { href: "/dashboard/professional/jobs", label: "Browse Jobs", icon: IndianRupee },
          { href: "/dashboard/professional/applications", label: "My Applications", icon: ClipboardList }
        ].map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              <span className="flex items-center gap-3 text-sm font-bold text-slate-900">
                <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", getCardHighlight(professional.role))}>
                  <Icon className="h-4 w-4" />
                </span>
                {action.label}
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-700" />
            </Link>
          );
        })}
      </div>

      {/* Recent Shifts */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Your Recent Shifts</h2>
          <Link href="/dashboard/professional/shifts" className="text-sm font-semibold text-[#1E40AF] hover:underline">
            View all
          </Link>
        </div>
        {recentShifts.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
              <CalendarCheck className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">No shifts yet</h3>
            <p className="mt-1 text-sm text-slate-500">Apply for shifts to start earning.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentShifts.map((shift) => (
              <div key={shift.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-start justify-between">
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider", getCardHighlight(professional.role))}>
                    {shift.status}
                  </span>
                  <span className="text-sm font-bold text-emerald-600">₹{shift.pay.toLocaleString()}</span>
                </div>
                <h3 className="font-bold text-slate-900">{shift.clinic?.name ?? "Clinic"}</h3>
                <div className="mt-2 space-y-1.5 text-sm text-slate-500">
                  <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {shift.area}</p>
                  <p className="flex items-center gap-2"><CalendarCheck className="h-3.5 w-3.5" /> {shift.date} • {shift.startTime}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
