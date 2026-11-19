import { NextResponse } from "next/server";
import { getAdminServiceClient, jsonError, parseJsonWithSchema } from "@/lib/api-utils";
import { z } from "zod";

interface RouteContext {
  params: {
    id: string;
  };
}

const approvePayloadSchema = z.object({
  specialty: z.string().optional(),
  area: z.string().optional(),
  pay: z.number().optional(),
  date: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  notes: z.string().optional(),
  hospitalName: z.string().optional()
});

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const auth = await getAdminServiceClient();

    if ("error" in auth) {
      return auth.error;
    }

    type ApprovePayload = z.infer<typeof approvePayloadSchema>;
    const payload: ApprovePayload = await parseJsonWithSchema(request, approvePayloadSchema).catch(() => ({} as ApprovePayload));

    // Fetch shift
    const { data: shift, error: fetchError } = await auth.service
      .from("shifts")
      .select("id, clinic_id, magic_token, status")
      .eq("id", params.id)
      .single();

    if (fetchError || !shift) {
      return jsonError("Shift not found.", 404);
    }

    // Prepare update object
    const updateData: Record<string, unknown> = {
      status: "active"
    };

    if (payload.specialty) updateData.specialty = payload.specialty;
    if (payload.area) updateData.area = payload.area;
    if (payload.pay) updateData.pay = payload.pay;
    if (payload.date) updateData.date = payload.date;
    if (payload.startTime) updateData.start_time = payload.startTime;
    if (payload.endTime) updateData.end_time = payload.endTime;
    if (payload.notes) updateData.notes = payload.notes;

    const { data: updatedShift, error: updateError } = await auth.service
      .from("shifts")
      .update(updateData)
      .eq("id", params.id)
      .select(`
        id,
        specialty,
        date,
        start_time,
        end_time,
        pay,
        area,
        status,
        magic_token,
        magic_contact_phone,
        magic_contact_name,
        clinic:clinics(id, name, contact_phone, contact_person, credits)
      `)
      .single();

    if (updateError || !updatedShift) {
      return jsonError(updateError?.message ?? "Failed to approve shift.", 500);
    }

    // Also ensure shadow clinic is marked verified
    if (shift.clinic_id) {
      await auth.service
        .from("clinics")
        .update({ verification_status: "verified" })
        .eq("id", shift.clinic_id);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://medrova.in";
    const magicUrl = `${appUrl}/s/${updatedShift.magic_token}`;

    return NextResponse.json({
      success: true,
      message: "Quick post approved and published successfully!",
      magicUrl,
      shift: updatedShift
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return jsonError(message, 500);
  }
}
