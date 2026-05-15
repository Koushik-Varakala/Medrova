import type {
  ApplicationStatus,
  Clinic,
  HealthcareProfessional,
  Job,
  JobType,
  PaymentStatus,
  ProfessionalApplication,
  ProfessionalPayout,
  ProfessionalRole,
  Shift,
  ShiftStatus,
  VerificationStatus
} from "@/types";
import {
  getBooleanValue,
  getNumberValue,
  getOptionalNumberValue,
  getOptionalStringValue,
  getRecordValue,
  getStringValue,
  parseStringArray
} from "@/lib/utils";

export type DbRecord = Record<string, unknown>;

const DEFAULT_CLINIC_TYPE = "Clinic";
const DEFAULT_VERIFICATION_STATUS: VerificationStatus = "pending";
const DEFAULT_SHIFT_STATUS: ShiftStatus = "active";
const DEFAULT_JOB_STATUS: Job["status"] = "active";
const DEFAULT_JOB_TYPE: JobType = "full_time";
const DEFAULT_APPLICATION_STATUS: ApplicationStatus = "applied";
const DEFAULT_PAYMENT_STATUS: PaymentStatus = "pending";
const DEFAULT_PROFESSIONAL_ROLE: ProfessionalRole = "doctor";

const hyderabadAreaCoordinates: Record<string, { lat: number; lng: number }> = {
  "Banjara Hills": { lat: 17.4126, lng: 78.4483 },
  "Jubilee Hills": { lat: 17.4326, lng: 78.4071 },
  Gachibowli: { lat: 17.4401, lng: 78.3489 },
  "HITEC City": { lat: 17.4435, lng: 78.3772 },
  Madhapur: { lat: 17.4483, lng: 78.3915 },
  Kondapur: { lat: 17.4698, lng: 78.3578 },
  Kukatpally: { lat: 17.4948, lng: 78.3996 },
  Ameerpet: { lat: 17.4375, lng: 78.4483 },
  Secunderabad: { lat: 17.4399, lng: 78.4983 },
  Begumpet: { lat: 17.4447, lng: 78.4665 },
  Mehdipatnam: { lat: 17.393, lng: 78.4365 },
  Dilsukhnagar: { lat: 17.3687, lng: 78.5247 },
  "LB Nagar": { lat: 17.3457, lng: 78.5522 },
  Uppal: { lat: 17.4056, lng: 78.5591 },
  Miyapur: { lat: 17.4933, lng: 78.3915 },
  Kompally: { lat: 17.5416, lng: 78.4814 }
};

export function toDbRecord(value: unknown): DbRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as DbRecord)
    : {};
}

function firstRecord(value: unknown): DbRecord | null {
  if (Array.isArray(value)) {
    const first = value[0];
    return first && typeof first === "object" && !Array.isArray(first)
      ? (first as DbRecord)
      : null;
  }
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as DbRecord)
    : null;
}

function asProfessionalRole(value: string): ProfessionalRole {
  return value === "nurse" || value === "technician" || value === "doctor"
    ? value
    : DEFAULT_PROFESSIONAL_ROLE;
}

function asVerificationStatus(value: string): VerificationStatus {
  return value === "verified" || value === "rejected" || value === "pending"
    ? value
    : DEFAULT_VERIFICATION_STATUS;
}

function asShiftStatus(value: string): ShiftStatus {
  if (
    value === "pending_payment" ||
    value === "active" ||
    value === "confirmed" ||
    value === "completed" ||
    value === "cancelled"
  ) {
    return value;
  }
  return DEFAULT_SHIFT_STATUS;
}

function asApplicationStatus(value: string): ApplicationStatus {
  if (
    value === "applied" ||
    value === "confirmed" ||
    value === "rejected" ||
    value === "completed"
  ) {
    return value;
  }
  return DEFAULT_APPLICATION_STATUS;
}

function asPaymentStatus(value: string): PaymentStatus {
  return value === "completed" || value === "failed" || value === "pending"
    ? value
    : DEFAULT_PAYMENT_STATUS;
}

