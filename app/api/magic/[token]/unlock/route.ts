import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase-server";
import { jsonError, parseJsonWithSchema } from "@/lib/api-utils";
import { z } from "zod";

interface RouteContext {
  params: {
    token: string;
  };
}

const unlockSchema = z.object({
  applicationId: z.string().uuid(),
  sourceTable: z.enum(["applications", "professional_applications"]).default("applications")
});

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const supabase = createSupabaseServiceClient();
    if (!supabase) {
      return jsonError("Database service client unavailable.", 500);
    }

    const payload = await parseJsonWithSchema(request, unlockSchema);

    // ── 1. Fetch Shift & Clinic by Magic Token ──────
    const { data: shift, error: shiftError } = await supabase
      .from("shifts")
      .select(`
        id,
        clinic_id,
        specialty,
        date,
        status,
        clinic:clinics(id, name, credits)
      `)
      .eq("magic_token", params.token)
      .single();

    if (shiftError || !shift || !shift.clinic) {
      return jsonError("Invalid or expired shift link.", 404);
    }

    const clinic = shift.clinic as unknown as { id: string; name: string; credits: number };

    // ── 2. Check Credit Balance ──────
    const currentCredits = typeof clinic.credits === "number" ? clinic.credits : 0;
    if (currentCredits < 1) {
      return NextResponse.json(
        {
          success: false,
          error: "INSUFFICIENT_CREDITS",
          message: "You need 1 credit to unlock this doctor's contact details.",
          pricing: [
            { id: "single", name: "Pay-As-You-Go", credits: 1, price: 750 },
            { id: "pack", name: "Clinic Saver Pack", credits: 4, price: 2500, popular: true },
            { id: "pro", name: "Hospital Pro", credits: 15, price: 8500 }
          ]
        },
        { status: 402 }
      );
    }

    // ── 3. Deduct 1 Credit ──────
    const { error: deductError } = await supabase
      .from("clinics")
      .update({ credits: currentCredits - 1 })
      .eq("id", clinic.id);

    if (deductError) {
      return jsonError("Failed to deduct credit from your hospital balance.", 500);
    }

    // ── 4. Confirm Application & Unmask Doctor ──────
    let unlockedDoctor = {
      name: "",
      phone: "",
      email: "",
      specialty: ""
    };

    if (payload.sourceTable === "professional_applications") {
      const { data: appData } = await supabase
        .from("professional_applications")
        .select(`
          id,
          professional_id,
          professional:healthcare_professionals(id, name, phone, email, specialty)
        `)
        .eq("id", payload.applicationId)
        .single();

      if (appData && appData.professional) {
        const prof = appData.professional as unknown as {
          name: string;
          phone: string;
          email: string;
          specialty: string;
        };
        unlockedDoctor = {
          name: prof.name,
          phone: prof.phone,
          email: prof.email,
          specialty: prof.specialty
        };

        // Update shift
        await supabase
          .from("shifts")
          .update({
            status: "confirmed",
            confirmed_professional_id: appData.professional_id
          })
          .eq("id", shift.id);

        // Update application
        await supabase
          .from("professional_applications")
          .update({ status: "confirmed" })
          .eq("id", appData.id);
      }
    } else {
      // Legacy applications table
      const { data: appData } = await supabase
        .from("applications")
        .select(`
          id,
          doctor_id,
          doctor:doctors(id, name, phone, email, specialty)
        `)
        .eq("id", payload.applicationId)
        .single();

      if (appData && appData.doctor) {
        const doc = appData.doctor as unknown as {
          name: string;
          phone: string;
          email: string;
          specialty: string;
        };
        unlockedDoctor = {
          name: doc.name,
          phone: doc.phone,
          email: doc.email,
          specialty: doc.specialty
        };

        // Update shift
        await supabase
          .from("shifts")
          .update({
            status: "confirmed",
            confirmed_doctor_id: appData.doctor_id
          })
          .eq("id", shift.id);

        // Update application
        await supabase
          .from("applications")
          .update({ status: "confirmed" })
          .eq("id", appData.id);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Doctor contact unlocked successfully! Contact details revealed.",
      remainingCredits: currentCredits - 1,
      doctor: unlockedDoctor
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return jsonError(message, 500);
  }
}
