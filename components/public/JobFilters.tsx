"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { specialties } from "@/lib/constants";

export function JobFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentRole = searchParams.get("role") || "all";
  const currentType = searchParams.get("jobType") || "all";
  const currentSpecialty = searchParams.get("specialty") || "all";
  const currentSort = searchParams.get("sort") || "newest";

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all") {
        params.delete(name);
      } else {
        params.set(name, value);
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleFilterChange = (name: string, value: string) => {
    router.push(`?${createQueryString(name, value)}`);
  };

  return (
    <div className="sticky top-20 z-40 mb-8 w-full border-b border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-md flex flex-col gap-4 lg:flex-row lg:items-center justify-between rounded-2xl overflow-x-auto">
      <div className="flex flex-nowrap items-center gap-2">
        {/* Role Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide bg-slate-100 p-1 rounded-xl shrink-0">
          {[
            { id: "all", label: "All Roles" },
            { id: "doctor", label: "Doctors" },
            { id: "nurse", label: "Nurses" },
            { id: "technician", label: "Technicians" },
          ].map((role) => (
            <button
              key={role.id}
              onClick={() => handleFilterChange("role", role.id)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                currentRole === role.id
                  ? "bg-white text-[#1E40AF] shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {role.label}
            </button>
          ))}
        </div>

        <div className="h-8 w-px bg-slate-200 hidden lg:block mx-2 shrink-0" />

        {/* Job Type Dropdown */}
        <select
          value={currentType}
          onChange={(e) => handleFilterChange("jobType", e.target.value)}
          className="shrink-0 rounded-xl border border-slate-200 bg-white py-2 pl-4 pr-8 text-sm font-medium text-slate-700 outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF]"
        >
          <option value="all">All Types</option>
          <option value="full_time">Full Time</option>
          <option value="part_time">Part Time</option>
        </select>

        {/* Specialty Dropdown */}
        <select
          value={currentSpecialty}
          onChange={(e) => handleFilterChange("specialty", e.target.value)}
          className="shrink-0 rounded-xl border border-slate-200 bg-white py-2 pl-4 pr-8 text-sm font-medium text-slate-700 outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF]"
        >
          <option value="all">All Specialties</option>
          {specialties.map((specialty) => (
            <option key={specialty} value={specialty}>
              {specialty}
            </option>
          ))}
        </select>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="text-sm font-medium text-slate-500">Sort by:</span>
        <select
          value={currentSort}
          onChange={(e) => handleFilterChange("sort", e.target.value)}
          className="rounded-xl border border-slate-200 bg-white py-2 pl-4 pr-8 text-sm font-medium text-slate-700 outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF]"
        >
          <option value="newest">Newest First</option>
          <option value="salary">Highest Salary</option>
        </select>
      </div>
    </div>
  );
}
