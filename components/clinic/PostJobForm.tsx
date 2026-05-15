"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { BriefcaseMedical, Loader2, Stethoscope, Clock, IndianRupee, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { specialties } from "@/lib/constants";
import { cn } from "@/lib/utils";

const postJobSchema = z.object({
  specialty: z.string().min(1, "Select a specialty"),
  experienceMin: z.coerce.number().min(0, "Experience cannot be negative"),
  jobType: z.enum(["full_time", "part_time"]),
  salaryMin: z.coerce.number().min(1, "Enter minimum salary"),
  salaryMax: z.coerce.number().min(1, "Enter maximum salary"),
  description: z.string().min(20, "Describe the role in at least 20 characters")
});

type PostJobValues = z.infer<typeof postJobSchema>;

export function PostJobForm() {
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<PostJobValues>({
    resolver: zodResolver(postJobSchema),
    defaultValues: {
      jobType: "full_time"
    }
  });

  const descriptionValue = watch("description") || "";

  async function onSubmit(values: PostJobValues) {
    setNotice("");
    setFormError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });

      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setFormError(result.error ?? "Unable to post job.");
        return;
      }

      setNotice("Job posted successfully! It is now live and visible to doctors.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mx-auto max-w-3xl space-y-8 pb-24" onSubmit={handleSubmit(onSubmit)}>
      {/* JOB DETAILS */}
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Stethoscope className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-[#0F172A]">Job Details</h3>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Select 
            label="Specialty Needed" 
            options={specialties} 
            registration={register("specialty")} 
            error={errors.specialty?.message}
            icon={<div className="h-2 w-2 rounded-full bg-blue-500"></div>}
          />
          <Input 
            label="Minimum Experience (Years)" 
            type="number" 
            registration={register("experienceMin")} 
            error={errors.experienceMin?.message} 
            icon={<Clock className="h-4 w-4 text-slate-400" />}
          />
          <div className="col-span-1 sm:col-span-2">
            <label className="mb-2 block text-sm font-bold text-[#0F172A]">Job Type</label>
            <div className="grid grid-cols-2 gap-4">
              <label className="relative cursor-pointer">
                <input type="radio" value="full_time" className="peer sr-only" {...register("jobType")} />
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-center font-semibold text-slate-600 transition-all peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-700 hover:border-blue-200">
                  Full Time
                </div>
              </label>
              <label className="relative cursor-pointer">
                <input type="radio" value="part_time" className="peer sr-only" {...register("jobType")} />
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-center font-semibold text-slate-600 transition-all peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-700 hover:border-blue-200">
                  Part Time
                </div>
              </label>
            </div>
            {errors.jobType && <p className="mt-1 text-sm font-medium text-red-500">{errors.jobType.message}</p>}
          </div>
        </div>
      </section>

      {/* COMPENSATION */}
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <IndianRupee className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-[#0F172A]">Salary Range</h3>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Input 
            label="Minimum Salary (₹)" 
            type="number" 
            registration={register("salaryMin")} 
            error={errors.salaryMin?.message} 
            icon={<span className="text-lg font-bold text-slate-400">₹</span>}
          />
          <Input 
            label="Maximum Salary (₹)" 
            type="number" 
            registration={register("salaryMax")} 
            error={errors.salaryMax?.message} 
            icon={<span className="text-lg font-bold text-slate-400">₹</span>}
          />
        </div>
      </section>

      {/* DESCRIPTION */}
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <FileText className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-[#0F172A]">Job Description</h3>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-bold text-[#0F172A]">Role Details & Requirements</label>
            <span className={cn(
              "text-xs font-medium",
              descriptionValue.length < 20 ? "text-red-400" : "text-emerald-500"
            )}>
              {descriptionValue.length}/20 min
            </span>
          </div>
          <textarea
            className={cn(
              "min-h-[160px] w-full rounded-xl border p-4 text-sm font-medium text-[#0F172A] outline-none transition-all focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20",
              errors.description ? "border-red-500" : "border-[#E2E8F0]"
            )}
            placeholder="Describe the responsibilities, work schedule, and any specific requirements for this role..."
            {...register("description")}
          />
          {errors.description && <p className="mt-1 text-sm font-medium text-red-500">{errors.description.message}</p>}
        </div>
      </section>

      {/* MESSAGES */}
      {formError && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 shadow-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <p>{formError}</p>
        </div>
      )}
      
      {notice && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 shadow-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
          <p>{notice}</p>
        </div>
      )}

      {/* SUBMIT BUTTON */}
      <div className="sticky bottom-0 z-10 -mx-4 border-t border-[#E2E8F0] bg-white/90 p-4 backdrop-blur-md sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <button
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E40AF] px-8 py-4 text-lg font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-1 hover:bg-[#1D4ED8] hover:shadow-xl hover:shadow-blue-900/30 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <BriefcaseMedical className="h-6 w-6" />
          )}
          {isSubmitting ? "Posting Job..." : "Post Job"}
        </button>
      </div>
    </form>
  );
}

// ----- SUBCOMPONENTS -----

interface FieldProps {
  label: string;
  error?: string;
  registration: ReturnType<typeof registerPlaceholder>;
  type?: string;
  icon?: React.ReactNode;
}

function registerPlaceholder() {
  return {};
}

function Input({ label, error, registration, type = "text", icon }: FieldProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-[#0F172A]">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            {icon}
          </div>
        )}
        <input
          className={cn(
            "w-full rounded-xl border px-4 py-3 text-sm font-medium text-[#0F172A] outline-none transition-all focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20",
            icon && "pl-10",
            error ? "border-red-500" : "border-[#E2E8F0]"
          )}
          type={type}
          {...registration}
        />
      </div>
      {error && <p className="mt-1 text-sm font-medium text-red-500">{error}</p>}
    </div>
  );
}

function Select({ label, error, registration, options, icon }: FieldProps & { options: string[] }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-[#0F172A]">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            {icon}
          </div>
        )}
        <select
          className={cn(
            "w-full appearance-none rounded-xl border bg-white px-4 py-3 text-sm font-medium text-[#0F172A] outline-none transition-all focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20",
            icon && "pl-10",
            error ? "border-red-500" : "border-[#E2E8F0]"
          )}
          {...registration}
        >
          <option value="" disabled>Select {label.toLowerCase()}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="mt-1 text-sm font-medium text-red-500">{error}</p>}
    </div>
  );
}
