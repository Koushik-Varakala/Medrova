"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Stethoscope,
  Building2,
  Heart,
  FlaskConical,
  ArrowRight,
  Loader2,
  AlertCircle
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type SelectableRole = "doctor" | "nurse" | "technician" | "clinic";

interface RoleOption {
  role: SelectableRole;
  title: string;
  subtitle: string;
  icon: typeof Stethoscope;
  color: string;
  bg: string;
  ring: string;
}

const roleOptions: RoleOption[] = [
  {
    role: "doctor",
    title: "I'm a Doctor",
    subtitle: "Find locum shifts and permanent roles across Hyderabad clinics",
    icon: Stethoscope,
    color: "text-blue-700",
    bg: "bg-blue-100",
    ring: "border-[#1E40AF] bg-blue-50 ring-2 ring-[#1E40AF]/20"
  },
  {
    role: "nurse",
    title: "I'm a Nurse",
    subtitle: "Find nursing shifts and permanent positions",
    icon: Heart,
    color: "text-emerald-700",
    bg: "bg-emerald-100",
    ring: "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20"
  },
  {
    role: "technician",
    title: "I'm a Technician",
    subtitle: "Find lab, radiology, OT, and allied health roles",
    icon: FlaskConical,
    color: "text-purple-700",
    bg: "bg-purple-100",
    ring: "border-purple-500 bg-purple-50 ring-2 ring-purple-500/20"
  },
  {
    role: "clinic",
    title: "I'm a Clinic",
    subtitle: "Hire verified healthcare professionals for shifts and jobs",
    icon: Building2,
    color: "text-slate-700",
    bg: "bg-slate-100",
    ring: "border-slate-500 bg-slate-50 ring-2 ring-slate-500/20"
  }
];

function getOnboardingPath(role: SelectableRole): string {
  if (role === "clinic") return "/onboarding/clinic";
  return `/onboarding/professional?role=${role}`;
}

function getCheckColor(role: SelectableRole): string {
  const map: Record<SelectableRole, string> = {
    doctor: "bg-[#1E40AF]",
    nurse: "bg-emerald-600",
    technician: "bg-purple-600",
    clinic: "bg-slate-600"
  };
  return map[role];
}

export default function RoleSelectPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<SelectableRole | null>(null);
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

      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Session expired. Please sign in again.");
        router.push("/sign-in");
        return;
      }

      const { error: roleError } = await supabase.from("user_roles").upsert({
        user_id: user.id,
        role: selectedRole
      });

      if (roleError && roleError.code !== "42501") {
        setError(roleError.message);
        return;
      }

      await supabase.auth.updateUser({ data: { role: selectedRole } });

      router.push(getOnboardingPath(selectedRole));
    } catch {
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
        className="w-full max-w-xl"
      >
        {/* Header */}
        <div className="mb-10 text-center">
          <span className="text-3xl font-black tracking-tight text-[#0F172A]">Medrova</span>
          <h1 className="mt-6 text-2xl font-bold text-[#0F172A]">One last step</h1>
          <p className="mt-2 text-sm text-slate-500">
            You signed in with Google. Tell us who you are so we can set up your account.
          </p>
        </div>

        {/* Role Cards — 2×2 grid */}
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
                  "relative flex flex-col items-start rounded-2xl border-2 p-6 text-left shadow-sm transition-all duration-200",
                  isSelected ? option.ring : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                )}
              >
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl",
                    isSelected ? option.bg : "bg-slate-100"
                  )}
                >
                  <Icon
                    className={cn("h-6 w-6", isSelected ? option.color : "text-slate-500")}
                  />
                </div>
                <p
                  className={cn(
                    "mt-4 text-base font-bold",
                    isSelected ? option.color : "text-[#0F172A]"
                  )}
                >
                  {option.title}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{option.subtitle}</p>
                {isSelected && (
                  <div
                    className={cn(
                      "absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full text-white",
                      getCheckColor(option.role)
                    )}
                  >
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
