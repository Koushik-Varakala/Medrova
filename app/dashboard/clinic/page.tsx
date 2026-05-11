"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, ClipboardList, Users, type LucideIcon } from "lucide-react";
import { ClinicDashboardHome } from "@/components/clinic/ClinicDashboardHome";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { clinicNavigation } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { getStringValue, getNumberValue } from "@/lib/utils";
import type { Clinic, VerificationStatus } from "@/types";

export default function ClinicDashboardPage() {
  const router = useRouter();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [stats, setStats] = useState({ activeShifts: 0, filledShifts: 0, pendingApplications: 0 });
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

        // Fetch clinic profile
        const { data: clinicRow, error: clinicError } = await supabase
          .from("clinics")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (clinicError) throw new Error(clinicError.message);

        if (!clinicRow) {
          router.push("/onboarding/clinic");
          return;
        }

        const c = clinicRow as Record<string, unknown>;

        const mappedClinic: Clinic = {
          id: getStringValue(c, "id"),
          userId: getStringValue(c, "user_id"),
          name: getStringValue(c, "name"),
          type: getStringValue(c, "type"),
          address: getStringValue(c, "address"),
          area: getStringValue(c, "area"),
          phone: getStringValue(c, "phone"),
          contactPerson: getStringValue(c, "contact_person"),
          contactPhone: getStringValue(c, "contact_phone"),
          specialtiesNeeded: Array.isArray(c["specialties_needed"]) ? c["specialties_needed"] as string[] : [],
          verificationStatus: getStringValue(c, "verification_status") as VerificationStatus,
          regCertUrl: getStringValue(c, "reg_cert_url") || undefined,
          createdAt: getStringValue(c, "created_at"),
        };

        // Fetch shift stats for this clinic
        const { data: shiftsData } = await supabase
          .from("shifts")
          .select("id, status")
          .eq("clinic_id", mappedClinic.id);

        const shifts = (shiftsData ?? []) as { id: string; status: string }[];
        const activeShifts = shifts.filter((s) => s.status === "active").length;
        const filledShifts = shifts.filter((s) => s.status === "confirmed" || s.status === "completed").length;
        const shiftIds = shifts.map((s) => s.id);

        // Fetch pending applications across all clinic shifts
        let pendingApplications = 0;
        if (shiftIds.length > 0) {
          const { data: appsData } = await supabase
            .from("applications")
            .select("id")
            .in("shift_id", shiftIds)
            .eq("status", "applied");
          pendingApplications = appsData?.length ?? 0;
        }

        if (!isMounted) return;

        setClinic(mappedClinic);
        setStats({ activeShifts, filledShifts, pendingApplications });
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
    <DashboardShell items={clinicNavigation}>
      {isLoading ? (
        <p className="rounded-xl border border-[#E2E8F0] bg-white p-6 text-sm text-[#64748B] shadow-sm">
          Loading your profile...
        </p>
      ) : error ? (
        <p className="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#B91C1C]">
          {error}
        </p>
      ) : clinic ? (
        <div className="space-y-6">
          <ClinicDashboardHome clinic={clinic} stats={stats} />
          <section className="grid gap-4 md:grid-cols-3">
            <QuickCard icon={CalendarCheck} label="Active shifts" value={String(stats.activeShifts)} />
            <QuickCard icon={Users} label="Applicants waiting" value={String(stats.pendingApplications)} />
            <QuickCard icon={ClipboardList} label="Filled shifts" value={String(stats.filledShifts)} />
          </section>
        </div>
      ) : null}
    </DashboardShell>
  );
}

function QuickCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <article className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
      <Icon className="h-5 w-5 text-[#1E40AF]" />
      <p className="mt-4 text-sm text-[#64748B]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[#0F172A]">{value}</p>
    </article>
  );
}
