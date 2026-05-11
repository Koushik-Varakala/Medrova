import { NextResponse } from "next/server";
import {
  type DoctorLookupRow,
  getAuthedServiceClient,
  jsonError,
  validationError
} from "@/lib/api-utils";

interface ShiftApplyRouteContext {
  params: {
    id: string;
  };
}

export async function POST(_request: Request, { params }: ShiftApplyRouteContext) {
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

    const { data: shiftData, error: shiftError } = await auth.service
      .from("shifts")
      .select("id, status")
      .eq("id", params.id)
      .single();

    if (shiftError || !shiftData) {
      return jsonError(shiftError?.message ?? "Shift not found.", 404);
    }

    const shift = shiftData as { id: string; status: string };

    if (shift.status !== "active") {
      return jsonError("Only active shifts can receive applications.", 409);
    }

    // Check if application already exists
    const { data: existingApps, error: existingAppError } = await auth.service
      .from("applications")
      .select("id")
      .eq("doctor_id", doctor.id)
      .eq("shift_id", params.id)
      .limit(1);

    if (existingAppError) {
      return jsonError("Unable to verify existing applications.", 500);
    }

    if (existingApps && existingApps.length > 0) {
      return jsonError("You have already applied to this shift.", 409);
    }

    const { data, error } = await auth.service
      .from("applications")
      .insert({
        doctor_id: doctor.id,
        shift_id: params.id,
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
