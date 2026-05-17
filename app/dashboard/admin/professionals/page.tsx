"use client";

import { useEffect, useState } from "react";
import { AdminProfessionalTable, ProfessionalApiRow } from "../../../../components/admin/AdminProfessionalTable";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { adminNavigation } from "@/lib/constants";

export default function AdminProfessionalsPage() {
  const [professionals, setProfessionals] = useState<ProfessionalApiRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProfessionals() {
      try {
        const response = await fetch("/api/admin/professionals");
        const result = (await response.json()) as { professionals?: ProfessionalApiRow[]; error?: string };

        if (!response.ok) {
          throw new Error(result.error ?? "Unable to load professionals.");
        }

        if (!isMounted) return;

        setProfessionals(result.professionals ?? []);
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : "Unable to load professionals right now.";
        setError(message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProfessionals();
    return () => { isMounted = false; };
  }, []);

  return (
    <DashboardShell items={adminNavigation}>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-[#0F172A]">Healthcare Professionals</h1>
            {!isLoading && (
              <span className="flex h-7 items-center justify-center rounded-full bg-[#1E40AF]/10 px-3 text-xs font-bold text-[#1E40AF]">
                {professionals.length} Total
              </span>
            )}
          </div>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Review professional profiles, documents, and verification status across all roles.
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
        <AdminProfessionalTable professionals={professionals} />
      )}
    </DashboardShell>
  );
}
