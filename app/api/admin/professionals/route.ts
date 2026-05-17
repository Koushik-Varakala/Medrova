import { NextResponse } from "next/server";
import { getAdminServiceClient, jsonError, validationError } from "@/lib/api-utils";

export async function GET() {
  try {
    const auth = await getAdminServiceClient();

    if ("error" in auth) {
      return auth.error;
    }

    // Fetch from the new healthcare_professionals table
    const { data: newProfs, error: newError } = await auth.service
      .from("healthcare_professionals")
      .select("*")
      .order("created_at", { ascending: false });

    if (newError) {
      return jsonError(newError.message, 500);
    }

    // Fetch from legacy doctors table for backwards compatibility
    const { data: legacyDoctors, error: legacyError } = await auth.service
      .from("doctors")
      .select("*")
      .order("created_at", { ascending: false });

    if (legacyError) {
      return jsonError(legacyError.message, 500);
    }

    // Merge them. For legacy doctors, map them to look like healthcare_professionals
    const legacyMapped = (legacyDoctors ?? []).map(doc => ({
      id: doc.id,
      user_id: doc.user_id,
      role: "doctor",
      name: doc.name,
      phone: doc.phone,
      email: doc.email,
      specialty: doc.specialty,
      experience: doc.experience,
      registration_number: doc.mci_number,
      city: doc.city,
      area: doc.area,
      employment_status: doc.employment_status,
      available_days: doc.available_days,
      shift_preference: doc.shift_preference,
      expected_pay: doc.expected_pay,
      upi_id: doc.upi_id,
      verification_status: doc.verification_status,
      verification_note: doc.verification_note,
      primary_cert_url: doc.mci_cert_url,
      degree_cert_url: doc.degree_cert_url,
      gov_id_url: doc.gov_id_url,
      created_at: doc.created_at,
      _sourceTable: "doctors"
    }));

    const newMapped = (newProfs ?? []).map(prof => ({
      ...prof,
      _sourceTable: "professionals"
    }));

    const merged = [...newMapped, ...legacyMapped].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return NextResponse.json({ professionals: merged });
  } catch (error) {
    return validationError(error);
  }
}
