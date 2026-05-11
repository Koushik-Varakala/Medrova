import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getAdminServiceClient,
  jsonError,
  parseJsonWithSchema,
  validationError
} from "@/lib/api-utils";

interface AdminClinicVerifyRouteContext {
  params: {
    id: string;
  };
}

const verifyClinicSchema = z.object({
  status: z.enum(["pending", "verified", "rejected"]),
  note: z.string().optional()
});

export async function POST(
  request: Request,
  { params }: AdminClinicVerifyRouteContext
) {
  try {
    const auth = await getAdminServiceClient();

    if ("error" in auth) {
      return auth.error;
    }

    const values = await parseJsonWithSchema(request, verifyClinicSchema);
    const { data, error } = await auth.service
      .from("clinics")
      .update({
        verification_status: values.status
      })
      .eq("id", params.id)
      .select("*")
      .single();

    if (error || !data) {
      return jsonError(error?.message ?? "Clinic not found.", 404);
    }

    return NextResponse.json({ clinic: data, note: values.note });
  } catch (error) {
    return validationError(error);
  }
}
