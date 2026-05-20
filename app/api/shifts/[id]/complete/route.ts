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
      console.error("[complete] Auth failed");
      return auth.error;
    }

    console.log("[complete] shift_id:", params.id, "user:", auth.user.id);

    const { data: clinicData, error: clinicError } = await auth.service
      .from("clinics")
      .select("id, name")
      .eq("user_id", auth.user.id)
      .single();

    if (clinicError || !clinicData) {
      console.error("[complete] Clinic not found for user:", auth.user.id, clinicError?.message);
      return jsonError(clinicError?.message ?? "Clinic profile not found.", 403);
    }

    const clinic = clinicData as { id: string; name: string };
    console.log("[complete] clinic:", clinic.id);
    
    // First fetch the shift to give clear errors
    const { data: shiftCheck, error: shiftCheckErr } = await auth.service
      .from("shifts")
      .select("id, status, clinic_id, pay, confirmed_professional_id, confirmed_doctor_id, specialty, date, start_time, end_time, area")
      .eq("id", params.id)
      .maybeSingle();


    if (shiftCheckErr || !shiftCheck) {
      console.error("[complete] Shift not found:", params.id, shiftCheckErr?.message);
      return jsonError("Shift not found.", 404);
    }

    const shiftCheck2 = shiftCheck as { id: string; status: string; clinic_id: string; pay: number; confirmed_professional_id: string | null; confirmed_doctor_id: string | null; specialty: string; date: string; start_time: string; end_time: string; area?: string };

    console.log("[complete] shift status:", shiftCheck2.status, "shift clinic_id:", shiftCheck2.clinic_id, "req clinic_id:", clinic.id);

    if (shiftCheck2.clinic_id !== clinic.id) {
      return jsonError("You are not authorised to complete this shift.", 403);
    }

    if (shiftCheck2.status !== "confirmed") {
      return jsonError(
        shiftCheck2.status === "completed"
          ? "This shift has already been marked as completed."
          : `Only confirmed shifts can be marked as complete. Current status: ${shiftCheck2.status}`,
        400
      );
    }

    // Now mark it completed
    const { error: updateError } = await auth.service
      .from("shifts")
      .update({ status: "completed" })
      .eq("id", params.id);

    if (updateError) {
      return jsonError(updateError.message, 500);
    }

    const shiftData = shiftCheck2;

    const confirmedDoctorId = typeof shiftData.confirmed_doctor_id === "string" ? shiftData.confirmed_doctor_id : null;
    const confirmedProfessionalId = typeof shiftData.confirmed_professional_id === "string" ? shiftData.confirmed_professional_id : null;

    if (!confirmedDoctorId && !confirmedProfessionalId) {
      return jsonError("Shift has no confirmed professional attached.", 400);
    }

    const shiftDate = new Date(shiftData.date).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const location = shiftData.area ?? "Not specified";
    const adminEmail = process.env.ADMIN_EMAIL ?? "koushik@medrova.in";
    const payoutLive = process.env.RAZORPAY_PAYOUT_LIVE === "true";

    // ── Legacy Doctor Flow ──────────────────────────────────
    if (confirmedDoctorId) {
      await auth.service
        .from("applications")
        .update({ status: "completed" })
        .eq("shift_id", shiftData.id)
        .eq("doctor_id", confirmedDoctorId);

      const { data: doctorData } = await auth.service
        .from("doctors")
        .select("upi_id, email, name")
        .eq("id", confirmedDoctorId)
        .single();

      const doctor = doctorData && typeof doctorData === "object"
        ? (doctorData as { upi_id?: string; email?: string; name?: string })
        : null;

      const doctorAmount = shiftData.pay;

      const { error: payoutErr } = await auth.service
        .from("doctor_payouts")
        .insert({
          doctor_id: confirmedDoctorId,
          shift_id: shiftData.id,
          amount: doctorAmount,
          upi_id: doctor?.upi_id ?? "unknown",
          status: "pending",
          paid_at: null
        });

      if (payoutErr) {
        console.error("[complete] Failed to insert doctor payout:", payoutErr.message);
        return jsonError(`Failed to register payout record: ${payoutErr.message}`, 500);
      }

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
            specialty: shiftData.specialty,
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
            shiftId: shiftData.id,
            clinicName: clinic.name,
            shiftDate,
            specialty: shiftData.specialty,
          }),
        });
      }
    }

    // ── Healthcare Professional Flow ────────────────────────
    if (confirmedProfessionalId) {
      await auth.service
        .from("professional_applications")
        .update({ status: "completed" })
        .eq("shift_id", shiftData.id)
        .eq("professional_id", confirmedProfessionalId);

      const { data: profData } = await auth.service
        .from("healthcare_professionals")
        .select("upi_id, email, name, role")
        .eq("id", confirmedProfessionalId)
        .single();

      const prof = profData && typeof profData === "object"
        ? (profData as { upi_id?: string; email?: string; name?: string; role?: string })
        : null;

      const professionalAmount = shiftData.pay;

      const { error: payoutErr } = await auth.service
        .from("professional_payouts")
        .insert({
          professional_id: confirmedProfessionalId,
          shift_id: shiftData.id,
          amount: professionalAmount,
          upi_id: prof?.upi_id ?? "unknown",
          status: "pending",
          paid_at: null
        });

      if (payoutErr) {
        console.error("[complete] Failed to insert professional payout:", payoutErr.message);
        return jsonError(`Failed to register payout record: ${payoutErr.message}`, 500);
      }

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
            specialty: shiftData.specialty,
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
            shiftId: shiftData.id,
            clinicName: clinic.name,
            shiftDate,
            specialty: shiftData.specialty,
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
