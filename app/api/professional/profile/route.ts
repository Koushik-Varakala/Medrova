import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthedServiceClient, jsonError, validationError } from "@/lib/api-utils";
import { mapHealthcareProfessionalRow, toDbRecord } from "@/lib/mappers";

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  specialty: z.string().min(1).optional(),
  experience: z.coerce.number().int().min(0).optional(),
  registrationNumber: z.string().min(3).optional(),
  city: z.string().min(1).optional(),
  area: z.string().min(1).optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  locationDisplayName: z.string().nullable().optional(),
  employmentStatus: z.string().min(1).optional(),
  availableDays: z.array(z.string()).min(1).optional(),
  shiftPreference: z.enum(["locum", "permanent", "both"]).optional(),
  expectedPay: z.coerce.number().int().min(0).optional(),
  upiId: z.string().min(3).optional(),
  primaryCertUrl: z.string().url().optional(),
  degreeCertUrl: z.string().url().optional(),
  govIdUrl: z.string().url().optional(),
  verificationStatus: z.string().optional()
});

export async function GET() {
  try {
    const auth = await getAuthedServiceClient();
    if ("error" in auth) return auth.error;

    const { data: profRow, error: profError } = await auth.service
      .from("healthcare_professionals")
      .select("*")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (profError) return jsonError(profError.message, 500);

    if (!profRow) {
      // Return 404 so frontend knows to redirect to onboarding
      return jsonError("Profile not found", 404);
    }

    // Count completed shifts for this professional
    const { count: shiftsCompleted } = await auth.service
      .from("professional_applications")
      .select("id", { count: "exact", head: true })
      .eq("professional_id", profRow.id)
      .eq("status", "completed");

    const profile = mapHealthcareProfessionalRow(toDbRecord(profRow));
    return NextResponse.json({ profile: { ...profile, shiftsCompleted: shiftsCompleted ?? 0 } });
  } catch (error) {
    return validationError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getAuthedServiceClient();
    if ("error" in auth) return auth.error;

    const values = updateProfileSchema.parse(await request.json());
    const updatePayload: Record<string, string | number | string[] | null | undefined> = {
      name: values.name,
      phone: values.phone,
      specialty: values.specialty,
      experience: values.experience,
      registration_number: values.registrationNumber,
      city: values.city,
      area: values.area,
      latitude: values.latitude,
      longitude: values.longitude,
      location_display_name: values.locationDisplayName,
      employment_status: values.employmentStatus,
      available_days: values.availableDays,
      shift_preference: values.shiftPreference,
      expected_pay: values.expectedPay,
      upi_id: values.upiId,
      primary_cert_url: values.primaryCertUrl,
      degree_cert_url: values.degreeCertUrl,
      gov_id_url: values.govIdUrl,
      verification_status: values.verificationStatus
    };

    Object.keys(updatePayload).forEach((key) => {
      if (updatePayload[key] === undefined) delete updatePayload[key];
    });

    const { data, error } = await auth.service
      .from("healthcare_professionals")
      .update(updatePayload)
      .eq("user_id", auth.user.id)
      .select("*")
      .single();

    if (error || !data) {
      return jsonError(error?.message ?? "Profile not found", 404);
    }

    return NextResponse.json({ profile: mapHealthcareProfessionalRow(toDbRecord(data)) });
  } catch (error) {
    return validationError(error);
  }
}
