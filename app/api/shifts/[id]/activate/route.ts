import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getAuthedServiceClient,
  jsonError,
  parseJsonWithSchema,
  validationError
} from "@/lib/api-utils";
import { sendEmail, shiftLiveEmailHtml } from "@/lib/email";

/**
 * POST /api/shifts/[id]/activate
 *
 * Called by the client-side checkout as a UX convenience after payment.
 * The Cashfree webhook is the authoritative activator — this route is
 * a secondary/redundant path that handles the case where the webhook
 * hasn't fired yet but the user's browser reports success.
 *
 * Security gates:
 * 1. Authenticated clinic session (JWT verified server-side)
 * 2. Clinic owns the shift (ownership check)
 * 3. Shift must be pending_payment — idempotent if already active
 */
const activateSchema = z.object({
  paymentId: z.string().min(1),   // Cashfree payment ID or order ID
  orderId: z.string().min(1),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthedServiceClient();
    if ("error" in auth) return auth.error;

    const values = await parseJsonWithSchema(request, activateSchema);

    // ── Security Gate 1: Verify clinic session ──────────────
    const { data: clinicData } = await auth.service
      .from("clinics")
      .select("id, name, email")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (!clinicData) {
      return jsonError("Clinic profile not found.", 404);
    }

    const clinic = clinicData as { id: string; name: string; email?: string };

    // ── Security Gate 2: Clinic owns this shift ─────────────
    const { data: shift, error: shiftFetchError } = await auth.service
      .from("shifts")
      .select("id, clinic_id, status, specialty, date, start_time, end_time, pay, location_display_name, area")
      .eq("id", params.id)
      .eq("clinic_id", clinic.id)  // ← ownership guard
      .maybeSingle();

    if (shiftFetchError || !shift) {
      return jsonError("Shift not found.", 404);
    }

    const shiftRow = shift as {
      id: string;
      clinic_id: string;
      status: string;
      specialty: string;
      date: string;
      start_time: string;
      end_time: string;
      pay: number;
      location_display_name?: string;
      area?: string;
    };

    // ── Security Gate 3: Idempotency check ──────────────────
    // If the webhook already activated the shift, return success quietly
    if (shiftRow.status === "active") {
      return NextResponse.json({ success: true, shiftId: params.id, source: "already_active" });
    }

    if (shiftRow.status !== "pending_payment") {
      return jsonError(`Shift cannot be activated — current status: ${shiftRow.status}`, 409);
    }

    // ── Activate the shift ──────────────────────────────────
    const { error: updateError } = await auth.service
      .from("shifts")
      .update({
        status: "active",
        razorpay_payment_id: values.paymentId,
      })
      .eq("id", params.id)
      .eq("status", "pending_payment"); // Prevent race condition with webhook

    if (updateError) {
      return jsonError(updateError.message, 500);
    }

    // ── Update payment record ───────────────────────────────
    await auth.service
      .from("clinic_payments")
      .update({
        status: "paid",
        razorpay_id: values.paymentId,
      })
      .eq("shift_id", params.id);

    // ── Send "Shift is Live" email (only if webhook hasn't already) ─
    const clinicEmail = clinic.email ?? auth.user.email;
    if (clinicEmail) {
      await sendEmail({
        to: clinicEmail,
        subject: "Your Medrova shift is live! 🚀",
        html: shiftLiveEmailHtml({
          clinicName: clinic.name,
          specialty: shiftRow.specialty,
          date: new Date(shiftRow.date).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
          time: `${shiftRow.start_time} – ${shiftRow.end_time}`,
          location: shiftRow.location_display_name ?? shiftRow.area ?? "Not specified",
          pay: shiftRow.pay,
        }),
      });
    }

    return NextResponse.json({ success: true, shiftId: params.id, source: "client_activate" });
  } catch (error) {
    return validationError(error);
  }
}