function asJobType(value: string): JobType {
  return value === "part_time" || value === "full_time" ? value : DEFAULT_JOB_TYPE;
}

function asJobStatus(value: string): Job["status"] {
  return value === "closed" || value === "active" ? value : DEFAULT_JOB_STATUS;
}

function fallbackCoordinates(area: string) {
  return hyderabadAreaCoordinates[area];
}

export function mapClinicRow(row: DbRecord): Clinic {
  return {
    id: getStringValue(row, "id"),
    userId: getStringValue(row, "user_id"),
    name: getStringValue(row, "name") || "Clinic",
    type: getStringValue(row, "type") || DEFAULT_CLINIC_TYPE,
    address: getStringValue(row, "address"),
    area: getStringValue(row, "area"),
    phone: getStringValue(row, "phone"),
    contactPerson: getStringValue(row, "contact_person"),
    contactPhone: getStringValue(row, "contact_phone"),
    specialtiesNeeded: parseStringArray(row["specialties_needed"]),
    verificationStatus: asVerificationStatus(getStringValue(row, "verification_status")),
    verificationNote: getOptionalStringValue(row, "verification_note"),
    regCertUrl: getOptionalStringValue(row, "reg_cert_url"),
    createdAt: getStringValue(row, "created_at")
  };
}

export function mapHealthcareProfessionalRow(row: DbRecord): HealthcareProfessional {
  const shiftPreference = getStringValue(row, "shift_preference");
  return {
    id: getStringValue(row, "id"),
    userId: getStringValue(row, "user_id"),
    role: asProfessionalRole(getStringValue(row, "role")),
    name: getStringValue(row, "name"),
    phone: getStringValue(row, "phone"),
    email: getStringValue(row, "email"),
    specialty: getStringValue(row, "specialty"),
    experience: getNumberValue(row, "experience"),
    registrationNumber: getStringValue(row, "registration_number"),
    city: getStringValue(row, "city"),
    area: getStringValue(row, "area"),
    latitude: getOptionalNumberValue(row, "latitude"),
    longitude: getOptionalNumberValue(row, "longitude"),
    locationDisplayName: getOptionalStringValue(row, "location_display_name"),
    employmentStatus: getStringValue(row, "employment_status"),
    availableDays: parseStringArray(row["available_days"]),
    shiftPreference:
      shiftPreference === "locum" || shiftPreference === "permanent" || shiftPreference === "both"
        ? shiftPreference
        : "both",
    expectedPay: getNumberValue(row, "expected_pay"),
    upiId: getStringValue(row, "upi_id"),
    verificationStatus: asVerificationStatus(getStringValue(row, "verification_status")),
    verificationNote: getOptionalStringValue(row, "verification_note"),
    primaryCertUrl: getOptionalStringValue(row, "primary_cert_url"),
    degreeCertUrl: getOptionalStringValue(row, "degree_cert_url"),
    govIdUrl: getOptionalStringValue(row, "gov_id_url"),
    createdAt: getStringValue(row, "created_at")
  };
}

export function mapShiftRow(row: DbRecord): Shift {
  const area = getStringValue(row, "area");
  const fallback = fallbackCoordinates(area);
  const clinicRow = firstRecord(row["clinic"]);
  const latitude =
    getOptionalNumberValue(row, "latitude") ??
    getOptionalNumberValue(row, "location_lat") ??
    fallback?.lat;
  const longitude =
    getOptionalNumberValue(row, "longitude") ??
    getOptionalNumberValue(row, "location_lng") ??
    fallback?.lng;

  return {
    id: getStringValue(row, "id"),
    clinicId: getStringValue(row, "clinic_id"),
    clinic: clinicRow ? mapClinicRow(clinicRow) : undefined,
    specialty: getStringValue(row, "specialty"),
    date: getStringValue(row, "date"),
    startTime: getStringValue(row, "start_time"),
    endTime: getStringValue(row, "end_time"),
    pay: getNumberValue(row, "pay"),
    area,
    latitude,
    longitude,
    locationDisplayName: getOptionalStringValue(row, "location_display_name"),
    notes: getOptionalStringValue(row, "notes"),
    isUrgent: getBooleanValue(row, "is_urgent"),
    status: asShiftStatus(getStringValue(row, "status")),
    razorpayPaymentId: getOptionalStringValue(row, "razorpay_payment_id"),
    confirmedDoctorId: getOptionalStringValue(row, "confirmed_doctor_id"),
    professionalType: asProfessionalRole(getStringValue(row, "professional_type")),
    confirmedProfessionalId: getOptionalStringValue(row, "confirmed_professional_id"),
    createdAt: getStringValue(row, "created_at")
  };
}

