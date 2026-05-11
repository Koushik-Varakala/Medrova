import { NextResponse } from "next/server";
import { z } from "zod";
import {
  type ClinicLookupRow,
  getAuthedServiceClient,
  jsonError,
  parseJsonWithSchema,
  validationError
} from "@/lib/api-utils";
import { createSupabaseServiceClient } from "@/lib/supabase-server";

const createShiftSchema = z.object({
  specialty: z.string().min(1),
  date: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  pay: z.coerce.number().int().positive(),
  area: z.string().min(1),
  notes: z.string().optional(),
  isUrgent: z.boolean().default(false)
});

export async function GET(request: Request) {
  const service = createSupabaseServiceClient();

  if (!service) {
    return jsonError("Supabase service role is not configured.", 500);
  }

  const url = new URL(request.url);
  const specialty = url.searchParams.get("specialty");
  const area = url.searchParams.get("area");
  const date = url.searchParams.get("date");

  let query = service
    .from("shifts")
    .select("*, clinic:clinics(*)")
    .order("date", { ascending: true });

  if (specialty) {
    query = query.eq("specialty", specialty);
  }

  if (area) {
    query = query.eq("area", area);
  }

  if (date) {
    query = query.eq("date", date);
  }

  const { data, error } = await query;

  if (error) {
    return jsonError(error.message, 500);
  }

  return NextResponse.json({ shifts: data ?? [] });
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthedServiceClient();

    if ("error" in auth) {
      return auth.error;
    }

    const values = await parseJsonWithSchema(request, createShiftSchema);
    const { data: clinicData, error: clinicError } = await auth.service
      .from("clinics")
      .select("id, verification_status")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (clinicError) {
      return jsonError("Unable to load clinic profile.", 500);
    }

    if (!clinicData) {
      return jsonError(
        "Clinic onboarding not completed. Complete clinic onboarding before posting shifts.",
        404
      );
    }

    const clinic = clinicData as ClinicLookupRow;

    if (clinic.verification_status !== "verified") {
      return jsonError("Clinic verification is required before posting shifts.", 403);
    }

    const { data, error } = await auth.service
      .from("shifts")
      .insert({
        clinic_id: clinic.id,
        specialty: values.specialty,
        date: values.date,
        start_time: values.startTime,
        end_time: values.endTime,
        pay: values.pay,
        area: values.area,
        notes: values.notes,
        is_urgent: values.isUrgent,
        status: "pending_payment"
      })
      .select("id")
      .single();

    if (error || !data) {
      return jsonError(error?.message ?? "Unable to create shift.", 500);
    }

    const row = data as { id: string };
    return NextResponse.json({ id: row.id, status: "pending_payment" }, { status: 201 });
  } catch (error) {
    return validationError(error);
  }
}
