import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getAdminServiceClient,
  jsonError,
  parseJsonWithSchema,
  validationError
} from "@/lib/api-utils";
import {
  sendEmail,
  clinicVerificationStatusEmailHtml,
} from "@/lib/email";

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

    // Update the clinic status
    const { data, error } = await auth.service
      .from("clinics")
      .update({
        verification_status: values.status,
        ...(values.note ? { verification_note: values.note } : {}),
      })
      .eq("id", params.id)
      .select("name, contact_person, user_id")
      .single();

    if (error || !data) {
      return jsonError(error?.message ?? "Clinic not found.", 404);
    }

    // Send verification status email if status is actionable
    if (values.status === "verified" || values.status === "rejected") {
      // Fetch the clinic user's email via auth admin API
      const { data: userRecord } = await auth.service.auth.admin.getUserById(data.user_id);
      const clinicEmail = userRecord?.user?.email;

      if (clinicEmail) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://medrova.in";
        sendEmail({
          to: clinicEmail,
          subject: values.status === "verified"
            ? `🎉 ${data.name} is now verified on Medrova!`
            : `Action required: ${data.name} verification needs attention`,
          html: clinicVerificationStatusEmailHtml({
            clinicName: data.name,
            contactPerson: data.contact_person ?? "there",
            status: values.status,
            note: values.note,
            dashboardUrl: values.status === "verified"
              ? `${appUrl}/dashboard/clinic`
              : `${appUrl}/onboarding/clinic`,
          }),
        }).catch((e) => console.error("[verify clinic email]", e));
      }
    }

    return NextResponse.json({ clinic: data, note: values.note });
  } catch (error) {
    return validationError(error);
  }
}
