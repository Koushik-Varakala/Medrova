"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClinicShiftManager } from "@/components/clinic/ClinicShiftManager";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { clinicNavigation } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { getBooleanValue, getStringValue, getNumberValue } from "@/lib/utils";
import type { Application, Shift } from "@/types";

export default function ClinicShiftsPage() {
  const router = useRouter();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/sign-in"); return; }

      const { data: clinicRow } = await supabase
        .from("clinics").select("id").eq("user_id", user.id).maybeSingle();
      if (!clinicRow) { router.push("/onboarding/clinic"); return; }

      const clinicId = (clinicRow as { id: string }).id;

      const { data: shiftRows } = await supabase
        .from("shifts").select("*").eq("clinic_id", clinicId).order("date", { ascending: true });

      const mappedShifts: Shift[] = (shiftRows ?? []).map((s: Record<string, unknown>) => ({
        id: getStringValue(s, "id"), clinicId: getStringValue(s, "clinic_id"),
        specialty: getStringValue(s, "specialty"), date: getStringValue(s, "date"),
        startTime: getStringValue(s, "start_time"), endTime: getStringValue(s, "end_time"),
        pay: getNumberValue(s, "pay"), area: getStringValue(s, "area"),
        notes: getStringValue(s, "notes") || undefined,
        isUrgent: getBooleanValue(s, "is_urgent"),
        status: getStringValue(s, "status") as Shift["status"],
        createdAt: getStringValue(s, "created_at"),
      }));

      const shiftIds = mappedShifts.map((s) => s.id);
      let mappedApplications: Application[] = [];
      if (shiftIds.length > 0) {
        const appsRes = await fetch("/api/clinic/applications");
        if (appsRes.ok) {
          const appsJson = (await appsRes.json()) as { applications?: Record<string, unknown>[] };
          const apps = appsJson.applications ?? [];

          mappedApplications = apps.map((r: Record<string, unknown>) => {
            const rawData = r["doctor"] || r["doctors"];
            const rawDoc = Array.isArray(rawData) ? rawData[0] : rawData;
            
            const doctorObj = rawDoc ? {
              id: getStringValue(rawDoc, "id"),
              name: getStringValue(rawDoc, "name"),
              specialty: getStringValue(rawDoc, "specialty"),
              experience: getNumberValue(rawDoc, "experience"),
              phone: getStringValue(rawDoc, "phone"),
              email: getStringValue(rawDoc, "email"),
              mciNumber: getStringValue(rawDoc, "mci_number"),
              city: getStringValue(rawDoc, "city"),
              area: getStringValue(rawDoc, "area"),
              employmentStatus: getStringValue(rawDoc, "employment_status")
            } : undefined;

            return {
              id: getStringValue(r, "id"),
              doctorId: getStringValue(r, "doctor_id"),
              shiftId: getStringValue(r, "shift_id") || undefined,
              jobId: undefined,
              status: getStringValue(r, "status") as Application["status"],
              createdAt: getStringValue(r, "created_at"),
              doctor: doctorObj as Application["doctor"],
            };
          });
        }
      }

      if (!isMounted) return;
      setShifts(mappedShifts);
      setApplications(mappedApplications);
      setIsLoading(false);
    }
    load();
    return () => { isMounted = false; };
  }, [router]);

  return (
    <DashboardShell items={clinicNavigation}>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-normal text-[#0F172A]">My shifts</h1>
        <p className="mt-2 text-sm leading-6 text-[#64748B]">Review shift status, inspect applicants, and confirm coverage.</p>
      </div>
      {isLoading ? (
        <p className="rounded-xl border border-[#E2E8F0] bg-white p-6 text-sm text-[#64748B] shadow-sm">Loading shifts...</p>
      ) : (
        <ClinicShiftManager applications={applications} shifts={shifts} />
      )}
    </DashboardShell>
  );
}
