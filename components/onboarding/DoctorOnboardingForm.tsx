"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Upload, 
  UserCircle,
  Stethoscope,
  FileCheck,
  Calendar,
  Wallet,
  User,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  Briefcase,
  FileText,
  AlertCircle,
  X,
  ChevronDown
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  employmentStatuses,
  hyderabadAreas,
  specialties,
  weekDays
} from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { uploadDocument } from "@/components/onboarding/upload";
import LocationPicker from "@/components/shared/LocationPicker";
import type { LocationResult } from "@/types";

const doctorSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  phone: z.string().min(10, "Enter a valid phone number"),
  locationDisplayName: z.string().min(1, "Please select your location to continue"),
  locationLat: z.number().optional(),
  locationLng: z.number().optional(),
  city: z.string().optional(),
  area: z.string().optional(),
  specialty: z.string().min(1, "Select a specialty"),
  experience: z.coerce.number().min(0, "Experience cannot be negative"),
  mciNumber: z.string().min(3, "Enter your MCI/NMC registration number"),
  employmentStatus: z.string().min(1, "Select employment status"),
  availableDays: z.array(z.string()).min(1, "Select at least one day"),
  shiftPreference: z.enum(["locum", "permanent", "both"]),
  expectedPay: z.coerce.number().min(1000, "Enter expected pay per shift"),
  upiId: z.string().min(3, "Enter a valid UPI ID"),
  agreedToTerms: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the Terms of Service and Independent Contractor Agreement." })
  })
});

type DoctorOnboardingValues = z.infer<typeof doctorSchema>;
type DoctorField = keyof DoctorOnboardingValues;

const stepFields: DoctorField[][] = [
  ["name", "phone", "locationDisplayName"],
  ["specialty", "experience", "mciNumber", "employmentStatus"],
  [],
  ["availableDays", "shiftPreference", "expectedPay"],
  ["upiId", "agreedToTerms"]
];

const stepsData = [
  {
    title: "Tell us about yourself",
    subtitle: "We'll use this to create your verified profile",
    icon: UserCircle,
    name: "Personal Info"
  },
  {
    title: "Your medical credentials",
    subtitle: "This is how clinics will find and trust you",
    icon: Stethoscope,
    name: "Professional Info"
  },
  {
    title: "Upload your credentials",
    subtitle: "We verify every doctor to ensure clinic trust",
    icon: FileCheck,
    name: "Documents"
  },
  {
    title: "Your availability",
    subtitle: "Only get notified about shifts that fit your schedule",
    icon: Calendar,
    name: "Availability"
  },
  {
    title: "Get paid fast",
    subtitle: "Verified doctors receive UPI payouts within 24 hours of shift completion",
    icon: Wallet,
    name: "Payment"
  }
];

