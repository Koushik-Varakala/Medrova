import {
  BriefcaseMedical,
  Building2,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  FileCheck2,
  Home,
  IndianRupee,
  LayoutDashboard,
  Stethoscope,
  User,
  Users
} from "lucide-react";
import type { BottomTabItem } from "@/components/shared/BottomTabBar";
import type { SidebarItem } from "@/components/shared/Sidebar";

export const hyderabadAreas = [
  "Banjara Hills",
  "Jubilee Hills",
  "Gachibowli",
  "HITEC City",
  "Madhapur",
  "Kondapur",
  "Kukatpally",
  "Ameerpet",
  "Secunderabad",
  "Begumpet",
  "Mehdipatnam",
  "Dilsukhnagar",
  "LB Nagar",
  "Uppal",
  "Miyapur",
  "Kompally"
];

export const specialties = [
  "General Physician",
  "Pediatrics",
  "Gynecology",
  "Emergency Medicine",
  "Orthopedics",
  "Dermatology",
  "Radiology",
  "Anesthesiology",
  "Cardiology",
  "ENT",
  "Dentistry",
  "Psychiatry"
];

export const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const clinicTypes = [
  "Nursing home",
  "Hospital",
  "Standalone clinic",
  "Maternity home"
];

export const employmentStatuses = [
  "Currently employed",
  "Available immediately",
  "Serving notice period",
  "Freelance locum doctor"
];

export const doctorNavigation: Array<SidebarItem & BottomTabItem> = [
  { href: "/dashboard/doctor", label: "Home", icon: Home },
  { href: "/dashboard/doctor/shifts", label: "Shifts", icon: CalendarCheck },
  { href: "/dashboard/doctor/jobs", label: "Jobs", icon: BriefcaseMedical },
  {
    href: "/dashboard/doctor/applications",
    label: "Applications",
    icon: ClipboardList
  },
  { href: "/dashboard/doctor/payments", label: "Payments", icon: IndianRupee },
  { href: "/dashboard/doctor/profile", label: "Profile", icon: User }
];

export const clinicNavigation: Array<SidebarItem & BottomTabItem> = [
  { href: "/dashboard/clinic", label: "Home", icon: Home },
  { href: "/dashboard/clinic/post-shift", label: "Post Shift", icon: CalendarCheck },
  { href: "/dashboard/clinic/post-job", label: "Post Job", icon: BriefcaseMedical },
  { href: "/dashboard/clinic/shifts", label: "Shifts", icon: ClipboardList },
  { href: "/dashboard/clinic/jobs", label: "Jobs", icon: BriefcaseMedical },
  { href: "/dashboard/clinic/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/clinic/profile", label: "Profile", icon: User }
];

export const adminNavigation: Array<SidebarItem & BottomTabItem> = [
  { href: "/dashboard/admin", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/admin/professionals", label: "Professionals", icon: Users },
  { href: "/dashboard/admin/clinics", label: "Clinics", icon: Building2 },
  { href: "/dashboard/admin/shifts", label: "Shifts", icon: CalendarCheck },
  { href: "/dashboard/admin/payments", label: "Payments", icon: FileCheck2 }
];

// ─── Unified Healthcare Professional Constants ────────────────────────────────

export const nurseSpecialties = [
  "Staff Nurse",
  "ICU Nurse",
  "OT Nurse",
  "Pediatric Nurse",
  "Maternity Nurse",
  "Emergency Nurse",
  "Home Care Nurse",
  "Dialysis Nurse",
  "Oncology Nurse",
  "Cardiac Care Nurse"
];

export const technicianSpecialties = [
  "Lab Technician",
  "Radiology Technician",
  "OT Technician",
  "Physiotherapist",
  "Dialysis Technician",
  "ECG Technician",
  "Dental Technician",
  "Pharmacy Technician",
  "Blood Bank Technician",
  "Anesthesia Technician"
];

export const professionalRoleConfig = {
  doctor: {
    label: "Doctor",
    registrationLabel: "MCI/NMC Registration Number",
    primaryCertLabel: "MCI Certificate",
    specialties: specialties,
    color: "blue"
  },
  nurse: {
    label: "Nurse",
    registrationLabel: "Nursing Council Registration Number",
    primaryCertLabel: "Nursing Council Certificate",
    specialties: nurseSpecialties,
    color: "emerald"
  },
  technician: {
    label: "Technician",
    registrationLabel: "Certification/License Number",
    primaryCertLabel: "Relevant Certification",
    specialties: technicianSpecialties,
    color: "purple"
  }
} as const;

export const professionalNavigation: Array<SidebarItem & BottomTabItem> = [
  { href: "/dashboard/professional", label: "Home", icon: Home },
  { href: "/dashboard/professional/shifts", label: "Shifts", icon: CalendarCheck },
  { href: "/dashboard/professional/jobs", label: "Jobs", icon: BriefcaseMedical },
  {
    href: "/dashboard/professional/applications",
    label: "Applications",
    icon: ClipboardList
  },
  { href: "/dashboard/professional/payments", label: "Payments", icon: IndianRupee },
  { href: "/dashboard/professional/profile", label: "Profile", icon: User }
];
