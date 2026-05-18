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
          <p className="mt-2 text-sm leading-6 text-[#64748B]">Fill the details below. Your shift goes live after payment is confirmed.</p>
        </div>
        
        <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
          <p className="text-sm font-medium text-blue-900">
            Shifts are visible to matching verified professionals after upfront payment. You pay the professional's quoted fee + 20% Medrova platform fee.
          </p>
        </div>
      </div>
      
      <PostShiftForm />
    </DashboardShell>
  );
}
