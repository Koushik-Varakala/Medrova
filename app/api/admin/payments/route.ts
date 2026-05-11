import { NextResponse } from "next/server";
import { getAdminServiceClient, jsonError, validationError } from "@/lib/api-utils";

export async function GET() {
  try {
    const auth = await getAdminServiceClient();

    if ("error" in auth) {
      return auth.error;
    }

    const [{ data: clinicPayments, error: clinicError }, { data: doctorPayouts, error: doctorError }] =
      await Promise.all([
        auth.service.from("clinic_payments").select("*").order("created_at", { ascending: false }),
        auth.service.from("doctor_payouts").select("*").order("created_at", { ascending: false })
      ]);

    if (clinicError) {
      return jsonError(clinicError.message, 500);
    }

    if (doctorError) {
      return jsonError(doctorError.message, 500);
    }

    const totalRevenue = (clinicPayments ?? []).reduce(
      (total, payment: { amount: number }) => total + payment.amount,
      0
    );
    const totalPayouts = (doctorPayouts ?? []).reduce(
      (total, payout: { amount: number }) => total + payout.amount,
      0
    );

    return NextResponse.json({
      clinicPayments: clinicPayments ?? [],
      doctorPayouts: doctorPayouts ?? [],
      summary: {
        totalRevenue,
        totalPayouts,
        platformFeesRetained: totalRevenue - totalPayouts
      }
    });
  } catch (error) {
    return validationError(error);
  }
}
