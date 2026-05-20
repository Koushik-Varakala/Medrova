import { NextResponse } from "next/server";
import { getAuthedServiceClient, jsonError, validationError } from "@/lib/api-utils";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const shiftId = params.id;
    if (!shiftId) {
      return jsonError("Missing shift ID", 400);
    }

    // 1. Authenticate Request using secure server-side cookies
    const auth = await getAuthedServiceClient();
    if ("error" in auth) return auth.error;

    const { service, user } = auth;

    // 2. Fetch Shift & Clinic verification
    const { data: shift, error: shiftError } = await service
      .from("shifts")
      .select("id, status, clinic_id, date, start_time")
      .eq("id", shiftId)
      .single();

    if (shiftError || !shift) {
      return jsonError("Shift not found", 404);
    }

    // Verify Clinic Ownership
    const { data: clinic } = await service
      .from("clinics")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!clinic || clinic.id !== shift.clinic_id) {
      return jsonError("Unauthorized to cancel this shift", 403);
    }

    if (
      shift.status === "completed" ||
      shift.status === "cancelled" ||
      shift.status === "cancelled_with_penalty" ||
      shift.status === "cancelled_full_refund"
    ) {
      return jsonError("Shift cannot be cancelled in its current state.", 400);
    }

    // ── Block cancellation after confirmation ───────────────
    // Once a professional has been confirmed (clinic paid, professional notified),
    // the shift cannot be cancelled. Contact support if there is an emergency.
    if (shift.status === "confirmed") {
      return jsonError(
        "This shift cannot be cancelled because a professional has already been confirmed. Please contact the professional directly to reschedule.",
        403
      );
    }

    // Only active shifts can be cancelled freely
    const finalStatus = "cancelled";

    // 4. Update Shift Status
    const { error: updateError } = await service
      .from("shifts")
      .update({ status: finalStatus })
      .eq("id", shiftId);

    if (updateError) throw updateError;

    // 5. Reject any pending or confirmed applications in both legacy and modern tables
    await service
      .from("applications")
      .update({ status: "rejected" })
      .eq("shift_id", shiftId)
      .in("status", ["applied", "confirmed"]);

    await service
      .from("professional_applications")
      .update({ status: "rejected" })
      .eq("shift_id", shiftId)
      .in("status", ["applied", "confirmed"]);

    return NextResponse.json({
      success: true,
      status: finalStatus,
      message: "Shift cancelled successfully.",
    });
  } catch (error: any) {
    return validationError(error);
  }
}
