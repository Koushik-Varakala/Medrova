"use client";

import { motion } from "framer-motion";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Building2, 
  Phone,
  Briefcase
} from "lucide-react";
import type { Application } from "@/types";
import { formatCurrencyInr } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ApplicationListProps {
  applications: Application[];
  isHistory?: boolean;
}

export function ApplicationList({ applications, isHistory = false }: ApplicationListProps) {
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
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={container} 
      initial="hidden" 
      animate="show" 
      className="space-y-4"
    >
      {applications.map((application) => {
        const isShift = !!application.shift;
        const details = isShift ? application.shift : application.job;
        const clinic = details?.clinic;
        const isRejected = application.status === "rejected";
        const isConfirmed = application.status === "confirmed";
        const isCompleted = application.status === "completed";

        const formattedDate = application.shift?.date 
          ? new Date(application.shift.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
          : "TBD";

        return (
          <motion.article
            variants={item}
            key={application.id}
            className={cn(
              "overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm transition-all",
              isRejected ? "opacity-60 bg-slate-50" : "hover:-translate-y-1 hover:shadow-md",
              isConfirmed && !isHistory ? "ring-1 ring-emerald-500" : ""
            )}
          >
            <div className="p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 mb-1">
                    {isHistory && isCompleted ? (
                      <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Completed
                      </span>
                    ) : (
                      <span className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider",
                        isConfirmed ? "bg-emerald-100 text-emerald-700" :
                        isRejected ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      )}>
                        {application.status}
                      </span>
                    )}
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                      {isShift ? "Locum Shift" : "Permanent Job"}
                    </span>
                  </div>
                  
                  <h3 className={cn("text-xl font-bold text-[#0F172A]", isRejected && "line-through text-slate-500")}>
                    {details?.specialty ?? "Specialty"}
                  </h3>
                  
                  <div className="flex items-center gap-1.5 text-sm font-medium text-[#64748B]">
                    <Building2 className="h-4 w-4" />
                    <span className="text-[#0F172A]">{clinic?.name ?? "Clinic Details Pending"}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:items-end">
                  {isShift && application.shift ? (
                    <>
                      <div className="flex items-center gap-3 text-sm font-medium text-[#0F172A]">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-[#64748B]" />
                          {formattedDate}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-[#64748B]" />
                          {application.shift.startTime}
                        </div>
                      </div>
                      <div className="text-xl font-bold tracking-tight text-emerald-600">
                        {formatCurrencyInr(application.shift.pay)}
                      </div>
                    </>
                  ) : application.job ? (
                    <>
                      <div className="flex items-center gap-3 text-sm font-medium text-[#0F172A]">
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4 text-[#64748B]" />
                          {application.job.jobType === "full_time" ? "Full Time" : "Part Time"}
                        </div>
                      </div>
                      <div className="text-lg font-bold tracking-tight text-emerald-600">
                        {formatCurrencyInr(application.job.salaryMin)} - {formatCurrencyInr(application.job.salaryMax)} / mo
                      </div>
                    </>
                  ) : null}
                </div>
              </div>

              {isConfirmed && clinic && !isHistory && (
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Confirmed — Clinic contact details below
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-start gap-2 text-sm text-emerald-900">
                      <Phone className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <div>
                        <p className="font-semibold">{clinic.contactPerson}</p>
                        <p>{clinic.contactPhone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-emerald-900">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <p>{clinic.address}, {clinic.area}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.article>
        );
      })}
    </motion.div>
  );
}

export function ApplicationSkeletonList() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex animate-pulse flex-col justify-between gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:flex-row sm:items-start">
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="h-6 w-20 rounded-full bg-slate-200"></div>
              <div className="h-6 w-24 rounded-md bg-slate-200"></div>
            </div>
            <div className="h-6 w-48 rounded-md bg-slate-200"></div>
            <div className="h-4 w-32 rounded-md bg-slate-200"></div>
          </div>
          <div className="space-y-3 sm:text-right">
            <div className="h-5 w-40 rounded-md bg-slate-200 sm:ml-auto"></div>
            <div className="h-8 w-24 rounded-md bg-slate-200 sm:ml-auto"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
