"use client";

import { BriefcaseMedical } from "lucide-react";
import { useMemo, useState } from "react";
import { specialties } from "@/lib/constants";
import type { Doctor, Job } from "@/types";
import { EmptyState } from "@/components/shared/EmptyState";
import { JobCard } from "@/components/shared/JobCard";

interface DoctorJobBrowserProps {
  doctor: Doctor;
  jobs: Job[];
}

export function DoctorJobBrowser({ doctor, jobs }: DoctorJobBrowserProps) {
  const [specialty, setSpecialty] = useState("");
  const [jobType, setJobType] = useState("");
  const [notice, setNotice] = useState("");

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSpecialty = specialty ? job.specialty === specialty : true;
      const matchesType = jobType ? job.jobType === jobType : true;

      return matchesSpecialty && matchesType;
    });
  }, [jobType, jobs, specialty]);

  async function applyToJob(jobId: string) {
    setNotice("");
    const response = await fetch(`/api/jobs/${jobId}/apply`, { method: "POST" });

    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      setNotice(result.error ?? "Unable to apply for this job.");
      return;
    }

    setNotice("Job application submitted.");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-[#0F172A]">Specialty</label>
            <select
              className="mt-2 w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
              onChange={(event) => setSpecialty(event.target.value)}
              value={specialty}
            >
              <option value="">All specialties</option>
              {specialties.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-[#0F172A]">Job type</label>
            <select
              className="mt-2 w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
              onChange={(event) => setJobType(event.target.value)}
              value={jobType}
            >
              <option value="">All types</option>
              <option value="full_time">Full time</option>
              <option value="part_time">Part time</option>
            </select>
          </div>
        </div>
      </section>
      {notice ? (
        <p className="rounded-lg border border-[#1E40AF]/20 bg-[#1E40AF]/10 px-4 py-3 text-sm text-[#1E40AF]">
          {notice}
        </p>
      ) : null}
      {filteredJobs.length > 0 ? (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <JobCard
              actionLabel={doctor.verificationStatus === "verified" ? "Apply" : undefined}
              key={job.id}
              onAction={() => applyToJob(job.id)}
              job={job}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          description="Permanent positions will appear here as verified clinics publish roles."
          icon={BriefcaseMedical}
          title="No jobs match your filters"
        />
      )}
    </div>
  );
}
