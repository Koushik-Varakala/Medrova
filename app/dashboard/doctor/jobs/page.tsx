"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DoctorJobBrowser } from "@/components/doctor/DoctorJobBrowser";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { doctorNavigation } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { getStringValue, getNumberValue } from "@/lib/utils";
import type { Doctor, Job, VerificationStatus } from "@/types";

export default function DoctorJobsPage() {
  const router = useRouter();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/sign-in"); return; }

      const { data: doctorRow } = await supabase
        .from("doctors").select("*").eq("user_id", user.id).maybeSingle();
      if (!doctorRow) { router.push("/onboarding/doctor"); return; }

      const d = doctorRow as Record<string, unknown>;
      const mappedDoctor: Doctor = {
        id: getStringValue(d, "id"), userId: getStringValue(d, "user_id"),
        name: getStringValue(d, "name"), phone: getStringValue(d, "phone"),
        email: getStringValue(d, "email"), specialty: getStringValue(d, "specialty"),
        experience: getNumberValue(d, "experience"), mciNumber: getStringValue(d, "mci_number"),
        city: getStringValue(d, "city"), area: getStringValue(d, "area"),
        employmentStatus: getStringValue(d, "employment_status"),
        availableDays: Array.isArray(d["available_days"]) ? d["available_days"] as string[] : [],
        shiftPreference: getStringValue(d, "shift_preference"),
        expectedPay: getNumberValue(d, "expected_pay"), upiId: getStringValue(d, "upi_id"),
        verificationStatus: getStringValue(d, "verification_status") as VerificationStatus,
        createdAt: getStringValue(d, "created_at"),
      };

      const res = await fetch("/api/jobs?professionalType=doctor");
      const json = (await res.json()) as { jobs?: Job[] };
      const mappedJobs = json.jobs ?? [];

      if (!isMounted) return;
      setDoctor(mappedDoctor);
      setJobs(mappedJobs);
      setIsLoading(false);
    }
    load();
    return () => { isMounted = false; };
  }, [router]);

  return (
    <DashboardShell items={doctorNavigation}>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-normal text-[#0F172A]">Permanent jobs</h1>
        <p className="mt-2 text-sm leading-6 text-[#64748B]">Browse full-time and part-time openings from verified clinics.</p>
      </div>
      {isLoading ? (
        <p className="rounded-xl border border-[#E2E8F0] bg-white p-6 text-sm text-[#64748B] shadow-sm">Loading jobs...</p>
      ) : doctor ? (
        <DoctorJobBrowser doctor={doctor} jobs={jobs} />
      ) : null}
    </DashboardShell>
  );
}
