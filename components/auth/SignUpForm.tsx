"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Loader2, Stethoscope } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

const signUpSchema = z
  .object({
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
    role: z.enum(["doctor", "clinic"])
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });

type SignUpValues = z.infer<typeof signUpSchema>;

const roleOptions: Array<{
  role: Extract<UserRole, "doctor" | "clinic">;
  title: string;
  description: string;
  icon: typeof Stethoscope;
}> = [
  {
    role: "doctor",
    title: "Doctor",
    description: "Find locum shifts and permanent roles across Hyderabad.",
    icon: Stethoscope
  },
  {
    role: "clinic",
    title: "Clinic",
    description: "Hire verified doctors for shifts and full-time positions.",
    icon: Building2
  }
];

export function SignUpForm() {
  const router = useRouter();
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [confirmedRole, setConfirmedRole] = useState<"doctor" | "clinic">("doctor");
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      role: "doctor"
    }
  });

  const selectedRole = watch("role");

  async function onSubmit(values: SignUpValues) {
    setFormError("");
    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();

      if (!supabase) {
        setFormError("Supabase is not configured. Add your environment variables first.");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            role: values.role
          }
        }
      });

      if (error) {
        if (error.status === 429) {
          setFormError(
            "Too many sign-up attempts right now. Use a different email or wait a few minutes."
          );
          return;
        }

        setFormError(error.message);
        return;
      }

      // If user has no identities, the email already exists in Supabase auth.
      // Supabase returns a fake success instead of an error for security reasons.
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setFormError(
          "An account with this email already exists. Please sign in instead, or use a different email address."
        );
        return;
      }

      const userId = data.user?.id;

      if (!userId) {
        setFormError("Account created, but Supabase did not return a user profile.");
        return;
      }

      // If email confirmation is required, data.session will be null.
      // In that case we must NOT redirect to onboarding — the user has no active session.
      if (!data.session) {
        setConfirmedRole(values.role);
        setAwaitingConfirmation(true);
        return;
      }

      const { error: roleError } = await supabase.from("user_roles").upsert({
        user_id: userId,
        role: values.role
      });

      // During auth edge cases (rate limits / delayed session), RLS can block this client insert.
      // We still keep role in user metadata so the user can continue into onboarding.
      if (roleError && roleError.code !== "42501") {
        setFormError(roleError.message);
        return;
      }

      router.push(values.role === "doctor" ? "/onboarding/doctor" : "/onboarding/clinic");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (awaitingConfirmation) {
    return (
      <div className="space-y-4 rounded-xl border border-[#E2E8F0] bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1E40AF]/10">
          <span className="text-2xl">📧</span>
        </div>
        <h2 className="text-xl font-semibold text-[#0F172A]">Check your email</h2>
        <p className="mx-auto max-w-sm text-sm leading-6 text-[#64748B]">
          We sent a confirmation link to your email address. Click the link to verify your account,
          then sign in to complete your{" "}
          <span className="font-medium text-[#1E40AF]">{confirmedRole}</span> onboarding.
        </p>
        <a
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1E40AF] px-4 py-2 font-medium text-white hover:bg-[#1D4ED8]"
          href="/sign-in"
        >
          Go to sign in
        </a>
      </div>
    );
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
      <div className="grid gap-4 sm:grid-cols-2">
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
        <div>
          <label
            className="text-sm font-medium text-[#0F172A]"
            htmlFor="confirmPassword"
          >
            Confirm password
          </label>
          <input
            className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
            id="confirmPassword"
            type="password"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword ? (
            <p className="mt-1 text-sm text-[#EF4444]">
              {errors.confirmPassword.message}
            </p>
          ) : null}
        </div>
      </div>
      <fieldset>
        <legend className="text-sm font-medium text-[#0F172A]">Choose account type</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {roleOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedRole === option.role;

            return (
              <button
                className={cn(
                  "rounded-xl border border-[#E2E8F0] bg-white p-4 text-left shadow-sm transition",
                  isSelected && "border-[#1E40AF] ring-2 ring-[#1E40AF]"
                )}
                key={option.role}
                onClick={() => setValue("role", option.role, { shouldValidate: true })}
                type="button"
              >
                <Icon className="h-6 w-6 text-[#1E40AF]" />
                <p className="mt-3 font-semibold text-[#0F172A]">{option.title}</p>
                <p className="mt-1 text-sm leading-6 text-[#64748B]">
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>
      </fieldset>
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
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Create account
      </button>
    </form>
  );
}
