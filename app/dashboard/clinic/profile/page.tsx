"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClinicProfileForm } from "@/components/clinic/ClinicProfileForm";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { clinicNavigation } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { getStringValue } from "@/lib/utils";
import type { Clinic, VerificationStatus } from "@/types";

export default function ClinicProfilePage() {
  const router = useRouter();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/sign-in"); return; }

      const { data: c } = await supabase
        .from("clinics").select("*").eq("user_id", user.id).maybeSingle();
      if (!c) { router.push("/onboarding/clinic"); return; }

      const row = c as Record<string, unknown>;
      if (!isMounted) return;
      setClinic({
        id: getStringValue(row, "id"), userId: getStringValue(row, "user_id"),
        name: getStringValue(row, "name"), type: getStringValue(row, "type"),
        address: getStringValue(row, "address"), area: getStringValue(row, "area"),
        phone: getStringValue(row, "phone"), contactPerson: getStringValue(row, "contact_person"),
        contactPhone: getStringValue(row, "contact_phone"),
        specialtiesNeeded: Array.isArray(row["specialties_needed"]) ? row["specialties_needed"] as string[] : [],
        verificationStatus: getStringValue(row, "verification_status") as VerificationStatus,
        regCertUrl: getStringValue(row, "reg_cert_url") || undefined,
        createdAt: getStringValue(row, "created_at"),
      });
      setIsLoading(false);
    }
    load();
    return () => { isMounted = false; };
  }, [router]);

  return (
    <DashboardShell 
      items={clinicNavigation}
      userProfile={clinic ? { name: clinic.name, verificationStatus: clinic.verificationStatus } : undefined}
    >
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-[#0F172A]">Profile Management</h1>
        <p className="mt-2 text-sm leading-6 text-[#64748B]">Update your clinic&apos;s details, contact information, and documents.</p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="h-40 w-full animate-pulse rounded-2xl bg-slate-200"></div>
          <div className="h-[500px] w-full animate-pulse rounded-2xl bg-slate-200"></div>
        </div>
      ) : clinic ? (
        <ClinicProfileForm clinic={clinic} />
      ) : null}
    </DashboardShell>
  );
}
