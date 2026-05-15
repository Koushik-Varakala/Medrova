"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, MapPin, IndianRupee, CheckCircle2 } from "lucide-react";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { professionalNavigation } from "@/lib/constants";
import type { Job, HealthcareProfessional, LocationResult } from "@/types";
import LocationPicker from "@/components/shared/LocationPicker";
import { calculateDistance } from "@/lib/location";
import { formatCurrencyInr } from "@/lib/utils";

export default function ProfessionalJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [profile, setProfile] = useState<HealthcareProfessional | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  
  const [searchSpecialty, setSearchSpecialty] = useState("");
  const [location, setLocation] = useState<LocationResult | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [profRes, appsRes] = await Promise.all([
          fetch("/api/professional/profile"),
          fetch("/api/professional/applications")
        ]);

        const profResult = await profRes.json();
        if (!profRes.ok) throw new Error(profResult.error ?? "Failed to load profile.");

        const role = (profResult.profile as HealthcareProfessional).role;
        const jobsRes = await fetch(`/api/jobs?professionalType=${role}`);
        const jobsResult = (await jobsRes.json()) as { jobs?: Job[]; error?: string };
        const appsResult = (await appsRes.json()) as {
          applications?: Array<{ jobId?: string }>;
          error?: string;
        };

        if (!jobsRes.ok) throw new Error(jobsResult.error ?? "Failed to load jobs.");
        if (!appsRes.ok) throw new Error(appsResult.error ?? "Failed to load applications.");

        if (!isMounted) return;

        setProfile(profResult.profile);
        setJobs(jobsResult.jobs ?? []);
        setAppliedJobIds(new Set((appsResult.applications ?? []).map((app) => app.jobId ?? "").filter(Boolean)));
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : "An error occurred.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  const handleApply = async (jobId: string) => {
    setApplyingId(jobId);
    try {
      const res = await fetch("/api/professional/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId })
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice({ type: "error", message: data.error ?? "Failed to apply." });
      } else {
        setNotice({ type: "success", message: "Successfully applied to job!" });
        setAppliedJobIds((current) => new Set(current).add(jobId));
      }
    } catch {
      setNotice({ type: "error", message: "An unexpected error occurred." });
    } finally {
      setApplyingId(null);
      setTimeout(() => setNotice(null), 4000);
    }
  };

  let filteredJobs = jobs.filter(j => 
    j.specialty.toLowerCase().includes(searchSpecialty.toLowerCase())
  );

  // Simple sorting by distance if location is provided
  if (location && location.lat && location.lng) {
    filteredJobs.sort((a, b) => {
      const distA = a.locationLat && a.locationLng ? calculateDistance(location.lat!, location.lng!, a.locationLat, a.locationLng) : Infinity;
      const distB = b.locationLat && b.locationLng ? calculateDistance(location.lat!, location.lng!, b.locationLat, b.locationLng) : Infinity;
      return distA - distB;
    });
  }

  return (
    <DashboardShell 
      items={professionalNavigation}
      userProfile={profile ? { name: profile.name, verificationStatus: profile.verificationStatus } : undefined}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-[#0F172A]">Permanent Jobs</h1>
        <p className="mt-2 text-sm font-medium text-slate-500">
          Find and apply for full-time and part-time positions.
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

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#1E40AF]" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
          {error}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <h3 className="text-lg font-bold text-slate-900">No jobs found</h3>
          <p className="mt-1 text-sm text-slate-500">Try adjusting your search criteria or location.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredJobs.map((job) => {
            const isFullTime = job.jobType === "full_time";
            const hasApplied = appliedJobIds.has(job.id);
            const userLat = location?.lat ?? profile?.latitude;
            const userLng = location?.lng ?? profile?.longitude;
            let distanceText = "";
            if (userLat && userLng && job.locationLat && job.locationLng) {
              distanceText = `${calculateDistance(userLat, userLng, job.locationLat, job.locationLng).toFixed(1)} km away`;
            }

            return (
              <article key={job.id} className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-[#0F172A]">{job.specialty}</h3>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${isFullTime ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {isFullTime ? 'Full Time' : 'Part Time'}
                    </span>
                    {job.isFreePosting && (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                        Free Posting
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-[#64748B]">
                    <p>{job.clinic?.name ?? "Clinic"}</p>
                    {distanceText && (
                      <p className="mt-1 flex items-center gap-1 text-[#1E40AF]">
                        <MapPin className="h-3.5 w-3.5" /> {distanceText}
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm font-bold text-emerald-600">
                    <IndianRupee className="h-4 w-4" />
                    {formatCurrencyInr(job.salaryMin)} - {formatCurrencyInr(job.salaryMax)} / mo
                  </div>
                  <p className="mt-4 text-sm text-slate-600 line-clamp-2 max-w-2xl">{job.description}</p>
                </div>
                <div className="sm:text-right shrink-0 flex flex-col gap-2">
                  <button
                    onClick={() => handleApply(job.id)}
                    disabled={hasApplied || applyingId === job.id}
                    className="rounded-lg bg-[#1E40AF] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#1D4ED8] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {applyingId === job.id ? "Applying..." : hasApplied ? "Applied" : "Apply Now"}
                  </button>
                  {hasApplied && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-left text-xs font-semibold text-emerald-800">
                      <p className="mb-1 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Contact unlocked
                      </p>
                      {job.contactEmail && <a href={`mailto:${job.contactEmail}`} className="block hover:underline">{job.contactEmail}</a>}
                      {job.contactPhone && <a href={`tel:${job.contactPhone}`} className="block hover:underline">{job.contactPhone}</a>}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
