import { NextResponse } from "next/server";
import { getAdminServiceClient, validationError } from "@/lib/api-utils";

export async function GET() {
  try {
    const auth = await getAdminServiceClient();

    if ("error" in auth) {
      return auth.error;
    }

    // Try to fetch from the unified professional_payouts table (current schema)
    const { data: professionalPayouts, error: payoutsError } = await auth.service
      .from("professional_payouts")
      .select("amount, status")
      .order("created_at", { ascending: false });

    // Gracefully fall back to zero if the table doesn't exist yet
    const safePayouts = payoutsError ? [] : (professionalPayouts ?? []);

    // Try legacy tables — they may not exist in all environments
    const { data: clinicPayments } = await auth.service
      .from("clinic_payments")
      .select("amount")
      .order("created_at", { ascending: false });

    const { data: doctorPayouts } = await auth.service
      .from("doctor_payouts")
      .select("amount")
      .order("created_at", { ascending: false });

    // Revenue = what clinics paid into the platform (clinic_payments)
    const totalRevenue = (clinicPayments ?? []).reduce(
      (total: number, payment: { amount: number }) => total + (payment.amount ?? 0),
      0
    );

    // Payouts = what professionals were paid out (professional_payouts OR legacy doctor_payouts)
    const unifiedPayoutsTotal = safePayouts
      .filter((p: { amount: number; status: string }) => p.status === "completed")
      .reduce((total: number, p: { amount: number }) => total + (p.amount ?? 0), 0);

    const legacyPayoutsTotal = (doctorPayouts ?? []).reduce(
      (total: number, payout: { amount: number }) => total + (payout.amount ?? 0),
      0
    );

    const totalPayouts = unifiedPayoutsTotal + legacyPayoutsTotal;

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
