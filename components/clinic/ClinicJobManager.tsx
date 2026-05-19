"use client";

import { useState, useCallback } from "react";
import type { Application, Job } from "@/types";
import { ApplicantCard } from "@/components/clinic/ApplicantCard";
import { JobCard } from "@/components/shared/JobCard";
import { Users } from "lucide-react";

interface ClinicJobManagerProps {
  jobs: Job[];
  applications: Application[];
}

export function ClinicJobManager({ jobs, applications: initialApplications }: ClinicJobManagerProps) {
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [jobs_, setJobs] = useState<Job[]>(jobs);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const updateAppStatus = useCallback(async (
    applicationId: string,
    status: "confirmed" | "rejected" | "applied",
    sourceTable: Application["sourceTable"]
  ) => {
    setLoadingId(applicationId);
    try {
      const res = await fetch(`/api/clinic/job-applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, source_table: sourceTable ?? "professional_applications" }),
      });

      if (!res.ok) throw new Error("Failed to update");

      setApplications(prev =>
        prev.map(a => a.id === applicationId ? { ...a, status } : a)
      );
    } catch {
      alert("Failed to update application. Please try again.");
    } finally {
      setLoadingId(null);
    }
  }, []);

  const finalizeHire = useCallback(async (applicationId: string, jobId: string) => {
    setLoadingId(applicationId);
    try {
      // Mark application as completed
      const res = await fetch(`/api/clinic/job-applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "confirmed", source_table: "professional_applications" }),
      });
      if (!res.ok) {
        await fetch(`/api/clinic/job-applications/${applicationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "confirmed", source_table: "applications" }),
        });
      }

      // Close the job posting
      await fetch(`/api/clinic/jobs/${jobId}/close`, { method: "POST" });

      setJobs(prev =>
        prev.map(j => j.id === jobId ? { ...j, status: "closed" as Job["status"] } : j)
      );
    } catch {
      alert("Failed to finalize hire. Please try again.");
    } finally {
      setLoadingId(null);
    }
  }, []);

  if (jobs_.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#E2E8F0] bg-white p-12 text-center shadow-sm">
        <p className="text-[#64748B]">You haven&apos;t posted any permanent jobs yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {jobs_.map((job) => {
        const jobApplications = applications.filter((application) => application.jobId === job.id);
        const isJobClosed = job.status === "closed";

        return (
          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-start" key={job.id}>
            {/* LEFT COLUMN - JOB CARD */}
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
              <JobCard job={job} />
              {isJobClosed && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700">
                  ✓ Position Filled — Job Closed
                </div>
              )}
            </div>

            {/* RIGHT COLUMN - APPLICANTS */}
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
                <h3 className="text-lg font-bold text-[#0F172A]">Applicants</h3>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                  {jobApplications.length}
                </span>
                {jobApplications.some(a => a.status === "confirmed") && (
                  <span className="ml-auto rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                    {jobApplications.filter(a => a.status === "confirmed").length} Shortlisted
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {jobApplications.length > 0 ? (
                  jobApplications.map((application) => (
                    <ApplicantCard
                      application={application}
                      key={application.id}
                      isActionLoading={loadingId === application.id}
                      onAccept={isJobClosed ? undefined : (id) => updateAppStatus(id, "confirmed", application.sourceTable)}
                      onReject={isJobClosed ? undefined : (id) => updateAppStatus(id, "rejected", application.sourceTable)}
                      onFinalize={isJobClosed ? undefined : (id) => finalizeHire(id, job.id)}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
                      <Users className="h-6 w-6 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium text-[#64748B]">No applicants yet.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
