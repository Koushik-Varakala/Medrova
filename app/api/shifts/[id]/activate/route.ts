import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getAuthedServiceClient,
  jsonError,
  parseJsonWithSchema,
  validationError
} from "@/lib/api-utils";

const activateSchema = z.object({
  razorpayPaymentId: z.string().min(1),
  razorpayOrderId: z.string().min(1)
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthedServiceClient();

    if ("error" in auth) {
      return auth.error;
    }

    const values = await parseJsonWithSchema(request, activateSchema);

    // Verify the shift belongs to this clinic
    const { data: clinicData } = await auth.service
      .from("clinics")
      .select("id")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (!clinicData) {
      return jsonError("Clinic profile not found.", 404);
    }

    const { data: shift, error: shiftError } = await auth.service
      .from("shifts")
      .select("id, clinic_id, status")
      .eq("id", params.id)
      .eq("clinic_id", (clinicData as { id: string }).id)
      .maybeSingle();

    if (shiftError || !shift) {
      return jsonError("Shift not found.", 404);
    }

    // Update shift to active
    const { error: updateError } = await auth.service
      .from("shifts")
      .update({ status: "active" })
      .eq("id", params.id);

    if (updateError) {
      return jsonError(updateError.message, 500);
    }

    // Update payment record with Razorpay IDs
    await auth.service
      .from("clinic_payments")
      .update({
        status: "paid",
        razorpay_id: values.razorpayPaymentId
      })
      .eq("shift_id", params.id);

    return NextResponse.json({ success: true, shiftId: params.id });
  } catch (error) {
    return validationError(error);
  }
}
