import { NextResponse } from "next/server";
import { z } from "zod";
import {
  type ClinicLookupRow,
  getAuthedServiceClient,
  jsonError,
  parseJsonWithSchema,
  validationError
} from "@/lib/api-utils";
import { createSupabaseServiceClient } from "@/lib/supabase-server";

const createJobSchema = z.object({
  specialty: z.string().min(1),
  experienceMin: z.coerce.number().int().min(0),
  jobType: z.enum(["full_time", "part_time"]),
  salaryMin: z.coerce.number().int().positive(),
  salaryMax: z.coerce.number().int().positive(),
  description: z.string().min(20)
});

export async function GET(request: Request) {
  const service = createSupabaseServiceClient();

  if (!service) {
    return jsonError("Supabase service role is not configured.", 500);
  }

  const url = new URL(request.url);
  const specialty = url.searchParams.get("specialty");
  const jobType = url.searchParams.get("jobType");

  let query = service
    .from("jobs")
    .select("*, clinic:clinics(*)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (specialty) {
    query = query.eq("specialty", specialty);
  }

  if (jobType) {
    query = query.eq("job_type", jobType);
  }

  const { data, error } = await query;

  if (error) {
    return jsonError(error.message, 500);
  }

  return NextResponse.json({ jobs: data ?? [] });
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthedServiceClient();

    if ("error" in auth) {
      return auth.error;
    }

    const values = await parseJsonWithSchema(request, createJobSchema);
    const { data: clinicData, error: clinicError } = await auth.service
      .from("clinics")
      .select("id, verification_status")
      .eq("user_id", auth.user.id)
      .single();

    if (clinicError || !clinicData) {
      return jsonError(clinicError?.message ?? "Clinic profile not found.", 404);
    }

    const clinic = clinicData as ClinicLookupRow;

    if (clinic.verification_status !== "verified") {
      return jsonError("Clinic verification is required before posting jobs.", 403);
    }

    const { data, error } = await auth.service
      .from("jobs")
      .insert({
        clinic_id: clinic.id,
        specialty: values.specialty,
        experience_min: values.experienceMin,
        job_type: values.jobType,
        salary_min: values.salaryMin,
        salary_max: values.salaryMax,
        description: values.description,
        status: "active"
      })
      .select("id")
      .single();

    if (error || !data) {
      return jsonError(error?.message ?? "Unable to create job.", 500);
    }

    return NextResponse.json({ job: data }, { status: 201 });
  } catch (error) {
    return validationError(error);
  }
}
