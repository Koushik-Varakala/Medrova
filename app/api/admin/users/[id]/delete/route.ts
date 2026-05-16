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

    // Delete profile rows and their dependent records first (they may not cascade from auth.users)
    if (profRow) {
      // 1. Remove references in shifts
      await auth.service.from("shifts").update({ confirmed_professional_id: null }).eq("confirmed_professional_id", params.id);
      // 2. Delete child records
      await auth.service.from("professional_applications").delete().eq("professional_id", params.id);
      await auth.service.from("professional_payouts").delete().eq("professional_id", params.id);
      // 3. Delete the profile
      await auth.service.from("healthcare_professionals").delete().eq("id", params.id);
    }
    if (doctorRow) {
      // 1. Remove references in shifts
      await auth.service.from("shifts").update({ confirmed_doctor_id: null }).eq("confirmed_doctor_id", params.id);
      // 2. Delete child records
      await auth.service.from("applications").delete().eq("doctor_id", params.id);
      await auth.service.from("payments").delete().eq("doctor_id", params.id);
      // 3. Delete the profile
      await auth.service.from("doctors").delete().eq("id", params.id);
    }

    // Delete user roles
    await auth.service.from("user_roles").delete().eq("user_id", userId);

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
