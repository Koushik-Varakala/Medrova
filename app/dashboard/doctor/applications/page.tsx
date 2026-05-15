"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ApplicationList, ApplicationSkeletonList } from "@/components/doctor/ApplicationList";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { doctorNavigation } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { toDbRecord } from "@/lib/mappers";
import { getNumberValue, getStringValue } from "@/lib/utils";
import type { Application } from "@/types";

export default function DoctorApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<{name: string, verificationStatus: string} | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/sign-in"); return; }

      const { data: doctorRow } = await supabase
        .from("doctors").select("id, name, verification_status").eq("user_id", user.id).maybeSingle();
      if (!doctorRow) { router.push("/onboarding/doctor"); return; }

      const doctorId = (doctorRow as { id: string }).id;
      if (isMounted) {
        setUserProfile({
          name: (doctorRow as { name: string }).name,
          verificationStatus: (doctorRow as { verification_status: string }).verification_status,
        });
      }

      const res = await fetch("/api/doctor/applications");
      const json = (await res.json()) as { applications?: Record<string, unknown>[] };
      const apps = json.applications ?? [];

      const mapped: Application[] = apps.map((row) => {
        const r = toDbRecord(row);
        const rawShiftData = r["shift"] || r["shifts"];
        const rawJobData = r["job"] || r["jobs"];
        const rawShift = toDbRecord(Array.isArray(rawShiftData) ? rawShiftData[0] : rawShiftData);
        const rawJob = toDbRecord(Array.isArray(rawJobData) ? rawJobData[0] : rawJobData);

        const mapClinic = (rawClinic: unknown) => {
          const c = toDbRecord(Array.isArray(rawClinic) ? rawClinic[0] : rawClinic);
          if (!getStringValue(c, "id") && !getStringValue(c, "name")) return undefined;
          return {
            name: getStringValue(c, "name"),
            contactPerson: getStringValue(c, "contact_person"),
            contactPhone: getStringValue(c, "contact_phone"),
            address: getStringValue(c, "address"),
            area: getStringValue(c, "area")
          };
        };

        const shiftObj = getStringValue(rawShift, "id") ? {
          specialty: getStringValue(rawShift, "specialty"),
          date: getStringValue(rawShift, "date"),
          startTime: getStringValue(rawShift, "start_time"),
          endTime: getStringValue(rawShift, "end_time"),
          pay: getNumberValue(rawShift, "pay"),
          clinic: mapClinic(rawShift.clinic || rawShift.clinics)
        } : undefined;

        const jobObj = getStringValue(rawJob, "id") ? {
          specialty: getStringValue(rawJob, "specialty"),
          jobType: getStringValue(rawJob, "job_type"),
          salaryMin: getNumberValue(rawJob, "salary_min"),
          salaryMax: getNumberValue(rawJob, "salary_max"),
          clinic: mapClinic(rawJob.clinic || rawJob.clinics)
        } : undefined;

        return {
          id: getStringValue(r, "id"),
          doctorId: getStringValue(r, "doctor_id"),
          shiftId: getStringValue(r, "shift_id") || undefined,
          jobId: getStringValue(r, "job_id") || undefined,
          status: getStringValue(r, "status") as Application["status"],
          createdAt: getStringValue(r, "created_at"),
          shift: shiftObj as Application["shift"],
          job: jobObj as Application["job"],
        };
      });

      if (!isMounted) return;
      setApplications(mapped);
      setIsLoading(false);
    }
    load();
    return () => { isMounted = false; };
  }, [router]);

  return (
    <DashboardShell items={doctorNavigation} userProfile={userProfile}>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F172A]">My applications</h1>
          <p className="mt-2 text-sm leading-6 text-[#64748B]">Track locum shift applications, including confirmed clinic contacts.</p>
        </div>
        {!isLoading && applications.length > 0 && (
          <div className="inline-flex h-8 items-center justify-center rounded-full bg-[#1E40AF]/10 px-3 text-sm font-semibold text-[#1E40AF]">
            {applications.length} total
          </div>
        )}
      </div>
      
      {isLoading ? (
        <ApplicationSkeletonList />
      ) : applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E2E8F0] bg-white py-16 text-center shadow-sm">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-400">
            <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-[#0F172A]">No applications yet</h3>
          <p className="mt-2 max-w-sm text-sm text-[#64748B]">
            You haven&apos;t applied to any shifts or jobs. Browse the available listings to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <div>
            <h2 className="mb-4 text-lg font-bold tracking-tight text-[#0F172A]">Active Applications</h2>
            {applications.filter(a => a.status === "applied" || a.status === "confirmed").length > 0 ? (
              <ApplicationList applications={applications.filter(a => a.status === "applied" || a.status === "confirmed")} />
            ) : (
              <p className="rounded-xl border border-[#E2E8F0] bg-white p-6 text-sm font-medium text-[#64748B] shadow-sm">
                No active applications at the moment.
              </p>
            )}
          </div>
          
          {applications.filter(a => a.status === "completed" || a.status === "rejected").length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-bold tracking-tight text-[#0F172A]">History</h2>
              <ApplicationList applications={applications.filter(a => a.status === "completed" || a.status === "rejected")} isHistory />
            </div>
          )}
        </div>
      )}
    </DashboardShell>
  );
}
