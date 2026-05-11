"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { DoctorDashboardHome } from "@/components/doctor/DoctorDashboardHome";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { doctorNavigation } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { parseStringArray, getStringValue, getNumberValue, getBooleanValue } from "@/lib/utils";
import type { Doctor, Shift, VerificationStatus } from "@/types";

export default function DoctorDashboardPage() {
  const router = useRouter();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [recentShifts, setRecentShifts] = useState<Shift[]>([]);
  const [stats, setStats] = useState({ shiftsCompleted: 0, totalEarned: 0, pendingApplications: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const supabase = createSupabaseBrowserClient();
        if (!supabase) throw new Error("Supabase is not configured.");

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push("/sign-in");
          return;
        }

        const { data: doctorRow, error: doctorError } = await supabase
          .from("doctors")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (doctorError) throw new Error(doctorError.message);

        if (!doctorRow) {
          router.push("/onboarding/doctor");
          return;
        }

        const d = doctorRow as Record<string, unknown>;

        const mappedDoctor: Doctor = {
          id: getStringValue(d, "id"),
          userId: getStringValue(d, "user_id"),
          name: getStringValue(d, "name"),
          phone: getStringValue(d, "phone"),
          email: getStringValue(d, "email"),
          specialty: getStringValue(d, "specialty"),
          experience: getNumberValue(d, "experience"),
          mciNumber: getStringValue(d, "mci_number"),
          city: getStringValue(d, "city"),
          area: getStringValue(d, "area"),
          employmentStatus: getStringValue(d, "employment_status"),
          availableDays: parseStringArray(d["available_days"]),
          shiftPreference: getStringValue(d, "shift_preference"),
          expectedPay: getNumberValue(d, "expected_pay"),
          upiId: getStringValue(d, "upi_id"),
          verificationStatus: getStringValue(d, "verification_status") as VerificationStatus,
          verificationNote: getStringValue(d, "verification_note") || undefined,
          mciCertUrl: getStringValue(d, "mci_cert_url") || undefined,
          degreeCertUrl: getStringValue(d, "degree_cert_url") || undefined,
          govIdUrl: getStringValue(d, "gov_id_url") || undefined,
          createdAt: getStringValue(d, "created_at"),
        };

        const { data: shiftsData } = await supabase
          .from("shifts")
          .select("*, clinic:clinics(*)")
          .eq("confirmed_doctor_id", mappedDoctor.id)
          .order("date", { ascending: false })
          .limit(3);

        const mappedShifts: Shift[] = (shiftsData ?? []).map((s: Record<string, unknown>) => {
          const rawClinic = s["clinic"];
          const c = Array.isArray(rawClinic) ? rawClinic[0] : rawClinic;
          const clinicObj = c ? {
            name: getStringValue(c, "name"),
            contactPerson: getStringValue(c, "contact_person"),
            contactPhone: getStringValue(c, "contact_phone"),
            address: getStringValue(c, "address"),
            area: getStringValue(c, "area")
          } : undefined;

          return {
            id: getStringValue(s, "id"),
            clinicId: getStringValue(s, "clinic_id"),
            specialty: getStringValue(s, "specialty"),
            date: getStringValue(s, "date"),
            startTime: getStringValue(s, "start_time"),
            endTime: getStringValue(s, "end_time"),
            pay: getNumberValue(s, "pay"),
            area: getStringValue(s, "area"),
            notes: getStringValue(s, "notes") || undefined,
            isUrgent: getBooleanValue(s, "is_urgent"),
            status: getStringValue(s, "status") as Shift["status"],
            createdAt: getStringValue(s, "created_at"),
            clinic: clinicObj as any
          };
        });

        const { data: payoutsData } = await supabase
          .from("doctor_payouts")
          .select("amount, status")
          .eq("doctor_id", mappedDoctor.id)
          .eq("status", "completed");

        const { data: applicationsData } = await supabase
          .from("applications")
          .select("status")
          .eq("doctor_id", mappedDoctor.id)
          .eq("status", "applied");

        if (!isMounted) return;

        setDoctor(mappedDoctor);
        setRecentShifts(mappedShifts);
        setStats({
          shiftsCompleted: payoutsData?.length ?? 0,
          totalEarned: (payoutsData ?? []).reduce((sum, p: { amount: number }) => sum + p.amount, 0),
          pendingApplications: applicationsData?.length ?? 0,
        });
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Unable to load your profile.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();
    return () => { isMounted = false; };
  }, [router]);

  return (
    <DashboardShell 
      items={doctorNavigation}
      userProfile={doctor ? { name: doctor.name, verificationStatus: doctor.verificationStatus } : undefined}
    >
      {isLoading ? (
        <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#1E40AF]" />
          <p className="text-sm font-medium text-[#64748B]">Loading your dashboard...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-50 p-6 text-center text-sm font-medium text-red-600 shadow-sm">
          {error}
        </div>
      ) : doctor ? (
        <DoctorDashboardHome
          doctor={doctor}
          recentShifts={recentShifts}
          stats={stats}
        />
      ) : null}
    </DashboardShell>
  );
}
