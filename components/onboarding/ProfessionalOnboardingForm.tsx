"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowRight, ArrowLeft, Loader2, AlertCircle,
  CheckCircle2, User, Stethoscope, FileText,
  Calendar, IndianRupee, Upload
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { professionalRoleConfig, weekDays } from "@/lib/constants";
import { cn } from "@/lib/utils";
import LocationPicker from "@/components/shared/LocationPicker";
import type { ProfessionalRole, LocationResult } from "@/types";

// ─── Zod Schema ────────────────────────────────────────────────────────────────
const professionalSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  phone: z.string().min(10, "Enter a valid phone number"),
  city: z.string().min(2, "Enter your city"),
  area: z.string().optional(),
  locationDisplayName: z.string().optional(),
  locationLat: z.number().optional(),
  locationLng: z.number().optional(),
  specialty: z.string().min(1, "Select a specialty"),
  experience: z.coerce.number().min(0, "Enter years of experience"),
  registrationNumber: z.string().min(3, "Enter your registration number"),
  employmentStatus: z.string().min(1, "Select employment status"),
  availableDays: z.array(z.string()).min(1, "Select at least one day"),
  shiftPreference: z.enum(["locum", "permanent", "both"]),
  expectedPay: z.coerce.number().min(500, "Minimum expected pay is ₹500"),
  upiId: z.string().min(3, "Enter a valid UPI ID"),
});

type ProfessionalValues = z.infer<typeof professionalSchema>;

const employmentOptions = [
  "Currently employed",
  "Available immediately",
  "Serving notice period",
  "Freelance / Locum"
];

const shiftPreferenceOptions = [
  { value: "locum" as const, label: "Locum / Shifts", subtitle: "Short-term shift work" },
  { value: "permanent" as const, label: "Permanent", subtitle: "Full-time positions" },
  { value: "both" as const, label: "Both", subtitle: "Open to either" },
];

