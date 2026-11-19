import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { createSupabaseServiceClient } from "@/lib/supabase-server";
import { jsonError, parseJsonWithSchema } from "@/lib/api-utils";

const quickPostSchema = z.object({
  hospitalName: z.string().min(2, "Hospital name is required"),
  area: z.string().min(2, "Area is required"),
  specialty: z.string().min(2, "Specialty is required"),
  subSpecialtyOrRole: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  startTime: z.string().min(2, "Start time is required"),
  endTime: z.string().min(2, "End time is required"),
  displayTime: z.string().optional(),
  pay: z.number().positive("Pay must be greater than 0"),
  contactPhone: z.string().regex(/^[6-9]\d{9}$/, "Must be a valid 10-digit Indian phone number"),
  contactName: z.string().min(2, "Contact person name is required"),
  contactEmail: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
  rawText: z.string().optional()
});

function generateMagicToken(hospitalName: string, area: string): string {
  const cleanHosp = hospitalName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 4) || "hosp";
  const cleanArea = area.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 4) || "hyd";
  const randomSuffix = crypto.randomBytes(3).toString("hex"); // 6 chars hex
  return `${cleanHosp}-${cleanArea}-${randomSuffix}`;
}

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServiceClient();
    if (!supabase) {
      return jsonError("Server configuration error: Database client unavailable.", 500);
    }

    const payload = await parseJsonWithSchema(request, quickPostSchema);

    // ── 1. Find or create Shadow Clinic by Contact Phone ──────
    const normalizedPhone = payload.contactPhone.trim();

    const { data: existingClinic } = await supabase
      .from("clinics")
      .select("id, name, credits, is_claimed")
      .eq("contact_phone", normalizedPhone)
      .maybeSingle();

    let clinicId: string;

    if (existingClinic) {
      clinicId = existingClinic.id;
    } else {
      // Create shadow clinic with 1 Free Welcome Credit
      const { data: newClinic, error: clinicError } = await supabase
        .from("clinics")
        .insert({
          name: payload.hospitalName.trim(),
          type: "Hospital",
          address: `${payload.area}, Hyderabad`,
          area: payload.area,
          phone: normalizedPhone,
          contact_person: payload.contactName.trim(),
          contact_phone: normalizedPhone,
          specialties_needed: [payload.specialty],
          verification_status: "pending",
          credits: 1, // 1 Free Welcome Credit
          is_claimed: false
        })
        .select("id")
        .single();

      if (clinicError || !newClinic) {
        return jsonError(clinicError?.message ?? "Failed to create facility profile.", 500);
      }

      clinicId = newClinic.id;
    }

    // ── 2. Generate Unguessable Magic Token ──────
    const magicToken = generateMagicToken(payload.hospitalName, payload.area);

    // ── 3. Insert Shift with status 'pending_review' ──────
    const { data: shift, error: shiftError } = await supabase
      .from("shifts")
      .insert({
        clinic_id: clinicId,
        specialty: payload.specialty,
        date: payload.date,
        start_time: payload.startTime,
        end_time: payload.endTime,
        pay: payload.pay,
        area: payload.area,
        notes: payload.notes || payload.rawText || "",
        is_urgent: true,
        status: "pending_review", // Public submission requires admin approval before publishing
        magic_token: magicToken,
        magic_contact_phone: normalizedPhone,
        magic_contact_name: payload.contactName.trim(),
        is_whatsapp_source: true,
        raw_whatsapp_text: payload.rawText || ""
      })
      .select("id, magic_token, status, created_at")
      .single();

    if (shiftError || !shift) {
      return jsonError(shiftError?.message ?? "Failed to save shift.", 500);
    }

    return NextResponse.json({
      success: true,
      shiftId: shift.id,
      magicToken: shift.magic_token,
      status: shift.status,
      message: "Shift successfully submitted for verification. Admin review in progress."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return jsonError(message, 500);
  }
}
