"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DoctorProfileForm } from "@/components/doctor/DoctorProfileForm";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { doctorNavigation } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { getStringValue, getNumberValue } from "@/lib/utils";
import type { Doctor, VerificationStatus } from "@/types";

export default function DoctorProfilePage() {
  const router = useRouter();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/sign-in"); return; }

      const { data: d } = await supabase
        .from("doctors").select("*").eq("user_id", user.id).maybeSingle();
      if (!d) { router.push("/onboarding/doctor"); return; }

      const row = d as Record<string, unknown>;
      if (!isMounted) return;
      setDoctor({
        id: getStringValue(row, "id"), userId: getStringValue(row, "user_id"),
        name: getStringValue(row, "name"), phone: getStringValue(row, "phone"),
        email: getStringValue(row, "email"), specialty: getStringValue(row, "specialty"),
        experience: getNumberValue(row, "experience"), mciNumber: getStringValue(row, "mci_number"),
        city: getStringValue(row, "city"), area: getStringValue(row, "area"),
        employmentStatus: getStringValue(row, "employment_status"),
        availableDays: Array.isArray(row["available_days"]) ? row["available_days"] as string[] : [],
        shiftPreference: getStringValue(row, "shift_preference"),
        expectedPay: getNumberValue(row, "expected_pay"), upiId: getStringValue(row, "upi_id"),
        verificationStatus: getStringValue(row, "verification_status") as VerificationStatus,
        verificationNote: getStringValue(row, "verification_note") || undefined,
        mciCertUrl: getStringValue(row, "mci_cert_url") || undefined,
        degreeCertUrl: getStringValue(row, "degree_cert_url") || undefined,
        govIdUrl: getStringValue(row, "gov_id_url") || undefined,
        createdAt: getStringValue(row, "created_at"),
      });
      setIsLoading(false);
    }
    load();
    return () => { isMounted = false; };
  }, [router]);

  return (
    <DashboardShell 
      items={doctorNavigation}
      userProfile={doctor ? { name: doctor.name, verificationStatus: doctor.verificationStatus } : undefined}
    >
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F172A]">Profile</h1>
          <p className="mt-2 text-sm leading-6 text-[#64748B]">Manage your professional details, availability, and payments.</p>
        </div>
      </div>
      
      {isLoading ? (
        <div className="space-y-6">
          <div className="h-40 w-full animate-pulse rounded-2xl bg-slate-200"></div>
          <div className="h-64 w-full animate-pulse rounded-2xl bg-slate-200"></div>
          <div className="h-64 w-full animate-pulse rounded-2xl bg-slate-200"></div>
        </div>
      ) : doctor ? (
        <DoctorProfileForm doctor={doctor} />
      ) : null}
    </DashboardShell>
  );
}
