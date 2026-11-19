import { NextResponse } from "next/server";
import { getAdminServiceClient, jsonError } from "@/lib/api-utils";

export async function GET() {
  try {
    const auth = await getAdminServiceClient();

    if ("error" in auth) {
      return auth.error;
    }

    const { data: quickPosts, error } = await auth.service
      .from("shifts")
      .select(`
        id,
        specialty,
        date,
        start_time,
        end_time,
        pay,
        area,
        notes,
        status,
        magic_token,
        magic_contact_phone,
        magic_contact_name,
        is_whatsapp_source,
        raw_whatsapp_text,
        created_at,
        clinic:clinics(
          id,
          name,
          phone,
          contact_person,
          contact_phone,
          credits,
          is_claimed,
          verification_status
        )
      `)
      .not("magic_token", "is", null)
      .order("created_at", { ascending: false });

    if (error) {
      return jsonError(error.message, 500);
    }

    return NextResponse.json({
      success: true,
      quickPosts: quickPosts ?? []
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return jsonError(message, 500);
  }
}
