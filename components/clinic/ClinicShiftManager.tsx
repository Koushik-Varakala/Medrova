"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";
import type { Application, Shift } from "@/types";
import { ApplicantCard } from "@/components/clinic/ApplicantCard";
import { ShiftCard } from "@/components/shared/ShiftCard";

interface ClinicShiftManagerProps {
  shifts: Shift[];
  applications: Application[];
}

export function ClinicShiftManager({ shifts, applications }: ClinicShiftManagerProps) {
  const [selectedShiftId, setSelectedShiftId] = useState(shifts[0]?.id ?? "");
  const [notice, setNotice] = useState("");
  const selectedShift = shifts.find((shift) => shift.id === selectedShiftId);
  const shiftApplications = applications.filter((application) => application.shiftId === selectedShiftId);

  async function confirmApplicant(applicationId: string) {
    if (!selectedShift) {
      return;
    }

    const response = await fetch(`/api/shifts/${selectedShift.id}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId })
    });

    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      setNotice(result.error ?? "Unable to confirm applicant.");
      return;
    }

    setNotice("Applicant confirmed and competing applications rejected.");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4">
        {shifts.map((shift) => (
          <button
            className="block w-full text-left"
            key={shift.id}
            onClick={() => setSelectedShiftId(shift.id)}
            type="button"
          >
            <ShiftCard shift={shift} />
          </button>
        ))}
      </div>
      <section className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-[#0F172A]">Applicants</h2>
        {notice ? (
          <p className="mt-4 rounded-lg border border-[#1E40AF]/20 bg-[#1E40AF]/10 px-4 py-3 text-sm text-[#1E40AF]">
            {notice}
          </p>
        ) : null}
        <div className="mt-5 space-y-4">
          {shiftApplications.length > 0 ? (
            shiftApplications.map((application) => (
              <div className="space-y-3" key={application.id}>
                <ApplicantCard application={application} />
                {application.status === "applied" && selectedShift?.status !== "confirmed" ? (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1E40AF] px-4 py-2 text-sm font-medium text-white hover:bg-[#1D4ED8]"
                      onClick={() => confirmApplicant(application.id)}
                      type="button"
                    >
                      <Check className="h-4 w-4" />
                      Confirm
                    </button>
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
                      onClick={() => setNotice("Applicant rejected locally.")}
                      type="button"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                ) : null}
                
                {application.status === "confirmed" && selectedShift?.status === "confirmed" ? (
                  <div className="mt-4 border-t border-[#E2E8F0] pt-4">
                    <button
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#10B981] px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-[#059669]"
                      onClick={async () => {
                        setNotice("Processing shift completion and triggering payout...");
                        const response = await fetch(`/api/shifts/${selectedShift.id}/complete`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ applicationId: application.id })
                        });
                        if (!response.ok) {
                          setNotice("Failed to complete shift and trigger payout.");
                          return;
                        }
                        setNotice("✅ Shift marked as completed! Payment transfer to the doctor has been initiated.");
                      }}
                      type="button"
                    >
                      <Check className="h-5 w-5" />
                      Mark Completed & Transfer Payment
                    </button>
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm leading-6 text-[#64748B]">
              No applicants for this shift yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
