import { NextResponse } from "next/server";
import { getAuthedServiceClient, jsonError, validationError } from "@/lib/api-utils";
import { mapShiftRow, toDbRecord } from "@/lib/mappers";

export async function GET(request: Request) {
  try {
    const auth = await getAuthedServiceClient();
    if ("error" in auth) return auth.error;

    // Get the professional role
    const { data: profRow } = await auth.service
      .from("healthcare_professionals")
      .select("id, role")
      .eq("user_id", auth.user.id)
      .single();

    if (!profRow) return jsonError("Profile not found", 404);

    const { data: applicationRows, error: applicationError } = await auth.service
      .from("professional_applications")
      .select("shift_id")
      .eq("professional_id", profRow.id)
      .not("shift_id", "is", null);

    if (applicationError) {
      return jsonError("Unable to load existing applications", 500);
    }

    const appliedShiftIds = new Set(
      (applicationRows ?? [])
        .map((row) => (typeof row.shift_id === "string" ? row.shift_id : ""))
        .filter(Boolean)
    );

    const url = new URL(request.url);
    const specialty = url.searchParams.get("specialty");

    let query = auth.service
      .from("shifts")
      .select("*, clinic:clinics(*)")
      .eq("professional_type", profRow.role)
      .eq("status", "active")
      .order("date", { ascending: true });

    if (specialty) {
      query = query.eq("specialty", specialty);
    }

    const { data: shifts, error } = await query;

    if (error) {
      return jsonError(error.message, 500);
    }

    const mapped = (shifts ?? [])
      .filter((shift) => {
        const record = toDbRecord(shift);
        const id = typeof record.id === "string" ? record.id : "";
        return !appliedShiftIds.has(id);
      })
      .map((shift) => mapShiftRow(toDbRecord(shift)));

    return NextResponse.json({ shifts: mapped });
  } catch (error) {
    return validationError(error);
  }
}
