export type ProfessionalRole = "doctor" | "nurse" | "technician";
export type UserRole = ProfessionalRole | "clinic" | "admin";
export type VerificationStatus = "pending" | "verified" | "rejected";
export type ShiftStatus =
  | "pending_payment"
  | "active"
  | "confirmed"
  | "completed"
  | "cancelled";
export type ApplicationStatus =
  | "applied"
  | "confirmed"
  | "rejected"
  | "completed";
export type PaymentStatus = "pending" | "completed" | "failed";
export type JobType = "full_time" | "part_time";

export interface Doctor {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  specialty: string;
  experience: number;
  mciNumber: string;
  city: string;
  area: string;
  employmentStatus: string;
  availableDays: string[];
  shiftPreference: string;
  expectedPay: number;
  upiId: string;
  verificationStatus: VerificationStatus;
  verificationNote?: string;
  mciCertUrl?: string;
  degreeCertUrl?: string;
  govIdUrl?: string;
  cvUrl?: string;
  createdAt: string;
}

export interface Clinic {
  id: string;
  userId: string;
  name: string;
  type: string;
  address: string;
  area: string;
  phone: string;
  contactPerson: string;
  contactPhone: string;
  specialtiesNeeded: string[];
  verificationStatus: VerificationStatus;
  verificationNote?: string;
  regCertUrl?: string;
  createdAt: string;
}

export interface Shift {
  id: string;
  clinicId: string;
  clinic?: Clinic;
  specialty: string;
  date: string;
  startTime: string;
  endTime: string;
  pay: number;
  area: string;
  latitude?: number;
  longitude?: number;
  locationDisplayName?: string;
  notes?: string;
  isUrgent: boolean;
  status: ShiftStatus;
  razorpayPaymentId?: string;
  confirmedDoctorId?: string;
  professionalType?: ProfessionalRole;
  confirmedProfessionalId?: string;
  createdAt: string;
}

export interface Job {
  id: string;
  clinicId: string;
  clinic?: Clinic;
  specialty: string;
  experienceMin: number;
  jobType: JobType;
  salaryMin: number;
  salaryMax: number;
  description: string;
  status: "active" | "closed";
  professionalType: ProfessionalRole;
  locationLat?: number;
  locationLng?: number;
  locationDisplayName?: string;
  isFreePosting: boolean;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
}

export interface Application {
  id: string;
  doctorId: string;
  doctor?: Doctor;
  shiftId?: string;
  shift?: Shift;
  jobId?: string;
  job?: Job;
  status: ApplicationStatus;
  createdAt: string;
}

export interface ClinicPayment {
  id: string;
  clinicId: string;
  shiftId: string;
  amount: number;
  razorpayId: string;
  status: PaymentStatus;
  createdAt: string;
}

export interface DoctorPayment {
  id: string;
  doctorId: string;
  shiftId: string;
  amount: number;
  upiId: string;
  status: PaymentStatus;
  paidAt?: string;
  createdAt: string;
}

// Unified Healthcare Professional Types

export type ExtendedUserRole = UserRole;

export interface HealthcareProfessional {
  id: string;
  userId: string;
  role: ProfessionalRole;
  name: string;
  phone: string;
  email: string;
  specialty: string;
  experience: number;
  registrationNumber: string;
  city: string;
  area: string;
  latitude?: number;
  longitude?: number;
  locationDisplayName?: string;
  employmentStatus: string;
  availableDays: string[];
  shiftPreference: "locum" | "permanent" | "both";
  expectedPay: number;
  upiId: string;
  verificationStatus: VerificationStatus;
  verificationNote?: string;
  primaryCertUrl?: string;
  degreeCertUrl?: string;
  govIdUrl?: string;
  createdAt: string;
}

export interface ProfessionalApplication {
  id: string;
  professionalId: string;
  professional?: HealthcareProfessional;
  shiftId?: string;
  shift?: Shift;
  jobId?: string;
  job?: Job;
  status: ApplicationStatus;
  createdAt: string;
}

export interface ProfessionalPayout {
  id: string;
  professionalId: string;
  shiftId: string;
  amount: number;
  upiId: string;
  status: PaymentStatus;
  paidAt?: string;
  createdAt: string;
  shift?: {
    id: string;
    specialty: string;
    date: string;
    startTime: string;
    endTime: string;
    pay?: number;
    clinic?: { name: string };
  };
}

export interface LocationResult {
  displayName: string;
  lat: number;
  lng: number;
  area?: string;
  city?: string;
}
