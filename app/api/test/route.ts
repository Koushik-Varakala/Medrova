import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase-server";

export async function GET() {
  const service = createSupabaseServiceClient();
  if (!service) return NextResponse.json({ error: "no service" });

  const { data, error } = await service
    .from("applications")
    .select("*, shift:shifts(*, clinic:clinics(*)), job:jobs(*, clinic:clinics(*))")
    .limit(1);

  return NextResponse.json({ data, error });
}