const roleColorMap: Record<ProfessionalRole, { accent: string; ring: string; bg: string; text: string }> = {
  doctor:     { accent: "bg-[#1E40AF]", ring: "ring-[#1E40AF]", bg: "bg-blue-50",    text: "text-[#1E40AF]" },
  nurse:      { accent: "bg-emerald-600", ring: "ring-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
  technician: { accent: "bg-purple-600",  ring: "ring-purple-500",  bg: "bg-purple-50",  text: "text-purple-700" },
};

interface Props { role: ProfessionalRole; }

export function ProfessionalOnboardingForm({ role }: Props) {
  const router = useRouter();
  const config = professionalRoleConfig[role];
  const colors = roleColorMap[role];

  const [step, setStep] = useState(1);
  const totalSteps = 5;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [location, setLocation] = useState<LocationResult | null>(null);

  // File state
  const [primaryCertFile, setPrimaryCertFile] = useState<File | null>(null);
  const [degreeCertFile, setDegreeCertFile] = useState<File | null>(null);
  const [govIdFile, setGovIdFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<ProfessionalValues>({
    resolver: zodResolver(professionalSchema),
    defaultValues: {
      availableDays: [],
      shiftPreference: "both",
      city: "Hyderabad",
    },
  });

  const availableDays = watch("availableDays");
  const shiftPreference = watch("shiftPreference");

  useEffect(() => {
    let isMounted = true;
    async function checkSession() {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;
      const {
        data: { user },
        error
      } = await supabase.auth.getUser();
      if (isMounted && (error || !user)) {
        router.push("/sign-in");
      }
    }
    checkSession();
    return () => { isMounted = false; };
  }, [router]);

  // ── Step navigation with validation ──────────────────────────────────────
  const stepFields: Record<number, (keyof ProfessionalValues)[]> = {
    1: ["name", "phone", "city"],
    2: ["specialty", "experience", "registrationNumber", "employmentStatus"],
    3: [],
    4: ["availableDays", "shiftPreference", "expectedPay"],
    5: ["upiId"],
  };

  async function goNext() {
    const valid = await trigger(stepFields[step]);
    if (valid) setStep((s) => s + 1);
  }
  function goBack() { setStep((s) => s - 1); }

  // ── Final submit ──────────────────────────────────────────────────────────
  async function onSubmit(values: ProfessionalValues) {
    setIsSubmitting(true);
    setFormError("");

    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) { setFormError("Supabase is not configured."); return; }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) { setFormError("Session expired. Please sign in again."); return; }

      // Upload helper
      async function uploadFile(file: File, path: string): Promise<string | null> {
        const { data, error } = await supabase!.storage
          .from("documents")
          .upload(path, file, { upsert: true });
        if (error) return null;
        const { data: urlData } = supabase!.storage.from("documents").getPublicUrl(data.path);
        return urlData.publicUrl;
      }

      const [primaryCertUrl, degreeCertUrl, govIdUrl] = await Promise.all([
        primaryCertFile ? uploadFile(primaryCertFile, `${user.id}/primary_cert`) : Promise.resolve(null),
        degreeCertFile ? uploadFile(degreeCertFile, `${user.id}/degree_cert`) : Promise.resolve(null),
        govIdFile ? uploadFile(govIdFile, `${user.id}/gov_id`) : Promise.resolve(null),
      ]);

      const { error: insertError } = await supabase.from("healthcare_professionals").upsert({
        user_id: user.id,
        role,
        name: values.name,
        phone: values.phone,
        email: user.email ?? "",
        specialty: values.specialty,
        experience: values.experience,
        registration_number: values.registrationNumber,
        city: values.city,
        area: location?.area ?? values.area ?? "",
        latitude: location?.lat ?? null,
        longitude: location?.lng ?? null,
        location_display_name: location?.displayName ?? null,
        employment_status: values.employmentStatus,
        available_days: values.availableDays,
        shift_preference: values.shiftPreference,
        expected_pay: values.expectedPay,
        upi_id: values.upiId,
        primary_cert_url: primaryCertUrl,
        degree_cert_url: degreeCertUrl,
        gov_id_url: govIdUrl,
      });

      if (insertError) { setFormError(insertError.message); return; }

      // Upsert user_roles
      await supabase.from("user_roles").upsert({ user_id: user.id, role });
      await supabase.auth.updateUser({ data: { role } });

      router.push("/dashboard/professional");
    } finally {
      setIsSubmitting(false);
    }
  }

  const progress = (step / totalSteps) * 100;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Left decorative panel */}
      <div className={cn("relative hidden w-80 shrink-0 flex-col justify-between overflow-hidden p-10 lg:flex",
        role === "doctor" ? "bg-[#0F172A]" : role === "nurse" ? "bg-emerald-900" : "bg-purple-900"
      )}>
        <motion.div animate={{ scale: [1,1.2,1], x:[0,40,0] }} transition={{ duration:14, repeat:Infinity, ease:"easeInOut" }}
          className="absolute -left-20 top-1/4 h-80 w-80 rounded-full blur-[80px] opacity-20 bg-white" />
        <div className="relative z-10">
          <span className="text-2xl font-black text-white">Medrova</span>
          <div className="mt-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/50">Your role</p>
            <p className="mt-2 text-3xl font-bold text-white">{config.label}</p>
          </div>
          <div className="mt-12 space-y-4">
            {["Personal Info","Professional Info","Documents","Availability","Payment"].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={cn("flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                  i+1 < step ? "bg-white/20 text-white" : i+1 === step ? "bg-white text-slate-900" : "bg-white/10 text-white/40"
                )}>
                  {i+1 < step ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : i+1}
                </div>
                <span className={cn("text-sm font-medium", i+1 === step ? "text-white" : "text-white/50")}>{s}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-xs text-white/30">Step {step} of {totalSteps}</p>
      </div>

      {/* Form area */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-lg">
          {/* Mobile progress bar */}
          <div className="mb-8 lg:hidden">
            <div className="mb-2 flex justify-between text-xs font-medium text-slate-500">
              <span>Step {step} of {totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <motion.div className={cn("h-full rounded-full", colors.accent)} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
            </div>
          </div>

          {formError && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" /> {formError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              {/* ── STEP 1: Personal Info ── */}
              {step === 1 && (
                <motion.div key="step1" initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-30}} transition={{duration:0.25}}>
                  <div className="mb-8">
                    <div className={cn("mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl", colors.bg)}>
                      <User className={cn("h-6 w-6", colors.text)} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Personal Information</h2>
                    <p className="mt-1 text-sm text-slate-500">Tell us about yourself</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">Full name</label>
                      <input {...register("name")} placeholder="Dr. Anjali Sharma" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
                      {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">Phone number</label>
                      <input {...register("phone")} placeholder="+91 98765 43210" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
                      {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
                    </div>
                    <LocationPicker
                      label="Your location"
                      value={location}
                      onChange={(loc) => {
                        setLocation(loc);
                        if (loc) {
                          setValue("locationLat", loc.lat);
                          setValue("locationLng", loc.lng);
                          setValue("locationDisplayName", loc.displayName);
                          if (loc.area) setValue("area", loc.area);
                          if (loc.city) setValue("city", loc.city);
                        }
                      }}
                    />
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">City</label>
                      <input {...register("city")} placeholder="Hyderabad" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
                      {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city.message}</p>}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 2: Professional Info ── */}
              {step === 2 && (
                <motion.div key="step2" initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-30}} transition={{duration:0.25}}>
                  <div className="mb-8">
                    <div className={cn("mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl", colors.bg)}>
                      <Stethoscope className={cn("h-6 w-6", colors.text)} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Professional Details</h2>
                    <p className="mt-1 text-sm text-slate-500">Your qualifications and experience</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">Specialty</label>
                      <select {...register("specialty")} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10">
                        <option value="">Select specialty</option>
                        {config.specialties.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {errors.specialty && <p className="mt-1 text-xs text-red-500">{errors.specialty.message}</p>}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">Years of experience</label>
                      <input {...register("experience")} type="number" min={0} placeholder="5" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
                      {errors.experience && <p className="mt-1 text-xs text-red-500">{errors.experience.message}</p>}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">{config.registrationLabel}</label>
                      <input {...register("registrationNumber")} placeholder="MCI-123456" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
                      {errors.registrationNumber && <p className="mt-1 text-xs text-red-500">{errors.registrationNumber.message}</p>}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">Employment status</label>
                      <select {...register("employmentStatus")} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10">
                        <option value="">Select status</option>
                        {employmentOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {errors.employmentStatus && <p className="mt-1 text-xs text-red-500">{errors.employmentStatus.message}</p>}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 3: Documents ── */}
              {step === 3 && (
                <motion.div key="step3" initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-30}} transition={{duration:0.25}}>
                  <div className="mb-8">
                    <div className={cn("mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl", colors.bg)}>
                      <FileText className={cn("h-6 w-6", colors.text)} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Upload Documents</h2>
                    <p className="mt-1 text-sm text-slate-500">Required for verification (PDF or image)</p>
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: config.primaryCertLabel, setter: setPrimaryCertFile, file: primaryCertFile, required: true },
                      { label: "Degree / Qualification Certificate", setter: setDegreeCertFile, file: degreeCertFile, required: false },
                      { label: "Government ID (Aadhaar / PAN)", setter: setGovIdFile, file: govIdFile, required: false },
                    ].map(({ label, setter, file, required }) => (
                      <div key={label}>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          {label} {required && <span className="text-red-500">*</span>}
                        </label>
                        <label className="flex cursor-pointer items-center justify-between rounded-xl border-2 border-dashed border-slate-200 bg-white px-4 py-3.5 transition hover:border-blue-400 hover:bg-blue-50/30">
                          <span className="text-sm text-slate-500">{file ? file.name : "Click to upload"}</span>
                          <Upload className="h-4 w-4 text-slate-400" />
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setter(e.target.files?.[0] ?? null)} />
                        </label>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── STEP 4: Availability ── */}
              {step === 4 && (
                <motion.div key="step4" initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-30}} transition={{duration:0.25}}>
                  <div className="mb-8">
                    <div className={cn("mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl", colors.bg)}>
                      <Calendar className={cn("h-6 w-6", colors.text)} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Your Availability</h2>
                    <p className="mt-1 text-sm text-slate-500">When can you work?</p>
                  </div>
                  <div className="space-y-6">
                    {/* Day pills */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Available days</label>
                      <div className="flex flex-wrap gap-2">
                        {weekDays.map((day) => {
                          const selected = availableDays.includes(day);
                          return (
                            <button key={day} type="button"
                              onClick={() => setValue("availableDays", selected ? availableDays.filter(d => d !== day) : [...availableDays, day])}
                              className={cn("rounded-full px-4 py-1.5 text-sm font-semibold transition-all",
                                selected ? `${colors.accent} text-white shadow` : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              )}
                            >{day}</button>
                          );
                        })}
                      </div>
                      {errors.availableDays && <p className="mt-1 text-xs text-red-500">{errors.availableDays.message}</p>}
                    </div>

                    {/* Shift preference */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Shift preference</label>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {shiftPreferenceOptions.map((opt) => (
                          <button key={opt.value} type="button"
                            onClick={() => setValue("shiftPreference", opt.value)}
                            className={cn("rounded-xl border-2 p-3 text-left transition-all",
                              shiftPreference === opt.value ? `${colors.bg} border-current ${colors.text}` : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                            )}
                          >
                            <p className="text-sm font-bold">{opt.label}</p>
                            <p className="mt-0.5 text-xs opacity-70">{opt.subtitle}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Expected pay */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">Expected pay per shift (₹)</label>
                      <input {...register("expectedPay")} type="number" min={500} placeholder="3500" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
                      {errors.expectedPay && <p className="mt-1 text-xs text-red-500">{errors.expectedPay.message}</p>}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 5: Payment ── */}
              {step === 5 && (
                <motion.div key="step5" initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-30}} transition={{duration:0.25}}>
                  <div className="mb-8">
                    <div className={cn("mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl", colors.bg)}>
                      <IndianRupee className={cn("h-6 w-6", colors.text)} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Payment Details</h2>
                    <p className="mt-1 text-sm text-slate-500">We use UPI for instant payouts after each shift</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">UPI ID</label>
                      <input {...register("upiId")} placeholder="yourname@upi" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
                      {errors.upiId && <p className="mt-1 text-xs text-red-500">{errors.upiId.message}</p>}
                    </div>
                    {/* Payout flow visual */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">How payouts work</p>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        {["Shift Completed","Clinic Confirms","Payment Processed","UPI Payout (24hr)"].map((step, i, arr) => (
                          <span key={step} className="flex items-center gap-2">
                            <span className={cn("inline-block rounded-full px-2 py-0.5 font-semibold text-white text-[10px]", colors.accent)}>{step}</span>
                            {i < arr.length - 1 && <ArrowRight className="h-3 w-3 text-slate-300 shrink-0" />}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="mt-8 flex gap-3">
              {step > 1 && (
                <button type="button" onClick={goBack}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              )}
              {step < totalSteps ? (
                <button type="button" onClick={goNext}
                  className={cn("flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition", colors.accent, "hover:opacity-90")}>
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button type="submit" disabled={isSubmitting}
                  className={cn("flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition disabled:opacity-60", colors.accent, "hover:opacity-90")}>
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><CheckCircle2 className="h-5 w-5" /> Complete Setup</>}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
