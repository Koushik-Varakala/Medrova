"use client";

import { useEffect, useState } from "react";
import { AdminClinicTable } from "@/components/admin/AdminClinicTable";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { adminNavigation } from "@/lib/constants";
import type { Clinic, VerificationStatus } from "@/types";

interface ClinicApiRow {
  id: string;
  user_id: string;
  name: string;
  type: string;
  phone: string;
  contact_person: string;
  contact_phone: string;
  address: string;
  area: string;
  specialties_needed: string[];
  verification_status: VerificationStatus;
  verification_note: string | null;
  reg_cert_url: string | null;
  created_at: string;
}

export default function AdminClinicsPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadClinics() {
      try {
        const response = await fetch("/api/admin/clinics");
        const result = (await response.json()) as { clinics?: ClinicApiRow[]; error?: string };

        if (!response.ok) {
          throw new Error(result.error ?? "Unable to load clinics.");
        }

        if (!isMounted) return;

        const mapped: (Clinic & { verificationNote?: string })[] = (result.clinics ?? []).map((c) => ({
          id: c.id,
          userId: c.user_id,
          name: c.name,
          type: c.type,
          phone: c.phone || c.contact_phone,
          contactPerson: c.contact_person,
          contactPhone: c.contact_phone,
          address: c.address,
          area: c.area,
          specialtiesNeeded: c.specialties_needed || [],
          verificationStatus: c.verification_status,
          verificationNote: c.verification_note ?? undefined,
          regCertUrl: c.reg_cert_url ?? undefined,
          createdAt: c.created_at
        }));

        setClinics(mapped);
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : "Unable to load clinics right now.";
        setError(message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadClinics();
    return () => { isMounted = false; };
  }, []);

  return (
    <DashboardShell items={adminNavigation}>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-[#0F172A]">Clinics</h1>
            {!isLoading && (
              <span className="flex h-7 items-center justify-center rounded-full bg-[#1E40AF]/10 px-3 text-xs font-bold text-[#1E40AF]">
                {clinics.length} Total
              </span>
            )}
          </div>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Review clinic registrations, documents, and verification status.
          </p>
        </div>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 shadow-sm">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-10 w-24 rounded-full bg-slate-200 animate-pulse" />)}
          </div>
          <div className="grid gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 rounded-xl bg-slate-200 animate-pulse border border-slate-300" />)}
          </div>
        </div>
      ) : (
        <AdminClinicTable clinics={clinics} />
      )}
    </DashboardShell>
  );
}
