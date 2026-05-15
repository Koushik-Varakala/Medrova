"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Stethoscope, Building2, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

const roleOptions: Array<{
  role: Extract<UserRole, "doctor" | "clinic">;
  title: string;
  subtitle: string;
  icon: typeof Stethoscope;
  color: string;
  bg: string;
}> = [
  {
    role: "doctor",
    title: "I'm a Doctor",
    subtitle: "Find locum shifts and permanent roles across Hyderabad clinics",
    icon: Stethoscope,
    color: "text-blue-700",
    bg: "bg-blue-100"
  },
  {
    role: "clinic",
    title: "I'm a Clinic",
    subtitle: "Hire verified doctors for shifts and permanent positions",
    icon: Building2,
    color: "text-purple-700",
    bg: "bg-purple-100"
  }
];

export default function RoleSelectPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<"doctor" | "clinic" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleContinue() {
    if (!selectedRole) return;
    setIsSubmitting(true);
    setError("");

    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        setError("Supabase is not configured.");
        return;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError("Session expired. Please sign in again.");
        router.push("/sign-in");
        return;
      }

      // Save role to user_roles table
      const { error: roleError } = await supabase.from("user_roles").upsert({
        user_id: user.id,
        role: selectedRole
      });

      if (roleError && roleError.code !== "42501") {
        setError(roleError.message);
        return;
      }

      // Also update user metadata for convenience
      await supabase.auth.updateUser({
        data: { role: selectedRole }
      });

      router.push(selectedRole === "doctor" ? "/onboarding/doctor" : "/onboarding/clinic");
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="mb-10 text-center">
          <span className="text-3xl font-black tracking-tight text-[#0F172A]">Medrova</span>
          <h1 className="mt-6 text-2xl font-bold text-[#0F172A]">One last step</h1>
          <p className="mt-2 text-sm text-slate-500">
            You signed in with Google. Tell us who you are so we can set up your account.
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {roleOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedRole === option.role;
            return (
              <motion.button
                key={option.role}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedRole(option.role)}
                className={cn(
                  "relative flex flex-col items-start rounded-2xl border-2 p-6 text-left transition-all duration-200 shadow-sm",
                  isSelected
                    ? "border-[#1E40AF] bg-blue-50 shadow-md ring-2 ring-[#1E40AF]/20"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                )}
              >
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", isSelected ? option.bg : "bg-slate-100")}>
                  <Icon className={cn("h-6 w-6", isSelected ? option.color : "text-slate-500")} />
                </div>
                <p className={cn("mt-4 text-base font-bold", isSelected ? "text-[#1E40AF]" : "text-[#0F172A]")}>
                  {option.title}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                  {option.subtitle}
                </p>
                {isSelected && (
                  <div className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-[#1E40AF] text-white">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {error && (
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <motion.button
          whileHover={{ scale: selectedRole ? 1.02 : 1 }}
          whileTap={{ scale: selectedRole ? 0.98 : 1 }}
          onClick={handleContinue}
          disabled={!selectedRole || isSubmitting}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E40AF] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              Continue to onboarding
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </motion.button>

        <p className="mt-4 text-center text-xs text-slate-400">
          You can always change this later in your settings.
        </p>
      </motion.div>
    </main>
  );
}
