"use client";

import { Check, FileText, X } from "lucide-react";
import { useState } from "react";
import type { Doctor, VerificationStatus } from "@/types";
import { StatusBadge } from "@/components/shared/StatusBadge";

interface AdminDoctorTableProps {
  doctors: Doctor[];
}

export function AdminDoctorTable({ doctors: initialDoctors }: AdminDoctorTableProps) {
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors);
  const [notice, setNotice] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function verifyDoctor(doctorId: string, status: VerificationStatus) {
    setLoadingId(doctorId);
    setNotice("");

    const response = await fetch(`/api/admin/doctors/${doctorId}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        note: status === "verified" ? "Approved by Medrova admin." : "Documents need review."
      })
    });

    setLoadingId(null);

    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      setNotice(result.error ?? "Unable to update doctor.");
      return;
    }

    // Optimistically update the local list so UI reflects the new status immediately
    setDoctors((prev) =>
      prev.map((d) =>
        d.id === doctorId ? { ...d, verificationStatus: status } : d
      )
    );

    setNotice(
      status === "verified"
        ? "Doctor approved successfully."
        : "Doctor rejected."
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
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-[#F8FAFC] text-[#64748B]">
            <tr>
              <th className="px-4 py-3 font-medium">Doctor</th>
              <th className="px-4 py-3 font-medium">Specialty</th>
              <th className="px-4 py-3 font-medium">Area</th>
              <th className="px-4 py-3 font-medium">Verification</th>
              <th className="px-4 py-3 font-medium">Documents</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {doctors.map((doctor) => {
              const isPending = doctor.verificationStatus === "pending";
              const isUpdating = loadingId === doctor.id;

              return (
                <tr key={doctor.id}>
                  <td className="px-4 py-3 text-[#0F172A]">{doctor.name}</td>
                  <td className="px-4 py-3 text-[#64748B]">{doctor.specialty}</td>
                  <td className="px-4 py-3 text-[#64748B]">{doctor.area}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={doctor.verificationStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <DocumentLink href={doctor.mciCertUrl} label="MCI" />
                      <DocumentLink href={doctor.degreeCertUrl} label="Degree" />
                      <DocumentLink href={doctor.govIdUrl} label="ID" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {isPending ? (
                      <div className="flex gap-2">
                        <button
                          className="inline-flex items-center gap-1 rounded-lg bg-[#10B981] px-3 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={isUpdating}
                          onClick={() => verifyDoctor(doctor.id, "verified")}
                          type="button"
                        >
                          <Check className="h-3.5 w-3.5" />
                          {isUpdating ? "Saving…" : "Approve"}
                        </button>
                        <button
                          className="inline-flex items-center gap-1 rounded-lg bg-[#EF4444] px-3 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={isUpdating}
                          onClick={() => verifyDoctor(doctor.id, "rejected")}
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

function DocumentLink({ href, label }: { href?: string; label: string }) {
  if (!href) {
    return <span className="text-xs text-[#64748B]">{label}: none</span>;
  }

  return (
    <a
      className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] px-2 py-1 text-xs font-medium text-[#1E40AF]"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      <FileText className="h-3.5 w-3.5" />
      {label}
    </a>
  );
}
