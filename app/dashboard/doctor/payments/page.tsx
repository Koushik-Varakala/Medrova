"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PaymentList } from "@/components/doctor/PaymentList";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { doctorNavigation } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { toDbRecord } from "@/lib/mappers";
import { getStringValue, getNumberValue } from "@/lib/utils";
import type { DoctorPayment } from "@/types";

type DoctorPaymentWithClinic = DoctorPayment & { clinicName?: string };

export default function DoctorPaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<DoctorPaymentWithClinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<{name: string, verificationStatus: string} | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/sign-in"); return; }

      const { data: doctorRow } = await supabase
        .from("doctors").select("id, name, verification_status").eq("user_id", user.id).maybeSingle();
      if (!doctorRow) { router.push("/onboarding/doctor"); return; }

      const doctorId = (doctorRow as { id: string }).id;
      if (isMounted) {
        setUserProfile({
          name: (doctorRow as { name: string }).name,
          verificationStatus: (doctorRow as { verification_status: string }).verification_status,
        });
      }

      // Fetch payouts and their associated shifts (for clinic names)
      const { data: rows } = await supabase
        .from("doctor_payouts")
        .select("*, shift:shifts(clinic_id, clinics(name))")
        .eq("doctor_id", doctorId)
        .order("created_at", { ascending: false });

      const mapped: DoctorPaymentWithClinic[] = (rows ?? []).map((row) => {
        const r = toDbRecord(row);
        let clinicName = undefined;
        if (r.shift) {
          const shiftObj = toDbRecord(Array.isArray(r.shift) ? r.shift[0] : r.shift);
          if (shiftObj.clinics) {
            const clinicObj = toDbRecord(Array.isArray(shiftObj.clinics) ? shiftObj.clinics[0] : shiftObj.clinics);
            clinicName = getStringValue(clinicObj, "name") || undefined;
          }
        }

        return {
          id: getStringValue(r, "id"),
          doctorId: getStringValue(r, "doctor_id"),
          shiftId: getStringValue(r, "shift_id"),
          amount: getNumberValue(r, "amount"),
          upiId: getStringValue(r, "upi_id"),
          status: getStringValue(r, "status") as DoctorPayment["status"],
          paidAt: getStringValue(r, "paid_at") || undefined,
          createdAt: getStringValue(r, "created_at"),
          clinicName
        };
      });

      if (!isMounted) return;
      setPayments(mapped);
      setIsLoading(false);
    }
    load();
    return () => { isMounted = false; };
  }, [router]);

  return (
    <DashboardShell items={doctorNavigation} userProfile={userProfile}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-[#0F172A]">Payments</h1>
        <p className="mt-2 text-sm leading-6 text-[#64748B]">Completed shift payouts and UPI transfer status.</p>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-[120px] w-full animate-pulse rounded-2xl bg-slate-200"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 w-full animate-pulse rounded-xl bg-slate-200"></div>
          ))}
        </div>
      ) : (
        <PaymentList payments={payments} />
      )}
    </DashboardShell>
  );
}
