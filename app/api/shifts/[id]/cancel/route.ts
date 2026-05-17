import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase-server";
import { createSupabaseBrowserClient } from "@/lib/supabase"; // For session check

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const shiftId = params.id;
    if (!shiftId) return NextResponse.json({ error: "Missing shift ID" }, { status: 400 });

    // 1. Authenticate Request
    const supabaseClient = createSupabaseBrowserClient();
    if (!supabaseClient) return NextResponse.json({ error: "Auth client missing" }, { status: 500 });

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const service = createSupabaseServiceClient();
    if (!service) return NextResponse.json({ error: "Service client missing" }, { status: 500 });

    // 2. Fetch Shift & Clinic verification
    const { data: shift, error: shiftError } = await service
      .from("shifts")
      .select("id, status, clinic_id, date, start_time")
      .eq("id", shiftId)
      .single();

    if (shiftError || !shift) return NextResponse.json({ error: "Shift not found" }, { status: 404 });

    // Verify Clinic Ownership
    const { data: clinic } = await service
      .from("clinics")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    if (!clinic || clinic.id !== shift.clinic_id) {
      return NextResponse.json({ error: "Unauthorized to cancel this shift" }, { status: 403 });
    }

    if (shift.status === 'completed' || shift.status === 'cancelled' || shift.status === 'cancelled_with_penalty' || shift.status === 'cancelled_full_refund') {
      return NextResponse.json({ error: "Shift cannot be cancelled in its current state" }, { status: 400 });
    }

    // 3. Calculate 12-Hour Rule
    // Shift start time parsing
    const shiftDateTimeString = `${shift.date}T${shift.start_time}:00`;
    const shiftStart = new Date(shiftDateTimeString);
    const now = new Date();

    const hoursUntilStart = (shiftStart.getTime() - now.getTime()) / (1000 * 60 * 60);

    let finalStatus = 'cancelled_full_refund';

    if (shift.status === 'confirmed' && hoursUntilStart < 12 && hoursUntilStart > 0) {
      finalStatus = 'cancelled_with_penalty';
    } else if (shift.status === 'active' || shift.status === 'pending_payment') {
      finalStatus = 'cancelled';
    }

    // 4. Update Shift Status
    const { error: updateError } = await service
      .from("shifts")
      .update({ status: finalStatus })
      .eq("id", shiftId);

    if (updateError) throw updateError;

    // 5. Reject any pending or confirmed applications
    await service
      .from("applications")
      .update({ status: 'rejected' }) // Could be a distinct 'cancelled' state in V2
      .eq("shift_id", shiftId)
      .in("status", ["applied", "confirmed"]);

    return NextResponse.json({ 
      success: true, 
      status: finalStatus,
      message: finalStatus === 'cancelled_with_penalty' 
        ? "Shift cancelled. 30% penalty applied due to < 12hr notice." 
        : "Shift cancelled successfully. Full refund eligible."
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
