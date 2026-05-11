import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getAdminServiceClient,
  jsonError,
  parseJsonWithSchema,
  validationError
} from "@/lib/api-utils";

interface AdminDoctorVerifyRouteContext {
  params: {
    id: string;
  };
}

const verifyDoctorSchema = z.object({
  status: z.enum(["pending", "verified", "rejected"]),
  note: z.string().optional()
});

export async function POST(
  request: Request,
  { params }: AdminDoctorVerifyRouteContext
) {
  try {
    const auth = await getAdminServiceClient();

    if ("error" in auth) {
      return auth.error;
    }

    const values = await parseJsonWithSchema(request, verifyDoctorSchema);
    const { data, error } = await auth.service
      .from("doctors")
      .update({
        verification_status: values.status,
        verification_note: values.note
      })
      .eq("id", params.id)
      .select("*")
      .single();

    if (error || !data) {
      return jsonError(error?.message ?? "Doctor not found.", 404);
    }

    return NextResponse.json({ doctor: data });
  } catch (error) {
    return validationError(error);
  }
}
