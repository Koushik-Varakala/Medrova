"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { DoctorShiftBrowser, ShiftSkeletonGrid } from "@/components/doctor/DoctorShiftBrowser";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { doctorNavigation } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { mapShiftRow, toDbRecord } from "@/lib/mappers";
import { getStringValue, getNumberValue, parseStringArray } from "@/lib/utils";
import type { Doctor, Shift, VerificationStatus } from "@/types";

export default function DoctorShiftsPage() {
  const router = useRouter();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
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
        availableDays: parseStringArray(d["available_days"]),
        shiftPreference: getStringValue(d, "shift_preference"),
        expectedPay: getNumberValue(d, "expected_pay"), upiId: getStringValue(d, "upi_id"),
        verificationStatus: getStringValue(d, "verification_status") as VerificationStatus,
        mciCertUrl: getStringValue(d, "mci_cert_url") || undefined,
        degreeCertUrl: getStringValue(d, "degree_cert_url") || undefined,
        govIdUrl: getStringValue(d, "gov_id_url") || undefined,
        createdAt: getStringValue(d, "created_at"),
      };

      const res = await fetch("/api/shifts?professionalType=doctor");
      const json = (await res.json()) as { shifts?: Record<string, unknown>[] };
      const mappedShifts: Shift[] = (json.shifts ?? []).map((shift) => mapShiftRow(toDbRecord(shift)));

      const { data: appRows } = await supabase
        .from("applications")
        .select("shift_id")
        .eq("doctor_id", mappedDoctor.id);

      const appliedShiftIds = new Set(
        (appRows ?? [])
          .map((row) => {
            const record = toDbRecord(row);
            return getStringValue(record, "shift_id");
          })
          .filter(Boolean)
      );
      const unappliedShifts = mappedShifts.filter(s => !appliedShiftIds.has(s.id));

      if (!isMounted) return;
      setDoctor(mappedDoctor);
      setShifts(unappliedShifts);
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
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-normal text-[#0F172A]">Browse shifts</h1>
        <p className="mt-2 text-sm leading-6 text-[#64748B]">Filter verified Hyderabad locum shifts and apply directly.</p>
      </div>
      {isLoading ? (
        <ShiftSkeletonGrid />
      ) : doctor ? (
        <DoctorShiftBrowser doctor={doctor} shifts={shifts} />
      ) : null}
    </DashboardShell>
  );
}
