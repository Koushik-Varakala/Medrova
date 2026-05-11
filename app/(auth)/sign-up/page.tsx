"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Loader2,
  Stethoscope,
  Building2,
  Check
} from "lucide-react";

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
  subtitle: string;
  icon: typeof Stethoscope;
}> = [
  {
    role: "doctor",
    title: "I'm a Doctor",
    subtitle: "Find locum shifts and permanent roles",
    icon: Stethoscope
  },
  {
    role: "clinic",
    title: "I'm a Clinic",
    subtitle: "Hire verified doctors for shifts and jobs",
    icon: Building2
  }
];

export default function SignUpPage() {
  const router = useRouter();
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [confirmedRole, setConfirmedRole] = useState<"doctor" | "clinic">("doctor");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
          setFormError("Too many sign-up attempts right now. Use a different email or wait a few minutes.");
          return;
        }
        setFormError(error.message);
        return;
      }

      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setFormError("An account with this email already exists. Please sign in instead.");
        return;
      }

      const userId = data.user?.id;

      if (!userId) {
        setFormError("Account created, but Supabase did not return a user profile.");
        return;
      }

      if (!data.session) {
        setConfirmedRole(values.role);
        setAwaitingConfirmation(true);
        return;
      }

      const { error: roleError } = await supabase.from("user_roles").upsert({
        user_id: userId,
        role: values.role
      });

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
              Join Medrova today
            </h1>
            <p className="mt-4 text-lg text-slate-300">
              Start finding shifts or hiring verified doctors in Hyderabad
            </p>

            <div className="mt-12 space-y-6">
              {[
                "Free to join for doctors",
                "Clinics pay only when shifts are filled",
                "Verified credentials for trust and safety"
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
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
            </div>
            <p className="text-sm font-medium text-white max-w-[280px] leading-relaxed">
              New shift posted — Pediatric Clinic, Kukatpally — ₹3,500
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
            {awaitingConfirmation ? (
              <div className="space-y-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <Mail className="h-8 w-8 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">Check your email</h2>
                <p className="mx-auto max-w-sm text-sm leading-relaxed text-slate-500">
                  We sent a confirmation link to your email address. Click the link to verify your account,
                  then sign in to complete your <span className="font-semibold text-[#1E40AF] capitalize">{confirmedRole}</span> onboarding.
                </p>
                <Link
                  href="/sign-in"
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E40AF] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-[#1D4ED8] hover:shadow-xl"
                >
                  Go to sign in
                </Link>
              </div>
            ) : (
              <>
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
                  Create your account
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Choose your role and complete onboarding in minutes
                </p>

                <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
                  <fieldset>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {roleOptions.map((option) => {
                        const Icon = option.icon;
                        const isSelected = selectedRole === option.role;

                        return (
                          <motion.button
                            whileHover={{ y: -2 }}
                            key={option.role}
                            type="button"
                            onClick={() => setValue("role", option.role, { shouldValidate: true })}
                            className={cn(
                              "relative flex flex-col items-start rounded-xl border p-4 text-left shadow-sm transition-all duration-200",
                              isSelected 
                                ? "border-[#1E40AF] bg-blue-50/50 shadow-md ring-1 ring-[#1E40AF]" 
                                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                            )}
                          >
                            <div className={cn("rounded-lg p-2.5", isSelected ? "bg-blue-100 text-[#1E40AF]" : "bg-slate-100 text-slate-500")}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <p className={cn("mt-3 font-bold text-sm", isSelected ? "text-[#1E40AF]" : "text-[#0F172A]")}>{option.title}</p>
                            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                              {option.subtitle}
                            </p>
                            {isSelected && (
                              <div className="absolute right-3 top-3 rounded-full bg-[#1E40AF] p-0.5 text-white">
                                <Check className="h-3 w-3" />
                              </div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </fieldset>

                  <motion.div whileFocus="focus" className="relative mt-2">
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

                  <div className="grid gap-5 sm:grid-cols-2">
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
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      {errors.password && (
                        <p className="mt-1.5 text-xs font-medium text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {errors.password.message}
                        </p>
                      )}
                    </motion.div>

                    <motion.div whileFocus="focus" className="relative">
                      <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 z-10" />
                      <motion.input
                        variants={{ focus: { scale: 1.01 } }}
                        className="peer w-full rounded-xl border border-slate-200 bg-white px-12 pb-2 pt-6 text-sm text-[#0F172A] outline-none transition-all focus:border-[#1E40AF] focus:ring-4 focus:ring-[#1E40AF]/10"
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder=" "
                        {...register("confirmPassword")}
                      />
                      <label className="pointer-events-none absolute left-12 top-1.5 text-xs text-slate-400 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-[#1E40AF] font-medium">
                        Confirm
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      {errors.confirmPassword && (
                        <p className="mt-1.5 text-xs font-medium text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {errors.confirmPassword.message}
                        </p>
                      )}
                    </motion.div>
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
                    className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#1E40AF] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-[#1D4ED8] hover:shadow-xl hover:shadow-blue-900/30 disabled:pointer-events-none disabled:opacity-70 mt-2"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        Create account
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
                  Sign up with Google
                </motion.button>

                <p className="mt-8 text-center text-sm text-slate-500">
                  Already have an account?{" "}
                  <Link href="/sign-in" className="font-semibold text-[#1E40AF] hover:underline">
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </main>
  );
}
