import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 60; // Cache this route to prevent DB hammering

export async function GET() {
  try {
    const supabase = createSupabaseServiceClient();
    if (!supabase) throw new Error("Supabase client not configured");

    // Fetch active Locum Shifts
    const { data: shifts, error: shiftsError } = await supabase
      .from('shifts')
      .select('id, specialty, professional_type, date, start_time, end_time, pay, area, is_urgent, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(30);

    if (shiftsError) throw shiftsError;

    // Fetch active Permanent Jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, specialty, professional_type, job_type, salary_min, salary_max, location_display_name, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(30);

    if (jobsError) throw jobsError;

    // Unified format
    const opportunities = [
      ...(shifts || []).map(s => ({
        id: `shift_${s.id}`,
        type: 'shift' as const,
        role: s.professional_type,
        specialty: s.specialty,
        payMin: s.pay,
        payMax: s.pay,
        location: s.area || 'Hyderabad',
        date: s.date,
        startTime: s.start_time,
        endTime: s.end_time,
        isUrgent: s.is_urgent,
        createdAt: s.created_at,
      })),
      ...(jobs || []).map(j => ({
        id: `job_${j.id}`,
        type: 'job' as const,
        role: j.professional_type,
        specialty: j.specialty,
        payMin: j.salary_min,
        payMax: j.salary_max,
        location: j.location_display_name || 'Hyderabad',
        isUrgent: false,
        createdAt: j.created_at,
      }))
    ];

    // Sort combined by created_at desc
    opportunities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ opportunities });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
