"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  employmentStatuses,
  hyderabadAreas,
  specialties,
  weekDays
} from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { uploadDocument } from "@/components/onboarding/upload";

const doctorSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  phone: z.string().min(10, "Enter a valid phone number"),
  city: z.string().min(2, "Enter your city"),
  area: z.string().min(1, "Select an area"),
  specialty: z.string().min(1, "Select a specialty"),
  experience: z.coerce.number().min(0, "Experience cannot be negative"),
  mciNumber: z.string().min(3, "Enter your MCI/NMC registration number"),
  employmentStatus: z.string().min(1, "Select employment status"),
  availableDays: z.array(z.string()).min(1, "Select at least one day"),
  shiftPreference: z.enum(["locum", "permanent", "both"]),
  expectedPay: z.coerce.number().min(1000, "Enter expected pay per shift"),
  upiId: z.string().min(3, "Enter a valid UPI ID")
});

type DoctorOnboardingValues = z.infer<typeof doctorSchema>;
type DoctorField = keyof DoctorOnboardingValues;

const stepFields: DoctorField[][] = [
  ["name", "phone", "city", "area"],
  ["specialty", "experience", "mciNumber", "employmentStatus"],
  [],
  ["availableDays", "shiftPreference", "expectedPay"],
  ["upiId"]
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

  // Check for a valid Supabase session on mount so the user doesn't fill all 5 steps
  // only to hit "Auth session missing!" at the very end.
  useEffect(() => {
    async function checkSession() {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setSessionError(
          "Your session has expired or you are not signed in. Please sign in before completing onboarding."
        );
      }
    }
    checkSession();
  }, []);

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
      city: "Hyderabad",
      area: "",
      specialty: "",
      employmentStatus: "",
      availableDays: [],
      shiftPreference: "both",
      expectedPay: 6000
    }
  });

  const availableDays = watch("availableDays");

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
        setFormError("Supabase is not configured. Add your environment variables first.");
        return;
      }

      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setFormError(userError?.message ?? "Sign in before completing onboarding.");
        return;
      }

      const [mciCertUrl, degreeCertUrl, govIdUrl] = await Promise.all([
        uploadDocument(supabase, mciCert, `doctors/${user.id}/mci`),
        uploadDocument(supabase, degreeCert, `doctors/${user.id}/degree`),
        uploadDocument(supabase, govId, `doctors/${user.id}/gov-id`)
      ]);

      const { error } = await supabase.from("doctors").upsert({
        user_id: user.id,
        name: values.name,
        phone: values.phone,
        email: user.email ?? "",
        specialty: values.specialty,
        experience: values.experience,
        mci_number: values.mciNumber,
        city: values.city,
        area: values.area,
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
      <div className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-6 text-center">
        <p className="text-sm font-medium text-[#B91C1C]">{sessionError}</p>
        <a
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-[#1E40AF] px-4 py-2 font-medium text-white hover:bg-[#1D4ED8]"
          href="/sign-in"
        >
          Go to sign in
        </a>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 text-center shadow-sm">
        <CheckCircle2 className="mx-auto h-12 w-12 text-[#10B981]" />
        <h1 className="mt-4 text-2xl font-semibold text-[#0F172A]">
          Verification pending
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#64748B]">
          Your doctor profile is submitted. Medrova admin will review your documents
          before enabling applications.
        </p>
        <button
          className="mt-6 rounded-lg bg-[#1E40AF] px-4 py-2 font-medium text-white hover:bg-[#1D4ED8]"
          onClick={() => router.push("/dashboard/doctor")}
          type="button"
        >
          Go to dashboard
        </button>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <ProgressHeader step={step} totalSteps={5} />
      <section className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        {step === 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <TextField error={errors.name?.message} label="Full name" registration={register("name")} />
            <TextField error={errors.phone?.message} label="Phone" registration={register("phone")} />
            <TextField error={errors.city?.message} label="City" registration={register("city")} />
            <SelectField
              error={errors.area?.message}
              label="Area in Hyderabad"
              options={hyderabadAreas}
              registration={register("area")}
            />
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              error={errors.specialty?.message}
              label="Specialty"
              options={specialties}
              registration={register("specialty")}
            />
            <TextField
              error={errors.experience?.message}
              label="Years of experience"
              registration={register("experience")}
              type="number"
            />
            <TextField
              error={errors.mciNumber?.message}
              label="MCI/NMC number"
              registration={register("mciNumber")}
            />
            <SelectField
              error={errors.employmentStatus?.message}
              label="Employment status"
              options={employmentStatuses}
              registration={register("employmentStatus")}
            />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-4 md:grid-cols-3">
            <FilePicker file={mciCert} label="MCI certificate" onChange={setMciCert} />
            <FilePicker file={degreeCert} label="Degree certificate" onChange={setDegreeCert} />
            <FilePicker file={govId} label="Government ID" onChange={setGovId} />
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-[#0F172A]">Available days</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {weekDays.map((day) => (
                  <button
                    className={cn(
                      "rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#64748B]",
                      availableDays.includes(day) && "border-[#1E40AF] bg-[#1E40AF] text-white"
                    )}
                    key={day}
                    onClick={() => toggleDay(day)}
                    type="button"
                  >
                    {day}
                  </button>
                ))}
              </div>
              {errors.availableDays ? (
                <p className="mt-1 text-sm text-[#EF4444]">
                  {errors.availableDays.message}
                </p>
              ) : null}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField
                error={errors.shiftPreference?.message}
                label="Shift preference"
                options={["locum", "permanent", "both"]}
                registration={register("shiftPreference")}
              />
              <TextField
                error={errors.expectedPay?.message}
                label="Expected pay per shift"
                registration={register("expectedPay")}
                type="number"
              />
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <TextField
            error={errors.upiId?.message}
            label="UPI ID for receiving payments"
            registration={register("upiId")}
          />
        ) : null}
      </section>

      {formError ? (
        <p className="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#B91C1C]">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-4 py-2 font-medium text-[#0F172A] hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={step === 0 || isSubmitting}
          onClick={() => setStep((currentStep) => Math.max(currentStep - 1, 0))}
          type="button"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        {step < 4 ? (
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1E40AF] px-4 py-2 font-medium text-white hover:bg-[#1D4ED8]"
            onClick={goNext}
            type="button"
          >
            Continue
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1E40AF] px-4 py-2 font-medium text-white hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Submit for verification
          </button>
        )}
      </div>
    </form>
  );
}

