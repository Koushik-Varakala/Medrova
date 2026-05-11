"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClinicJobManager } from "@/components/clinic/ClinicJobManager";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { clinicNavigation } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { getStringValue, getNumberValue } from "@/lib/utils";
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

      const { data: jobRows } = await supabase
        .from("jobs").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false });

      const mappedJobs: Job[] = (jobRows ?? []).map((j: Record<string, unknown>) => ({
        id: getStringValue(j, "id"), clinicId: getStringValue(j, "clinic_id"),
        specialty: getStringValue(j, "specialty"),
        experienceMin: getNumberValue(j, "experience_min"),
        jobType: getStringValue(j, "job_type") as Job["jobType"],
        salaryMin: getNumberValue(j, "salary_min"), salaryMax: getNumberValue(j, "salary_max"),
        description: getStringValue(j, "description"),
        status: getStringValue(j, "status") as Job["status"],
        createdAt: getStringValue(j, "created_at"),
      }));

      const jobIds = mappedJobs.map((j) => j.id);
      let mappedApplications: Application[] = [];
      if (jobIds.length > 0) {
        const { data: appRows } = await supabase
          .from("applications")
          .select("*")
          .in("job_id", jobIds)
          .order("created_at", { ascending: false });

        const apps = appRows ?? [];
        const doctorIds = apps.map((a: any) => getStringValue(a, "doctor_id")).filter(Boolean);
        
        let doctorsMap: Record<string, any> = {};
        if (doctorIds.length > 0) {
          const { data: docRows } = await supabase
            .from("doctors")
            .select("*")
            .in("id", doctorIds);
            
          (docRows ?? []).forEach((d: any) => {
            doctorsMap[d.id] = d;
          });
        }

        mappedApplications = apps.map((r: Record<string, unknown>) => {
          const docId = getStringValue(r, "doctor_id");
          const rawDoc = docId ? doctorsMap[docId] : null;
          
          const doctorObj = rawDoc ? {
            id: getStringValue(rawDoc, "id"),
            name: getStringValue(rawDoc, "name"),
            specialty: getStringValue(rawDoc, "specialty"),
          } : undefined;

          return {
            id: getStringValue(r, "id"),
            doctorId: docId,
            shiftId: undefined,
            jobId: getStringValue(r, "job_id") || undefined,
            status: getStringValue(r, "status") as Application["status"],
            createdAt: getStringValue(r, "created_at"),
            doctor: doctorObj as Application["doctor"],
          };
        });
      }

      if (!isMounted) return;
      setJobs(mappedJobs);
      setApplications(mappedApplications);
      setIsLoading(false);
    }
    load();
    return () => { isMounted = false; };
  }, [router]);

  return (
    <DashboardShell items={clinicNavigation}>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-normal text-[#0F172A]">My jobs</h1>
        <p className="mt-2 text-sm leading-6 text-[#64748B]">Track permanent openings and review interested doctors.</p>
      </div>
      {isLoading ? (
        <p className="rounded-xl border border-[#E2E8F0] bg-white p-6 text-sm text-[#64748B] shadow-sm">Loading jobs...</p>
      ) : (
        <ClinicJobManager applications={applications} jobs={jobs} />
      )}
    </DashboardShell>
  );
}
