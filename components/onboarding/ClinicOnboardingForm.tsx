"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Upload, 
  Building2,
  UserCheck,
  FileCheck,
  Stethoscope,
  User,
  Phone,
  MapPin,
  Tag,
  Briefcase,
  FileText,
  AlertCircle,
  X,
  ChevronDown
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { clinicTypes, hyderabadAreas, specialties } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { uploadDocument } from "@/components/onboarding/upload";
import LocationPicker from "@/components/shared/LocationPicker";
import type { LocationResult } from "@/types";

const clinicSchema = z.object({
  name: z.string().min(2, "Enter clinic name"),
  type: z.string().min(2, "Enter or select your clinic type"),
  locationDisplayName: z.string().min(1, "Please select your location to continue"),
  locationLat: z.number().optional(),
  locationLng: z.number().optional(),
  city: z.string().optional(),
  area: z.string().optional(),
  phone: z.string().min(10, "Enter clinic phone"),
  contactPerson: z.string().min(2, "Enter contact person"),
  designation: z.string().min(2, "Enter designation"),
  contactPhone: z.string().min(10, "Enter contact phone"),
  specialtiesNeeded: z.array(z.string()).min(1, "Select at least one specialty"),
  agreedToTerms: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the Terms of Service and Independent Contractor Agreement." })
  })
});

type ClinicOnboardingValues = z.infer<typeof clinicSchema>;
type ClinicField = keyof ClinicOnboardingValues;

const stepFields: ClinicField[][] = [
  ["name", "type", "phone", "locationDisplayName"],
  ["contactPerson", "designation", "contactPhone"],
  [],
  ["specialtiesNeeded", "agreedToTerms"]
];

const stepsData = [
  {
    title: "Tell us about your clinic",
    subtitle: "Verified clinics get access to our doctor network",
    icon: Building2,
    name: "Clinic Info"
  },
  {
    title: "Who should we contact?",
    subtitle: "This person will manage shifts and receive notifications",
    icon: UserCheck,
    name: "Contact Person"
  },
  {
    title: "Verify your clinic",
    subtitle: "Document verification builds trust with our doctors",
    icon: FileCheck,
    name: "Documents"
  },
  {
    title: "What doctors do you need?",
    subtitle: "We'll prioritize matching you with the right specialists",
    icon: Stethoscope,
    name: "Specialties"
  }
];

