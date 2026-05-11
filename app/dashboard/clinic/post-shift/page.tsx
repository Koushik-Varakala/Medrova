"use client";

import { PostShiftForm } from "@/components/clinic/PostShiftForm";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { clinicNavigation } from "@/lib/constants";

export default function ClinicPostShiftPage() {
  return (
    <DashboardShell items={clinicNavigation}>
      <Header
        description="Create a locum shift, pay upfront, and let the webhook activate it."
        title="Post a locum shift"
      />
      <PostShiftForm />
    </DashboardShell>
  );
}

function Header({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-semibold tracking-normal text-[#0F172A]">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-[#64748B]">{description}</p>
    </div>
  );
}
