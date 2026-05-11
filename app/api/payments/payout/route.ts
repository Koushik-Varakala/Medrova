import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getAuthedServiceClient,
  jsonError,
  parseJsonWithSchema,
  validationError
} from "@/lib/api-utils";

const payoutSchema = z.object({
  shiftId: z.string().min(1)
});

interface CompletedShiftRow {
  id: string;
  clinic_id: string;
  pay: number;
  status: string;
  confirmed_doctor_id: string | null;
}

interface DoctorPayoutLookupRow {
  id: string;
  upi_id: string;
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthedServiceClient();

    if ("error" in auth) {
      return auth.error;
    }

    const values = await parseJsonWithSchema(request, payoutSchema);
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
      .select("id, clinic_id, pay, status, confirmed_doctor_id")
      .eq("id", values.shiftId)
      .eq("clinic_id", clinic.id)
      .single();

    if (shiftError || !shiftData) {
      return jsonError(shiftError?.message ?? "Shift not found.", 404);
    }

    const shift = shiftData as CompletedShiftRow;

    if (shift.status !== "completed" || !shift.confirmed_doctor_id) {
      return jsonError("Only completed confirmed shifts can be paid out.", 409);
    }

    const { data: doctorData, error: doctorError } = await auth.service
      .from("doctors")
      .select("id, upi_id")
      .eq("id", shift.confirmed_doctor_id)
      .single();

    if (doctorError || !doctorData) {
      return jsonError(doctorError?.message ?? "Doctor not found.", 404);
    }

    const doctor = doctorData as DoctorPayoutLookupRow;
    const doctorAmount = Math.floor(shift.pay * 0.9);
    const platformFee = shift.pay - doctorAmount;

    const { data: payoutData, error: payoutError } = await auth.service
      .from("doctor_payouts")
      .upsert({
        doctor_id: doctor.id,
        shift_id: shift.id,
        amount: doctorAmount,
        upi_id: doctor.upi_id,
        status: "completed",
        paid_at: new Date().toISOString()
      })
      .select("id")
      .single();

    if (payoutError || !payoutData) {
      return jsonError(payoutError?.message ?? "Unable to create payout.", 500);
    }

    await auth.service
      .from("applications")
      .update({ status: "completed" })
      .eq("shift_id", shift.id)
      .eq("doctor_id", doctor.id);

    return NextResponse.json({
      payout: payoutData,
      doctorAmount,
      platformFee,
      note: "Razorpay Route transfer should be configured with the production Route account before live payouts."
    });
  } catch (error) {
    return validationError(error);
  }
}
