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
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-[#0F172A]">Doctors</h1>
            {!isLoading && (
              <span className="flex h-7 items-center justify-center rounded-full bg-[#1E40AF]/10 px-3 text-xs font-bold text-[#1E40AF]">
                {doctors.length} Total
              </span>
            )}
          </div>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Review doctor profiles, documents, and verification status.
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
            {[1, 2, 3, 4].map(i => <div key={i} className="h-40 rounded-xl bg-slate-200 animate-pulse border border-slate-300" />)}
          </div>
        </div>
      ) : (
        <AdminDoctorTable doctors={doctors} />
      )}
    </DashboardShell>
  );
}
