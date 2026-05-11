"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { UserRole } from "@/types";

const signInSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password")
});

type SignInValues = z.infer<typeof signInSchema>;

interface RoleRow {
  role: UserRole;
}

function getRoleFromMetadata(metadata: unknown): UserRole | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const role = (metadata as { role?: unknown }).role;
  if (role === "doctor" || role === "clinic" || role === "admin") {
    return role;
  }

  return null;
}

export function SignInForm() {
  const router = useRouter();
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema)
  });

  async function onSubmit(values: SignInValues) {
    setFormError("");
    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();

      if (!supabase) {
        setFormError("Supabase is not configured. Add your environment variables first.");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword(values);

      if (error) {
        setFormError(error.message);
        return;
      }

      const userId = data.user?.id;

      if (!userId) {
        setFormError("Signed in, but Supabase did not return a user profile.");
        return;
      }

      const { data: roleRow, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle<RoleRow>();

      if (roleError) {
        setFormError(roleError.message);
        return;
      }

      const resolvedRole = roleRow?.role ?? getRoleFromMetadata(data.user?.user_metadata);

      if (!resolvedRole) {
        setFormError("No Medrova role found for this account.");
        return;
      }

      router.push(`/dashboard/${resolvedRole}`);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label className="text-sm font-medium text-[#0F172A]" htmlFor="email">
          Email
        </label>
        <input
          className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
          id="email"
          type="email"
          {...register("email")}
        />
        {errors.email ? (
          <p className="mt-1 text-sm text-[#EF4444]">{errors.email.message}</p>
        ) : null}
      </div>
      <div>
        <label className="text-sm font-medium text-[#0F172A]" htmlFor="password">
          Password
        </label>
        <input
          className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
          id="password"
          type="password"
          {...register("password")}
        />
        {errors.password ? (
          <p className="mt-1 text-sm text-[#EF4444]">{errors.password.message}</p>
        ) : null}
      </div>
      {formError ? (
        <p className="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#B91C1C]">
          {formError}
        </p>
      ) : null}
      <button
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1E40AF] px-4 py-2 font-medium text-white hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
        Sign in
      </button>
    </form>
  );
}
