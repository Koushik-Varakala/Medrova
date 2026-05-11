"use client";

import { useEffect, useState } from "react";
import { IndianRupee, Landmark, WalletCards } from "lucide-react";
import { AdminPaymentLog } from "@/components/admin/AdminPaymentLog";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { StatCard } from "@/components/shared/StatCard";
import { adminNavigation } from "@/lib/constants";
import { formatCurrencyInr, getStringValue, getNumberValue } from "@/lib/utils";
import type { ClinicPayment, DoctorPayment } from "@/types";

export default function AdminPaymentsPage() {
  const [clinicPayments, setClinicPayments] = useState<ClinicPayment[]>([]);
  const [doctorPayments, setDoctorPayments] = useState<DoctorPayment[]>([]);
  const [summary, setSummary] = useState({ totalRevenue: 0, totalPayouts: 0, platformFeesRetained: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      const res = await fetch("/api/admin/payments");
      const json = (await res.json()) as {
        clinicPayments?: Record<string, unknown>[];
        doctorPayouts?: Record<string, unknown>[];
        summary?: { totalRevenue: number; totalPayouts: number; platformFeesRetained: number };
      };

      const mappedClinicPayments: ClinicPayment[] = (json.clinicPayments ?? []).map((p) => ({
        id: getStringValue(p, "id"),
        clinicId: getStringValue(p, "clinic_id"),
        shiftId: getStringValue(p, "shift_id"),
        amount: getNumberValue(p, "amount"),
        razorpayId: getStringValue(p, "razorpay_id"),
        status: getStringValue(p, "status") as ClinicPayment["status"],
        createdAt: getStringValue(p, "created_at"),
      }));

      const mappedDoctorPayments: DoctorPayment[] = (json.doctorPayouts ?? []).map((p) => ({
        id: getStringValue(p, "id"),
        doctorId: getStringValue(p, "doctor_id"),
        shiftId: getStringValue(p, "shift_id"),
        amount: getNumberValue(p, "amount"),
        upiId: getStringValue(p, "upi_id"),
        status: getStringValue(p, "status") as DoctorPayment["status"],
        paidAt: getStringValue(p, "paid_at") || undefined,
        createdAt: getStringValue(p, "created_at"),
      }));

      if (!isMounted) return;
      setClinicPayments(mappedClinicPayments);
      setDoctorPayments(mappedDoctorPayments);
      if (json.summary) setSummary(json.summary);
      setIsLoading(false);
    }
    load();
    return () => { isMounted = false; };
  }, []);

  return (
    <DashboardShell items={adminNavigation}>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-normal text-[#0F172A]">Payment logs</h1>
        <p className="mt-2 text-sm leading-6 text-[#64748B]">Full transaction log, doctor payouts, and platform fee retention.</p>
      </div>
      {isLoading ? (
        <p className="rounded-xl border border-[#E2E8F0] bg-white p-6 text-sm text-[#64748B] shadow-sm">Loading payments...</p>
      ) : (
        <>
          <section className="mb-6 grid gap-4 md:grid-cols-3">
            <StatCard icon={IndianRupee} label="Total revenue" value={formatCurrencyInr(summary.totalRevenue)} />
            <StatCard icon={WalletCards} label="Total payouts" value={formatCurrencyInr(summary.totalPayouts)} />
            <StatCard icon={Landmark} label="Fees retained" value={formatCurrencyInr(summary.platformFeesRetained)} />
          </section>
          <AdminPaymentLog clinicPayments={clinicPayments} doctorPayments={doctorPayments} />
        </>
      )}
    </DashboardShell>
  );
}
