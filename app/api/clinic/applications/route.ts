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

    // Fetch shift IDs and job IDs for this clinic
    const [{ data: shifts }, { data: jobs }] = await Promise.all([
      auth.service.from("shifts").select("id").eq("clinic_id", clinicId),
      auth.service.from("jobs").select("id").eq("clinic_id", clinicId),
    ]);

    const shiftIds = (shifts ?? []).map(s => s.id);
    const jobIds = (jobs ?? []).map(j => j.id);

    // ── SHIFT applications (doctors table) ──
    const { data: shiftDoctorApps } = shiftIds.length > 0
      ? await auth.service
          .from("applications")
          .select("*, doctors(*)")
          .in("shift_id", shiftIds)
          .order("created_at", { ascending: false })
      : { data: [] };

    // ── SHIFT applications (professional_applications table) ──
    const { data: shiftProfApps } = shiftIds.length > 0
      ? await auth.service
          .from("professional_applications")
          .select("*, professional:healthcare_professionals(*)")
          .in("shift_id", shiftIds)
          .order("created_at", { ascending: false })
      : { data: [] };

    // ── JOB applications (applications table, doctors) ──
    const { data: jobDoctorApps } = jobIds.length > 0
      ? await auth.service
          .from("applications")
          .select("*, doctors(*)")
          .in("job_id", jobIds)
          .order("created_at", { ascending: false })
      : { data: [] };

    // ── JOB applications (professional_applications table) ──
    const { data: jobProfApps } = jobIds.length > 0
      ? await auth.service
          .from("professional_applications")
          .select("*, professional:healthcare_professionals(*)")
          .in("job_id", jobIds)
          .order("created_at", { ascending: false })
      : { data: [] };

    function mapDoctorApp(application: Record<string, unknown>, sourceTable: string) {
      const appRecord = toDbRecord(application);
      const doctor = toDbRecord(appRecord.doctors);
      return {
        ...appRecord,
        source_table: sourceTable,
        doctors: {
          id: getStringValue(doctor, "id"),
          name: getStringValue(doctor, "name"),
          specialty: getStringValue(doctor, "specialty"),
          experience: getNumberValue(doctor, "experience"),
          phone: getStringValue(doctor, "phone"),
          email: getStringValue(doctor, "email"),
          mci_number: getStringValue(doctor, "mci_number"),
          city: getStringValue(doctor, "city"),
          area: getStringValue(doctor, "area"),
          employment_status: getStringValue(doctor, "employment_status"),
          cv_url: getOptionalStringValue(doctor, "cv_url"),
        }
      };
    }

    function mapProfessionalApp(application: Record<string, unknown>, sourceTable: string) {
      const appRecord = toDbRecord(application);
      const professional = toDbRecord(appRecord.professional);
      return {
        id: getStringValue(appRecord, "id"),
        professional_id: getStringValue(appRecord, "professional_id"),
        shift_id: getOptionalStringValue(appRecord, "shift_id"),
        job_id: getOptionalStringValue(appRecord, "job_id"),
        status: getStringValue(appRecord, "status"),
        created_at: getStringValue(appRecord, "created_at"),
        source_table: sourceTable,
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
          cv_url: getOptionalStringValue(professional, "cv_url"),
        }
      };
    }

    const allApplications = [
      ...(shiftDoctorApps ?? []).map(a => mapDoctorApp(toDbRecord(a), "applications")),
      ...(shiftProfApps ?? []).map(a => mapProfessionalApp(toDbRecord(a), "professional_applications")),
      ...(jobDoctorApps ?? []).map(a => mapDoctorApp(toDbRecord(a), "applications")),
      ...(jobProfApps ?? []).map(a => mapProfessionalApp(toDbRecord(a), "professional_applications")),
    ].sort((a, b) =>
      new Date(getStringValue(toDbRecord(b), "created_at")).getTime() -
      new Date(getStringValue(toDbRecord(a), "created_at")).getTime()
    );

    return NextResponse.json({ applications: allApplications });
  } catch (error) {
    return validationError(error);
  }
}
