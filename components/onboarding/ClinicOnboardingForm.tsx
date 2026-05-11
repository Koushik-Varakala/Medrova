"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { clinicTypes, hyderabadAreas, specialties } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { uploadDocument } from "@/components/onboarding/upload";

const clinicSchema = z.object({
  name: z.string().min(2, "Enter clinic name"),
  type: z.string().min(1, "Select clinic type"),
  address: z.string().min(8, "Enter complete address"),
  area: z.string().min(1, "Select an area"),
  phone: z.string().min(10, "Enter clinic phone"),
  contactPerson: z.string().min(2, "Enter contact person"),
  designation: z.string().min(2, "Enter designation"),
  contactPhone: z.string().min(10, "Enter contact phone"),
  specialtiesNeeded: z.array(z.string()).min(1, "Select at least one specialty")
});

type ClinicOnboardingValues = z.infer<typeof clinicSchema>;
type ClinicField = keyof ClinicOnboardingValues;

const stepFields: ClinicField[][] = [
  ["name", "type", "address", "area", "phone"],
  ["contactPerson", "designation", "contactPhone"],
  [],
  ["specialtiesNeeded"]
];

export function ClinicOnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regCert, setRegCert] = useState<File | null>(null);

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
      area: "",
      specialtiesNeeded: []
    }
  });

  const selectedSpecialties = watch("specialtiesNeeded");

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
      ? selectedSpecialties.filter((selectedSpecialty) => selectedSpecialty !== specialty)
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

      const regCertUrl = await uploadDocument(supabase, regCert, `clinics/${user.id}/registration`);

      const { error } = await supabase.from("clinics").upsert({
        user_id: user.id,
        name: values.name,
        type: values.type,
        address: values.address,
        area: values.area,
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

      setIsComplete(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isComplete) {
    return (
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 text-center shadow-sm">
        <CheckCircle2 className="mx-auto h-12 w-12 text-[#10B981]" />
        <h1 className="mt-4 text-2xl font-semibold text-[#0F172A]">
          Verification pending
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#64748B]">
          Your clinic profile is submitted. Medrova admin will review your registration
          certificate before shifts and jobs go live.
        </p>
        <button
          className="mt-6 rounded-lg bg-[#1E40AF] px-4 py-2 font-medium text-white hover:bg-[#1D4ED8]"
          onClick={() => router.push("/dashboard/clinic")}
          type="button"
        >
          Go to dashboard
        </button>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <ProgressHeader step={step} totalSteps={4} />
      <section className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        {step === 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <TextField error={errors.name?.message} label="Clinic name" registration={register("name")} />
            <SelectField
              error={errors.type?.message}
              label="Clinic type"
              options={clinicTypes}
              registration={register("type")}
            />
            <TextField
              error={errors.address?.message}
              label="Address"
              registration={register("address")}
            />
            <SelectField
              error={errors.area?.message}
              label="Area"
              options={hyderabadAreas}
              registration={register("area")}
            />
            <TextField error={errors.phone?.message} label="Clinic phone" registration={register("phone")} />
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-4 md:grid-cols-3">
            <TextField
              error={errors.contactPerson?.message}
              label="Contact person"
              registration={register("contactPerson")}
            />
            <TextField
              error={errors.designation?.message}
              label="Designation"
              registration={register("designation")}
            />
            <TextField
              error={errors.contactPhone?.message}
              label="Contact phone"
              registration={register("contactPhone")}
            />
          </div>
        ) : null}

        {step === 2 ? (
          <FilePicker file={regCert} label="Clinic registration certificate" onChange={setRegCert} />
        ) : null}

        {step === 3 ? (
          <div>
            <p className="text-sm font-medium text-[#0F172A]">Specialties needed</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {specialties.map((specialty) => (
                <button
                  className={cn(
                    "rounded-lg border border-[#E2E8F0] px-4 py-2 text-left text-sm font-medium text-[#64748B]",
                    selectedSpecialties.includes(specialty) &&
                      "border-[#1E40AF] bg-[#1E40AF] text-white"
                  )}
                  key={specialty}
                  onClick={() => toggleSpecialty(specialty)}
                  type="button"
                >
                  {specialty}
                </button>
              ))}
            </div>
            {errors.specialtiesNeeded ? (
              <p className="mt-1 text-sm text-[#EF4444]">
                {errors.specialtiesNeeded.message}
              </p>
            ) : null}
          </div>
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
        {step < 3 ? (
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
            step === 0 && "w-1/4",
            step === 1 && "w-2/4",
            step === 2 && "w-3/4",
            step === 3 && "w-full"
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
}

function registerPlaceholder() {
  return {};
}

function TextField({ label, error, registration }: FieldProps) {
  return (
    <div>
      <label className="text-sm font-medium text-[#0F172A]">{label}</label>
      <input
        className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
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
    <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-4 text-center">
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
