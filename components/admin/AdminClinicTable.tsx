"use client";

import { Check, FileText, X } from "lucide-react";
import { useState } from "react";
import type { Clinic, VerificationStatus } from "@/types";
import { StatusBadge } from "@/components/shared/StatusBadge";

interface AdminClinicTableProps {
  clinics: Clinic[];
}

export function AdminClinicTable({ clinics: initialClinics }: AdminClinicTableProps) {
  const [clinics, setClinics] = useState<Clinic[]>(initialClinics);
  const [notice, setNotice] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function verifyClinic(clinicId: string, status: VerificationStatus) {
    setLoadingId(clinicId);
    setNotice("");

    const response = await fetch(`/api/admin/clinics/${clinicId}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        note: status === "verified" ? "Approved by Medrova admin." : "Registration needs review."
      })
    });

    setLoadingId(null);

    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      setNotice(result.error ?? "Unable to update clinic.");
      return;
    }

    // Optimistically update the local list so UI reflects the new status immediately
    setClinics((prev) =>
      prev.map((c) =>
        c.id === clinicId ? { ...c, verificationStatus: status } : c
      )
    );

    setNotice(
      status === "verified"
        ? "Clinic approved successfully."
        : "Clinic rejected."
    );
  }

  return (
    <div className="space-y-4">
      {notice ? (
        <p className="rounded-lg border border-[#1E40AF]/20 bg-[#1E40AF]/10 px-4 py-3 text-sm text-[#1E40AF]">
          {notice}
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-[#F8FAFC] text-[#64748B]">
            <tr>
              <th className="px-4 py-3 font-medium">Clinic</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Area</th>
              <th className="px-4 py-3 font-medium">Verification</th>
              <th className="px-4 py-3 font-medium">Document</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {clinics.map((clinic) => {
              const isPending = clinic.verificationStatus === "pending";
              const isUpdating = loadingId === clinic.id;

              return (
                <tr key={clinic.id}>
                  <td className="px-4 py-3 text-[#0F172A]">{clinic.name}</td>
                  <td className="px-4 py-3 text-[#64748B]">{clinic.type}</td>
                  <td className="px-4 py-3 text-[#64748B]">{clinic.area}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={clinic.verificationStatus} />
                  </td>
                  <td className="px-4 py-3">
                    {clinic.regCertUrl ? (
                      <a
                        className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] px-2 py-1 text-xs font-medium text-[#1E40AF]"
                        href={clinic.regCertUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Registration
                      </a>
                    ) : (
                      <span className="text-xs text-[#64748B]">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isPending ? (
                      <div className="flex gap-2">
                        <button
                          className="inline-flex items-center gap-1 rounded-lg bg-[#10B981] px-3 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={isUpdating}
                          onClick={() => verifyClinic(clinic.id, "verified")}
                          type="button"
                        >
                          <Check className="h-3.5 w-3.5" />
                          {isUpdating ? "Saving…" : "Approve"}
                        </button>
                        <button
                          className="inline-flex items-center gap-1 rounded-lg bg-[#EF4444] px-3 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={isUpdating}
                          onClick={() => verifyClinic(clinic.id, "rejected")}
                          type="button"
                        >
                          <X className="h-3.5 w-3.5" />
                          {isUpdating ? "Saving…" : "Reject"}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-[#64748B]">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
