import { ChevronDown, ChevronUp, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { useState } from "react";
import type { Application } from "@/types";

interface ApplicantCardProps {
  application: Application;
}

export function ApplicantCard({ application }: ApplicantCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const doctor = application.doctor;

  return (
    <article 
      className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition hover:border-[#1E40AF]/30"
    >
      <div 
        className="flex cursor-pointer items-start justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h3 className="text-lg font-semibold text-[#0F172A]">
            {doctor?.name ?? "Doctor applicant"}
          </h3>
          <p className="mt-1 flex items-center gap-2 text-sm text-[#64748B]">
            <span className="font-medium text-[#1E40AF]">{doctor?.specialty ?? "Specialty pending"}</span>
            <span>·</span>
            <span className="capitalize">{application.status}</span>
          </p>
        </div>
        <button 
          type="button" 
          className="text-[#64748B] hover:text-[#0F172A]"
          aria-label={isExpanded ? "Collapse details" : "Expand details"}
        >
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      {isExpanded && doctor ? (
        <div className="mt-6 border-t border-[#E2E8F0] pt-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-4">
              <h4 className="text-xs font-semibold tracking-wider text-[#64748B] uppercase">Professional Details</h4>
              
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#1E40AF]" />
                <div>
                  <p className="text-sm font-medium text-[#0F172A]">Experience</p>
                  <p className="mt-1 text-sm text-[#64748B]">{doctor.experience} years</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#1E40AF]" />
                <div>
                  <p className="text-sm font-medium text-[#0F172A]">MCI Registration</p>
                  <p className="mt-1 text-sm text-[#64748B]">{doctor.mciNumber || "Pending"}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#1E40AF]" />
                <div>
                  <p className="text-sm font-medium text-[#0F172A]">Employment</p>
                  <p className="mt-1 text-sm capitalize text-[#64748B]">{doctor.employmentStatus?.replace("_", " ")}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-semibold tracking-wider text-[#64748B] uppercase">Contact Information</h4>
              
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#1E40AF]" />
                <div>
                  <p className="text-sm font-medium text-[#0F172A]">Location</p>
                  <p className="mt-1 text-sm text-[#64748B]">{doctor.area || "Area pending"}{doctor.city ? `, ${doctor.city}` : ""}</p>
                </div>
              </div>

              {application.status === "confirmed" ? (
                <>
                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#10B981]" />
                    <div>
                      <p className="text-sm font-medium text-[#0F172A]">Phone Number</p>
                      <a href={`tel:${doctor.phone}`} className="mt-1 block text-sm font-medium text-[#10B981] hover:underline">
                        {doctor.phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#10B981]" />
                    <div>
                      <p className="text-sm font-medium text-[#0F172A]">Email Address</p>
                      <a href={`mailto:${doctor.email}`} className="mt-1 block text-sm font-medium text-[#10B981] hover:underline">
                        {doctor.email}
                      </a>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-lg bg-[#F8FAFC] p-4 text-sm text-[#64748B]">
                  Contact details (phone and email) will be unlocked here automatically once you confirm this applicant.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
