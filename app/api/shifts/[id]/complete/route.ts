import { NextResponse } from "next/server";
import { getAuthedServiceClient, jsonError, validationError } from "@/lib/api-utils";
import { sendEmail, adminPayoutAlertEmailHtml, paymentDispatchedEmailHtml } from "@/lib/email";

interface ShiftCompleteRouteContext {
  params: {
    id: string;
  };
}

export async function POST(
  _request: Request,
  { params }: ShiftCompleteRouteContext
) {
  try {
    const auth = await getAuthedServiceClient();

    if ("error" in auth) {
      return auth.error;
    }

    const { data: clinicData, error: clinicError } = await auth.service
      .from("clinics")
      .select("id, name")
      .eq("user_id", auth.user.id)
      .single();

    if (clinicError || !clinicData) {
      return jsonError(clinicError?.message ?? "Clinic profile not found.", 404);
    }

    const clinic = clinicData as { id: string; name: string };
    
    // First find the shift and update to completed
    const { data: shiftData, error: shiftError } = await auth.service
      .from("shifts")
      .update({ status: "completed" })
      .eq("id", params.id)
      .eq("clinic_id", clinic.id)
      .eq("status", "confirmed")
      .select("id, pay, confirmed_professional_id, professional_type, confirmed_doctor_id, specialty, date, start_time, end_time, location_display_name, area")
      .single();

    if (shiftError || !shiftData) {
      return jsonError(shiftError?.message ?? "Confirmed shift not found.", 404);
    }

    const shift = shiftData as {
      id: string;
      pay: number;
      confirmed_doctor_id: string | null;
      confirmed_professional_id: string | null;
      specialty: string;
      date: string;
      start_time: string;
      end_time: string;
      location_display_name?: string;
      area?: string;
    };

    const confirmedDoctorId = typeof shift.confirmed_doctor_id === "string" ? shift.confirmed_doctor_id : null;
    const confirmedProfessionalId = typeof shift.confirmed_professional_id === "string" ? shift.confirmed_professional_id : null;

    if (!confirmedDoctorId && !confirmedProfessionalId) {
      return jsonError("Shift has no confirmed professional attached.", 400);
    }

    const shiftDate = new Date(shift.date).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const location = shift.location_display_name ?? shift.area ?? "Not specified";
    const adminEmail = process.env.ADMIN_EMAIL ?? "koushik@medrova.in";
    const payoutLive = process.env.RAZORPAY_PAYOUT_LIVE === "true";

    // ── Legacy Doctor Flow ──────────────────────────────────
    if (confirmedDoctorId) {
      await auth.service
        .from("applications")
        .update({ status: "completed" })
        .eq("shift_id", shift.id)
        .eq("doctor_id", confirmedDoctorId);

      const { data: doctorData } = await auth.service
        .from("doctors")
        .select("upi_id, email, name")
        .eq("id", confirmedDoctorId)
        .single();

      const doctor = doctorData && typeof doctorData === "object"
        ? (doctorData as { upi_id?: string; email?: string; name?: string })
        : null;

      const doctorAmount = Math.floor(shift.pay * 0.80);

      await auth.service
        .from("doctor_payouts")
        .insert({
          doctor_id: confirmedDoctorId,
          shift_id: shift.id,
          amount: doctorAmount,
          upi_id: doctor?.upi_id ?? "unknown",
          status: payoutLive ? "pending" : "manual_pending",
          paid_at: payoutLive ? null : new Date().toISOString()
        });

      // Send payout email to doctor
      if (doctor?.email && doctor?.name) {
        await sendEmail({
          to: doctor.email,
          subject: "Your Medrova payment is on the way! 💸",
          html: paymentDispatchedEmailHtml({
            professionalName: doctor.name,
            clinicName: clinic.name,
            amount: doctorAmount,
            upiId: doctor.upi_id ?? "Not on file",
            shiftDate,
            specialty: shift.specialty,
          }),
        });
      }

      // Send admin alert for manual payout
      if (!payoutLive) {
        await sendEmail({
          to: adminEmail,
          subject: `⚠️ Manual Payout Required — ₹${doctorAmount.toLocaleString("en-IN")} to ${doctor?.name}`,
          html: adminPayoutAlertEmailHtml({
            professionalName: doctor?.name ?? "Unknown",
            upiId: doctor?.upi_id ?? "Not on file",
            amount: doctorAmount,
            shiftId: shift.id,
            clinicName: clinic.name,
            shiftDate,
            specialty: shift.specialty,
          }),
        });
      }
    }

    // ── Healthcare Professional Flow ────────────────────────
    if (confirmedProfessionalId) {
      await auth.service
        .from("professional_applications")
        .update({ status: "completed" })
        .eq("shift_id", shift.id)
        .eq("professional_id", confirmedProfessionalId);

      const { data: profData } = await auth.service
        .from("healthcare_professionals")
        .select("upi_id, email, name, role")
        .eq("id", confirmedProfessionalId)
        .single();

      const prof = profData && typeof profData === "object"
        ? (profData as { upi_id?: string; email?: string; name?: string; role?: string })
        : null;

      const professionalAmount = Math.floor(shift.pay * 0.80);

      await auth.service
        .from("professional_payouts")
        .insert({
          professional_id: confirmedProfessionalId,
          shift_id: shift.id,
          amount: professionalAmount,
          upi_id: prof?.upi_id ?? "unknown",
          status: payoutLive ? "pending" : "manual_pending",
          paid_at: payoutLive ? null : new Date().toISOString()
        });

      // Send payout email to professional
      if (prof?.email && prof?.name) {
        await sendEmail({
          to: prof.email,
          subject: "Your Medrova payment is on the way! 💸",
          html: paymentDispatchedEmailHtml({
            professionalName: prof.name,
            clinicName: clinic.name,
            amount: professionalAmount,
            upiId: prof.upi_id ?? "Not on file",
            shiftDate,
            specialty: shift.specialty,
          }),
        });
      }

      // Send admin alert for manual payout
      if (!payoutLive) {
        await sendEmail({
          to: adminEmail,
          subject: `⚠️ Manual Payout Required — ₹${professionalAmount.toLocaleString("en-IN")} to ${prof?.name}`,
          html: adminPayoutAlertEmailHtml({
            professionalName: prof?.name ?? "Unknown",
            upiId: prof?.upi_id ?? "Not on file",
            amount: professionalAmount,
            shiftId: shift.id,
            clinicName: clinic.name,
            shiftDate,
            specialty: shift.specialty,
          }),
        });
      }
    }

    return NextResponse.json({
      status: "completed",
      payoutTriggered: Boolean(confirmedDoctorId || confirmedProfessionalId),
      payoutMode: payoutLive ? "automatic" : "manual",
    });
  } catch (error) {
    return validationError(error);
  }
}
