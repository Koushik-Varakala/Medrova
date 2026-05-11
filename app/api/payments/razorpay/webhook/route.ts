import { NextResponse } from "next/server";
import { jsonError, validationError } from "@/lib/api-utils";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";
import { createSupabaseServiceClient } from "@/lib/supabase-server";

interface RazorpayWebhookEvent {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        status?: string;
      };
    };
  };
}

interface ClinicPaymentRow {
  id: string;
  shift_id: string;
}

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("x-razorpay-signature");
    const rawBody = await request.text();

    if (!signature) {
      return jsonError("Missing Razorpay signature.", 400);
    }

    if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
      return jsonError("Invalid Razorpay signature.", 400);
    }

    const service = createSupabaseServiceClient();

    if (!service) {
      return jsonError("Supabase service role is not configured.", 500);
    }

    const event = JSON.parse(rawBody) as RazorpayWebhookEvent;
    const payment = event.payload?.payment?.entity;
    const orderId = payment?.order_id;
    const paymentId = payment?.id;

    if (!orderId || !paymentId) {
      return jsonError("Webhook missing payment order information.", 400);
    }

    if (event.event !== "payment.captured" && payment.status !== "captured") {
      return NextResponse.json({ received: true, ignored: true });
    }

    const { data: paymentRowData, error: paymentRowError } = await service
      .from("clinic_payments")
      .select("id, shift_id")
      .eq("razorpay_id", orderId)
      .single();

    if (paymentRowError || !paymentRowData) {
      return jsonError(paymentRowError?.message ?? "Clinic payment record not found.", 404);
    }

    const paymentRow = paymentRowData as ClinicPaymentRow;
    const { error: clinicPaymentError } = await service
      .from("clinic_payments")
      .update({
        status: "completed",
        razorpay_id: paymentId
      })
      .eq("id", paymentRow.id);

    if (clinicPaymentError) {
      return jsonError(clinicPaymentError.message, 500);
    }

    const { error: shiftError } = await service
      .from("shifts")
      .update({
        status: "active",
        razorpay_payment_id: paymentId
      })
      .eq("id", paymentRow.shift_id)
      .eq("status", "pending_payment");

    if (shiftError) {
      return jsonError(shiftError.message, 500);
    }

    return NextResponse.json({ received: true, shiftStatus: "active" });
  } catch (error) {
    return validationError(error);
  }
}
