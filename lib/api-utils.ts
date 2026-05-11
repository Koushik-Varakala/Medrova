import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServiceClient, getAuthenticatedUser, isAdminUser } from "@/lib/supabase-server";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function getAuthedServiceClient() {
  const user = await getAuthenticatedUser();
  const service = createSupabaseServiceClient();

  if (!service) {
    return { error: jsonError("Supabase service role is not configured.", 500) };
  }

  if (!user) {
    return { error: jsonError("Authentication required.", 401) };
  }

  return { service, user };
}

export async function getAdminServiceClient() {
  const result = await getAuthedServiceClient();

  if ("error" in result) {
    return result;
  }

  if (!isAdminUser(result.user.id)) {
    return { error: jsonError("Admin access required.", 403) };
  }

  return result;
}

export async function parseJsonWithSchema<TSchema extends z.ZodType>(
  request: Request,
  schema: TSchema
): Promise<z.infer<TSchema>> {
  const body: unknown = await request.json();
  return schema.parse(body);
}

export function validationError(error: unknown) {
  if (error instanceof z.ZodError) {
    return jsonError(error.issues[0]?.message ?? "Invalid request.", 422);
  }

  if (error instanceof Error) {
    return jsonError(error.message, 500);
  }

  return jsonError("Unexpected server error.", 500);
}

export interface ClinicLookupRow {
  id: string;
  verification_status: string;
}

export interface DoctorLookupRow {
  id: string;
  verification_status: string;
  upi_id: string;
}
