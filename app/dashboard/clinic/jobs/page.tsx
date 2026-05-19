"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClinicJobManager } from "@/components/clinic/ClinicJobManager";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { clinicNavigation } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { mapJobRow, toDbRecord } from "@/lib/mappers";
import { getOptionalStringValue, getStringValue, getNumberValue } from "@/lib/utils";
import type { Application, Job } from "@/types";

export default function ClinicJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
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

      // Fetch jobs (clinic owns these — anon key is fine)
      const { data: jobRows } = await supabase
        .from("jobs").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false });

      const mappedJobs: Job[] = (jobRows ?? []).map((job) => mapJobRow(toDbRecord(job)));

      // Fetch ALL applications via service-role API (avoids RLS on professional tables)
      const appsRes = await fetch("/api/clinic/applications");
      const appsJson = (await appsRes.json()) as { applications?: Record<string, unknown>[] };
      const rawApps = appsJson.applications ?? [];

      // Filter to only job applications and map to the Application type
      const jobApplications: Application[] = rawApps
        .filter(a => getOptionalStringValue(toDbRecord(a), "job_id"))
        .map(a => {
          const r = toDbRecord(a);
          const doc = toDbRecord(r.doctors);
          const doctorObj = getStringValue(doc, "id") ? {
            id: getStringValue(doc, "id"),
            name: getStringValue(doc, "name"),
            specialty: getStringValue(doc, "specialty"),
            experience: getNumberValue(doc, "experience"),
            phone: getStringValue(doc, "phone"),
            email: getStringValue(doc, "email"),
            mciNumber: getStringValue(doc, "mci_number"),
            city: getStringValue(doc, "city"),
            area: getStringValue(doc, "area"),
            employmentStatus: getStringValue(doc, "employment_status"),
            cvUrl: getOptionalStringValue(doc, "cv_url") || undefined,
          } : undefined;

          return {
            id: getStringValue(r, "id"),
            doctorId: getStringValue(r, "doctor_id") || getStringValue(r, "professional_id"),
            shiftId: undefined,
            jobId: getOptionalStringValue(r, "job_id") || undefined,
            status: getStringValue(r, "status") as Application["status"],
            createdAt: getStringValue(r, "created_at"),
            sourceTable: (getStringValue(r, "source_table") || "professional_applications") as Application["sourceTable"],
            doctor: doctorObj as Application["doctor"],
          };
        });

      if (!isMounted) return;
      setJobs(mappedJobs);
      setApplications(jobApplications);
      setIsLoading(false);
    }
    load();
    return () => { isMounted = false; };
  }, [router]);

  return (
    <DashboardShell items={clinicNavigation}>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-normal text-[#0F172A]">My jobs</h1>
        <p className="mt-2 text-sm leading-6 text-[#64748B]">Track permanent openings and review interested professionals.</p>
      </div>
      {isLoading ? (
        <p className="rounded-xl border border-[#E2E8F0] bg-white p-6 text-sm text-[#64748B] shadow-sm">Loading jobs...</p>
      ) : (
        <ClinicJobManager applications={applications} jobs={jobs} />
      )}
    </DashboardShell>
  );
}