export function ClinicOnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regCert, setRegCert] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [sessionError, setSessionError] = useState("");

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
  } = useForm<ClinicOnboardingValues>({
    resolver: zodResolver(clinicSchema),
    defaultValues: {
      type: "",
      locationDisplayName: "",
      city: "",
      area: "",
      specialtiesNeeded: []
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

  const selectedSpecialties = watch("specialtiesNeeded");
  const formValues = watch();

  async function goNext() {
    setFormError("");

    if (step === 2 && !regCert) {
      setFormError("Upload the clinic registration certificate before continuing.");
      return;
    }

    const fields = stepFields[step];
    const isValid = fields.length === 0 ? true : await trigger(fields);

    if (isValid) {
      setStep((currentStep) => Math.min(currentStep + 1, 3));
    }
  }

  function toggleSpecialty(specialty: string) {
    const nextSpecialties = selectedSpecialties.includes(specialty)
      ? selectedSpecialties.filter((s) => s !== specialty)
      : [...selectedSpecialties, specialty];
    setValue("specialtiesNeeded", nextSpecialties, { shouldValidate: true });
  }

  async function onSubmit(values: ClinicOnboardingValues) {
    setFormError("");
    setIsSubmitting(true);

    try {
      if (!regCert) {
        setFormError("Upload the clinic registration certificate.");
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

      const progressInterval = setInterval(() => {
        setUploadProgress(p => Math.min(p + 15, 90));
      }, 300);

      const regCertUrl = await uploadDocument(supabase, regCert, `clinics/${user.id}/registration`);

      clearInterval(progressInterval);
      setUploadProgress(100);

      const { error } = await supabase.from("clinics").upsert({
        user_id: user.id,
        name: values.name,
        type: values.type,
        address: values.locationDisplayName,
        area: values.area ?? values.locationDisplayName,
        phone: values.phone,
        contact_person: values.contactPerson,
        contact_phone: values.contactPhone,
        specialties_needed: values.specialtiesNeeded,
        verification_status: "pending",
        reg_cert_url: regCertUrl
      });

      if (error) {
        setFormError(error.message);
        return;
      }

      // Fire registration emails (clinic confirmation + admin alert)
      // Use fetch — runs client-side but hits our server route which has env vars
      fetch("/api/clinic/notify-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicName: values.name,
          clinicType: values.type,
          contactPerson: values.contactPerson,
          contactPhone: values.contactPhone,
          area: values.area ?? values.locationDisplayName ?? "Hyderabad",
          specialties: values.specialtiesNeeded,
          clinicEmail: user.email ?? "",
        }),
      }).catch(() => {}); // silently ignore — never block the user

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
            Your clinic profile has been submitted for verification.
          </p>
          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm font-medium text-blue-800">
            Our team reviews profiles within 24 hours. You&apos;ll receive an email once verified.
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              className="flex flex-1 items-center justify-center rounded-xl bg-[#1E40AF] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-0.5 hover:bg-[#1D4ED8] hover:shadow-xl hover:shadow-blue-900/30"
              onClick={() => router.push("/dashboard/clinic")}
              type="button"
            >
              Go to Dashboard
            </button>
            <button
              className="flex flex-1 items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
              onClick={() => router.push("/dashboard/clinic/profile")}
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
              <div className="absolute left-0 right-0 h-1 top-1/2 -translate-y-1/2 bg-white/10 rounded-full z-0" />
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
        <div className="flex items-center justify-between p-6 lg:hidden border-b border-slate-100">
          <span className="text-xl font-black tracking-tight text-[#1E40AF]">Medrova</span>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Step {step + 1} of 4</p>
            <p className="text-sm font-bold text-[#0F172A]">{stepsData[step].name}</p>
          </div>
        </div>
        
        <div className="h-1 w-full bg-slate-100 lg:hidden">
          <motion.div 
            className="h-full bg-[#1E40AF]"
            initial={false}
            animate={{ width: `${((step + 1) / stepsData.length) * 100}%` }}
          />
        </div>

        <div className="flex-1 p-6 sm:p-10 lg:p-16">
          <div className="mx-auto w-full max-w-[560px]">
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
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <FloatingField error={errors.name?.message} label="Clinic Name" icon={<Building2 />} registration={register("name")} filled={!!formValues.name} />
                      </div>
                      <ComboInput
                        label="Clinic Type"
                        options={clinicTypes}
                        error={errors.type?.message}
                        value={watch("type") ?? ""}
                        onChange={(val) => setValue("type", val, { shouldValidate: true })}
                        icon={<Tag />}
                        note="Don't see your type? Just type it in."
                      />
                      <FloatingField error={errors.phone?.message} label="Clinic Phone" icon={<Phone />} registration={register("phone")} filled={!!formValues.phone} />
                      <div className="sm:col-span-2">
                        <LocationPicker
                          value={selectedLocation}
                          onChange={handleLocationChange}
                          label="Your Location"
                          error={errors.locationDisplayName?.message}
                        />
                        <p className="mt-2 text-xs font-semibold text-slate-400">
                          We use your location to match you with nearby professionals.
                        </p>
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <FloatingField error={errors.contactPerson?.message} label="Contact Person Name" icon={<User />} registration={register("contactPerson")} filled={!!formValues.contactPerson} />
                      </div>
                      <FloatingField error={errors.designation?.message} label="Designation" icon={<Briefcase />} registration={register("designation")} filled={!!formValues.designation} />
                      <FloatingField error={errors.contactPhone?.message} label="Contact Phone" icon={<Phone />} registration={register("contactPhone")} filled={!!formValues.contactPhone} />
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-6">
                      <FileUploadZone file={regCert} onChange={setRegCert} title="Clinic Registration Certificate" />
                      <p className="text-sm font-semibold text-slate-500">Your clinic registration certificate confirms you are a legitimate healthcare provider. This is required to access our doctor network.</p>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold text-[#0F172A] mb-4">Select all specialties you commonly need for shifts and jobs:</h3>
                        <div className="flex flex-wrap gap-3">
                          {specialties.map((specialty) => {
                            const isSelected = selectedSpecialties.includes(specialty);
                            return (
                              <button
                                key={specialty}
                                type="button"
                                onClick={() => toggleSpecialty(specialty)}
                                className={cn(
                                  "rounded-full px-5 py-2.5 text-sm font-bold transition-all hover:scale-105 active:scale-95",
                                  isSelected 
                                    ? "bg-[#1E40AF] text-white shadow-md shadow-blue-900/20" 
                                    : "border-2 border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                                )}
                              >
                                {specialty}
                              </button>
                            );
                          })}
                        </div>
                        {errors.specialtiesNeeded && <p className="mt-3 flex items-center gap-1.5 text-sm font-bold text-red-500"><AlertCircle className="h-4 w-4" />{errors.specialtiesNeeded.message}</p>}
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
                              I agree to the Medrova Platform Usage Agreement and Terms of Service.
                            </span>
                            <p className="text-slate-500 mt-1 text-xs">
                              By checking this box, I confirm I am an authorised representative of this clinic and accept the terms on its behalf, including payment facilitation and liability clauses.
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
                            Read the full Platform Usage Agreement
                            <ChevronDown className="h-4 w-4 transition-transform group-open/terms:rotate-180" />
                          </summary>
                          <div className="p-4 text-xs text-slate-600 h-64 overflow-y-auto bg-white space-y-4 leading-relaxed">
                            <div>
                              <p className="font-bold text-slate-900 text-sm">MEDROVA PLATFORM USAGE AGREEMENT</p>
                              <p className="text-slate-500 mt-1">This Agreement is entered into between Medrova (&quot;Platform&quot;, &quot;Company&quot;, &quot;We&quot;, &quot;Us&quot;, or &quot;Our&quot;) and the Healthcare Facility registering on the platform (&quot;Clinic&quot;, &quot;You&quot;, or &quot;Your&quot;). By completing onboarding, the Clinic agrees to be legally bound by this Agreement.</p>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">1. Nature of Relationship</p>
                              <p>Medrova operates solely as a technology-enabled marketplace connecting verified Clinics with verified healthcare professionals (&quot;Contractors&quot;) for temporary, locum, or permanent opportunities. Nothing in this Agreement creates an employment relationship between Medrova and the Clinic or between Medrova and the Contractors.</p>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">2. Role of Medrova</p>
                              <p>Medrova provides a digital platform for discovery, scheduling, and payment facilitation. Medrova does not provide medical or healthcare services, does not supervise clinical decisions, and does not determine patient care outcomes. All clinical services are rendered by the Contractor under their own professional responsibility.</p>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">3. Payment Facilitation</p>
                              <p>To confirm a booking, the Clinic shall remit the agreed shift fee to Medrova prior to the assignment. Medrova acts as a limited payment collection agent on behalf of the Contractor. The Clinic agrees that payment to Medrova constitutes valid payment to the Contractor. Medrova reserves the right to deduct applicable platform fees, taxes, or transaction charges prior to remittance.</p>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">4. Clinic Responsibilities</p>
                              <p>The Clinic warrants it holds all required facility registrations, licenses, and regulatory approvals to operate as a healthcare establishment. The Clinic remains fully responsible for patient care, facility operations, and providing a safe working environment for all Contractors engaged through the platform.</p>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">5. Liability &amp; Indemnification</p>
                              <p>Medrova acts solely as an intermediary technology platform and shall not be liable for any medical negligence, malpractice, clinical outcomes, or disputes between the Clinic and Contractors. The Clinic agrees to indemnify and hold harmless Medrova against any claims arising from the Clinic&apos;s operations or breach of this Agreement.</p>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">6. Digital Acceptance</p>
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
                {step < 3 ? (
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
            !filled && "text-transparent" 
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

function ComboInput({
  label,
  options,
  error,
  value,
  onChange,
  icon,
  note
}: {
  label: string;
  options: string[];
  error?: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  note?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  const filtered = options.filter(opt =>
    opt.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div>
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        <input
          className={cn(
            "peer w-full rounded-xl border-2 bg-transparent px-12 pb-2 pt-6 text-sm font-bold text-[#0F172A] outline-none transition-all focus:border-[#1E40AF] focus:ring-4 focus:ring-[#1E40AF]/10",
            error ? "border-red-400" : "border-slate-200 hover:border-slate-300"
          )}
          placeholder=" "
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        />
        <label className={cn(
          "pointer-events-none absolute left-12 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 transition-all peer-focus:top-4 peer-focus:-translate-y-1 peer-focus:text-xs peer-focus:text-[#1E40AF]",
          value && "top-4 -translate-y-1 text-xs"
        )}>
          {label}
        </label>
      </div>

      {isOpen && filtered.length > 0 && (
        <div className="relative z-50 mt-1 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          {filtered.map(option => (
            <button
              key={option}
              type="button"
              className="w-full px-4 py-3 text-left text-sm font-semibold text-[#0F172A] hover:bg-blue-50 hover:text-[#1E40AF] transition-colors"
              onMouseDown={() => {
                onChange(option);
                setIsOpen(false);
              }}
            >
              {option}
            </button>
          ))}
          {value && !options.some(o => o.toLowerCase() === value.toLowerCase()) && (
            <div className="px-4 py-2 text-xs font-bold text-slate-400 border-t border-slate-100 bg-slate-50">
              Using: &quot;{value}&quot;
            </div>
          )}
        </div>
      )}

      {note && !error && (
        <p className="mt-2 text-xs font-semibold text-slate-400">
          {note}
        </p>
      )}
      {error && (
        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-1.5 flex items-center gap-1 text-xs font-bold text-red-500">
          <AlertCircle className="h-3.5 w-3.5" />{error}
        </motion.p>
      )}
    </div>
  );
}
