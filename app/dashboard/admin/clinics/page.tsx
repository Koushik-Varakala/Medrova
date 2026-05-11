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
  address: string;
  area: string;
  phone: string;
  contact_person: string;
  contact_phone: string;
  specialties_needed: string[];
  verification_status: VerificationStatus;
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

        if (!isMounted) {
          return;
        }

        const mappedClinics: Clinic[] = (result.clinics ?? []).map((clinic) => ({
          id: clinic.id,
          userId: clinic.user_id,
          name: clinic.name,
          type: clinic.type,
          address: clinic.address,
          area: clinic.area,
          phone: clinic.phone,
          contactPerson: clinic.contact_person,
          contactPhone: clinic.contact_phone,
          specialtiesNeeded: clinic.specialties_needed,
          verificationStatus: clinic.verification_status,
          regCertUrl: clinic.reg_cert_url ?? undefined,
          createdAt: clinic.created_at
        }));

        setClinics(mappedClinics);
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : "Unable to load clinics right now.";
        setError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadClinics();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <DashboardShell items={adminNavigation}>
      <Header
        description="Review clinic registrations and approve verified hiring accounts."
        title="Clinics"
      />
      {error ? (
        <p className="mb-4 rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#B91C1C]">
          {error}
        </p>
      ) : null}
      {isLoading ? (
        <p className="rounded-xl border border-[#E2E8F0] bg-white p-6 text-sm text-[#64748B] shadow-sm">
          Loading clinics...
        </p>
      ) : (
        <AdminClinicTable clinics={clinics} />
      )}
    </DashboardShell>
  );
}

function Header({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-semibold tracking-normal text-[#0F172A]">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-[#64748B]">{description}</p>
    </div>
  );
}
