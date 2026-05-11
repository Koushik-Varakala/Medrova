"use client";

import { useEffect, useState } from "react";
import { AdminDoctorTable } from "@/components/admin/AdminDoctorTable";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { adminNavigation } from "@/lib/constants";
import type { Doctor, VerificationStatus } from "@/types";

interface DoctorApiRow {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email: string;
  specialty: string;
  experience: number;
  mci_number: string;
  city: string;
  area: string;
  employment_status: string;
  available_days: string[];
  shift_preference: string;
  expected_pay: number;
  upi_id: string;
  verification_status: VerificationStatus;
  verification_note: string | null;
  mci_cert_url: string | null;
  degree_cert_url: string | null;
  gov_id_url: string | null;
  created_at: string;
}

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDoctors() {
      try {
        const response = await fetch("/api/admin/doctors");
        const result = (await response.json()) as { doctors?: DoctorApiRow[]; error?: string };

        if (!response.ok) {
          throw new Error(result.error ?? "Unable to load doctors.");
        }

        if (!isMounted) return;

        const mapped: Doctor[] = (result.doctors ?? []).map((d) => ({
          id: d.id,
          userId: d.user_id,
          name: d.name,
          phone: d.phone,
          email: d.email,
          specialty: d.specialty,
          experience: d.experience,
          mciNumber: d.mci_number,
          city: d.city,
          area: d.area,
          employmentStatus: d.employment_status,
          availableDays: d.available_days,
          shiftPreference: d.shift_preference,
          expectedPay: d.expected_pay,
          upiId: d.upi_id,
          verificationStatus: d.verification_status,
          verificationNote: d.verification_note ?? undefined,
          mciCertUrl: d.mci_cert_url ?? undefined,
          degreeCertUrl: d.degree_cert_url ?? undefined,
          govIdUrl: d.gov_id_url ?? undefined,
          createdAt: d.created_at
        }));

        setDoctors(mapped);
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : "Unable to load doctors right now.";
        setError(message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDoctors();
    return () => { isMounted = false; };
  }, []);

  return (
    <DashboardShell items={adminNavigation}>
      <Header
        description="Review doctor profiles, documents, and verification status."
        title="Doctors"
      />
      {error ? (
        <p className="mb-4 rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#B91C1C]">
          {error}
        </p>
      ) : null}
      {isLoading ? (
        <p className="rounded-xl border border-[#E2E8F0] bg-white p-6 text-sm text-[#64748B] shadow-sm">
          Loading doctors...
        </p>
      ) : doctors.length === 0 ? (
        <p className="rounded-xl border border-[#E2E8F0] bg-white p-6 text-sm text-[#64748B] shadow-sm">
          No doctors registered yet.
        </p>
      ) : (
        <AdminDoctorTable doctors={doctors} />
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
