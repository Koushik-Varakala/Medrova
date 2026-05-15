import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getAuthedServiceClient,
  jsonError,
  parseJsonWithSchema,
  validationError
} from "@/lib/api-utils";

interface ShiftConfirmRouteContext {
  params: {
    id: string;
  };
}

const confirmShiftSchema = z.object({
  applicationId: z.string().uuid()
});

export async function POST(request: Request, { params }: ShiftConfirmRouteContext) {
  try {
    const auth = await getAuthedServiceClient();

    if ("error" in auth) {
      return auth.error;
    }

    const values = await parseJsonWithSchema(request, confirmShiftSchema);
    const { data: clinicData, error: clinicError } = await auth.service
      .from("clinics")
      .select("id")
      .eq("user_id", auth.user.id)
      .single();

    if (clinicError || !clinicData) {
      return jsonError(clinicError?.message ?? "Clinic profile not found.", 404);
    }

    const clinic = clinicData as { id: string };
    const { data: applicationData } = await auth.service
      .from("applications")
      .select("id, doctor_id, shift_id")
      .eq("id", values.applicationId)
      .eq("shift_id", params.id)
      .maybeSingle();

    if (applicationData) {
      const application = applicationData as { id: string; doctor_id: string; shift_id: string };
      const { error: shiftError } = await auth.service
        .from("shifts")
        .update({
          status: "confirmed",
          confirmed_doctor_id: application.doctor_id
        })
        .eq("id", params.id)
        .eq("clinic_id", clinic.id);

      if (shiftError) {
        return jsonError(shiftError.message, 500);
      }

      const { error: confirmError } = await auth.service
        .from("applications")
        .update({ status: "confirmed" })
        .eq("id", application.id);

      if (confirmError) {
        return jsonError(confirmError.message, 500);
      }

      await auth.service
        .from("applications")
        .update({ status: "rejected" })
        .eq("shift_id", params.id)
        .neq("id", application.id);

      await auth.service
        .from("professional_applications")
        .update({ status: "rejected" })
        .eq("shift_id", params.id);

      const { data: doctorData } = await auth.service
        .from("doctors")
        .select("email, name")
        .eq("id", application.doctor_id)
        .single();
      
      if (doctorData) {
        console.log(`
      =======================================================
      [EMAIL NOTIFICATION SENT]
      To: ${doctorData.email}
      Subject: Application Confirmed!
      
      Hi Dr. ${doctorData.name},
      
      Great news! The clinic has confirmed your application for the shift.
      Please check your dashboard for further instructions and the clinic's contact details.
      
      Thank you for using Medrova!
      =======================================================
      `);
      }

      return NextResponse.json({ status: "confirmed" });
    }

    const { data: professionalApplicationData, error: professionalApplicationError } = await auth.service
      .from("professional_applications")
      .select("id, professional_id, shift_id")
      .eq("id", values.applicationId)
      .eq("shift_id", params.id)
      .maybeSingle();

    if (professionalApplicationError || !professionalApplicationData) {
      return jsonError(professionalApplicationError?.message ?? "Application not found.", 404);
    }

    const professionalApplication = professionalApplicationData as {
      id: string;
      professional_id: string;
      shift_id: string;
    };

    const { error: professionalShiftError } = await auth.service
      .from("shifts")
      .update({
        status: "confirmed",
        confirmed_professional_id: professionalApplication.professional_id
      })
      .eq("id", params.id)
      .eq("clinic_id", clinic.id);

    if (professionalShiftError) {
      return jsonError(professionalShiftError.message, 500);
    }

    const { error: professionalConfirmError } = await auth.service
      .from("professional_applications")
      .update({ status: "confirmed" })
      .eq("id", professionalApplication.id);

    if (professionalConfirmError) {
      return jsonError(professionalConfirmError.message, 500);
    }

    await auth.service
      .from("professional_applications")
      .update({ status: "rejected" })
      .eq("shift_id", params.id)
      .neq("id", professionalApplication.id);

    await auth.service
      .from("applications")
      .update({ status: "rejected" })
      .eq("shift_id", params.id);

    const { data: professionalData } = await auth.service
      .from("healthcare_professionals")
      .select("email, name")
      .eq("id", professionalApplication.professional_id)
      .single();

    if (professionalData) {
      console.log(`
      =======================================================
      [EMAIL NOTIFICATION SENT]
      To: ${professionalData.email}
      Subject: Application Confirmed!
      
      Hi ${professionalData.name},
      
      Great news! The clinic has confirmed your application for the shift.
      Please check your dashboard for further instructions and the clinic's contact details.
      
      Thank you for using Medrova!
      =======================================================
      `);
    }

    return NextResponse.json({ status: "confirmed" });
  } catch (error) {
    return validationError(error);
  }
}
