import { NextResponse } from "next/server";
import { getAdminServiceClient, jsonError, validationError } from "@/lib/api-utils";

export async function GET() {
  try {
    const auth = await getAdminServiceClient();

    if ("error" in auth) {
      return auth.error;
    }

    const { data, error } = await auth.service
      .from("clinics")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return jsonError(error.message, 500);
    }

    return NextResponse.json({ clinics: data ?? [] });
  } catch (error) {
    return validationError(error);
  }
}
