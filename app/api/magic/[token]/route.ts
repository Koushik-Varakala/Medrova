import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase-server";
import { jsonError } from "@/lib/api-utils";

interface RouteContext {
  params: {
    token: string;
  };
}

function maskPhone(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.length >= 10) {
    return `+91 ${cleaned.slice(0, 5)} •••••`;
  }
  return `${cleaned.slice(0, 3)}••••••`;
}

function maskEmail(email: string): string {
  if (!email) return "";
  const [user, domain] = email.split("@");
  if (!domain) return "*****@gmail.com";
  return `${user.slice(0, 2)}•••••@${domain}`;
}

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const supabase = createSupabaseServiceClient();
    if (!supabase) {
      return jsonError("Database service client unavailable.", 500);
    }

    // ── 1. Fetch Shift by Magic Token ──────
    const { data: shift, error: shiftError } = await supabase
      .from("shifts")
      .select(`
        id,
        clinic_id,
        specialty,
        date,
        start_time,
        end_time,
        pay,
        area,
        notes,
        is_urgent,
        status,
        magic_token,
        magic_contact_phone,
        magic_contact_name,
        is_whatsapp_source,
        raw_whatsapp_text,
        confirmed_doctor_id,
        confirmed_professional_id,
        created_at,
        clinic:clinics(
          id,
          name,
          phone,
          contact_person,
          contact_phone,
          credits,
          is_claimed,
          verification_status
        )
      `)
      .eq("magic_token", params.token)
      .single();

    if (shiftError || !shift) {
      return jsonError("Shift link expired or not found.", 404);
    }

    // ── 2. Fetch Shift Applicants ──────
    // Check legacy applications
    const { data: legacyApps } = await supabase
      .from("applications")
      .select(`
        id,
        status,
        created_at,
        doctor:doctors(
          id,
          name,
          specialty,
          experience,
          city,
          area,
          verification_status,
          phone,
          email
        )
      `)
      .eq("shift_id", shift.id);

    // Check unified professional applications
    const { data: profApps } = await supabase
      .from("professional_applications")
      .select(`
        id,
        status,
        created_at,
        professional:healthcare_professionals(
          id,
          name,
          role,
          specialty,
          experience,
          city,
          area,
          verification_status,
          phone,
          email
        )
      `)
      .eq("shift_id", shift.id);

    // Format & Mask Applicants
    const applicants = [];

    if (legacyApps) {
      for (const app of legacyApps) {
        const doc = app.doctor as unknown as {
          id: string;
          name: string;
          specialty: string;
          experience: number;
          city: string;
          area: string;
          verification_status: string;
          phone: string;
          email: string;
        } | null;

        if (doc) {
          const isUnlocked = app.status === "confirmed" || shift.status === "confirmed";
          applicants.push({
            applicationId: app.id,
            sourceTable: "applications",
            id: doc.id,
            name: doc.name.startsWith("Dr.") ? doc.name : `Dr. ${doc.name}`,
            role: "doctor",
            specialty: doc.specialty,
            experience: doc.experience,
            city: doc.city,
            area: doc.area,
            verificationStatus: doc.verification_status,
            isUnlocked,
            phone: isUnlocked ? doc.phone : maskPhone(doc.phone),
            email: isUnlocked ? doc.email : maskEmail(doc.email),
            appliedAt: app.created_at
          });
        }
      }
    }

    if (profApps) {
      for (const app of profApps) {
        const prof = app.professional as unknown as {
          id: string;
          name: string;
          role: string;
          specialty: string;
          experience: number;
          city: string;
          area: string;
          verification_status: string;
          phone: string;
          email: string;
        } | null;

        if (prof) {
          const isUnlocked = app.status === "confirmed" || shift.status === "confirmed";
          applicants.push({
            applicationId: app.id,
            sourceTable: "professional_applications",
            id: prof.id,
            name: prof.role === "doctor" && !prof.name.startsWith("Dr.") ? `Dr. ${prof.name}` : prof.name,
            role: prof.role,
            specialty: prof.specialty,
            experience: prof.experience,
            city: prof.city,
            area: prof.area,
            verificationStatus: prof.verification_status,
            isUnlocked,
            phone: isUnlocked ? prof.phone : maskPhone(prof.phone),
            email: isUnlocked ? prof.email : maskEmail(prof.email),
            appliedAt: app.created_at
          });
        }
      }
    }

    // ── 3. If 0 applicants, fetch Nearby Verified Matches (Instant Match Preview) ──────
    let nearbyMatches: Array<{
      id: string;
      name: string;
      specialty: string;
      experience: number;
      area: string;
      verificationStatus: string;
      isMatch: boolean;
    }> = [];

    if (applicants.length === 0) {
      const { data: matchedDoctors } = await supabase
        .from("healthcare_professionals")
        .select("id, name, role, specialty, experience, city, area, verification_status")
        .eq("role", "doctor")
        .eq("verification_status", "verified")
        .limit(4);

      if (matchedDoctors && matchedDoctors.length > 0) {
        nearbyMatches = matchedDoctors.map(d => ({
          id: d.id,
          name: d.name.startsWith("Dr.") ? d.name : `Dr. ${d.name}`,
          specialty: d.specialty,
          experience: d.experience,
          area: d.area || "Hyderabad",
          verificationStatus: d.verification_status,
          isMatch: true
        }));
      }
    }

    // ── 4. Fetch Other Shifts for this Clinic/Phone ──────
    let otherShifts: unknown[] = [];
    if (shift.clinic_id) {
      const { data: siblingShifts } = await supabase
        .from("shifts")
        .select("id, specialty, date, start_time, end_time, pay, status, magic_token, created_at")
        .eq("clinic_id", shift.clinic_id)
        .neq("id", shift.id)
        .order("created_at", { ascending: false })
        .limit(5);

      otherShifts = siblingShifts ?? [];
    }

    return NextResponse.json({
      success: true,
      shift,
      clinic: shift.clinic,
      applicants,
      nearbyMatches,
      otherShifts
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return jsonError(message, 500);
  }
}
