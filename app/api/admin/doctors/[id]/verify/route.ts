import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getAdminServiceClient,
  jsonError,
  parseJsonWithSchema,
  validationError
} from "@/lib/api-utils";
import { sendEmail, verificationApprovedEmailHtml } from "@/lib/email";

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

    const url = new URL(request.url);
    const tableParam = url.searchParams.get("table") || "doctors";
    const table =
      tableParam === "professionals" ? "healthcare_professionals" : tableParam;

    if (table !== "doctors" && table !== "healthcare_professionals") {
      return jsonError("Invalid table provided.", 400);
    }

    const values = await parseJsonWithSchema(request, verifyDoctorSchema);
    const { data, error } = await auth.service
      .from(table)
      .update({
        verification_status: values.status,
        verification_note: values.note
      })
      .eq("id", params.id)
      .select("*")
      .single();

    if (error || !data) {
      return jsonError("Professional not found.", 404);
    }

    // Send verification approved email
    if (values.status === "verified") {
      const professional = data as { email?: string; name?: string; role?: string };
      const email = professional.email;
      const name = professional.name ?? "Professional";
      const role = professional.role ?? "Doctor";

      if (email) {
        await sendEmail({
          to: email,
          subject: "You're verified on Medrova! ✅ Start applying now.",
          html: verificationApprovedEmailHtml({
            professionalName: name,
            role: role.charAt(0).toUpperCase() + role.slice(1),
          }),
        });
      }
    }

    return NextResponse.json({ professional: data });
  } catch (error) {
    return validationError(error);
  }
}
