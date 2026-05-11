import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getAuthedServiceClient,
  jsonError,
  parseJsonWithSchema,
  validationError
} from "@/lib/api-utils";
import { createSupabaseServiceClient } from "@/lib/supabase-server";

interface ShiftRouteContext {
  params: {
    id: string;
  };
}

const updateShiftSchema = z.object({
  specialty: z.string().min(1).optional(),
  date: z.string().min(1).optional(),
  startTime: z.string().min(1).optional(),
  endTime: z.string().min(1).optional(),
  pay: z.coerce.number().int().positive().optional(),
  area: z.string().min(1).optional(),
  notes: z.string().optional(),
  isUrgent: z.boolean().optional(),
  status: z
    .enum(["pending_payment", "active", "confirmed", "completed", "cancelled"])
    .optional()
});

export async function GET(_request: Request, { params }: ShiftRouteContext) {
  const service = createSupabaseServiceClient();

  if (!service) {
    return jsonError("Supabase service role is not configured.", 500);
  }

  const { data, error } = await service
    .from("shifts")
    .select("*, clinic:clinics(*)")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return jsonError(error?.message ?? "Shift not found.", 404);
  }

  return NextResponse.json({ shift: data });
}

export async function PATCH(request: Request, { params }: ShiftRouteContext) {
  try {
    const auth = await getAuthedServiceClient();

    if ("error" in auth) {
      return auth.error;
    }

    const values = await parseJsonWithSchema(request, updateShiftSchema);
    const updatePayload: Record<string, string | number | boolean | undefined> = {
      specialty: values.specialty,
      date: values.date,
      start_time: values.startTime,
      end_time: values.endTime,
      pay: values.pay,
      area: values.area,
      notes: values.notes,
      is_urgent: values.isUrgent,
      status: values.status
    };

    const { data: clinicData, error: clinicError } = await auth.service
      .from("clinics")
      .select("id")
      .eq("user_id", auth.user.id)
      .single();

    if (clinicError || !clinicData) {
      return jsonError(clinicError?.message ?? "Clinic profile not found.", 404);
    }

    const clinic = clinicData as { id: string };
    const { data, error } = await auth.service
      .from("shifts")
      .update(updatePayload)
      .eq("id", params.id)
      .eq("clinic_id", clinic.id)
      .select("*")
      .single();

    if (error || !data) {
      return jsonError(error?.message ?? "Unable to update shift.", 500);
    }

    return NextResponse.json({ shift: data });
  } catch (error) {
    return validationError(error);
  }
}
