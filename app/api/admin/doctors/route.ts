import { NextResponse } from "next/server";
import { getAdminServiceClient, jsonError, validationError } from "@/lib/api-utils";

export async function GET() {
  try {
    const auth = await getAdminServiceClient();

    if ("error" in auth) {
      return auth.error;
    }

    const { data, error } = await auth.service
      .from("doctors")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return jsonError(error.message, 500);
    }

    return NextResponse.json({ doctors: data ?? [] });
  } catch (error) {
    return validationError(error);
  }
}
