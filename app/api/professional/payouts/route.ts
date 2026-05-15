import { NextResponse } from "next/server";
import { getAuthedServiceClient, jsonError, validationError } from "@/lib/api-utils";
import { mapProfessionalPayoutRow, toDbRecord } from "@/lib/mappers";

export async function GET() {
  try {
    const auth = await getAuthedServiceClient();
    if ("error" in auth) return auth.error;

    // Get the professional ID
    const { data: profRow } = await auth.service
      .from("healthcare_professionals")
      .select("id")
      .eq("user_id", auth.user.id)
      .single();

    if (!profRow) return jsonError("Profile not found", 404);

    // Fetch payouts with joined shift/clinic
    const { data: payouts, error } = await auth.service
      .from("professional_payouts")
      .select(`
        *,
        shift:shifts(*, clinic:clinics(name))
      `)
      .eq("professional_id", profRow.id)
      .order("created_at", { ascending: false });

    if (error) {
      return jsonError(error.message, 500);
    }

    const mapped = (payouts ?? []).map((payout) => mapProfessionalPayoutRow(toDbRecord(payout)));

    return NextResponse.json({ payouts: mapped });
  } catch (error) {
    return validationError(error);
  }
}
