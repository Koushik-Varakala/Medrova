import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getAuthedServiceClient,
  jsonError,
  parseJsonWithSchema,
  validationError
} from "@/lib/api-utils";
import { createCashfreeOrder } from "@/lib/cashfree";

const confirmOrderSchema = z.object({
  shiftId: z.string().uuid(),
  applicationId: z.string().uuid(),
  sourceTable: z.enum(["applications", "professional_applications"])
});

interface ShiftRow {
  id: string;
  clinic_id: string;
  pay: number;
  status: string;
}

/**
 * POST /api/payments/cashfree/confirm-order
 *
 * Creates a Cashfree payment order when a clinic wants to confirm a professional.
 * Payment at this stage = platform fee (20%) + professional's pay = total the clinic pays.
 * After successful payment, the client calls /api/shifts/[id]/confirm with the orderId.
 */
export async function POST(request: Request) {
  try {
    const auth = await getAuthedServiceClient();
    if ("error" in auth) return auth.error;

    const values = await parseJsonWithSchema(request, confirmOrderSchema);

    // ── Gate 1: Verify clinic session ──────────────────────
    const { data: clinicData, error: clinicError } = await auth.service
      .from("clinics")
      .select("id, contact_phone")
      .eq("user_id", auth.user.id)
      .single();

    if (clinicError || !clinicData) {
      return jsonError("Clinic profile not found.", 404);
    }

    const clinic = clinicData as { id: string; contact_phone?: string };

    // ── Gate 2: Clinic owns this shift, shift is active ────
    const { data: shiftData, error: shiftError } = await auth.service
      .from("shifts")
      .select("id, clinic_id, pay, status")
      .eq("id", values.shiftId)
      .eq("clinic_id", clinic.id)
      .single();

    if (shiftError || !shiftData) {
      return jsonError("Shift not found or you do not own this shift.", 404);
    }

    const shift = shiftData as ShiftRow;

    if (shift.status !== "active") {
      return jsonError(
        shift.status === "confirmed"
          ? "This shift has already been confirmed."
          : "This shift is not available for confirmation.",
        409
      );
    }

    // ── Gate 3: Application exists and belongs to this shift
    const { data: appData, error: appError } = await auth.service
      .from(values.sourceTable)
      .select("id, shift_id, status")
      .eq("id", values.applicationId)
      .eq("shift_id", values.shiftId)
      .single();

    if (appError || !appData) {
      return jsonError("Application not found for this shift.", 404);
    }

    const app = appData as { id: string; shift_id: string; status: string };

    if (app.status !== "applied") {
      return jsonError("This application is no longer pending.", 409);
    }

    // ── Gate 4: Check no payment already exists ────────────
    const { data: existingPayment } = await auth.service
      .from("clinic_payments")
      .select("id, status")
      .eq("shift_id", values.shiftId)
      .maybeSingle();

    if (existingPayment && (existingPayment as { status: string }).status === "completed") {
      return jsonError("Payment already completed for this shift.", 409);
    }

    // ── Compute amount server-side (never from client) ─────
    const PLATFORM_FEE_PERCENTAGE = 0.20;
    const platformFee = Math.round(shift.pay * PLATFORM_FEE_PERCENTAGE);
    const totalAmount = shift.pay + platformFee;

    // Deterministic order ID: prevents duplicate Cashfree orders for same shift+application
    const cashfreeOrderId = `medrova_conf_${values.shiftId.replace(/-/g, "").slice(0, 20)}_${values.applicationId.replace(/-/g, "").slice(0, 8)}`;

    const order = await createCashfreeOrder({
      orderId: cashfreeOrderId,
      orderAmount: totalAmount,
      customerEmail: auth.user.email ?? "noreply@medrova.in",
      customerPhone: clinic.contact_phone ?? "9999999999",
      customerId: clinic.id,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://medrova.vercel.app"}/dashboard/clinic/shifts?payment=done&shift=${shift.id}`,
    });

    // ── Record pending payment in DB ───────────────────────
    const { error: paymentError } = await auth.service
      .from("clinic_payments")
      .upsert({
        clinic_id: clinic.id,
        shift_id: shift.id,
        amount: totalAmount,
        razorpay_id: order.orderId,
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
    console.error("[cashfree/confirm-order] Unhandled error:", message);
    return validationError(error);
  }
}
