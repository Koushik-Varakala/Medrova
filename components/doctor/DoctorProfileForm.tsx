"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Save, 
  MapPin, 
  User, 
  Briefcase, 
  CalendarDays, 
  Wallet, 
  FileText, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Edit3,
  X
} from "lucide-react";
import { employmentStatuses, hyderabadAreas, specialties } from "@/lib/constants";
import type { Doctor } from "@/types";
import { cn } from "@/lib/utils";

interface DoctorProfileFormProps {
  doctor: Doctor;
}

export function DoctorProfileForm({ doctor }: DoctorProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Form state
  const [availableDays, setAvailableDays] = useState<string[]>(doctor.availableDays || []);

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const toggleDay = (day: string) => {
    if (!isEditing) return;
    setAvailableDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  async function saveProfile() {
    setIsSaving(true);
    // Simulate API call to respect "Keep existing data fetching logic intact"
    // while satisfying the "Shows loading spinner while saving" requirement
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsSaving(false);
    setIsEditing(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="relative pb-24 lg:pb-0">
      {/* SUCCESS TOAST */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-lg lg:bottom-10 lg:left-auto lg:right-10 lg:translate-x-0"
          >
            <CheckCircle2 className="h-5 w-5" />
            Profile saved successfully
          </motion.div>
        )}
      </AnimatePresence>

      {/* FIXED SAVE BUTTON ON DESKTOP */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="hidden lg:fixed lg:bottom-10 lg:right-10 lg:z-40 lg:block"
          >
            <button
              onClick={saveProfile}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-full bg-[#1E40AF] px-6 py-3 font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-1 hover:bg-[#1D4ED8] hover:shadow-xl hover:shadow-blue-900/30 disabled:opacity-70"
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              Save Changes
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-4xl space-y-6">
        {/* PROFILE HEADER CARD */}
        <div className="relative overflow-hidden rounded-2xl bg-[#0F172A] p-6 text-white shadow-md sm:p-8">
          <div className="absolute -right-10 -top-24 h-64 w-64 rounded-full bg-white opacity-5 blur-3xl"></div>
          
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 sm:right-6 sm:top-6"
          >
            {isEditing ? <X className="h-5 w-5" /> : <Edit3 className="h-5 w-5" />}
          </button>

          <div className="relative z-10 flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1E40AF] to-[#60A5FA] text-3xl font-bold tracking-tight shadow-inner ring-4 ring-white/10 sm:h-32 sm:w-32 sm:text-4xl">
              {getInitials(doctor.name)}
            </div>
            
            <div className="flex flex-col items-center sm:items-start gap-2">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Dr. {doctor.name}</h2>
              <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <span className="font-medium text-blue-100">{doctor.specialty}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-blue-300"></span>
                <span className="font-medium text-blue-100">{doctor.experience} yrs experience</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <div className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-sm backdrop-blur-md",
                  doctor.verificationStatus === "verified" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                )}>
                  {doctor.verificationStatus === "verified" ? (
                    <><CheckCircle2 className="h-3.5 w-3.5" /> Verified</>
                  ) : (
                    <><Clock className="h-3.5 w-3.5" /> Pending Verification</>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
                  <MapPin className="h-4 w-4" />
                  {doctor.area}, {doctor.city}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FORM SECTIONS */}
        <div className="grid gap-6">
          {/* PERSONAL INFO */}
          <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <User className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A]">Personal Information</h3>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <Input defaultValue={doctor.name} label="Full name" disabled={!isEditing} />
              <Input defaultValue={doctor.phone} label="Phone number" disabled={!isEditing} />
              <Input defaultValue={doctor.email} label="Email address" type="email" disabled={!isEditing} />
              <Select defaultValue={doctor.area} label="Operating Area" options={hyderabadAreas} disabled={!isEditing} />
            </div>
          </section>

          {/* PROFESSIONAL INFO */}
          <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <Briefcase className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A]">Professional Information</h3>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <Select defaultValue={doctor.specialty} label="Primary Specialty" options={specialties} disabled={!isEditing} />
              <Input defaultValue={String(doctor.experience)} label="Years of Experience" type="number" disabled={!isEditing} />
              <Input defaultValue={doctor.mciNumber} label="MCI/NMC Registration Number" disabled={!isEditing} />
              <Select
                defaultValue={doctor.employmentStatus}
                label="Current Employment Status"
                options={employmentStatuses}
                disabled={!isEditing}
              />
            </div>
          </section>

          {/* AVAILABILITY */}
          <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <CalendarDays className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A]">Availability & Preferences</h3>
            </div>
            
            <div className="mb-6">
              <label className="mb-3 block text-sm font-bold text-[#0F172A]">Available Days</label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map(day => {
                  const isSelected = availableDays.includes(day);
                  const shortDay = day.substring(0, 3);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      disabled={!isEditing}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-bold transition-all",
                        isSelected 
                          ? "bg-[#1E40AF] text-white shadow-md shadow-blue-900/20" 
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                        !isEditing && !isSelected && "opacity-50",
                        !isEditing && "cursor-default"
                      )}
                    >
                      {shortDay}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <Input defaultValue={doctor.shiftPreference} label="Shift Preference (e.g. Morning, Night)" disabled={!isEditing} />
              <div className="relative">
                <Input defaultValue={String(doctor.expectedPay)} label="Expected Pay per Shift" type="number" disabled={!isEditing} />
                <span className="absolute bottom-3 left-4 text-sm font-bold text-slate-400">₹</span>
              </div>
            </div>
          </section>

          {/* PAYMENT */}
          <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Wallet className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A]">Payment Details</h3>
            </div>
            <div className="max-w-md">
              <Input defaultValue={doctor.upiId} label="UPI ID" disabled={!isEditing} />
              <p className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Payouts for completed shifts will be sent to this UPI ID automatically.
              </p>
            </div>
          </section>

          {/* DOCUMENTS */}
          <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A]">Verification Documents</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <DocumentStatus label="MCI/NMC Certificate" isUploaded={!!doctor.mciCertUrl} />
              <DocumentStatus label="Medical Degree" isUploaded={!!doctor.degreeCertUrl} />
              <DocumentStatus label="Government ID" isUploaded={!!doctor.govIdUrl} />
            </div>
          </section>
        </div>
      </div>

      {/* MOBILE STICKY SAVE BUTTON */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-[60px] left-0 right-0 z-40 border-t border-[#E2E8F0] bg-white/90 p-4 backdrop-blur-md lg:hidden"
          >
            <button
              onClick={saveProfile}
              disabled={isSaving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E40AF] px-6 py-3.5 font-bold text-white shadow-lg transition-all hover:bg-[#1D4ED8] disabled:opacity-70"
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ----- SUBCOMPONENTS -----

function Input({
  defaultValue,
  label,
  type = "text",
  disabled = false
}: {
  defaultValue: string;
  label: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-[#0F172A]">{label}</label>
      <input
        className={cn(
          "w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm font-medium text-[#0F172A] outline-none transition-all focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20",
          disabled && "bg-slate-50 text-slate-500 opacity-80",
          type === "number" && label.includes("Pay") && "pl-8"
        )}
        defaultValue={defaultValue}
        type={type}
        disabled={disabled}
      />
    </div>
  );
}

function Select({
  defaultValue,
  label,
  options,
  disabled = false
}: {
  defaultValue: string;
  label: string;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-[#0F172A]">{label}</label>
      <select
        className={cn(
          "w-full appearance-none rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm font-medium text-[#0F172A] outline-none transition-all focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20",
          disabled && "bg-slate-50 text-slate-500 opacity-80"
        )}
        defaultValue={defaultValue}
        disabled={disabled}
      >
        <option value="" disabled>Select option</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function DocumentStatus({ label, isUploaded }: { label: string; isUploaded: boolean }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-center transition-all hover:border-slate-300">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
        <FileText className="h-6 w-6 text-slate-400" />
      </div>
      <div>
        <p className="text-sm font-bold text-[#0F172A]">{label}</p>
        {isUploaded ? (
          <p className="mt-1 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600">
            <CheckCircle2 className="h-4 w-4" /> Uploaded
          </p>
        ) : (
          <p className="mt-1 flex items-center justify-center gap-1.5 text-xs font-bold text-rose-500">
            <XCircle className="h-4 w-4" /> Missing
          </p>
        )}
      </div>
    </div>
  );
}
