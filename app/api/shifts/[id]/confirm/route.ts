import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getAuthedServiceClient,
  jsonError,
  parseJsonWithSchema,
  validationError
} from "@/lib/api-utils";
import { sendEmail, shiftConfirmedEmailHtml } from "@/lib/email";

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
      .select("id, name")
      .eq("user_id", auth.user.id)
      .single();

    if (clinicError || !clinicData) {
      return jsonError(clinicError?.message ?? "Clinic profile not found.", 404);
    }

    const clinic = clinicData as { id: string; name: string };

    // Fetch the shift details for the email
    const { data: shiftDetails } = await auth.service
      .from("shifts")
      .select("specialty, date, start_time, end_time, pay, location_display_name, area")
      .eq("id", params.id)
      .maybeSingle();

    const shift = shiftDetails as {
      specialty: string;
      date: string;
      start_time: string;
      end_time: string;
      pay: number;
      location_display_name?: string;
      area?: string;
    } | null;

    const shiftDate = shift ? new Date(shift.date).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "Date not available";
    const shiftTime = shift ? `${shift.start_time} – ${shift.end_time}` : "";
    const shiftLocation = shift?.location_display_name ?? shift?.area ?? "Not specified";

    // ── Try legacy doctor application first ────────────────
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

      // Reject all other applicants
      await auth.service
        .from("applications")
        .update({ status: "rejected" })
        .eq("shift_id", params.id)
        .neq("id", application.id);

      await auth.service
        .from("professional_applications")
        .update({ status: "rejected" })
        .eq("shift_id", params.id);

      // Send confirmation email to the doctor
      const { data: doctorData } = await auth.service
        .from("doctors")
        .select("email, name")
        .eq("id", application.doctor_id)
        .single();
      
      if (doctorData && (doctorData as { email?: string; name?: string }).email) {
        const doc = doctorData as { email: string; name: string };
        await sendEmail({
          to: doc.email,
          subject: `You're confirmed for a shift at ${clinic.name}! ✅`,
          html: shiftConfirmedEmailHtml({
            professionalName: `Dr. ${doc.name}`,
            clinicName: clinic.name,
            specialty: shift?.specialty ?? "",
            date: shiftDate,
            time: shiftTime,
            location: shiftLocation,
            pay: shift?.pay ?? 0,
          }),
        });
      }

      return NextResponse.json({ status: "confirmed" });
    }

    // ── Try healthcare professional application ─────────────
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

    // Reject all other applicants
    await auth.service
      .from("professional_applications")
      .update({ status: "rejected" })
      .eq("shift_id", params.id)
      .neq("id", professionalApplication.id);

    await auth.service
      .from("applications")
      .update({ status: "rejected" })
      .eq("shift_id", params.id);

    // Send confirmation email to the professional
    const { data: professionalData } = await auth.service
      .from("healthcare_professionals")
      .select("email, name, role")
      .eq("id", professionalApplication.professional_id)
      .single();

    if (professionalData && (professionalData as { email?: string }).email) {
      const prof = professionalData as { email: string; name: string; role: string };
      await sendEmail({
        to: prof.email,
        subject: `You're confirmed for a shift at ${clinic.name}! ✅`,
        html: shiftConfirmedEmailHtml({
          professionalName: prof.name,
          clinicName: clinic.name,
          specialty: shift?.specialty ?? "",
          date: shiftDate,
          time: shiftTime,
          location: shiftLocation,
          pay: shift?.pay ?? 0,
          role: prof.role,
        }),
      });
    }

    return NextResponse.json({ status: "confirmed" });
  } catch (error) {
    return validationError(error);
  }
}
