"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { JobCard } from "@/components/shared/JobCard";
import { adminNavigation } from "@/lib/constants";
import type { Job } from "@/types";

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      const res = await fetch("/api/jobs");
      const json = (await res.json()) as { jobs?: Job[] };
      const mapped = json.jobs ?? [];
      if (!isMounted) return;
      setJobs(mapped);
      setIsLoading(false);
    }
    load();
    return () => { isMounted = false; };
  }, []);

  return (
    <DashboardShell items={adminNavigation}>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-normal text-[#0F172A]">All jobs</h1>
        <p className="mt-2 text-sm leading-6 text-[#64748B]">All permanent job postings across verified clinics.</p>
      </div>
      {isLoading ? (
        <p className="rounded-xl border border-[#E2E8F0] bg-white p-6 text-sm text-[#64748B] shadow-sm">Loading jobs...</p>
      ) : jobs.length === 0 ? (
        <p className="rounded-xl border border-[#E2E8F0] bg-white p-6 text-sm text-[#64748B] shadow-sm">No jobs posted yet.</p>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <JobCard job={job} key={job.id} />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
