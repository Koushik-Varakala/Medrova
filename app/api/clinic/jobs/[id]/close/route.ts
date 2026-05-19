import { NextResponse } from "next/server";
import { getAuthedServiceClient, jsonError, validationError } from "@/lib/api-utils";

interface RouteContext {
  params: { id: string };
}

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const auth = await getAuthedServiceClient();
    if ("error" in auth) return auth.error;

    // Confirm this job belongs to the authenticated clinic
    const { data: job, error: jobError } = await auth.service
      .from("jobs")
      .select("id, clinic_id, clinics!inner(user_id)")
      .eq("id", params.id)
      .maybeSingle();

    if (jobError || !job) {
      return jsonError("Job not found.", 404);
    }

    const jobRecord = job as unknown as { id: string; clinic_id: string; clinics: { user_id: string }[] };
    if (jobRecord.clinics[0]?.user_id !== auth.user.id) {
      return jsonError("Not authorised.", 403);
    }

    const { error } = await auth.service
      .from("jobs")
      .update({ status: "closed" })
      .eq("id", params.id);

    if (error) {
      return jsonError(error.message, 500);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return validationError(error);
  }
}
