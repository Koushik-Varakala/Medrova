/**
 * POST /api/payments/cashfree/webhook
 *
 * Security model:
 * 1. HMAC-SHA256 signature verification (timing-safe) — rejects forged requests.
 * 2. Timestamp check — rejects replayed webhooks older than 5 minutes.
 * 3. Idempotency check — skips already-processed payments (prevents double-activation).
 * 4. Status gate — only processes PAYMENT_SUCCESS events.
 * 5. Uses service-role Supabase client (bypasses RLS) — only accessible server-side.
 *
 * This is the authoritative source of truth for payment confirmation.
 * Client-side callbacks are a UX convenience only — this webhook is what
 * actually activates the shift and sends the confirmation email.
 */

import { NextResponse } from "next/server";
import { jsonError, validationError } from "@/lib/api-utils";
import { verifyCashfreeWebhook, getCashfreeOrderStatus } from "@/lib/cashfree";
import { createSupabaseServiceClient } from "@/lib/supabase-server";
import { sendEmail, shiftLiveEmailHtml } from "@/lib/email";

// Cashfree sends these event types
type CashfreeEventType =
  | "PAYMENT_SUCCESS_WEBHOOK"
  | "PAYMENT_FAILED_WEBHOOK"
  | "PAYMENT_USER_DROPPED_WEBHOOK"
  | string;

interface CashfreeWebhookBody {
  type: CashfreeEventType;
  data?: {
    order?: {
      order_id?: string;
      order_amount?: number;
    };
    payment?: {
      cf_payment_id?: string;
      payment_status?: string;
    };
  };
}

export async function POST(request: Request) {
  try {
    // ── Security Gate 1: Read raw body before any parsing ───
    const rawBody = await request.text();
    const signature = request.headers.get("x-webhook-signature");
    const timestamp = request.headers.get("x-webhook-timestamp");

    if (!signature || !timestamp) {
      return jsonError("Missing webhook signature or timestamp.", 400);
    }

    // ── Security Gate 2: Replay attack prevention ───────────
    // Reject webhooks older than 5 minutes
    const webhookAge = Math.abs(Date.now() / 1000 - Number(timestamp));
    if (webhookAge > 300) {
      return jsonError("Webhook timestamp too old — possible replay attack.", 400);
    }

    // ── Security Gate 3: HMAC-SHA256 signature verification ─
    // Timing-safe comparison in lib/cashfree.ts
    if (!verifyCashfreeWebhook(rawBody, signature, timestamp)) {
      return jsonError("Invalid webhook signature.", 401);
    }

    const event = JSON.parse(rawBody) as CashfreeWebhookBody;

    // ── Only process successful payments ────────────────────
    if (event.type !== "PAYMENT_SUCCESS_WEBHOOK") {
      return NextResponse.json({ received: true, ignored: true, event: event.type });
    }

    const cashfreeOrderId = event.data?.order?.order_id;
    const cfPaymentId = event.data?.payment?.cf_payment_id;

    if (!cashfreeOrderId || !cfPaymentId) {
      return jsonError("Webhook missing order or payment ID.", 400);
    }

    // ── Security Gate 4: Verify payment with Cashfree API ───
    // Don't trust the webhook body alone — confirm with Cashfree servers
    const orderStatus = await getCashfreeOrderStatus(cashfreeOrderId);
    if (orderStatus.status !== "PAID") {
      return jsonError(`Order status is ${orderStatus.status}, not PAID.`, 409);
    }

    const service = createSupabaseServiceClient();
    if (!service) {
      return jsonError("Supabase service role is not configured.", 500);
    }

    // ── Find the payment record using the Cashfree order ID ─
    const { data: paymentRow, error: paymentRowError } = await service
      .from("clinic_payments")
      .select("id, shift_id, status")
      .eq("razorpay_id", cashfreeOrderId)  // Column reused for cashfree order ID
      .single();

    if (paymentRowError || !paymentRow) {
      return jsonError("Payment record not found.", 404);
    }

    const payment = paymentRow as { id: string; shift_id: string; status: string };

    // ── Security Gate 5: Idempotency check ──────────────────
    // If already activated (e.g., client also called activate), skip gracefully
    if (payment.status === "paid" || payment.status === "completed") {
      return NextResponse.json({ received: true, skipped: "already_processed" });
    }

    // ── Activate the shift ──────────────────────────────────
    const { error: shiftError } = await service
      .from("shifts")
      .update({
        status: "active",
        razorpay_payment_id: String(cfPaymentId), // Storing cashfree payment ID here
      })
      .eq("id", payment.shift_id)
      .eq("status", "pending_payment"); // Double-check it's still pending

    if (shiftError) {
      return jsonError(shiftError.message, 500);
    }

    // ── Update payment record as paid ───────────────────────
    const { error: paymentUpdateError } = await service
      .from("clinic_payments")
      .update({
        status: "paid",
        razorpay_id: String(cfPaymentId),
      })
      .eq("id", payment.id);

    if (paymentUpdateError) {
      return jsonError(paymentUpdateError.message, 500);
    }

    // ── Send "Shift is Live" email to the clinic ────────────
    try {
      const { data: shiftRow } = await service
        .from("shifts")
        .select("specialty, date, start_time, end_time, pay, location_display_name, area, clinic:clinics(name, email)")
        .eq("id", payment.shift_id)
        .single();

      const shift = shiftRow as {
        specialty: string;
        date: string;
        start_time: string;
        end_time: string;
        pay: number;
        location_display_name?: string;
        area?: string;
        clinic: { name: string; email: string } | null;
      } | null;

      if (shift?.clinic?.email) {
        await sendEmail({
          to: shift.clinic.email,
          subject: "Your Medrova shift is live! 🚀",
          html: shiftLiveEmailHtml({
            clinicName: shift.clinic.name,
            specialty: shift.specialty,
            date: new Date(shift.date).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
            time: `${shift.start_time} – ${shift.end_time}`,
            location: shift.location_display_name ?? shift.area ?? "Not specified",
            pay: shift.pay,
          }),
        });
      }
    } catch (emailErr) {
      // Never fail the webhook response because of an email error
      console.error("[cashfree/webhook] Email send failed:", emailErr);
    }

    return NextResponse.json({ received: true, shiftActivated: payment.shift_id });
  } catch (error) {
    return validationError(error);
  }
}
