"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save,
  MapPin,
  Building2,
  Phone,
  Stethoscope,
  FileCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  Edit3,
  X,
  UploadCloud
} from "lucide-react";
import { clinicTypes, hyderabadAreas, specialties } from "@/lib/constants";
import type { Clinic } from "@/types";
import { cn } from "@/lib/utils";

interface ClinicProfileFormProps {
  clinic: Clinic;
}

export function ClinicProfileForm({ clinic }: ClinicProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState("");

  const handleSave = async () => {
    setIsSubmitting(true);
    setNotice("");
    // Simulate network delay
    await new Promise(r => setTimeout(r, 1000));
    setNotice("✅ Profile successfully updated!");
    setIsSubmitting(false);
    setIsEditing(false);

    // Clear notice after 3s
    setTimeout(() => setNotice(""), 3000);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="relative pb-24">
      {/* HEADER CARD */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white shadow-sm"
      >
        <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-400"></div>
        <div className="relative px-6 pb-6 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
            <div className="-mt-12 flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-white bg-blue-100 shadow-md">
              <Building2 className="h-10 w-10 text-blue-600" />
            </div>
            
            <div className="flex flex-1 flex-col gap-4 pt-2 sm:pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#0F172A]">{clinic.name}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[#64748B]">
                  <span className="flex items-center gap-1 font-medium text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                    {clinic.type}
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <MapPin className="h-4 w-4" />
                    {clinic.area}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold shadow-sm",
                  clinic.verificationStatus === "verified" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                )}>
                  {clinic.verificationStatus === "verified" ? <CheckCircle2 className="h-4 w-4" /> : <Loader2 className="h-4 w-4" />}
                  {clinic.verificationStatus === "verified" ? "Verified" : "Pending Verification"}
                </div>

                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-blue-600"
                  title={isEditing ? "Cancel editing" : "Edit profile"}
                >
                  {isEditing ? <X className="h-5 w-5" /> : <Edit3 className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <form className="space-y-6">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">

          {/* CLINIC INFO */}
          <motion.section variants={item} className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Building2 className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A]">Clinic Information</h3>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Clinic Name" defaultValue={clinic.name} isEditing={isEditing} />
              <SelectField label="Clinic Type" defaultValue={clinic.type} options={clinicTypes} isEditing={isEditing} />
              <Field label="Address" defaultValue={clinic.address} isEditing={isEditing} />
              <SelectField label="Area" defaultValue={clinic.area} options={hyderabadAreas} isEditing={isEditing} />
            </div>
          </motion.section>

          {/* CONTACT INFO */}
          <motion.section variants={item} className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Phone className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A]">Contact Details</h3>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Clinic Phone" defaultValue={clinic.phone} isEditing={isEditing} />
              <Field label="Contact Person Name" defaultValue={clinic.contactPerson} isEditing={isEditing} />
              <Field label="Contact Person Phone" defaultValue={clinic.contactPhone} isEditing={isEditing} />
            </div>
          </motion.section>

          {/* SPECIALTIES */}
          <motion.section variants={item} className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <Stethoscope className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A]">Specialties Required</h3>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <SelectField
                label="Primary Specialty Needed"
                defaultValue={clinic.specialtiesNeeded[0] ?? ""}
                options={specialties}
                isEditing={isEditing}
              />
              <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-500">
                <p>Need more specialties? Contact support to expand your hiring criteria.</p>
              </div>
            </div>
          </motion.section>

          {/* DOCUMENTS */}
          <motion.section variants={item} className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <FileCheck className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A]">Verification Documents</h3>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 p-4">
                <div>
                  <h4 className="font-bold text-[#0F172A]">Clinic Registration Certificate</h4>
                  <p className="text-sm text-slate-500">Official registration document for verification.</p>
                </div>
                <div className="flex items-center gap-4">
                  {clinic.regCertUrl ? (
                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="h-4 w-4" /> Uploaded
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-sm font-bold text-red-700 border border-red-200">
                      <XCircle className="h-4 w-4" /> Missing
                    </span>
                  )}
                  {isEditing && (
                    <button type="button" className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800">
                      <UploadCloud className="h-4 w-4" />
                      {clinic.regCertUrl ? "Re-upload" : "Upload"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.section>

        </motion.div>
      </form>

      {/* FLOATING ACTION BUTTONS */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 left-4 right-4 z-40 sm:bottom-8 sm:left-auto sm:right-8"
          >
            <div className="flex flex-col items-end gap-3">
              {notice && (
                <div className="rounded-xl bg-[#10B981] px-4 py-3 text-sm font-bold text-white shadow-lg">
                  {notice}
                </div>
              )}

              <button
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1E40AF] px-8 py-4 text-lg font-bold text-white shadow-xl shadow-blue-900/20 transition-all hover:-translate-y-1 hover:bg-[#1D4ED8] hover:shadow-2xl hover:shadow-blue-900/30 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 sm:w-auto sm:min-w-[200px]"
                onClick={handleSave}
                disabled={isSubmitting}
                type="button"
              >
                {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ----- SUBCOMPONENTS -----

function Field({ defaultValue, label, isEditing }: { defaultValue: string; label: string; isEditing: boolean }) {
  return (
    <div>
      <label className="text-sm font-bold text-[#0F172A]">{label}</label>
      {isEditing ? (
        <input
          className="mt-2 w-full rounded-xl border border-blue-200 bg-blue-50/30 px-4 py-3 text-sm font-medium text-[#0F172A] outline-none transition-all focus:border-[#1E40AF] focus:bg-white focus:ring-2 focus:ring-[#1E40AF]/20"
          defaultValue={defaultValue}
        />
      ) : (
        <p className="mt-2 text-sm font-medium text-[#64748B]">{defaultValue || "Not provided"}</p>
      )}
    </div>
  );
}

function SelectField({
  defaultValue,
  label,
  options,
  isEditing
}: {
  defaultValue: string;
  label: string;
  options: string[];
  isEditing: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-bold text-[#0F172A]">{label}</label>
      {isEditing ? (
        <select
          className="mt-2 w-full appearance-none rounded-xl border border-blue-200 bg-blue-50/30 px-4 py-3 text-sm font-medium text-[#0F172A] outline-none transition-all focus:border-[#1E40AF] focus:bg-white focus:ring-2 focus:ring-[#1E40AF]/20"
          defaultValue={defaultValue}
        >
          <option value="" disabled>Select {label.toLowerCase()}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <p className="mt-2 text-sm font-medium text-[#64748B]">{defaultValue || "Not provided"}</p>
      )}
    </div>
  );
}
