import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthedServiceClient, jsonError, parseJsonWithSchema, validationError } from "@/lib/api-utils";

const updateSchema = z.object({
  status: z.enum(["confirmed", "rejected", "applied"]),
  source_table: z.enum(["applications", "professional_applications"]),
});

interface RouteContext {
  params: { id: string };
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const auth = await getAuthedServiceClient();
    if ("error" in auth) return auth.error;

    // Ensure this belongs to the authenticated clinic
    const { data: clinicData } = await auth.service
      .from("clinics")
      .select("id")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (!clinicData) {
      return jsonError("Clinic profile not found.", 404);
    }

    const values = await parseJsonWithSchema(request, updateSchema);

    const { error } = await auth.service
      .from(values.source_table)
      .update({ status: values.status })
      .eq("id", params.id);

    if (error) {
      return jsonError(error.message, 500);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return validationError(error);
  }
}
