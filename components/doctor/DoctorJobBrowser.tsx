"use client";

import { BriefcaseMedical, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { specialties } from "@/lib/constants";
import type { Doctor, Job } from "@/types";
import { JobCard } from "@/components/shared/JobCard";
import { cn } from "@/lib/utils";

interface DoctorJobBrowserProps {
  doctor: Doctor;
  jobs: Job[];
}

export function DoctorJobBrowser({ doctor, jobs }: DoctorJobBrowserProps) {
  const [specialty, setSpecialty] = useState("");
  const [jobType, setJobType] = useState("");
  const [notice, setNotice] = useState<{ type: "success" | "error", msg: string } | null>(null);
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSpecialty = specialty ? job.specialty === specialty : true;
      const matchesType = jobType ? job.jobType === jobType : true;

      return matchesSpecialty && matchesType;
    });
  }, [jobType, jobs, specialty]);

  async function applyToJob(jobId: string) {
    setNotice(null);
    setApplyingTo(jobId);
    try {
      const response = await fetch(`/api/jobs/${jobId}/apply`, { method: "POST" });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        setNotice({ type: "error", msg: result.error ?? "Unable to apply for this job." });
        return;
      }
      setAppliedJobs(prev => new Set(prev).add(jobId));
      setNotice({ type: "success", msg: "Job application submitted successfully." });
    } catch {
      setNotice({ type: "error", msg: "A network error occurred." });
    } finally {
      setApplyingTo(null);
      setTimeout(() => setNotice(null), 4000);
    }
  }

  const clearFilters = () => {
    setSpecialty("");
    setJobType("");
  };

  const hasActiveFilters = specialty || jobType;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="relative flex h-3 w-3 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
        </div>
        <p className="text-sm font-medium text-emerald-600">
          {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'} available
        </p>
      </div>

      {doctor.verificationStatus !== "verified" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm">
          Applications unlock after Medrova verifies your profile. You can browse available jobs in the meantime.
        </div>
      )}

      {notice && (
        <div className={cn(
          "rounded-xl border p-4 text-sm font-medium shadow-sm flex items-center justify-between",
          notice.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
        )}>
          {notice.msg}
          <button onClick={() => setNotice(null)} className="opacity-50 hover:opacity-100"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* FILTER BAR */}
      <div className="sticky top-0 z-20 -mx-4 overflow-hidden bg-white/80 px-4 pb-4 pt-2 backdrop-blur-md sm:mx-0 sm:rounded-2xl sm:border sm:border-[#E2E8F0] sm:p-4 sm:shadow-sm">
        <div className="grid grid-cols-2 gap-3 sm:pb-0">
          <div className="w-full">
            <label className="mb-1.5 hidden text-xs font-bold uppercase tracking-wider text-[#64748B] sm:block">Specialty</label>
            <select
              className="w-full appearance-none rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm font-medium text-[#0F172A] outline-none transition-all focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20"
              onChange={(e) => setSpecialty(e.target.value)}
              value={specialty}
            >
              <option value="">All specialties</option>
              {specialties.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          
          <div className="w-full">
            <label className="mb-1.5 hidden text-xs font-bold uppercase tracking-wider text-[#64748B] sm:block">Job type</label>
            <select
              className="w-full appearance-none rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm font-medium text-[#0F172A] outline-none transition-all focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20"
              onChange={(e) => setJobType(e.target.value)}
              value={jobType}
            >
              <option value="">All types</option>
              <option value="full_time">Full time</option>
              <option value="part_time">Part time</option>
            </select>
          </div>
        </div>

        {/* ACTIVE FILTERS PILLS */}
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: "auto", opacity: 1, marginTop: 16 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              className="flex flex-wrap items-center gap-2 overflow-hidden"
            >
              {specialty && (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="flex items-center gap-1.5 rounded-full bg-[#1E40AF]/10 px-3 py-1 text-xs font-semibold text-[#1E40AF]">
                  {specialty}
                  <button onClick={() => setSpecialty("")} className="rounded-full p-0.5 hover:bg-[#1E40AF]/20"><X className="h-3 w-3" /></button>
                </motion.div>
              )}
              {jobType && (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="flex items-center gap-1.5 rounded-full bg-[#1E40AF]/10 px-3 py-1 text-xs font-semibold text-[#1E40AF]">
                  {jobType === "full_time" ? "Full time" : "Part time"}
                  <button onClick={() => setJobType("")} className="rounded-full p-0.5 hover:bg-[#1E40AF]/20"><X className="h-3 w-3" /></button>
                </motion.div>
              )}
              
              <button onClick={clearFilters} className="ml-2 text-xs font-semibold text-[#1E40AF] hover:underline">
                Clear all
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {filteredJobs.length > 0 ? (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <div key={job.id} className="relative">
              <JobCard
                actionLabel={appliedJobs.has(job.id) ? "Applied" : applyingTo === job.id ? "Applying..." : doctor.verificationStatus === "verified" ? "Apply" : undefined}
                onAction={() => applyToJob(job.id)}
                job={job}
              />
            </div>
          ))}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E2E8F0] bg-white py-16 text-center shadow-sm"
        >
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-400">
            <Search className="h-10 w-10" />
          </div>
          <h3 className="text-xl font-bold text-[#0F172A]">No jobs match your filters</h3>
          <p className="mt-2 max-w-md text-sm text-[#64748B]">
            Permanent positions will appear here as verified clinics publish roles. Try adjusting your filters.
          </p>
          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              className="mt-6 rounded-xl bg-[#1E40AF] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1D4ED8]"
            >
              Clear all filters
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
