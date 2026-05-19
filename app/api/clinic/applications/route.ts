import { NextResponse } from "next/server";
import { getAuthedServiceClient, jsonError, validationError } from "@/lib/api-utils";
import { toDbRecord } from "@/lib/mappers";
import { getNumberValue, getOptionalStringValue, getStringValue } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const auth = await getAuthedServiceClient();

    if ("error" in auth) {
      return auth.error;
    }

    // Verify clinic
    const { data: clinicData } = await auth.service
      .from("clinics")
      .select("id")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (!clinicData) {
      return jsonError("Clinic profile not found.", 404);
    }

    const clinicId = (clinicData as { id: string }).id;

    // We want to fetch applications for shifts belonging to this clinic.
    // So we first get the shifts.
    const { data: shifts } = await auth.service
      .from("shifts")
      .select("id")
      .eq("clinic_id", clinicId);

    const shiftIds = (shifts ?? []).map(s => s.id);

    if (shiftIds.length === 0) {
      return NextResponse.json({ applications: [] });
    }

    const { data: applications, error: appsError } = await auth.service
      .from("applications")
      .select("*, doctors(*)")
      .in("shift_id", shiftIds)
      .order("created_at", { ascending: false });

    if (appsError) {
      return jsonError(appsError.message, 500);
    }

    const { data: professionalApplications, error: professionalAppsError } = await auth.service
      .from("professional_applications")
      .select("*, professional:healthcare_professionals(*)")
      .in("shift_id", shiftIds)
      .order("created_at", { ascending: false });

    if (professionalAppsError) {
      return jsonError(professionalAppsError.message, 500);
    }

    const legacyApplications = (applications ?? []).map((application) => ({
      ...toDbRecord(application),
      source_table: "applications"
    }));

    const unifiedApplications = (professionalApplications ?? []).map((application) => {
      const appRecord = toDbRecord(application);
      const professional = toDbRecord(appRecord.professional);
      return {
        id: getStringValue(appRecord, "id"),
        professional_id: getStringValue(appRecord, "professional_id"),
        shift_id: getOptionalStringValue(appRecord, "shift_id"),
        job_id: getOptionalStringValue(appRecord, "job_id"),
        status: getStringValue(appRecord, "status"),
        created_at: getStringValue(appRecord, "created_at"),
        source_table: "professional_applications",
        doctors: {
          id: getStringValue(professional, "id"),
          name: getStringValue(professional, "name"),
          specialty: getStringValue(professional, "specialty"),
          experience: getNumberValue(professional, "experience"),
          phone: getStringValue(professional, "phone"),
          email: getStringValue(professional, "email"),
          mci_number: getStringValue(professional, "registration_number"),
          city: getStringValue(professional, "city"),
          area: getStringValue(professional, "area"),
          employment_status: getStringValue(professional, "employment_status"),
          cv_url: getOptionalStringValue(professional, "cv_url")
        }
      };
    });

    return NextResponse.json({
      applications: [...legacyApplications, ...unifiedApplications].sort((a, b) => {
        return new Date(getStringValue(toDbRecord(b), "created_at")).getTime() -
          new Date(getStringValue(toDbRecord(a), "created_at")).getTime();
      })
    });
  } catch (error) {
    return validationError(error);
  }
}
