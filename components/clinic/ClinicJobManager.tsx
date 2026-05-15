import type { Application, Job } from "@/types";
import { ApplicantCard } from "@/components/clinic/ApplicantCard";
import { JobCard } from "@/components/shared/JobCard";
import { Users } from "lucide-react";

interface ClinicJobManagerProps {
  jobs: Job[];
  applications: Application[];
}

export function ClinicJobManager({ jobs, applications }: ClinicJobManagerProps) {
  if (jobs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#E2E8F0] bg-white p-12 text-center shadow-sm">
        <p className="text-[#64748B]">You haven&apos;t posted any permanent jobs yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {jobs.map((job) => {
        const jobApplications = applications.filter((application) => application.jobId === job.id);

        return (
          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-start" key={job.id}>
            {/* LEFT COLUMN - JOB CARD */}
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
              <JobCard job={job} />
            </div>
            
            {/* RIGHT COLUMN - APPLICANTS */}
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
                <h3 className="text-lg font-bold text-[#0F172A]">Applicants</h3>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                  {jobApplications.length}
                </span>
              </div>
              
              <div className="space-y-4">
                {jobApplications.length > 0 ? (
                  jobApplications.map((application) => (
                    <ApplicantCard application={application} key={application.id} />
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
