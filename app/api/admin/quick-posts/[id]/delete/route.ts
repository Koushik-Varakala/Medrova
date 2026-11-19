import { NextResponse } from "next/server";
import { getAdminServiceClient, jsonError } from "@/lib/api-utils";

interface RouteContext {
  params: {
    id: string;
  };
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const auth = await getAdminServiceClient();

    if ("error" in auth) {
      return auth.error;
    }

    // Soft-delete: set status to "deleted" so it's preserved in history
    const { data: updatedShift, error } = await auth.service
      .from("shifts")
      .update({ status: "deleted" })
      .eq("id", params.id)
      .select("id, status")
      .single();

    if (error || !updatedShift) {
      return jsonError(error?.message ?? "Failed to delete quick post.", 500);
    }

    return NextResponse.json({
      success: true,
      message: "Quick post has been deleted."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return jsonError(message, 500);
  }
}
