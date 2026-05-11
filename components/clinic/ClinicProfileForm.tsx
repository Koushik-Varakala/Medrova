"use client";

import { Save } from "lucide-react";
import { useState } from "react";
import { clinicTypes, hyderabadAreas, specialties } from "@/lib/constants";
import type { Clinic } from "@/types";

interface ClinicProfileFormProps {
  clinic: Clinic;
}

export function ClinicProfileForm({ clinic }: ClinicProfileFormProps) {
  const [notice, setNotice] = useState("");

  return (
    <form className="space-y-6 rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <Input defaultValue={clinic.name} label="Clinic name" />
        <Select defaultValue={clinic.type} label="Clinic type" options={clinicTypes} />
        <Input defaultValue={clinic.address} label="Address" />
        <Select defaultValue={clinic.area} label="Area" options={hyderabadAreas} />
        <Input defaultValue={clinic.phone} label="Clinic phone" />
        <Input defaultValue={clinic.contactPerson} label="Contact person" />
        <Input defaultValue={clinic.contactPhone} label="Contact phone" />
        <Select defaultValue={clinic.specialtiesNeeded[0] ?? ""} label="Primary specialty needed" options={specialties} />
      </div>
      {notice ? (
        <p className="rounded-lg border border-[#10B981]/30 bg-[#10B981]/10 px-4 py-3 text-sm text-[#047857]">
          {notice}
        </p>
      ) : null}
      <button
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1E40AF] px-4 py-2 font-medium text-white hover:bg-[#1D4ED8]"
        onClick={() => setNotice("Clinic profile changes saved locally. Supabase update will run when connected.")}
        type="button"
      >
        <Save className="h-4 w-4" />
        Save profile
      </button>
    </form>
  );
}

function Input({ defaultValue, label }: { defaultValue: string; label: string }) {
  return (
    <div>
      <label className="text-sm font-medium text-[#0F172A]">{label}</label>
      <input
        className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
        defaultValue={defaultValue}
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
