import type { Application, Job } from "@/types";
import { ApplicantCard } from "@/components/clinic/ApplicantCard";
import { JobCard } from "@/components/shared/JobCard";

interface ClinicJobManagerProps {
  jobs: Job[];
  applications: Application[];
}

export function ClinicJobManager({ jobs, applications }: ClinicJobManagerProps) {
  return (
    <div className="space-y-6">
      {jobs.map((job) => {
        const jobApplications = applications.filter((application) => application.jobId === job.id);

        return (
          <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]" key={job.id}>
            <JobCard job={job} />
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#0F172A]">Applicants</h3>
              <div className="mt-4 space-y-4">
                {jobApplications.length > 0 ? (
                  jobApplications.map((application) => (
                    <ApplicantCard application={application} key={application.id} />
                  ))
                ) : (
                  <p className="text-sm text-[#64748B]">No applicants yet.</p>
                )}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
