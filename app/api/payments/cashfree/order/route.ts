import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getAuthedServiceClient,
  jsonError,
  parseJsonWithSchema,
  validationError
} from "@/lib/api-utils";
import { createCashfreeOrder } from "@/lib/cashfree";

const createOrderSchema = z.object({
  shiftId: z.string().uuid()
});

interface ShiftPaymentRow {
  id: string;
  clinic_id: string;
  pay: number;
  status: string;
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthedServiceClient();
    if ("error" in auth) return auth.error;

    const values = await parseJsonWithSchema(request, createOrderSchema);

    // ── Security Gate 1: Verify the clinic session ──────────
    const { data: clinicData, error: clinicError } = await auth.service
      .from("clinics")
      .select("id, email, contact_phone, contact_person")
      .eq("user_id", auth.user.id)
      .single();

    if (clinicError || !clinicData) {
      return jsonError("Clinic profile not found.", 404);
    }

    const clinic = clinicData as {
      id: string;
      email?: string;
      contact_phone?: string;
      contact_person?: string;
    };

    // ── Security Gate 2: Verify clinic owns this shift ──────
    const { data: shiftData, error: shiftError } = await auth.service
      .from("shifts")
      .select("id, clinic_id, pay, status")
      .eq("id", values.shiftId)
      .eq("clinic_id", clinic.id)  // ← ownership check: prevents other clinics from paying
      .single();

    if (shiftError || !shiftData) {
      return jsonError("Shift not found.", 404);
    }

    const shift = shiftData as ShiftPaymentRow;

    // ── Security Gate 3: Status check ───────────────────────
    // Only a shift explicitly waiting for payment can create an order.
    // Prevents double-charging an already-paid shift.
    if (shift.status !== "pending_payment") {
      return jsonError("This shift has already been paid or is not awaiting payment.", 409);
    }

    // ── Security Gate 4: Amount computed server-side ────────
    // The client NEVER sends an amount. We compute it from the DB record.
    const PLATFORM_FEE_PERCENTAGE = 0.20;
    const platformFee = Math.round(shift.pay * PLATFORM_FEE_PERCENTAGE);
    const totalAmount = shift.pay + platformFee;

    // Unique, deterministic order ID per shift (prevents duplicate orders)
    const cashfreeOrderId = `medrova_shift_${shift.id.replace(/-/g, "").slice(0, 28)}`;

    const order = await createCashfreeOrder({
      orderId: cashfreeOrderId,
      orderAmount: totalAmount,
      customerEmail: clinic.email ?? auth.user.email ?? "noreply@medrova.in",
      customerPhone: clinic.contact_phone ?? "9999999999",
      customerId: clinic.id,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://medrova.vercel.app"}/dashboard/clinic?payment=done&shift=${shift.id}`,
    });

    // ── Record pending payment in DB ─────────────────────────
    const { error: paymentError } = await auth.service
      .from("clinic_payments")
      .upsert({
        clinic_id: clinic.id,
        shift_id: shift.id,
        amount: totalAmount,
        razorpay_id: order.orderId,   // Reusing column for cashfree order ID
        status: "pending"
      });

    if (paymentError) {
      return jsonError(paymentError.message, 500);
    }

    return NextResponse.json({
      paymentSessionId: order.paymentSessionId,
      orderId: order.orderId,
      amount: totalAmount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[cashfree/order] Unhandled error:", message);
    return validationError(error);
  }
}
