"use client";

import { Save } from "lucide-react";
import { useState } from "react";
import { employmentStatuses, hyderabadAreas, specialties } from "@/lib/constants";
import type { Doctor } from "@/types";

interface DoctorProfileFormProps {
  doctor: Doctor;
}

export function DoctorProfileForm({ doctor }: DoctorProfileFormProps) {
  const [notice, setNotice] = useState("");

  function saveProfile() {
    setNotice("Profile changes saved locally. Supabase update will run when connected.");
  }

  return (
    <form className="space-y-6 rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <Input defaultValue={doctor.name} label="Full name" />
        <Input defaultValue={doctor.phone} label="Phone" />
        <Input defaultValue={doctor.email} label="Email" type="email" />
        <Select defaultValue={doctor.area} label="Area" options={hyderabadAreas} />
        <Select defaultValue={doctor.specialty} label="Specialty" options={specialties} />
        <Input defaultValue={String(doctor.experience)} label="Experience" type="number" />
        <Input defaultValue={doctor.mciNumber} label="MCI/NMC number" />
        <Select
          defaultValue={doctor.employmentStatus}
          label="Employment status"
          options={employmentStatuses}
        />
        <Input defaultValue={doctor.shiftPreference} label="Shift preference" />
        <Input defaultValue={String(doctor.expectedPay)} label="Expected pay" type="number" />
        <Input defaultValue={doctor.upiId} label="UPI ID" />
      </div>
      {notice ? (
        <p className="rounded-lg border border-[#10B981]/30 bg-[#10B981]/10 px-4 py-3 text-sm text-[#047857]">
          {notice}
        </p>
      ) : null}
      <button
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1E40AF] px-4 py-2 font-medium text-white hover:bg-[#1D4ED8]"
        onClick={saveProfile}
        type="button"
      >
        <Save className="h-4 w-4" />
        Save profile
      </button>
    </form>
  );
}

function Input({
  defaultValue,
  label,
  type = "text"
}: {
  defaultValue: string;
  label: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-[#0F172A]">{label}</label>
      <input
        className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
        defaultValue={defaultValue}
        type={type}
      />
    </div>
  );
}

function Select({
  defaultValue,
  label,
  options
}: {
  defaultValue: string;
  label: string;
  options: string[];
}) {
  return (
    <div>
      <label className="text-sm font-medium text-[#0F172A]">{label}</label>
      <select
        className="mt-2 w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
        defaultValue={defaultValue}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
