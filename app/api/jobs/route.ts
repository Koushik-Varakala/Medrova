import { NextResponse } from "next/server";
import { z } from "zod";
import {
  type ClinicLookupRow,
  getAuthedServiceClient,
  jsonError,
  parseJsonWithSchema,
  validationError
} from "@/lib/api-utils";
import { mapJobRow, toDbRecord } from "@/lib/mappers";
import { createSupabaseServiceClient } from "@/lib/supabase-server";

const createJobSchema = z.object({
  professionalType: z.enum(["doctor", "nurse", "technician"]),
  specialty: z.string().min(1),
  experienceMin: z.coerce.number().int().min(0),
  jobType: z.enum(["full_time", "part_time"]),
  salaryMin: z.coerce.number().int().positive(),
  salaryMax: z.coerce.number().int().positive(),
  description: z.string().min(20),
  locationLat: z.number().optional(),
  locationLng: z.number().optional(),
  locationDisplayName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().min(10).optional().or(z.literal(""))
});

export async function GET(request: Request) {
  const service = createSupabaseServiceClient();

  if (!service) {
    return jsonError("Supabase service role is not configured.", 500);
  }

  const url = new URL(request.url);
  const specialty = url.searchParams.get("specialty");
  const jobType = url.searchParams.get("jobType");
  const professionalType = url.searchParams.get("professionalType");

  const publicParam = url.searchParams.get("public");
  const isPublic = publicParam === "true";

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

  if (professionalType) {
    if (!["doctor", "nurse", "technician"].includes(professionalType)) {
      return jsonError("Invalid professionalType filter.", 422);
    }
    query = query.eq("professional_type", professionalType);
  }

  const { data, error } = await query;

  if (error) {
    return jsonError(error.message, 500);
  }

  const sanitized = (data ?? []).map((job: Record<string, unknown>) => {
    if (isPublic) {
      const safeJob = { ...job };
      delete safeJob.contact_email;
      delete safeJob.contact_phone;
      return safeJob;
    }
    return job;
  });

  return NextResponse.json({ jobs: sanitized.map((row) => mapJobRow(toDbRecord(row))) });
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
        professional_type: values.professionalType,
        specialty: values.specialty,
        experience_min: values.experienceMin,
        job_type: values.jobType,
        salary_min: values.salaryMin,
        salary_max: values.salaryMax,
        description: values.description,
        status: "active",
        location_lat: values.locationLat ?? null,
        location_lng: values.locationLng ?? null,
        location_display_name: values.locationDisplayName || null,
        is_free_posting: true,
        contact_email: values.contactEmail || null,
        contact_phone: values.contactPhone || null
      })
      .select("*, clinic:clinics(*)")
      .single();

    if (error || !data) {
      return jsonError(error?.message ?? "Unable to create job.", 500);
    }

    return NextResponse.json({ job: mapJobRow(toDbRecord(data)) }, { status: 201 });
  } catch (error) {
    return validationError(error);
  }
}
