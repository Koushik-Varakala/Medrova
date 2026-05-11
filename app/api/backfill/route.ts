import { NextResponse } from "next/server";
import { getAuthedServiceClient } from "@/lib/api-utils";

export async function GET() {
  const auth = await getAuthedServiceClient();

  if ("error" in auth) {
    return auth.error;
  }

  // Get all completed applications
  const { data: applications, error: appsError } = await auth.service
    .from("applications")
    .select("id, shift_id, doctor_id")
    .eq("status", "completed");
    
  if (appsError || !applications || applications.length === 0) {
    return NextResponse.json({ message: "No completed applications found to backfill." });
  }
  
  let insertedCount = 0;
  
  for (const app of applications) {
    // Check if payout already exists
    const { data: existing } = await auth.service
      .from("doctor_payouts")
      .select("id")
      .eq("shift_id", app.shift_id)
      .eq("doctor_id", app.doctor_id)
      .maybeSingle();
      
    if (existing) {
      continue;
    }
    
    // Fetch shift pay
    const { data: shift } = await auth.service
      .from("shifts")
      .select("pay")
      .eq("id", app.shift_id)
      .single();
      
    // Fetch doctor UPI
    const { data: doctor } = await auth.service
      .from("doctors")
      .select("upi_id")
      .eq("id", app.doctor_id)
      .single();
      
    if (shift && doctor) {
      const { error: insertError } = await auth.service
        .from("doctor_payouts")
        .insert({
          doctor_id: app.doctor_id,
          shift_id: app.shift_id,
          amount: shift.pay,
          upi_id: doctor.upi_id || "unknown",
          status: "completed",
          paid_at: new Date().toISOString()
        });
        
      if (!insertError) insertedCount++;
    }
  }
  
  return NextResponse.json({ message: `Successfully backfilled ${insertedCount} payouts!` });
}
