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
      return jsonError("Shift cannot be cancelled in its current state", 400);
    }

    // 3. Calculate 12-Hour Rule
    // Shift start time parsing
    const shiftDateTimeString = `${shift.date}T${shift.start_time}:00`;
    const shiftStart = new Date(shiftDateTimeString);
    const now = new Date();

    const hoursUntilStart = (shiftStart.getTime() - now.getTime()) / (1000 * 60 * 60);

    let finalStatus = "cancelled_full_refund";

    if (shift.status === "confirmed" && hoursUntilStart < 12 && hoursUntilStart > 0) {
      finalStatus = "cancelled_with_penalty";
    } else if (shift.status === "active" || shift.status === "pending_payment") {
      finalStatus = "cancelled";
    }

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
      message:
        finalStatus === "cancelled_with_penalty"
          ? "Shift cancelled. 30% penalty applied due to < 12hr notice."
          : "Shift cancelled successfully. Full refund eligible.",
    });
  } catch (error: any) {
    return validationError(error);
  }
}
