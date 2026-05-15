"use client";

import { useEffect, useState } from "react";
import { Loader2, ClipboardList, Building2, MapPin, Calendar, Clock, IndianRupee } from "lucide-react";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { professionalNavigation } from "@/lib/constants";
import type { ProfessionalApplication, HealthcareProfessional } from "@/types";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrencyInr, formatDate } from "@/lib/utils";

export default function ProfessionalApplicationsPage() {
  const [applications, setApplications] = useState<ProfessionalApplication[]>([]);
  const [profile, setProfile] = useState<HealthcareProfessional | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [profRes, appsRes] = await Promise.all([
          fetch("/api/professional/profile"),
          fetch("/api/professional/applications")
        ]);

        const profResult = await profRes.json();
        const appsResult = await appsRes.json();

        if (!profRes.ok) throw new Error(profResult.error ?? "Failed to load profile.");
        if (!appsRes.ok) throw new Error(appsResult.error ?? "Failed to load applications.");

        if (!isMounted) return;

        setProfile(profResult.profile);
        setApplications(appsResult.applications ?? []);
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : "An error occurred.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  const activeApplications = applications.filter((application) =>
    application.status === "applied" || application.status === "confirmed"
  );
  const historyApplications = applications.filter((application) =>
    application.status === "completed" || application.status === "rejected"
  );

  function renderApplication(app: ProfessionalApplication) {
    const isJob = !!app.jobId;
    const target = isJob ? app.job! : app.shift!;
    const clinicName = target.clinic?.name ?? "Unknown Clinic";
    
    return (
      <article key={app.id} className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md ${isJob ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
              {isJob ? "Permanent Job" : "Locum Shift"}
            </span>
            <span className="text-sm font-medium text-slate-400">
              Applied {formatDate(app.createdAt)}
            </span>
          </div>
          
          <h3 className="text-xl font-bold text-[#0F172A] mb-2">{target.specialty}</h3>
          
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-600">
            <div className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-slate-400"/> {clinicName}</div>
            
            {!isJob && app.shift && (
              <>
                <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400"/> {app.shift.area}</div>
                <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-400"/> {formatDate(app.shift.date)}</div>
                <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400"/> {app.shift.startTime} - {app.shift.endTime}</div>
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold"><IndianRupee className="w-4 h-4"/> {formatCurrencyInr(app.shift.pay)}</div>
              </>
            )}
            
            {isJob && app.job && (
              <>
                <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400"/> {app.job.jobType === "full_time" ? "Full Time" : "Part Time"}</div>
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold"><IndianRupee className="w-4 h-4"/> {formatCurrencyInr(app.job.salaryMin)} - {formatCurrencyInr(app.job.salaryMax)}/mo</div>
              </>
            )}
          </div>
        </div>
        
        <div className="sm:text-right shrink-0">
          <div className="mb-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Status</p>
            <StatusBadge status={app.status} />
          </div>
          {app.status === "confirmed" && !isJob && (
            <p className="text-xs font-bold text-emerald-600 mt-2 bg-emerald-50 px-3 py-1.5 rounded-lg">
              Clinic confirmed this shift.
            </p>
          )}
        </div>
      </article>
    );
  }

  return (
    <DashboardShell 
      items={professionalNavigation}
      userProfile={profile ? { name: profile.name, verificationStatus: profile.verificationStatus } : undefined}
    >
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#0F172A]">My Applications</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Track the status of your shift and job applications.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#1E40AF]" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
          {error}
        </div>
      ) : applications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center flex flex-col items-center">
          <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <ClipboardList className="h-8 w-8 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No applications yet</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-sm">
            When you apply for shifts or permanent jobs, they will appear here so you can track their status.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-4 text-xl font-bold text-[#0F172A]">Active</h2>
            <div className="grid gap-4">
              {activeApplications.length > 0 ? activeApplications.map(renderApplication) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-medium text-slate-500">
                  No active applications.
                </div>
              )}
            </div>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-bold text-[#0F172A]">History</h2>
            <div className="grid gap-4">
              {historyApplications.length > 0 ? historyApplications.map(renderApplication) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-medium text-slate-500">
                  No historical applications yet.
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </DashboardShell>
  );
}
