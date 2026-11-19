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

    const { data: updatedShift, error } = await auth.service
      .from("shifts")
      .update({ status: "cancelled" })
      .eq("id", params.id)
      .select("id, status")
      .single();

    if (error || !updatedShift) {
      return jsonError(error?.message ?? "Failed to reject quick post.", 500);
    }

    return NextResponse.json({
      success: true,
      message: "Quick post marked as cancelled / rejected."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return jsonError(message, 500);
  }
}
