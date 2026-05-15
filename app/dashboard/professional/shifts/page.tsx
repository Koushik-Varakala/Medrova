"use client";

import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { professionalNavigation } from "@/lib/constants";
import { ShiftCard } from "@/components/shared/ShiftCard";
import type { Shift, HealthcareProfessional, LocationResult } from "@/types";
import LocationPicker from "@/components/shared/LocationPicker";
import { scoreShifts } from "@/lib/location";

type ShiftFilter = "all" | "urgent" | "nearby" | "topPay";

export default function ProfessionalShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [profile, setProfile] = useState<HealthcareProfessional | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  
  // Search and Location state
  const [searchSpecialty, setSearchSpecialty] = useState("");
  const [location, setLocation] = useState<LocationResult | null>(null);
  const [activeFilter, setActiveFilter] = useState<ShiftFilter>("all");

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [profRes, shiftsRes] = await Promise.all([
          fetch("/api/professional/profile"),
          fetch("/api/professional/shifts")
        ]);

        const profResult = await profRes.json();
        const shiftsResult = await shiftsRes.json();

        if (!profRes.ok) throw new Error(profResult.error ?? "Failed to load profile.");
        if (!shiftsRes.ok) throw new Error(shiftsResult.error ?? "Failed to load shifts.");

        if (!isMounted) return;

        setProfile(profResult.profile);
        setShifts(shiftsResult.shifts ?? []);
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : "An error occurred.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  const handleApply = async (shiftId: string) => {
    setApplyingId(shiftId);
    try {
      const res = await fetch("/api/professional/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shiftId })
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice({ type: "error", message: data.error ?? "Failed to apply." });
      } else {
        setNotice({ type: "success", message: "Successfully applied to shift!" });
      }
    } catch {
      setNotice({ type: "error", message: "An unexpected error occurred." });
    } finally {
      setApplyingId(null);
      setTimeout(() => setNotice(null), 4000);
    }
  };

  // Filter and Score shifts
  let filteredShifts = shifts.filter(s => 
    s.specialty.toLowerCase().includes(searchSpecialty.toLowerCase())
  );

  if (activeFilter === "urgent") {
    filteredShifts = filteredShifts.filter((shift) => shift.isUrgent);
  }
  if (activeFilter === "nearby") {
    filteredShifts = filteredShifts.filter((shift) => {
      const userLat = location?.lat ?? profile?.latitude;
      const userLng = location?.lng ?? profile?.longitude;
      return Boolean(userLat && userLng && shift.latitude && shift.longitude);
    });
  }
  if (activeFilter === "topPay") {
    filteredShifts = [...filteredShifts].sort((a, b) => b.pay - a.pay);
  }

  // If user provided a location, score and sort the shifts
  if (activeFilter !== "topPay" && location && location.lat && location.lng) {
    filteredShifts = scoreShifts(filteredShifts, location.lat, location.lng);
  } else if (activeFilter !== "topPay" && profile?.latitude && profile?.longitude) {
    // Fallback to user's home location if they haven't explicitly set a search location
    filteredShifts = scoreShifts(filteredShifts, profile.latitude, profile.longitude);
  }

  const filterPills: Array<{ value: ShiftFilter; label: string }> = [
    { value: "all", label: "All" },
    { value: "urgent", label: "Urgent" },
    { value: "nearby", label: "Nearby" },
    { value: "topPay", label: "Top Pay" }
  ];

  return (
    <DashboardShell 
      items={professionalNavigation}
      userProfile={profile ? { name: profile.name, verificationStatus: profile.verificationStatus } : undefined}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-[#0F172A]">Available Shifts</h1>
        <p className="mt-2 text-sm font-medium text-slate-500">
          Find and apply for locum shifts that match your role.
        </p>
      </div>

      {notice && (
        <div className={`mb-4 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
          notice.type === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-red-200 bg-red-50 text-red-700"
        }`}>
          {notice.type === "success" ? "✓" : "✕"} {notice.message}
        </div>
      )}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-2 block text-sm font-bold text-slate-700">Search Specialty</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="e.g. ICU, Emergency..."
              value={searchSpecialty}
              onChange={(e) => setSearchSpecialty(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
        <div className="flex-1">
          <LocationPicker
            label="Filter by Location"
            value={location}
            onChange={setLocation}
          />
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {filterPills.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setActiveFilter(filter.value)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              activeFilter === filter.value
                ? "bg-[#1E40AF] text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#1E40AF]" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
          {error}
        </div>
      ) : filteredShifts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <h3 className="text-lg font-bold text-slate-900">No shifts found</h3>
          <p className="mt-1 text-sm text-slate-500">Try adjusting your search criteria or location.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredShifts.map((shift) => (
            <ShiftCard 
              key={shift.id} 
              shift={shift} 
              actionLabel={applyingId === shift.id ? "Applying..." : "Apply Now"}
              onAction={() => handleApply(shift.id)}
              userLat={location?.lat ?? profile?.latitude}
              userLng={location?.lng ?? profile?.longitude}
              shiftLat={shift.latitude}
              shiftLng={shift.longitude}
            />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
