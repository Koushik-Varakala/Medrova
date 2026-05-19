"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClinicJobManager } from "@/components/clinic/ClinicJobManager";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { clinicNavigation } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { mapJobRow, toDbRecord } from "@/lib/mappers";
import { getNumberValue, getStringValue } from "@/lib/utils";
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

      const mappedJobs: Job[] = (jobRows ?? []).map((job) => mapJobRow(toDbRecord(job)));

      const jobIds = mappedJobs.map((j) => j.id);
      let mappedApplications: Application[] = [];
      if (jobIds.length > 0) {
        const { data: appRows } = await supabase
          .from("applications")
          .select("*")
          .in("job_id", jobIds)
          .order("created_at", { ascending: false });

        const apps = appRows ?? [];
        const doctorIds = apps.map((application) => getStringValue(toDbRecord(application), "doctor_id")).filter(Boolean);
        
        let doctorsMap: Record<string, Record<string, unknown>> = {};
        if (doctorIds.length > 0) {
          const { data: docRows } = await supabase
            .from("doctors")
            .select("*")
            .in("id", doctorIds);
            
          (docRows ?? []).forEach((doctorRow) => {
            const doctor = toDbRecord(doctorRow);
            const id = getStringValue(doctor, "id");
            if (id) doctorsMap[id] = doctor;
          });
        }

        mappedApplications = apps.map((row) => {
          const r = toDbRecord(row);
          const docId = getStringValue(r, "doctor_id");
          const rawDoc = docId ? doctorsMap[docId] : null;
          
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
            employmentStatus: getStringValue(rawDoc, "employment_status"),
            cvUrl: getStringValue(rawDoc, "cv_url") || undefined
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

        const { data: professionalAppRows } = await supabase
          .from("professional_applications")
          .select("*, professional:healthcare_professionals(*)")
          .in("job_id", jobIds)
          .order("created_at", { ascending: false });

        const professionalApplications = (professionalAppRows ?? []).map((row) => {
          const r = toDbRecord(row);
          const professional = toDbRecord(r.professional);
          const professionalObj = getStringValue(professional, "id") ? {
            id: getStringValue(professional, "id"),
            name: getStringValue(professional, "name"),
            specialty: getStringValue(professional, "specialty"),
            experience: getNumberValue(professional, "experience"),
            phone: getStringValue(professional, "phone"),
            email: getStringValue(professional, "email"),
            mciNumber: getStringValue(professional, "registration_number"),
            city: getStringValue(professional, "city"),
            area: getStringValue(professional, "area"),
            employmentStatus: getStringValue(professional, "employment_status"),
            cvUrl: getStringValue(professional, "cv_url") || undefined
          } : undefined;

          return {
            id: getStringValue(r, "id"),
            doctorId: getStringValue(r, "professional_id"),
            shiftId: undefined,
            jobId: getStringValue(r, "job_id") || undefined,
            status: getStringValue(r, "status") as Application["status"],
            createdAt: getStringValue(r, "created_at"),
            doctor: professionalObj as Application["doctor"]
          };
        });

        mappedApplications = [...mappedApplications, ...professionalApplications];
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
