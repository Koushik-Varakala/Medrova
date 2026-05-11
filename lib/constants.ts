import {
  BriefcaseMedical,
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
  { href: "/dashboard/clinic/shifts", label: "Shifts", icon: ClipboardList },
  { href: "/dashboard/clinic/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/clinic/profile", label: "Profile", icon: User }
];

export const adminNavigation: Array<SidebarItem & BottomTabItem> = [
  { href: "/dashboard/admin", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/admin/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/dashboard/admin/clinics", label: "Clinics", icon: Users },
  { href: "/dashboard/admin/shifts", label: "Shifts", icon: CalendarCheck },
  { href: "/dashboard/admin/payments", label: "Payments", icon: FileCheck2 }
];
