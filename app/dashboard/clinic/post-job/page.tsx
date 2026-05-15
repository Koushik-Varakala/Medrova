"use client";

import { PostJobForm } from "@/components/clinic/PostJobForm";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { clinicNavigation } from "@/lib/constants";

export default function ClinicPostJobPage() {
  return (
    <DashboardShell items={clinicNavigation}>
      <Header
        description="Publish a permanent opening for verified healthcare professionals to apply."
        title="Post a permanent job"
      />
      <PostJobForm />
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