export function DoctorOnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [formError, setFormError] = useState("");
  const [sessionError, setSessionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [mciCert, setMciCert] = useState<File | null>(null);
  const [degreeCert, setDegreeCert] = useState<File | null>(null);
  const [govId, setGovId] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    async function checkSession() {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setSessionError(
          "Your session has expired or you are not signed in. Please sign in before completing onboarding."
        );
        return;
      }

      const userId = session.user.id;

      const [
        { data: doctorRow },
        { data: clinicRow },
        { data: professionalRow }
      ] = await Promise.all([
        supabase.from("doctors")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase.from("clinics")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase.from("healthcare_professionals")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle()
      ]);

      if (doctorRow) {
        router.push("/dashboard/doctor");
      } else if (clinicRow) {
        router.push("/dashboard/clinic");
      } else if (professionalRow) {
        router.push("/dashboard/professional");
      }
      // If none found — user is genuinely new, show the form
    }
    checkSession();
  }, [router]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors }
  } = useForm<DoctorOnboardingValues>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      locationDisplayName: "",
      city: "",
      area: "",
      specialty: "",
      employmentStatus: "",
      availableDays: [],
    }
  });

  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);

  function handleLocationChange(location: LocationResult | null) {
    setSelectedLocation(location);
    if (location) {
      setValue("locationDisplayName", location.displayName, { shouldValidate: true });
      setValue("locationLat", location.lat);
      setValue("locationLng", location.lng);
      setValue("city", location.city ?? "Hyderabad");
      setValue("area", location.area ?? location.displayName);
    } else {
      setValue("locationDisplayName", "");
      setValue("city", "");
      setValue("area", "");
    }
  }

  const availableDays = watch("availableDays");
  const shiftPreference = watch("shiftPreference");
  const formValues = watch();

  async function goNext() {
    setFormError("");

    if (step === 2 && (!mciCert || !degreeCert || !govId)) {
      setFormError("Upload all three required documents before continuing.");
      return;
    }

    const fields = stepFields[step];
    const isValid = fields.length === 0 ? true : await trigger(fields);

    if (isValid) {
      setStep((currentStep) => Math.min(currentStep + 1, 4));
    }
  }

  function toggleDay(day: string) {
    const nextDays = availableDays.includes(day)
      ? availableDays.filter((selectedDay) => selectedDay !== day)
      : [...availableDays, day];
    setValue("availableDays", nextDays, { shouldValidate: true });
  }

  async function onSubmit(values: DoctorOnboardingValues) {
    setFormError("");
    setIsSubmitting(true);

    try {
      if (!mciCert || !degreeCert || !govId) {
        setFormError("Upload all required documents.");
        return;
      }

      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        setFormError("Supabase is not configured.");
        return;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setFormError(userError?.message ?? "Sign in before completing onboarding.");
        return;
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(p => Math.min(p + 10, 90));
      }, 300);

      const [mciCertUrl, degreeCertUrl, govIdUrl] = await Promise.all([
        uploadDocument(supabase, mciCert, `doctors/${user.id}/mci`),
        uploadDocument(supabase, degreeCert, `doctors/${user.id}/degree`),
        uploadDocument(supabase, govId, `doctors/${user.id}/gov-id`)
      ]);

      clearInterval(progressInterval);
      setUploadProgress(100);

      const { error } = await supabase.from("doctors").upsert({
        user_id: user.id,
        name: values.name,
        phone: values.phone,
        email: user.email ?? "",
        specialty: values.specialty,
        experience: values.experience,
        mci_number: values.mciNumber,
        city: values.city ?? "Hyderabad",
        area: values.area ?? values.locationDisplayName,
        employment_status: values.employmentStatus,
        available_days: values.availableDays,
        shift_preference: values.shiftPreference,
        expected_pay: values.expectedPay,
        upi_id: values.upiId,
        verification_status: "pending",
        mci_cert_url: mciCertUrl,
        degree_cert_url: degreeCertUrl,
        gov_id_url: govIdUrl
      });

      if (error) {
        setFormError(error.message);
        return;
      }

      setIsComplete(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (sessionError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-4">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-[#0F172A]">Session expired</h2>
          <p className="mt-2 text-sm text-[#64748B]">{sessionError}</p>
          <button
            className="mt-8 flex w-full justify-center rounded-xl bg-[#1E40AF] px-4 py-3 text-sm font-bold text-white transition-all hover:bg-[#1D4ED8]"
            onClick={() => router.push("/sign-in")}
          >
            Sign in again
          </button>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-4 overflow-hidden relative">
        {/* Confetti effect using raw CSS */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div 
              key={i}
              initial={{ x: `${(i * 17) % 100}vw`, y: -20, rotate: 0 }}
              animate={{ y: "100vh", rotate: 360 }}
              transition={{
                duration: 2 + (i % 4) * 0.5,
                repeat: Infinity,
                delay: (i % 7) * 0.2,
                ease: "linear"
              }}
              className={cn(
                "absolute left-0 top-0 h-3 w-3 rounded-full opacity-70",
                ["bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-amber-500"][i % 4]
              )}
            />
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-lg rounded-3xl border border-[#E2E8F0] bg-white p-10 text-center shadow-2xl"
        >
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50">
            <motion.svg 
              className="h-12 w-12 text-emerald-500" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="3"
            >
              <motion.path 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M5 13l4 4L19 7" 
              />
            </motion.svg>
          </div>
          <h1 className="mt-8 text-3xl font-black tracking-tight text-[#0F172A]">
            You&apos;re all set!
          </h1>
          <p className="mt-3 text-lg font-medium text-[#64748B]">
            Your profile has been submitted for verification.
          </p>
          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm font-medium text-blue-800">
            Our team reviews profiles within 24 hours. You&apos;ll receive an email once verified.
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              className="flex flex-1 items-center justify-center rounded-xl bg-[#1E40AF] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-0.5 hover:bg-[#1D4ED8] hover:shadow-xl hover:shadow-blue-900/30"
              onClick={() => router.push("/dashboard/doctor")}
              type="button"
            >
              Go to Dashboard
            </button>
            <button
              className="flex flex-1 items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
              onClick={() => router.push("/dashboard/doctor/profile")}
              type="button"
            >
              View Profile
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const StepIcon = stepsData[step].icon;

  return (
    <div className="flex min-h-screen w-full bg-[#F8FAFC]">
      {/* DESKTOP LEFT PANEL */}
      <div className="hidden lg:flex fixed inset-y-0 left-0 w-1/3 flex-col bg-[#0F172A] overflow-hidden">
        {/* Animated Background blobs */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -left-20 -top-20 h-96 w-96 animate-[pulse_8s_ease-in-out_infinite] rounded-full bg-blue-600 blur-[100px]" />
          <div className="absolute bottom-10 right-10 h-80 w-80 animate-[pulse_10s_ease-in-out_infinite] rounded-full bg-indigo-600 blur-[100px]" />
        </div>

        <div className="relative flex flex-col h-full z-10 p-12">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight text-white">Medrova</span>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div 
                key={step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shadow-2xl">
                  <StepIcon className="h-10 w-10 text-blue-400" />
                </div>
                <h2 className="text-4xl font-black text-white leading-tight">
                  {stepsData[step].title}
                </h2>
                <p className="mt-4 text-lg font-medium text-slate-400 max-w-sm">
                  {stepsData[step].subtitle}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Stepper Progress */}
          <div className="mt-auto">
            <div className="flex items-center justify-between relative">
              {/* Connecting line background */}
              <div className="absolute left-0 right-0 h-1 top-1/2 -translate-y-1/2 bg-white/10 rounded-full z-0" />
              
              {/* Active connecting line */}
              <motion.div 
                className="absolute left-0 h-1 top-1/2 -translate-y-1/2 bg-blue-500 rounded-full z-0"
                initial={false}
                animate={{ width: `${(step / (stepsData.length - 1)) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />

              {stepsData.map((s, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-4 transition-all duration-300",
                    i < step ? "border-emerald-500 bg-emerald-500 text-white" : 
                    i === step ? "border-blue-500 bg-[#0F172A] text-blue-500" : 
                    "border-white/20 bg-[#0F172A] text-white/30"
                  )}>
                    {i < step ? <CheckCircle2 className="h-5 w-5" /> : <span className="text-sm font-bold">{i + 1}</span>}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>{stepsData[0].name}</span>
              <span>{stepsData[stepsData.length - 1].name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 lg:ml-[33.333333%] flex flex-col min-h-[100dvh] relative bg-white pb-32 lg:pb-0">
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-6 lg:hidden border-b border-slate-100">
          <span className="text-xl font-black tracking-tight text-[#1E40AF]">Medrova</span>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Step {step + 1} of 5</p>
            <p className="text-sm font-bold text-[#0F172A]">{stepsData[step].name}</p>
          </div>
        </div>
        
        {/* Mobile simple progress bar */}
        <div className="h-1 w-full bg-slate-100 lg:hidden">
          <motion.div 
            className="h-full bg-[#1E40AF]"
            initial={false}
            animate={{ width: `${((step + 1) / stepsData.length) * 100}%` }}
          />
        </div>

        <div className="flex-1 p-6 sm:p-10 lg:p-16">
          <div className="mx-auto w-full max-w-[560px]">
            {/* Form step transition */}
            <form onSubmit={handleSubmit(onSubmit)}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <div className="mb-10 lg:hidden">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
                      <StepIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <h2 className="text-3xl font-black text-[#0F172A]">{stepsData[step].title}</h2>
                    <p className="mt-2 text-base font-medium text-[#64748B]">{stepsData[step].subtitle}</p>
                  </div>

                  {step === 0 && (
                    <div className="space-y-6">
                      <FloatingField error={errors.name?.message} label="Full Name" icon={<User />} registration={register("name")} filled={!!formValues.name} />
                      <FloatingField error={errors.phone?.message} label="Phone Number" icon={<Phone />} registration={register("phone")} filled={!!formValues.phone} />
                      <div>
                        <LocationPicker
                          value={selectedLocation}
                          onChange={handleLocationChange}
                          label="Your Location"
                          error={errors.locationDisplayName?.message}
                        />
                        <p className="mt-2 text-xs font-semibold text-slate-400">
                          We use your location to match you with nearby shifts and clinics.
                        </p>
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <FloatingSelect 
                          error={errors.specialty?.message} 
                          label="Specialty" 
                          icon={<Stethoscope />} 
                          options={specialties} 
                          registration={register("specialty")} 
                          filled={!!formValues.specialty} 
                        />
                      </div>
                      <FloatingField error={errors.experience?.message} label="Years of Experience" icon={<Clock />} type="number" registration={register("experience")} filled={!!formValues.experience} />
                      <FloatingSelect 
                        error={errors.employmentStatus?.message} 
                        label="Current Status" 
                        icon={<Briefcase />} 
                        options={employmentStatuses} 
                        registration={register("employmentStatus")} 
                        filled={!!formValues.employmentStatus} 
                      />
                      <div className="sm:col-span-2">
                        <FloatingField error={errors.mciNumber?.message} label="MCI/NMC Registration Number" icon={<ShieldCheck />} registration={register("mciNumber")} filled={!!formValues.mciNumber} />
                        <p className="mt-2 text-xs font-semibold text-slate-500">Your registration number will be securely verified by our medical team.</p>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-6">
                      <FileUploadZone file={mciCert} onChange={setMciCert} title="MCI/NMC Certificate" />
                      <FileUploadZone file={degreeCert} onChange={setDegreeCert} title="Medical Degree Certificate" />
                      <FileUploadZone file={govId} onChange={setGovId} title="Government ID (Aadhaar/PAN)" />
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-10">
                      <div>
                        <h3 className="text-lg font-bold text-[#0F172A] mb-4">What days are you available?</h3>
                        <div className="flex flex-wrap gap-3">
                          {weekDays.map((day) => {
                            const isSelected = availableDays.includes(day);
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => toggleDay(day)}
                                className={cn(
                                  "rounded-full px-5 py-2.5 text-sm font-bold transition-all hover:scale-105 active:scale-95",
                                  isSelected 
                                    ? "bg-[#1E40AF] text-white shadow-md shadow-blue-900/20" 
                                    : "border-2 border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                                )}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                        {errors.availableDays && <p className="mt-3 flex items-center gap-1.5 text-sm font-bold text-red-500"><AlertCircle className="h-4 w-4" />{errors.availableDays.message}</p>}
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-[#0F172A] mb-4">What type of shifts?</h3>
                        <div className="grid gap-4 sm:grid-cols-3">
                          {[
                            { id: "locum", label: "Locum Only", icon: Clock },
                            { id: "permanent", label: "Permanent", icon: Briefcase },
                            { id: "both", label: "Open to Both", icon: Calendar }
                          ].map(pref => {
                            const isSelected = shiftPreference === pref.id;
                            const Icon = pref.icon;
                            return (
                              <label key={pref.id} className="relative cursor-pointer">
                                <input type="radio" value={pref.id} className="peer sr-only" {...register("shiftPreference")} />
                                <div className={cn(
                                  "flex h-full flex-col items-center justify-center gap-3 rounded-2xl border-2 p-5 text-center transition-all",
                                  isSelected 
                                    ? "border-[#1E40AF] bg-blue-50 text-[#1E40AF]" 
                                    : "border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:bg-slate-50"
                                )}>
                                  <Icon className="h-8 w-8" />
                                  <span className="font-bold">{pref.label}</span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-[#0F172A] mb-4">Minimum pay expectations</h3>
                        <FloatingField 
                          error={errors.expectedPay?.message} 
                          label="Expected Pay per Shift (₹)" 
                          icon={<span className="text-lg font-bold">₹</span>} 
                          type="number" 
                          registration={register("expectedPay")} 
                          filled={!!formValues.expectedPay} 
                        />
                        <p className="mt-2 text-xs font-semibold text-slate-500">This is your expected minimum per shift. We&apos;ll match you accordingly.</p>
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="space-y-8">
                      <FloatingField error={errors.upiId?.message} label="UPI ID" icon={<Wallet />} registration={register("upiId")} filled={!!formValues.upiId} />
                      
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                        <p className="font-bold text-emerald-800">Your earnings will be transferred directly to this UPI ID within 24 hours of completing a shift. Medrova never holds your money.</p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-2 px-2 text-center text-sm font-bold text-slate-400">
                        <div className="flex flex-row sm:flex-col items-center gap-4 sm:gap-2 w-full sm:w-auto">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100"><Briefcase className="h-5 w-5" /></div>
                          <span className="text-[10px] uppercase tracking-wider text-left sm:text-center flex-1 sm:flex-none">Clinic Pays</span>
                        </div>
                        <div className="h-8 w-0.5 sm:h-0.5 sm:flex-1 bg-slate-200"></div>
                        <div className="flex flex-row sm:flex-col items-center gap-4 sm:gap-2 w-full sm:w-auto">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100"><CheckCircle2 className="h-5 w-5" /></div>
                          <span className="text-[10px] uppercase tracking-wider text-left sm:text-center flex-1 sm:flex-none">Shift Complete</span>
                        </div>
                        <div className="h-8 w-0.5 sm:h-0.5 sm:flex-1 bg-slate-200"></div>
                        <div className="flex flex-row sm:flex-col items-center gap-4 sm:gap-2 w-full sm:w-auto">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Wallet className="h-5 w-5" /></div>
                          <span className="text-[10px] uppercase tracking-wider text-emerald-600 text-left sm:text-center flex-1 sm:flex-none">You receive 100%</span>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-slate-200 mt-8">
                        <label className="flex items-start gap-3 cursor-pointer group">
                          <div className="flex h-6 items-center mt-0.5">
                            <input 
                              type="checkbox" 
                              {...register("agreedToTerms")}
                              className="h-5 w-5 rounded border-slate-300 text-[#1E40AF] focus:ring-[#1E40AF] transition-all cursor-pointer"
                            />
                          </div>
                          <div className="text-sm">
                            <span className="font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                              I agree to the Medrova Terms of Service and Independent Contractor Agreement.
                            </span>
                            <p className="text-slate-500 mt-1">
                              By checking this box, I acknowledge that I am an independent contractor, Medrova acts as a payment facilitator, and I hold the necessary qualifications to practice.
                            </p>
                            {errors.agreedToTerms && (
                              <p className="mt-2 flex items-center gap-1.5 text-sm font-bold text-red-500">
                                <AlertCircle className="h-4 w-4" />{errors.agreedToTerms.message}
                              </p>
                            )}
                          </div>
                        </label>
                        
                        <details className="mt-4 group/terms border border-slate-200 rounded-xl overflow-hidden">
                          <summary className="text-xs font-bold text-[#1E40AF] cursor-pointer p-3 bg-blue-50 hover:bg-blue-100 list-none flex justify-between items-center transition-colors">
                            Read the full Independent Contractor Agreement
                            <ChevronDown className="h-4 w-4 transition-transform group-open/terms:rotate-180" />
                          </summary>
                          <div className="p-4 text-xs text-slate-600 h-64 overflow-y-auto bg-white space-y-4 leading-relaxed">
                            <div>
                              <p className="font-bold text-slate-900 text-sm">MEDROVA INDEPENDENT CONTRACTOR &amp; PLATFORM USAGE AGREEMENT</p>
                              <p className="text-slate-500 mt-1">This Agreement is entered into between Medrova (&quot;Platform&quot;, &quot;Company&quot;, &quot;We&quot;, &quot;Us&quot;, or &quot;Our&quot;) and the Healthcare Professional registering on the platform (&quot;Contractor&quot;, &quot;You&quot;, or &quot;Your&quot;). By completing onboarding and accepting shifts, the Contractor agrees to be legally bound by this Agreement.</p>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">1. Nature of Relationship</p>
                              <p>Medrova operates solely as a technology-enabled marketplace and aggregator. The Contractor shall act as an independent contractor at all times. Nothing in this Agreement creates an employer-employee relationship, partnership, agency, or fiduciary relationship between Medrova and the Contractor. The Contractor shall not be entitled to any employment-related benefits from Medrova, including provident fund, gratuity, paid leave, insurance, or bonuses.</p>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">2. Role of Medrova</p>
                              <p>Medrova provides a digital platform for discovery, scheduling, and payment facilitation. Medrova does not provide medical or healthcare services, does not supervise or control the Contractor&apos;s clinical judgment or medical practice, and does not determine treatment methods or patient care decisions. All professional and clinical services are rendered solely by the Contractor under their own professional responsibility.</p>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">3. Payment Collection &amp; Escrow Authorization</p>
                              <p>The Contractor hereby appoints and authorises Medrova to act as its limited payment collection agent to collect shift fees from Clinics on behalf of the Contractor. Upon successful completion of the shift, Medrova shall remit the applicable payment to the Contractor&apos;s designated bank account, typically within 24 to 48 business hours. The Contractor agrees that payment made by a Clinic to Medrova shall be deemed equivalent to payment made directly to the Contractor. Medrova reserves the right to deduct applicable platform fees, commissions, taxes, or transaction charges prior to remittance.</p>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">4. Contractor Responsibilities &amp; Compliance</p>
                              <p>The Contractor represents and warrants that they possess a valid, active, and unrestricted license or registration to practice their profession in India; all information submitted during onboarding is accurate and authentic; they shall perform all services in accordance with applicable medical standards and ethics; and they are solely responsible for payment of taxes, professional indemnity insurance, and regulatory compliance applicable to their services.</p>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">5. Liability &amp; Indemnification</p>
                              <p>Medrova acts solely as an intermediary technology platform and shall not be liable for any medical negligence, malpractice, misconduct, clinical outcomes, or disputes between the Contractor and a Clinic. The Contractor agrees to indemnify, defend, and hold harmless Medrova, its directors, employees, affiliates, and partners against any claims arising from the Contractor&apos;s professional conduct, breach of this Agreement, or violation of applicable laws.</p>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">6. Digital Acceptance &amp; Execution</p>
                              <p>Electronic acceptance via checkbox during onboarding has the same legal effect as a physical signature under applicable Indian laws, including the Information Technology Act, 2000.</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between bg-slate-50 border-t border-slate-200 px-4 py-3">
                            <span className="text-xs text-slate-500">For the official signed document, download below.</span>
                            <a
                              href="/MEDROVA%20INDEPENDENT%20CONTRACTOR%20%26%20PLATFORM%20USAGE%20AGREEMENT.pdf"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs font-bold text-[#1E40AF] hover:underline"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              Download Full PDF
                            </a>
                          </div>
                        </details>
                      </div>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>

              {formError && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
                  <p>{formError}</p>
                </motion.div>
              )}

              {/* NAV BUTTONS */}
              <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white/90 p-4 backdrop-blur-md sm:static sm:mt-12 sm:flex-row sm:border-0 sm:bg-transparent sm:p-0">
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-6 py-3.5 font-bold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-0 sm:w-auto"
                  disabled={step === 0 || isSubmitting}
                  onClick={() => setStep(s => Math.max(s - 1, 0))}
                  type="button"
                >
                  <ChevronLeft className="h-5 w-5" />
                  Back
                </button>
                <div className="flex-1"></div>
                {step < 4 ? (
                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E40AF] px-8 py-3.5 font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-0.5 hover:bg-[#1D4ED8] hover:shadow-xl hover:shadow-blue-900/30 sm:w-auto"
                    onClick={goNext}
                    type="button"
                  >
                    Continue
                    <ChevronRight className="h-5 w-5" />
                  </button>
                ) : (
                  <button
                    className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#1E40AF] px-8 py-3.5 font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-0.5 hover:bg-[#1D4ED8] hover:shadow-xl hover:shadow-blue-900/30 disabled:cursor-not-allowed disabled:opacity-80 sm:w-auto"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting && (
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-blue-800"
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                      {isSubmitting ? `Uploading... ${uploadProgress}%` : "Submit for Verification"}
                    </span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----- SUBCOMPONENTS -----

interface FieldProps {
  label: string;
  error?: string;
  registration: UseFormRegisterReturn;
  type?: string;
  icon?: React.ReactNode;
  filled?: boolean;
}

function FloatingField({ label, error, registration, type = "text", icon, filled }: FieldProps) {
  return (
    <div>
      <div className="relative">
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </div>
        <input
          className={cn(
            "peer w-full rounded-xl border-2 bg-transparent px-12 pb-2 pt-6 text-sm font-bold text-[#0F172A] outline-none transition-all focus:border-[#1E40AF] focus:ring-4 focus:ring-[#1E40AF]/10",
            error ? "border-red-400" : "border-slate-200 hover:border-slate-300"
          )}
          type={type}
          placeholder=" "
          {...registration}
        />
        <label className={cn(
          "pointer-events-none absolute left-12 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 transition-all",
          "peer-focus:top-4 peer-focus:-translate-y-1 peer-focus:text-xs peer-focus:text-[#1E40AF]",
          filled && "top-4 -translate-y-1 text-xs"
        )}>
          {label}
        </label>
      </div>
      {error && (
        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-1.5 flex items-center gap-1 text-xs font-bold text-red-500">
          <AlertCircle className="h-3.5 w-3.5" />{error}
        </motion.p>
      )}
    </div>
  );
}

function FloatingSelect({ label, error, registration, options, icon, filled }: FieldProps & { options: string[] }) {
  return (
    <div>
      <div className="relative">
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </div>
        <select
          className={cn(
            "peer w-full appearance-none rounded-xl border-2 bg-transparent px-12 pb-2 pt-6 text-sm font-bold text-[#0F172A] outline-none transition-all focus:border-[#1E40AF] focus:ring-4 focus:ring-[#1E40AF]/10",
            error ? "border-red-400" : "border-slate-200 hover:border-slate-300",
            !filled && "text-transparent" // Hide the initial select value so label looks empty
          )}
          {...registration}
        >
          <option value="" disabled className="text-slate-500">Select...</option>
          {options.map((option) => (
            <option key={option} value={option} className="text-[#0F172A]">{option}</option>
          ))}
        </select>
        <label className={cn(
          "pointer-events-none absolute left-12 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 transition-all",
          "peer-focus:top-4 peer-focus:-translate-y-1 peer-focus:text-xs peer-focus:text-[#1E40AF]",
          filled && "top-4 -translate-y-1 text-xs"
        )}>
          {label}
        </label>
      </div>
      {error && (
        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-1.5 flex items-center gap-1 text-xs font-bold text-red-500">
          <AlertCircle className="h-3.5 w-3.5" />{error}
        </motion.p>
      )}
    </div>
  );
}

function FileUploadZone({
  file,
  title,
  onChange
}: {
  file: File | null;
  title: string;
  onChange: (file: File | null) => void;
}) {
  return (
    <div className={cn(
      "group relative overflow-hidden rounded-2xl border-2 border-dashed p-6 transition-all hover:scale-[1.01]",
      file ? "border-emerald-500 bg-emerald-50" : "border-slate-300 bg-slate-50 hover:border-[#1E40AF] hover:bg-blue-50/50"
    )}>
      <input
        accept=".pdf,.jpg,.jpeg,.png"
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        type="file"
      />
      <div className="flex items-center gap-5 relative z-10 pointer-events-none">
        <div className={cn(
          "flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition-colors",
          file ? "bg-emerald-500 text-white" : "bg-white text-blue-600 shadow-sm group-hover:bg-blue-600 group-hover:text-white"
        )}>
          {file ? <CheckCircle2 className="h-7 w-7" /> : <FileText className="h-6 w-6" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("text-base font-bold", file ? "text-emerald-900" : "text-[#0F172A]")}>{title}</p>
          {file ? (
            <p className="mt-1 truncate text-sm font-semibold text-emerald-700">{file.name} • {(file.size / 1024 / 1024).toFixed(2)} MB</p>
          ) : (
            <p className="mt-1 text-sm font-semibold text-slate-500">PDF, JPG, or PNG — max 5MB</p>
          )}
        </div>
      </div>
      
      {file && (
        <button
          className="absolute right-4 top-4 z-20 rounded-full bg-white p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 shadow-sm"
          onClick={(e) => { e.preventDefault(); onChange(null); }}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
