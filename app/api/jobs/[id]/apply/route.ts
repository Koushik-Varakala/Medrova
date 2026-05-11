import { NextResponse } from "next/server";
import {
  type DoctorLookupRow,
  getAuthedServiceClient,
  jsonError,
  validationError
} from "@/lib/api-utils";

interface JobApplyRouteContext {
  params: {
    id: string;
  };
}

export async function POST(_request: Request, { params }: JobApplyRouteContext) {
  try {
    const auth = await getAuthedServiceClient();

    if ("error" in auth) {
      return auth.error;
    }

    const { data: doctorData, error: doctorError } = await auth.service
      .from("doctors")
      .select("id, verification_status, upi_id")
      .eq("user_id", auth.user.id)
      .single();

    if (doctorError || !doctorData) {
      return jsonError(doctorError?.message ?? "Doctor profile not found.", 404);
    }

    const doctor = doctorData as DoctorLookupRow;

    if (doctor.verification_status !== "verified") {
      return jsonError("Doctor verification is required before applying.", 403);
    }

    const { data: jobData, error: jobError } = await auth.service
      .from("jobs")
      .select("id, status")
      .eq("id", params.id)
      .single();

    if (jobError || !jobData) {
      return jsonError(jobError?.message ?? "Job not found.", 404);
    }

    const job = jobData as { id: string; status: string };

    if (job.status !== "active") {
      return jsonError("Only active jobs can receive applications.", 409);
    }

    const { data, error } = await auth.service
      .from("applications")
      .insert({
        doctor_id: doctor.id,
        job_id: params.id,
        status: "applied"
      })
      .select("id")
      .single();

    if (error || !data) {
      return jsonError(error?.message ?? "Unable to submit application.", 500);
    }

    return NextResponse.json({ application: data }, { status: 201 });
  } catch (error) {
    return validationError(error);
  }
}
