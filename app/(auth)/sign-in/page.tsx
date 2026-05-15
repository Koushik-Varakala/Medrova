"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CheckCircle2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2
} from "lucide-react";

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

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError) setFormError(urlError);
  }, [searchParams]);

  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  async function handleGoogleLogin() {
    setFormError("");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setFormError("Supabase is not configured.");
      return;
    }
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    
    if (error) {
      setFormError(error.message);
    }
  }

  return (
    <main className="flex min-h-screen bg-white">
      {/* MOBILE ACCENT BAR */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] lg:hidden" />

      {/* LEFT PANEL */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[#0F172A] p-12 lg:flex">
        {/* Animated Background Blobs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-[10%] top-[20%] h-[500px] w-[500px] rounded-full bg-[#1E40AF]/20 blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -right-[10%] bottom-[10%] h-[400px] w-[400px] rounded-full bg-[#3B82F6]/20 blur-[100px]"
        />
        
        {/* Grid Overlay */}
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:40px_40px]" />

        <div className="relative z-10">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Medrova Logo"
              width={160}
              height={50}
              className="object-contain brightness-0 invert"
              priority
            />
          </Link>

          <div className="mt-24 max-w-md">
            <h1 className="text-4xl font-bold tracking-tight text-white">
              Welcome back to Medrova
            </h1>
            <p className="mt-4 text-lg text-slate-300">
              India&apos;s most trusted doctor staffing platform
            </p>

            <div className="mt-12 space-y-6">
              {[
                "Verified doctors and clinics only",
                "Shifts filled within hours",
                "Guaranteed 24hr UPI payout"
              ].map((bullet, i) => (
                <div key={i} className="flex items-center gap-3 text-slate-200">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span className="text-base font-medium">{bullet}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating Activity Card */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-10 w-fit rounded-2xl border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur-md"
        >
          <div className="flex items-center gap-4">
            <div className="relative flex h-3 w-3 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </div>
            <p className="text-sm font-medium text-white max-w-[250px] leading-relaxed">
              Dr. Anil Reddy just confirmed a shift at Care Clinic, Banjara Hills
            </p>
          </div>
        </motion.div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-[420px]">
          <div className="mb-10 text-center lg:hidden">
            <Link href="/" className="inline-block">
              <Image
                src="/logo.png"
                alt="Medrova Logo"
                width={140}
                height={45}
                className="object-contain"
                priority
              />
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="hidden lg:block mb-8">
              <Image
                src="/logo.png"
                alt="Medrova Logo"
                width={120}
                height={40}
                className="object-contain"
                priority
              />
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-[#0F172A]">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Continue to your dashboard
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <motion.div whileFocus="focus" className="relative">
                <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 z-10" />
                <motion.input
                  variants={{ focus: { scale: 1.01 } }}
                  className="peer w-full rounded-xl border border-slate-200 bg-white px-12 pb-2 pt-6 text-sm text-[#0F172A] outline-none transition-all focus:border-[#1E40AF] focus:ring-4 focus:ring-[#1E40AF]/10"
                  id="email"
                  type="email"
                  placeholder=" "
                  {...register("email")}
                />
                <label className="pointer-events-none absolute left-12 top-1.5 text-xs text-slate-400 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-[#1E40AF] font-medium">
                  Email address
                </label>
                {errors.email && (
                  <p className="mt-1.5 text-xs font-medium text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.email.message}
                  </p>
                )}
              </motion.div>

              <div className="space-y-1">
                <motion.div whileFocus="focus" className="relative">
                  <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 z-10" />
                  <motion.input
                    variants={{ focus: { scale: 1.01 } }}
                    className="peer w-full rounded-xl border border-slate-200 bg-white px-12 pb-2 pt-6 text-sm text-[#0F172A] outline-none transition-all focus:border-[#1E40AF] focus:ring-4 focus:ring-[#1E40AF]/10"
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder=" "
                    {...register("password")}
                  />
                  <label className="pointer-events-none absolute left-12 top-1.5 text-xs text-slate-400 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-[#1E40AF] font-medium">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </motion.div>
                <div className="flex justify-end">
                  <Link href="/forgot-password" className="text-xs font-medium text-[#1E40AF] hover:underline">
                    Forgot password?
                  </Link>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs font-medium text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.password.message}
                  </p>
                )}
              </div>

              {formError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-50/50 p-4 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p className="font-medium">{formError}</p>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#1E40AF] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-[#1D4ED8] hover:shadow-xl hover:shadow-blue-900/30 disabled:pointer-events-none disabled:opacity-70"
                disabled={isSubmitting}
                type="submit"
              >
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </motion.button>
            </form>

            <div className="relative mt-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-slate-500">or</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-[#0F172A] transition-all hover:bg-slate-50 hover:shadow-sm"
              type="button"
              onClick={handleGoogleLogin}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 15.01 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </motion.button>

            <p className="mt-8 text-center text-sm text-slate-500">
              New to Medrova?{" "}
              <Link href="/sign-up" className="font-semibold text-[#1E40AF] hover:underline">
                Create an account
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
