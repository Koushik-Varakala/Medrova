"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClinicShiftManager } from "@/components/clinic/ClinicShiftManager";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { clinicNavigation } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { mapShiftRow, toDbRecord } from "@/lib/mappers";
import { getStringValue, getNumberValue } from "@/lib/utils";
import type { Application, Shift } from "@/types";
import { Calendar, CalendarPlus } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

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
        .from("shifts").select("*").eq("clinic_id", clinicId).order("date", { ascending: false });

      const mappedShifts: Shift[] = (shiftRows ?? []).map((shift) => mapShiftRow(toDbRecord(shift)));

      const shiftIds = mappedShifts.map((s) => s.id);
      let mappedApplications: Application[] = [];
      if (shiftIds.length > 0) {
        const appsRes = await fetch("/api/clinic/applications");
        if (appsRes.ok) {
          const appsJson = (await appsRes.json()) as { applications?: Record<string, unknown>[] };
          const apps = appsJson.applications ?? [];

          mappedApplications = apps.map((row) => {
            const r = toDbRecord(row);
            const rawData = r["doctor"] || r["doctors"];
            const rawDoc = toDbRecord(Array.isArray(rawData) ? rawData[0] : rawData);
            
            const doctorObj = getStringValue(rawDoc, "id") ? {
              id: getStringValue(rawDoc, "id"),
              name: getStringValue(rawDoc, "name"),
              specialty: getStringValue(rawDoc, "specialty"),
              experience: getNumberValue(rawDoc, "experience"),
              phone: getStringValue(rawDoc, "phone"),
              email: getStringValue(rawDoc, "email"),
              mciNumber: getStringValue(rawDoc, "mci_number"),
              city: getStringValue(rawDoc, "city"),
              area: getStringValue(rawDoc, "area"),
              employmentStatus: getStringValue(rawDoc, "employment_status"),
              cvUrl: getStringValue(rawDoc, "cv_url") || undefined
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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-[#0F172A]">My Shifts</h1>
            {!isLoading && (
              <span className="flex h-6 items-center justify-center rounded-full bg-blue-100 px-2.5 text-sm font-bold text-blue-700">
                {shifts.length}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm leading-6 text-[#64748B]">Review shift status, inspect applicants, and confirm coverage.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[200px] w-full animate-pulse rounded-2xl bg-slate-200"></div>
            ))}
          </div>
          <div className="hidden h-[500px] w-full animate-pulse rounded-2xl bg-slate-200 lg:block"></div>
        </div>
      ) : shifts.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed border-[#E2E8F0] bg-white p-8 text-center shadow-sm"
        >
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-500 shadow-inner">
            <Calendar className="h-10 w-10 animate-bounce" />
          </div>
          <h2 className="text-2xl font-bold text-[#0F172A]">You haven&apos;t posted any shifts yet</h2>
          <p className="mt-2 max-w-md text-[#64748B]">
            Create your first locum shift to start finding verified doctors in your area.
          </p>
          <Link 
            href="/dashboard/clinic/post-shift" 
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E40AF] px-6 py-3 font-semibold text-white shadow-md transition-all hover:bg-[#1D4ED8] hover:shadow-lg"
          >
            <CalendarPlus className="h-5 w-5" />
            Post your first shift
          </Link>
        </motion.div>
      ) : (
        <ClinicShiftManager shifts={shifts} applications={applications} />
      )}
    </DashboardShell>
  );
}
