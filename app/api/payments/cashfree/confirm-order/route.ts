import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getAuthedServiceClient,
  jsonError,
  parseJsonWithSchema,
  validationError
} from "@/lib/api-utils";
import { createCashfreeOrder, getCashfreePaymentSession } from "@/lib/cashfree";

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

    // ── Gate 3: Application exists and belongs to this shift ─
    // Try the specified sourceTable first, then fall back to the other one
    const otherTable = values.sourceTable === "applications"
      ? "professional_applications"
      : "applications";

    let appData: { id: string; shift_id: string; status: string } | null = null;

    const { data: primaryApp } = await auth.service
      .from(values.sourceTable)
      .select("id, shift_id, status")
      .eq("id", values.applicationId)
      .eq("shift_id", values.shiftId)
      .maybeSingle();

    if (primaryApp) {
      appData = primaryApp as { id: string; shift_id: string; status: string };
    } else {
      // Fallback: check the other table
      const { data: fallbackApp } = await auth.service
        .from(otherTable)
        .select("id, shift_id, status")
        .eq("id", values.applicationId)
        .eq("shift_id", values.shiftId)
        .maybeSingle();
      if (fallbackApp) {
        appData = fallbackApp as { id: string; shift_id: string; status: string };
      }
    }

    if (!appData) {
      return jsonError("Application not found for this shift.", 404);
    }

    if (appData.status !== "applied") {
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

    // ── Create Cashfree order (or reuse existing if retrying) ─
    let order: { paymentSessionId: string; orderId: string };

    try {
      order = await createCashfreeOrder({
        orderId: cashfreeOrderId,
        orderAmount: totalAmount,
        customerEmail: auth.user.email ?? "noreply@medrova.in",
        customerPhone: clinic.contact_phone ?? "9999999999",
        customerId: clinic.id,
        returnUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard/clinic/shifts?payment=done&shift=${shift.id}`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);

      // Cashfree 409: order already exists — fetch the existing session instead
      if (msg.includes("409") || msg.includes("order_already_exists")) {
        try {
          order = await getCashfreePaymentSession(cashfreeOrderId);
        } catch (fetchErr) {
          const fetchMsg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
          // Edge case: already paid — tell the frontend to proceed to confirm
          if (fetchMsg === "ALREADY_PAID") {
            return NextResponse.json({
              alreadyPaid: true,
              orderId: cashfreeOrderId,
              message: "Payment already completed. Proceeding to confirm.",
            });
          }
          throw fetchErr;
        }
      } else {
        throw err;
      }
    }

    // ── Record pending payment in DB ───────────────────────
    // Only upsert if no existing payment record — if one exists we already
    // have it from Gate 4 and just need the session to reopen the modal.
    if (!existingPayment) {
      const { error: paymentError } = await auth.service
        .from("clinic_payments")
        .insert({
          clinic_id: clinic.id,
          shift_id: shift.id,
          amount: totalAmount,
          razorpay_id: order.orderId,
          status: "pending"
        });

      if (paymentError) {
        return jsonError(paymentError.message, 500);
      }
    } else {
      // Update the order ID in case it changed (e.g. order expired and was recreated)
      await auth.service
        .from("clinic_payments")
        .update({ razorpay_id: order.orderId, amount: totalAmount })
        .eq("shift_id", shift.id);
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
