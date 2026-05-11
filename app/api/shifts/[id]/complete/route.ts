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
    const { data: shiftData, error: shiftError } = await auth.service
      .from("shifts")
      .update({ status: "completed" })
      .eq("id", params.id)
      .eq("clinic_id", clinic.id)
      .eq("status", "confirmed")
      .select("id, pay, confirmed_doctor_id")
      .single();

    if (shiftError || !shiftData) {
      return jsonError(shiftError?.message ?? "Confirmed shift not found.", 404);
    }

    const shift = shiftData as { id: string, pay: number, confirmed_doctor_id: string };

    // Update Application
    await auth.service
      .from("applications")
      .update({ status: "completed" })
      .eq("shift_id", shift.id)
      .eq("doctor_id", shift.confirmed_doctor_id);

    // Get doctor to find UPI ID for payment
    const { data: doctorData } = await auth.service
      .from("doctors")
      .select("upi_id, email, name")
      .eq("id", shift.confirmed_doctor_id)
      .single();

    const doctor = doctorData as { upi_id: string; email: string; name: string } | null;

    // Create Doctor Payment
    const { error: paymentError } = await auth.service
      .from("doctor_payouts")
      .insert({
        doctor_id: shift.confirmed_doctor_id,
        shift_id: shift.id,
        amount: shift.pay,
        upi_id: doctor?.upi_id ?? "unknown",
        status: "completed", // Simulating instant payout for now
        paid_at: new Date().toISOString()
      });

    if (paymentError) {
      console.error("[payout error]", paymentError);
    }

    // Simulate Email Notification to Doctor
    console.log(`
      =======================================================
      [EMAIL NOTIFICATION SENT]
      To: ${doctor?.email}
      Subject: Payment Received for Medrova Shift!
      
      Hi Dr. ${doctor?.name},
      
      The clinic has confirmed you successfully completed the shift.
      An amount of ₹${shift.pay} has been initiated to your UPI ID: ${doctor?.upi_id}.
      
      Thank you for using Medrova!
      =======================================================
    `);

    return NextResponse.json({
      status: "completed",
      payoutTriggered: true
    });
  } catch (error) {
    return validationError(error);
  }
}
