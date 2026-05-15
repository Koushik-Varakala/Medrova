"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase";

export default function CompleteSignupPage() {
  const router = useRouter();

  useEffect(() => {
    async function complete() {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) { router.push("/sign-in"); return; }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/sign-in"); return; }

      // Read the role the user selected before email confirmation
      const pendingRole = localStorage.getItem("pending_signup_role") as
        | "doctor" | "nurse" | "technician" | "clinic" | null;

      const role = pendingRole ?? "doctor";

      // Write to user_roles if not already there
      const { data: existing } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existing) {
        await supabase.from("user_roles").upsert({ user_id: user.id, role });
        await supabase.auth.updateUser({ data: { role } });
      }

      localStorage.removeItem("pending_signup_role");

      const finalRole = existing?.role ?? role;
      if (finalRole === "clinic") {
        router.push("/onboarding/clinic");
      } else {
        router.push(`/onboarding/professional?role=${finalRole}`);
      }
    }

    complete();
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F8FAFC]">
      <Loader2 className="h-8 w-8 animate-spin text-[#1E40AF]" />
      <p className="text-sm font-medium text-slate-500">Setting up your account...</p>
    </div>
  );
}
