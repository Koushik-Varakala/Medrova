import type { Doctor } from "@/types";
import { VerificationBadge } from "@/components/shared/VerificationBadge";

interface DoctorCardProps {
  doctor: Doctor;
}

export function DoctorCard({ doctor }: DoctorCardProps) {
  return (
    <article className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#0F172A]">
            {doctor.name}
          </h3>
          <p className="mt-1 text-sm text-[#64748B]">
            {doctor.specialty} · {doctor.experience} years
          </p>
          <p className="mt-3 text-sm text-[#0F172A]">
            {doctor.area}, {doctor.city}
          </p>
        </div>
        <VerificationBadge status={doctor.verificationStatus} />
      </div>
    </article>
  );
}
