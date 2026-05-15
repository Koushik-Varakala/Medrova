import { NextResponse } from "next/server";
import { getAdminServiceClient, jsonError, validationError } from "@/lib/api-utils";
import { createClient } from "@supabase/supabase-js";

interface DeleteUserRouteContext {
  params: { id: string };
}

export async function DELETE(
  _request: Request,
  { params }: DeleteUserRouteContext
) {
  try {
    const auth = await getAdminServiceClient();
    if ("error" in auth) return auth.error;

    // Find which table the professional is in
    const { data: profRow } = await auth.service
      .from("healthcare_professionals")
      .select("user_id")
      .eq("id", params.id)
      .maybeSingle();

    const { data: doctorRow } = !profRow
      ? await auth.service.from("doctors").select("user_id").eq("id", params.id).maybeSingle()
      : { data: null };

    const userId = profRow?.user_id ?? doctorRow?.user_id;

    if (!userId) {
      return jsonError("Professional not found.", 404);
    }

    // Use the Supabase Admin API to delete the auth user — this cascades to user_roles automatically
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Delete profile rows first (they may not cascade from auth.users)
    if (profRow) {
      await auth.service.from("healthcare_professionals").delete().eq("id", params.id);
    }
    if (doctorRow) {
      await auth.service.from("doctors").delete().eq("id", params.id);
    }

    // Delete the auth user (this also removes user_roles via FK cascade)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      return jsonError(deleteError.message, 500);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return validationError(error);
  }
}
