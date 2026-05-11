"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { ShiftCard } from "@/components/shared/ShiftCard";
import { adminNavigation } from "@/lib/constants";
import { getBooleanValue, getStringValue, getNumberValue } from "@/lib/utils";
import type { Shift } from "@/types";

export default function AdminShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      const res = await fetch("/api/shifts");
      const json = (await res.json()) as { shifts?: Record<string, unknown>[] };
      const mapped: Shift[] = (json.shifts ?? []).map((s) => ({
        id: getStringValue(s, "id"), clinicId: getStringValue(s, "clinic_id"),
        specialty: getStringValue(s, "specialty"), date: getStringValue(s, "date"),
        startTime: getStringValue(s, "start_time"), endTime: getStringValue(s, "end_time"),
        pay: getNumberValue(s, "pay"), area: getStringValue(s, "area"),
        notes: getStringValue(s, "notes") || undefined,
        isUrgent: getBooleanValue(s, "is_urgent"),
        status: getStringValue(s, "status") as Shift["status"],
        createdAt: getStringValue(s, "created_at"),
      }));
      if (!isMounted) return;
      setShifts(mapped);
      setIsLoading(false);
    }
    load();
    return () => { isMounted = false; };
  }, []);

  return (
    <DashboardShell items={adminNavigation}>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-normal text-[#0F172A]">All shifts</h1>
        <p className="mt-2 text-sm leading-6 text-[#64748B]">All shifts across the Medrova marketplace.</p>
      </div>
      {isLoading ? (
        <p className="rounded-xl border border-[#E2E8F0] bg-white p-6 text-sm text-[#64748B] shadow-sm">Loading shifts...</p>
      ) : shifts.length === 0 ? (
        <p className="rounded-xl border border-[#E2E8F0] bg-white p-6 text-sm text-[#64748B] shadow-sm">No shifts posted yet.</p>
      ) : (
        <div className="space-y-4">
          {shifts.map((shift) => <ShiftCard key={shift.id} shift={shift} />)}
        </div>
      )}
    </DashboardShell>
  );
}
