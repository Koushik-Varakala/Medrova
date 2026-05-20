import { NextResponse } from "next/server";
import { getAdminServiceClient, validationError, parseJsonWithSchema, jsonError } from "@/lib/api-utils";
import { z } from "zod";

export async function GET() {
  try {
    const auth = await getAdminServiceClient();

    if ("error" in auth) {
      return auth.error;
    }

    // Fetch from the unified professional_payouts table with complete joins
    const { data: professionalPayouts, error: payoutsError } = await auth.service
      .from("professional_payouts")
      .select(`
        id,
        professional_id,
        shift_id,
        amount,
        upi_id,
        status,
        paid_at,
        created_at,
        professional:healthcare_professionals(id, name, email, phone, role, specialty),
        shift:shifts(
          id,
          specialty,
          date,
          start_time,
          end_time,
          pay,
          area,
          clinic:clinics(id, name, contact_person, contact_phone, phone)
        )
      `)
      .order("created_at", { ascending: false });

    const safePayouts = payoutsError ? [] : (professionalPayouts ?? []);

    // Fetch clinic payments with complete joins
    const { data: clinicPayments } = await auth.service
      .from("clinic_payments")
      .select(`
        id,
        clinic_id,
        shift_id,
        amount,
        razorpay_id,
        status,
        created_at,
        clinic:clinics(id, name, contact_person, contact_phone, phone),
        shift:shifts(id, specialty, date, start_time, end_time, pay, area)
      `)
      .order("created_at", { ascending: false });

    // Fetch legacy doctor payouts with complete joins
    const { data: doctorPayouts } = await auth.service
      .from("doctor_payouts")
      .select(`
        id,
        doctor_id,
        shift_id,
        amount,
        upi_id,
        status,
        paid_at,
        created_at,
        doctor:doctors(id, name, email, phone, specialty),
        shift:shifts(
          id,
          specialty,
          date,
          start_time,
          end_time,
          pay,
          area,
          clinic:clinics(id, name, contact_person, contact_phone, phone)
        )
      `)
      .order("created_at", { ascending: false });

    // Revenue = what clinics paid into the platform (completed clinic_payments)
    const totalRevenue = (clinicPayments ?? [])
      .filter((p: { status: string }) => p.status === "completed")
      .reduce(
        (total: number, payment: { amount: number }) => total + (payment.amount ?? 0),
        0
      );

    // Payouts = what professionals were paid out (completed professional_payouts OR doctor_payouts)
    const unifiedPayoutsTotal = safePayouts
      .filter((p: { amount: number; status: string }) => p.status === "completed")
      .reduce((total: number, p: { amount: number }) => total + (p.amount ?? 0), 0);

    const legacyPayoutsTotal = (doctorPayouts ?? [])
      .filter((p: { amount: number; status: string }) => p.status === "completed")
      .reduce(
        (total: number, payout: { amount: number }) => total + (payout.amount ?? 0),
        0
      );

    const totalPayouts = unifiedPayoutsTotal + legacyPayoutsTotal;

    return NextResponse.json({
      clinicPayments: clinicPayments ?? [],
      doctorPayouts: doctorPayouts ?? [],
      professionalPayouts: safePayouts,
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

const updatePayoutSchema = z.object({
  payoutId: z.string().uuid(),
  type: z.enum(["doctor", "professional"]),
  status: z.enum(["completed", "failed", "pending"]),
});

export async function POST(request: Request) {
  try {
    const auth = await getAdminServiceClient();

    if ("error" in auth) {
      return auth.error;
    }

    const { payoutId, type, status } = await parseJsonWithSchema(request, updatePayoutSchema);

    const tableName = type === "doctor" ? "doctor_payouts" : "professional_payouts";
    const paidAt = status === "completed" ? new Date().toISOString() : null;

    const { data, error } = await auth.service
      .from(tableName)
      .update({
        status,
        paid_at: paidAt,
      })
      .eq("id", payoutId)
      .select("id, status, paid_at")
      .single();

    if (error) {
      return jsonError(error.message, 500);
    }

    return NextResponse.json({
      success: true,
      payout: data,
    });
  } catch (error) {
    return validationError(error);
  }
}
