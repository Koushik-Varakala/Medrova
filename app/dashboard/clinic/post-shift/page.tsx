"use client";

import { PostShiftForm } from "@/components/clinic/PostShiftForm";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { clinicNavigation } from "@/lib/constants";
import { Info } from "lucide-react";

export default function ClinicPostShiftPage() {
  return (
    <DashboardShell items={clinicNavigation}>
      <div className="mb-6 flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F172A]">Post a Locum Shift</h1>
          <p className="mt-2 text-sm leading-6 text-[#64748B]">Fill the details below. Your shift goes live instantly and is visible to matching verified professionals.</p>
        </div>
        
        <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
          <p className="text-sm font-medium text-blue-900">
            Posting shifts is <strong>free</strong>. You use 1 Medrova Credit only when you choose to confirm a professional for your shift. Doctors are always paid directly by you at the clinic — zero platform commission.
          </p>
        </div>
      </div>
      
      <PostShiftForm />
    </DashboardShell>
  );
}
