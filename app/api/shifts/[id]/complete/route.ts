import { NextResponse } from "next/server";
import { getAuthedServiceClient, jsonError, validationError } from "@/lib/api-utils";

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
      .select("id")
      .eq("user_id", auth.user.id)
      .single();

    if (clinicError || !clinicData) {
      return jsonError(clinicError?.message ?? "Clinic profile not found.", 404);
    }

    const clinic = clinicData as { id: string };
    
    // First find the shift and update to completed
    const { data: shiftData, error: shiftError } = await auth.service
      .from("shifts")
      .update({ status: "completed" })
      .eq("id", params.id)
      .eq("clinic_id", clinic.id)
      .eq("status", "confirmed")
      .select("id, pay, confirmed_professional_id, professional_type, confirmed_doctor_id")
      .single();

    if (shiftError || !shiftData) {
      return jsonError(shiftError?.message ?? "Confirmed shift not found.", 404);
    }

    const confirmedDoctorId =
      typeof shiftData.confirmed_doctor_id === "string"
        ? shiftData.confirmed_doctor_id
        : null;
    const confirmedProfessionalId =
      typeof shiftData.confirmed_professional_id === "string"
        ? shiftData.confirmed_professional_id
        : null;

    if (!confirmedDoctorId && !confirmedProfessionalId) {
      return jsonError("Shift has no confirmed professional attached.", 400);
    }

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

      const doctor =
        doctorData && typeof doctorData === "object"
          ? (doctorData as { upi_id?: string; email?: string; name?: string })
          : null;

      const { error: doctorPayoutError } = await auth.service
        .from("doctor_payouts")
        .insert({
          doctor_id: confirmedDoctorId,
          shift_id: shiftData.id,
          amount: shiftData.pay,
          upi_id: doctor?.upi_id ?? "unknown",
          status: "completed",
          paid_at: new Date().toISOString()
        });

      if (doctorPayoutError) {
        console.error("[doctor payout error]", doctorPayoutError);
      }

      console.log(`
      =======================================================
      [EMAIL NOTIFICATION SENT]
      To: ${doctor?.email}
      Subject: Payment Received for Medrova Shift!
      
      Hi Dr. ${doctor?.name},
      
      The clinic has confirmed you successfully completed the shift.
      An amount of ₹${shiftData.pay} has been initiated to your UPI ID: ${doctor?.upi_id}.
      
      Thank you for using Medrova!
      =======================================================
    `);
    }

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

      const prof =
        profData && typeof profData === "object"
          ? (profData as { upi_id?: string; email?: string; name?: string; role?: string })
          : null;

      const { error: professionalPayoutError } = await auth.service
        .from("professional_payouts")
        .insert({
          professional_id: confirmedProfessionalId,
          shift_id: shiftData.id,
          amount: shiftData.pay,
          upi_id: prof?.upi_id ?? "unknown",
          status: "completed",
          paid_at: new Date().toISOString()
        });

      if (professionalPayoutError) {
        console.error("[professional payout error]", professionalPayoutError);
      }

      console.log(`
      =======================================================
      [EMAIL NOTIFICATION SENT]
      To: ${prof?.email}
      Subject: Payment Received for Medrova Shift!
      
      Hi ${prof?.name},
      
      The clinic has confirmed you successfully completed the shift.
      An amount of ₹${shiftData.pay} has been initiated to your UPI ID: ${prof?.upi_id}.
      
      Thank you for using Medrova!
      =======================================================
    `);
    }

    return NextResponse.json({
      status: "completed",
      payoutTriggered: Boolean(confirmedDoctorId || confirmedProfessionalId)
    });
  } catch (error) {
    return validationError(error);
  }
}
