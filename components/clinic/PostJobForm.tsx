"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { BriefcaseMedical, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { specialties } from "@/lib/constants";

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
    formState: { errors }
  } = useForm<PostJobValues>({
    resolver: zodResolver(postJobSchema),
    defaultValues: {
      jobType: "full_time"
    }
  });

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

      setNotice("Job posted and visible to doctors.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5 rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <Select label="Specialty" options={specialties} registration={register("specialty")} error={errors.specialty?.message} />
        <Input label="Minimum experience" type="number" registration={register("experienceMin")} error={errors.experienceMin?.message} />
        <Select label="Job type" options={["full_time", "part_time"]} registration={register("jobType")} error={errors.jobType?.message} />
        <Input label="Minimum salary" type="number" registration={register("salaryMin")} error={errors.salaryMin?.message} />
        <Input label="Maximum salary" type="number" registration={register("salaryMax")} error={errors.salaryMax?.message} />
      </div>
      <div>
        <label className="text-sm font-medium text-[#0F172A]">Description</label>
        <textarea
          className="mt-2 min-h-36 w-full rounded-lg border border-[#E2E8F0] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
          {...register("description")}
        />
        {errors.description ? (
          <p className="mt-1 text-sm text-[#EF4444]">{errors.description.message}</p>
        ) : null}
      </div>
      {formError ? (
        <p className="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#B91C1C]">
          {formError}
        </p>
      ) : null}
      {notice ? (
        <p className="rounded-lg border border-[#10B981]/30 bg-[#10B981]/10 px-4 py-3 text-sm text-[#047857]">
          {notice}
        </p>
      ) : null}
      <button
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1E40AF] px-4 py-2 font-medium text-white hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <BriefcaseMedical className="h-4 w-4" />}
        Post job
      </button>
    </form>
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

function Input({ label, error, registration, type = "text" }: FieldProps) {
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

function Select({ label, error, registration, options }: FieldProps & { options: string[] }) {
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
            {option.replace("_", " ")}
          </option>
        ))}
      </select>
      {error ? <p className="mt-1 text-sm text-[#EF4444]">{error}</p> : null}
    </div>
  );
}
