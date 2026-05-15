"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { professionalNavigation, professionalRoleConfig } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { ProfessionalDashboardHome } from "@/components/professional/ProfessionalDashboardHome";
import type { HealthcareProfessional, Shift } from "@/types";
import { mapHealthcareProfessionalRow, mapShiftRow, toDbRecord } from "@/lib/mappers";

export default function ProfessionalDashboardPage() {
  const router = useRouter();
  const [professional, setProfessional] = useState<HealthcareProfessional | null>(null);
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

        const { data: profRow, error: profError } = await supabase
          .from("healthcare_professionals")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profError) throw new Error(profError.message);

        if (!profRow) {
          router.push("/sign-up");
          return;
        }

        const mappedProf: HealthcareProfessional = mapHealthcareProfessionalRow(toDbRecord(profRow));

        const { data: shiftsData } = await supabase
          .from("shifts")
          .select("*, clinic:clinics(*)")
          .eq("confirmed_professional_id", mappedProf.id)
          .order("date", { ascending: false })
          .limit(3);

        const mappedShifts: Shift[] = (shiftsData ?? []).map((shift) => mapShiftRow(toDbRecord(shift)));

        const { data: payoutsData } = await supabase
          .from("professional_payouts")
          .select("amount, status")
          .eq("professional_id", mappedProf.id)
          .eq("status", "completed");

        const { data: applicationsData } = await supabase
          .from("professional_applications")
          .select("status")
          .eq("professional_id", mappedProf.id)
          .eq("status", "applied");

        if (!isMounted) return;

        setProfessional(mappedProf);
        setRecentShifts(mappedShifts);
        setStats({
          shiftsCompleted: payoutsData?.length ?? 0,
          totalEarned: (payoutsData ?? []).reduce((sum, p: { amount: number }) => sum + p.amount, 0),
          pendingApplications: applicationsData?.length ?? 0,
        });
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : "Unable to load your profile.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();
    return () => { isMounted = false; };
  }, [router]);

  return (
    <DashboardShell 
      items={professionalNavigation}
      userProfile={professional ? { name: professional.name, verificationStatus: professional.verificationStatus } : undefined}
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
      ) : professional ? (
        <ProfessionalDashboardHome
          professional={professional}
          recentShifts={recentShifts}
          stats={stats}
          config={professionalRoleConfig[professional.role]}
        />
      ) : null}
    </DashboardShell>
  );
}
