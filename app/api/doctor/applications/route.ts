import { NextResponse } from "next/server";
import { getAuthedServiceClient, jsonError, validationError } from "@/lib/api-utils";

export async function GET() {
  try {
    const auth = await getAuthedServiceClient();

    if ("error" in auth) {
      return auth.error;
    }

    // Verify doctor
    const { data: doctorData } = await auth.service
      .from("doctors")
      .select("id")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (!doctorData) {
      return jsonError("Doctor profile not found.", 404);
    }

    const doctorId = (doctorData as { id: string }).id;

    // Fetch applications with nested relations using service role to bypass RLS
    const { data: applications, error: appsError } = await auth.service
      .from("applications")
      .select("*, shift:shifts(*, clinic:clinics(*)), job:jobs(*, clinic:clinics(*))")
      .eq("doctor_id", doctorId)
      .order("created_at", { ascending: false });

    if (appsError) {
      return jsonError(appsError.message, 500);
    }

    return NextResponse.json({ applications: applications ?? [] });
  } catch (error) {
    return validationError(error);
  }
}
