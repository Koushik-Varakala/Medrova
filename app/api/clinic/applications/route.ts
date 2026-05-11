import { NextResponse } from "next/server";
import { getAuthedServiceClient, jsonError, validationError } from "@/lib/api-utils";

export async function GET(request: Request) {
  try {
    const auth = await getAuthedServiceClient();

    if ("error" in auth) {
      return auth.error;
    }

    // Verify clinic
    const { data: clinicData } = await auth.service
      .from("clinics")
      .select("id")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (!clinicData) {
      return jsonError("Clinic profile not found.", 404);
    }

    const clinicId = (clinicData as { id: string }).id;

    // We want to fetch applications for shifts belonging to this clinic.
    // So we first get the shifts.
    const { data: shifts } = await auth.service
      .from("shifts")
      .select("id")
      .eq("clinic_id", clinicId);

    const shiftIds = (shifts ?? []).map(s => s.id);

    if (shiftIds.length === 0) {
      return NextResponse.json({ applications: [] });
    }

    // Now fetch applications and join doctors using service role (bypasses RLS)
    const { data: applications, error: appsError } = await auth.service
      .from("applications")
      .select("*, doctors(*)")
      .in("shift_id", shiftIds)
      .order("created_at", { ascending: false });

    if (appsError) {
      return jsonError(appsError.message, 500);
    }

    return NextResponse.json({ applications: applications ?? [] });
  } catch (error) {
    return validationError(error);
  }
}
