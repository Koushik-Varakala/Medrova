"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PaymentList } from "@/components/doctor/PaymentList";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { doctorNavigation } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { getStringValue, getNumberValue } from "@/lib/utils";
import type { DoctorPayment } from "@/types";

export default function DoctorPaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<DoctorPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/sign-in"); return; }

      const { data: doctorRow } = await supabase
        .from("doctors").select("id").eq("user_id", user.id).maybeSingle();
      if (!doctorRow) { router.push("/onboarding/doctor"); return; }

      const doctorId = (doctorRow as { id: string }).id;

      const { data: rows } = await supabase
        .from("doctor_payouts")
        .select("*")
        .eq("doctor_id", doctorId)
        .order("created_at", { ascending: false });

      const mapped: DoctorPayment[] = (rows ?? []).map((r: Record<string, unknown>) => ({
        id: getStringValue(r, "id"),
        doctorId: getStringValue(r, "doctor_id"),
        shiftId: getStringValue(r, "shift_id"),
        amount: getNumberValue(r, "amount"),
        upiId: getStringValue(r, "upi_id"),
        status: getStringValue(r, "status") as DoctorPayment["status"],
        paidAt: getStringValue(r, "paid_at") || undefined,
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
    <DashboardShell items={doctorNavigation}>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-normal text-[#0F172A]">Payments</h1>
        <p className="mt-2 text-sm leading-6 text-[#64748B]">Completed shift payouts and UPI transfer status.</p>
      </div>
      {isLoading ? (
        <p className="rounded-xl border border-[#E2E8F0] bg-white p-6 text-sm text-[#64748B] shadow-sm">Loading payments...</p>
      ) : payments.length === 0 ? (
        <p className="rounded-xl border border-[#E2E8F0] bg-white p-6 text-sm text-[#64748B] shadow-sm">No payouts yet.</p>
      ) : (
        <PaymentList payments={payments} />
      )}
    </DashboardShell>
  );
}
