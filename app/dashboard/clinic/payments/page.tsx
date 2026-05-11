"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { clinicNavigation } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { formatCurrencyInr, formatDate, getStringValue, getNumberValue } from "@/lib/utils";
import type { ClinicPayment } from "@/types";

export default function ClinicPaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<ClinicPayment[]>([]);
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

      const { data: rows } = await supabase
        .from("clinic_payments")
        .select("*")
        .eq("clinic_id", clinicId)
        .order("created_at", { ascending: false });

      const mapped: ClinicPayment[] = (rows ?? []).map((r: Record<string, unknown>) => ({
        id: getStringValue(r, "id"),
        clinicId: getStringValue(r, "clinic_id"),
        shiftId: getStringValue(r, "shift_id"),
        amount: getNumberValue(r, "amount"),
        razorpayId: getStringValue(r, "razorpay_id"),
        status: getStringValue(r, "status") as ClinicPayment["status"],
        createdAt: getStringValue(r, "created_at"),
      }));

      if (!isMounted) return;
      setPayments(mapped);
      setIsLoading(false);
    }
    load();
    return () => { isMounted = false; };
  }, [router]);

  return (
    <DashboardShell items={clinicNavigation}>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-normal text-[#0F172A]">Payments</h1>
        <p className="mt-2 text-sm leading-6 text-[#64748B]">Razorpay transactions for upfront locum shift payments.</p>
      </div>
      {isLoading ? (
        <p className="rounded-xl border border-[#E2E8F0] bg-white p-6 text-sm text-[#64748B] shadow-sm">Loading payments...</p>
      ) : payments.length === 0 ? (
        <p className="rounded-xl border border-[#E2E8F0] bg-white p-6 text-sm text-[#64748B] shadow-sm">No payments yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-[#F8FAFC] text-[#64748B]">
                <tr>
                  <th className="px-4 py-3 font-medium">Razorpay ID</th>
                  <th className="px-4 py-3 font-medium">Shift</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 text-[#0F172A]">{p.razorpayId}</td>
                    <td className="px-4 py-3 text-[#64748B]">{p.shiftId}</td>
                    <td className="px-4 py-3 text-[#0F172A]">{formatCurrencyInr(p.amount)}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3 text-[#64748B]">{formatDate(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
