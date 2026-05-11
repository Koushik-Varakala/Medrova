import type { Job } from "@/types";
import { formatCurrencyInr } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";

interface JobCardProps {
  job: Job;
  actionLabel?: string;
  onAction?: () => void;
}

export function JobCard({ job, actionLabel, onAction }: JobCardProps) {
  return (
    <article className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#0F172A]">
            {job.specialty}
          </h3>
          <p className="mt-2 text-sm text-[#64748B]">
            {job.clinic?.name ?? "Clinic"} · {job.jobType.replace("_", " ")}
          </p>
          <p className="mt-3 text-sm text-[#0F172A]">
            Minimum {job.experienceMin} years experience
          </p>
          <div className="mt-3">
            <StatusBadge status={job.status} />
          </div>
        </div>
        <div className="sm:text-right">
          <p className="text-lg font-semibold text-[#0F172A]">
            {formatCurrencyInr(job.salaryMin)} - {formatCurrencyInr(job.salaryMax)}
          </p>
          <p className="text-sm text-[#64748B]">monthly salary</p>
        </div>
      </div>
      <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#64748B]">
        {job.description}
      </p>
      {actionLabel ? (
        <button
          className="mt-5 rounded-lg bg-[#1E40AF] px-4 py-2 text-sm font-medium text-white hover:bg-[#1D4ED8]"
          onClick={onAction}
          type="button"
        >
          {actionLabel}
        </button>
      ) : null}
    </article>
  );
}