export function mapJobRow(row: DbRecord): Job {
  const clinicRow = firstRecord(row["clinic"]);
  return {
    id: getStringValue(row, "id"),
    clinicId: getStringValue(row, "clinic_id"),
    clinic: clinicRow ? mapClinicRow(clinicRow) : undefined,
    specialty: getStringValue(row, "specialty"),
    experienceMin: getNumberValue(row, "experience_min"),
    jobType: asJobType(getStringValue(row, "job_type")),
    salaryMin: getNumberValue(row, "salary_min"),
    salaryMax: getNumberValue(row, "salary_max"),
    description: getStringValue(row, "description"),
    status: asJobStatus(getStringValue(row, "status")),
    professionalType: asProfessionalRole(getStringValue(row, "professional_type")),
    locationLat: getOptionalNumberValue(row, "location_lat"),
    locationLng: getOptionalNumberValue(row, "location_lng"),
    locationDisplayName: getOptionalStringValue(row, "location_display_name"),
    isFreePosting:
      typeof row["is_free_posting"] === "boolean"
        ? row["is_free_posting"]
        : true,
    contactEmail: getOptionalStringValue(row, "contact_email"),
    contactPhone: getOptionalStringValue(row, "contact_phone"),
    createdAt: getStringValue(row, "created_at")
  };
}

export function mapProfessionalApplicationRow(row: DbRecord): ProfessionalApplication {
  const shiftRow = getRecordValue(row, "shift");
  const jobRow = getRecordValue(row, "job");
  const professionalRow = getRecordValue(row, "professional");
  return {
    id: getStringValue(row, "id"),
    professionalId: getStringValue(row, "professional_id"),
    professional: professionalRow ? mapHealthcareProfessionalRow(professionalRow) : undefined,
    shiftId: getOptionalStringValue(row, "shift_id"),
    shift: shiftRow ? mapShiftRow(shiftRow) : undefined,
    jobId: getOptionalStringValue(row, "job_id"),
    job: jobRow ? mapJobRow(jobRow) : undefined,
    status: asApplicationStatus(getStringValue(row, "status")),
    createdAt: getStringValue(row, "created_at")
  };
}

export function mapProfessionalPayoutRow(row: DbRecord): ProfessionalPayout {
  const shiftRow = getRecordValue(row, "shift");
  const clinicRow = shiftRow ? getRecordValue(shiftRow, "clinic") : null;
  return {
    id: getStringValue(row, "id"),
    professionalId: getStringValue(row, "professional_id"),
    shiftId: getStringValue(row, "shift_id"),
    amount: getNumberValue(row, "amount"),
    upiId: getStringValue(row, "upi_id"),
    status: asPaymentStatus(getStringValue(row, "status")),
    paidAt: getOptionalStringValue(row, "paid_at"),
    createdAt: getStringValue(row, "created_at"),
    shift: shiftRow
      ? {
          id: getStringValue(shiftRow, "id"),
          specialty: getStringValue(shiftRow, "specialty"),
          date: getStringValue(shiftRow, "date"),
          startTime: getStringValue(shiftRow, "start_time"),
          endTime: getStringValue(shiftRow, "end_time"),
          pay: getNumberValue(shiftRow, "pay"),
          clinic: clinicRow ? { name: getStringValue(clinicRow, "name") } : undefined
        }
      : undefined
  };
}
