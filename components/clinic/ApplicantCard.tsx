import { ChevronDown, ChevronUp, FileText, Mail, MapPin, Phone, ShieldCheck, User, CheckCircle } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Application } from "@/types";
import { cn } from "@/lib/utils";

interface ApplicantCardProps {
  application: Application;
  isShiftConfirmed?: boolean;
}

export function ApplicantCard({ application, isShiftConfirmed }: ApplicantCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const doctor = application.doctor;

  if (!doctor) return null;

  // Generate initials
  const initials = doctor.name
    .split(" ")
    .map(n => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const isConfirmed = application.status === "confirmed" && isShiftConfirmed;

  return (
    <article 
      className={cn(
        "overflow-hidden rounded-2xl border transition-all",
        isConfirmed ? "border-emerald-200 bg-white shadow-md ring-1 ring-emerald-500/10" : "border-[#E2E8F0] bg-white shadow-sm hover:border-[#1E40AF]/30"
      )}
    >
      <div 
        className="flex cursor-pointer items-start gap-4 p-5"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* AVATAR */}
        <div className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold shadow-inner",
          isConfirmed ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
        )}>
          {initials || <User className="h-6 w-6" />}
        </div>

        {/* INFO */}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="flex items-center gap-2 font-bold text-[#0F172A] sm:text-lg">
                {doctor.name}
                <div className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  <ShieldCheck className="h-3 w-3" />
                  Verified
                </div>
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                <span className="font-semibold text-[#1E40AF]">{doctor.specialty}</span>
                <span className="text-slate-300">•</span>
                <span className="font-medium text-slate-600">{doctor.experience} yrs exp</span>
                <span className="text-slate-300">•</span>
                <span className="font-bold text-[#0F172A]">0 Shifts Completed</span>
              </div>
            </div>
            
            <button 
              type="button" 
              className="mt-1 rounded-full p-1 text-[#64748B] hover:bg-slate-100 hover:text-[#0F172A]"
              aria-label={isExpanded ? "Collapse details" : "Expand details"}
            >
              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#64748B]">
            <MapPin className="h-3.5 w-3.5" />
            {doctor.area || doctor.city}
          </div>
        </div>
      </div>

      {/* CONFIRMED BANNER - UNLOCKED DETAILS */}
      {isConfirmed && (
        <div className="border-t border-emerald-100 bg-emerald-50 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-800">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            Professional Confirmed - Contact Details Unlocked
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
            <a href={`tel:${doctor.phone}`} className="flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 hover:underline">
              <Phone className="h-4 w-4" />
              {doctor.phone}
            </a>
            <a href={`mailto:${doctor.email}`} className="flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 hover:underline">
              <Mail className="h-4 w-4" />
              {doctor.email}
            </a>
          </div>
        </div>
      )}

      {/* EXPANDED DETAILS */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#E2E8F0] p-5">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#64748B]">Trust & Reliability</h4>
              <div className="mb-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Medrova Verified
                  </div>
                  <p className="mt-1.5 text-xs font-medium text-emerald-700">
                    Medical License & Government ID manually verified.
                  </p>
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#1E40AF]">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    0 Shifts Completed
                  </div>
                  <p className="mt-1.5 text-xs font-medium text-blue-800">
                    This professional is new to the Medrova platform.
                  </p>
                </div>
              </div>

              <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Professional Profile</h4>
              
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Registration Number</p>
                  <p className="font-medium text-[#0F172A]">{doctor.mciNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Employment Status</p>
                  <p className="font-medium capitalize text-[#0F172A]">{doctor.employmentStatus?.replace("_", " ")}</p>
                </div>
              </div>

              {/* CV DOWNLOAD */}
              {doctor.cvUrl && (
                <div className="mt-5 border-t border-[#E2E8F0] pt-4">
                  <a
                    href={doctor.cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-[#1E40AF] transition-all hover:bg-blue-100 hover:shadow-sm"
                  >
                    <FileText className="h-4 w-4" />
                    View Full CV / Resume
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
