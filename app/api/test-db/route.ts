import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase-server";

export async function GET() {
  const service = createSupabaseServiceClient();
  if (!service) return NextResponse.json({ error: "no service" });

  const { data: apps } = await service.from("applications").select("*").limit(3);
  const { data: doctors } = await service.from("doctors").select("*").limit(3);
  const { data: shifts } = await service.from("shifts").select("*").limit(3);
  
  return NextResponse.json({ apps, doctors, shifts });
}
