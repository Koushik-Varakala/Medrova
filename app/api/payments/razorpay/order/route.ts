import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getAuthedServiceClient,
  jsonError,
  parseJsonWithSchema,
  validationError
} from "@/lib/api-utils";
import { createRazorpayClient } from "@/lib/razorpay";

const createOrderSchema = z.object({
  shiftId: z.string().min(1)
});

interface ShiftPaymentRow {
  id: string;
  clinic_id: string;
  pay: number;
  status: string;
}

interface RazorpayOrderResult {
  id: string;
  amount: number;
  currency: string;
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthedServiceClient();

    if ("error" in auth) {
      return auth.error;
    }

    const values = await parseJsonWithSchema(request, createOrderSchema);
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
      .select("id, clinic_id, pay, status")
      .eq("id", values.shiftId)
      .eq("clinic_id", clinic.id)
      .single();

    if (shiftError || !shiftData) {
      return jsonError(shiftError?.message ?? "Shift not found.", 404);
    }

    const shift = shiftData as ShiftPaymentRow;

    if (shift.status !== "pending_payment") {
      return jsonError("Only pending payment shifts can create Razorpay orders.", 409);
    }

    const PLATFORM_FEE_PERCENTAGE = 0.10;
    const platformFee = Math.round(shift.pay * PLATFORM_FEE_PERCENTAGE);
    const totalAmountToCharge = shift.pay + platformFee;

    const razorpay = createRazorpayClient();
    let order: RazorpayOrderResult;
    try {

      order = (await razorpay.orders.create({
        amount: totalAmountToCharge * 100,
        currency: "INR",
        receipt: `shift_${shift.id.replace(/-/g, "").slice(0, 34)}`,
        notes: {
          shiftId: shift.id,
          clinicId: clinic.id,
          basePay: shift.pay.toString(),
          platformFee: platformFee.toString()
        }
      })) as RazorpayOrderResult;
    } catch (rzpErr: unknown) {
      const msg = rzpErr instanceof Error ? rzpErr.message : JSON.stringify(rzpErr);
      console.error("[razorpay/order] Razorpay SDK error:", msg);
      return jsonError(`Razorpay error: ${msg}`, 502);
    }

    const { error: paymentError } = await auth.service.from("clinic_payments").upsert({
      clinic_id: clinic.id,
      shift_id: shift.id,
      amount: totalAmountToCharge,
      razorpay_id: order.id,
      status: "pending"
    });

    if (paymentError) {
      return jsonError(paymentError.message, 500);
    }

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    // Surface the real error message for debugging
    const message = error instanceof Error ? error.message : String(error);
    console.error("[razorpay/order] Unhandled error:", message);
    return validationError(error);
  }
}
