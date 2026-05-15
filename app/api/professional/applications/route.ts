import { NextResponse } from "next/server";
import { getAuthedServiceClient, jsonError, validationError } from "@/lib/api-utils";
import { mapProfessionalApplicationRow, toDbRecord } from "@/lib/mappers";

export async function GET() {
  try {
    const auth = await getAuthedServiceClient();
    if ("error" in auth) return auth.error;

    // Get the professional ID
    const { data: profRow } = await auth.service
      .from("healthcare_professionals")
      .select("id")
      .eq("user_id", auth.user.id)
      .single();

    if (!profRow) {
      return jsonError("Profile not found", 404);
    }

    // Fetch applications with joined shifts/jobs and clinics
    const { data: apps, error } = await auth.service
      .from("professional_applications")
      .select(`
        *,
        shift:shifts(*, clinic:clinics(name)),
        job:jobs(*, clinic:clinics(name))
      `)
      .eq("professional_id", profRow.id)
      .order("created_at", { ascending: false });

    if (error) {
      return jsonError(error.message, 500);
    }

    const mapped = (apps ?? []).map((app) => mapProfessionalApplicationRow(toDbRecord(app)));

    return NextResponse.json({ applications: mapped });
  } catch (error) {
    return validationError(error);
  }
}

// Create a new application
export async function POST(request: Request) {
  try {
    const auth = await getAuthedServiceClient();
    if ("error" in auth) return auth.error;

    const { shiftId, jobId } = await request.json();

    if (!shiftId && !jobId) {
      return jsonError("Must provide shiftId or jobId", 400);
    }

    const { data: profRow } = await auth.service
      .from("healthcare_professionals")
      .select("id, role, verification_status")
      .eq("user_id", auth.user.id)
      .single();

    if (!profRow) return jsonError("Profile not found", 404);
    if (profRow.verification_status !== "verified") {
      return jsonError("Only verified professionals can apply", 403);
    }

    if (shiftId) {
      const { data: shift, error: shiftError } = await auth.service
        .from("shifts")
        .select("id, status, professional_type")
        .eq("id", shiftId)
        .single();

      if (shiftError || !shift) {
        return jsonError(shiftError?.message ?? "Shift not found", 404);
      }

      if (shift.status !== "active") {
        return jsonError("Only active shifts can receive applications", 409);
      }

      if (shift.professional_type !== profRow.role) {
        return jsonError("This shift is not open for your professional role", 403);
      }
    }

    if (jobId) {
      const { data: job, error: jobError } = await auth.service
        .from("jobs")
        .select("id, status, professional_type")
        .eq("id", jobId)
        .single();

      if (jobError || !job) {
        return jsonError(jobError?.message ?? "Job not found", 404);
      }

      if (job.status !== "active") {
        return jsonError("Only active jobs can receive applications", 409);
      }

      if (job.professional_type !== profRow.role) {
        return jsonError("This job is not open for your professional role", 403);
      }
    }

    // Check if already applied
    const { data: existing, error: existingError } = await auth.service
      .from("professional_applications")
      .select("id")
      .eq("professional_id", profRow.id)
      .eq(shiftId ? "shift_id" : "job_id", shiftId || jobId)
      .limit(1);

    if (existingError) {
      return jsonError("Unable to verify existing applications", 500);
    }

    if (existing && existing.length > 0) {
      return jsonError("You have already applied for this role", 400);
    }

    const { data: app, error } = await auth.service
      .from("professional_applications")
      .insert({
        professional_id: profRow.id,
        shift_id: shiftId || null,
        job_id: jobId || null,
        status: "applied"
      })
      .select("id")
      .single();

    if (error || !app) {
      return jsonError("Failed to apply", 500);
    }

    return NextResponse.json({ success: true, id: app.id });
  } catch (error) {
    return validationError(error);
  }
}