function ProgressHeader({ step, totalSteps }: { step: number; totalSteps: number }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[#1E40AF]">
          Step {step + 1} of {totalSteps}
        </p>
        <p className="text-sm text-[#64748B]">{Math.round(((step + 1) / totalSteps) * 100)}%</p>
      </div>
      <div className="mt-3 h-2 rounded-full bg-[#E2E8F0]">
        <div
          className={cn(
            "h-2 rounded-full bg-[#1E40AF]",
            step === 0 && "w-1/5",
            step === 1 && "w-2/5",
            step === 2 && "w-3/5",
            step === 3 && "w-4/5",
            step === 4 && "w-full"
          )}
        />
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  error?: string;
  registration: ReturnType<typeof registerPlaceholder>;
  type?: string;
}

function registerPlaceholder() {
  return {};
}

function TextField({ label, error, registration, type = "text" }: FieldProps) {
  return (
    <div>
      <label className="text-sm font-medium text-[#0F172A]">{label}</label>
      <input
        className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
        type={type}
        {...registration}
      />
      {error ? <p className="mt-1 text-sm text-[#EF4444]">{error}</p> : null}
    </div>
  );
}

function SelectField({ label, error, registration, options }: FieldProps & { options: string[] }) {
  return (
    <div>
      <label className="text-sm font-medium text-[#0F172A]">{label}</label>
      <select
        className="mt-2 w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
        {...registration}
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error ? <p className="mt-1 text-sm text-[#EF4444]">{error}</p> : null}
    </div>
  );
}

function FilePicker({
  file,
  label,
  onChange
}: {
  file: File | null;
  label: string;
  onChange: (file: File | null) => void;
}) {
  return (
    <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-4 text-center">
      <Upload className="h-6 w-6 text-[#1E40AF]" />
      <span className="mt-3 text-sm font-medium text-[#0F172A]">{label}</span>
      <span className="mt-1 max-w-full truncate text-xs text-[#64748B]">
        {file ? file.name : "PDF, JPG, or PNG"}
      </span>
      <input
        accept=".pdf,.jpg,.jpeg,.png"
        className="sr-only"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        type="file"
      />
    </label>
  );
}
