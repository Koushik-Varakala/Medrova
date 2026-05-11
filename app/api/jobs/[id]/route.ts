import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getAuthedServiceClient,
  jsonError,
  parseJsonWithSchema,
  validationError
} from "@/lib/api-utils";
import { createSupabaseServiceClient } from "@/lib/supabase-server";

interface JobRouteContext {
  params: {
    id: string;
  };
}

const updateJobSchema = z.object({
  specialty: z.string().min(1).optional(),
  experienceMin: z.coerce.number().int().min(0).optional(),
  jobType: z.enum(["full_time", "part_time"]).optional(),
  salaryMin: z.coerce.number().int().positive().optional(),
  salaryMax: z.coerce.number().int().positive().optional(),
  description: z.string().min(20).optional(),
  status: z.enum(["active", "closed"]).optional()
});

export async function GET(_request: Request, { params }: JobRouteContext) {
  const service = createSupabaseServiceClient();

  if (!service) {
    return jsonError("Supabase service role is not configured.", 500);
  }

  const { data, error } = await service
    .from("jobs")
    .select("*, clinic:clinics(*)")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return jsonError(error?.message ?? "Job not found.", 404);
  }

  return NextResponse.json({ job: data });
}

export async function PATCH(request: Request, { params }: JobRouteContext) {
  try {
    const auth = await getAuthedServiceClient();

    if ("error" in auth) {
      return auth.error;
    }

    const values = await parseJsonWithSchema(request, updateJobSchema);
    const { data: clinicData, error: clinicError } = await auth.service
      .from("clinics")
      .select("id")
      .eq("user_id", auth.user.id)
      .single();

    if (clinicError || !clinicData) {
      return jsonError(clinicError?.message ?? "Clinic profile not found.", 404);
    }

    const clinic = clinicData as { id: string };
    const updatePayload: Record<string, string | number | undefined> = {
      specialty: values.specialty,
      experience_min: values.experienceMin,
      job_type: values.jobType,
      salary_min: values.salaryMin,
      salary_max: values.salaryMax,
      description: values.description,
      status: values.status
    };

    const { data, error } = await auth.service
      .from("jobs")
      .update(updatePayload)
      .eq("id", params.id)
      .eq("clinic_id", clinic.id)
      .select("*")
      .single();

    if (error || !data) {
      return jsonError(error?.message ?? "Unable to update job.", 500);
    }

    return NextResponse.json({ job: data });
  } catch (error) {
    return validationError(error);
  }
}
