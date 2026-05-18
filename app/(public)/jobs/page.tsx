import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { JobFilters } from "@/components/public/JobFilters";
import { Briefcase, MapPin, AlertCircle } from "lucide-react";
import Link from "next/link";
import { professionalRoleConfig } from "@/lib/constants";
import { createSupabaseServiceClient } from "@/lib/supabase-server";

// Skeleton for loading states
function JobCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex justify-between mb-4">
        <div className="h-6 w-24 rounded-full bg-slate-200" />
        <div className="h-6 w-16 rounded-full bg-slate-200" />
      </div>
      <div className="h-5 w-40 rounded bg-slate-200 mb-2" />
      <div className="h-4 w-32 rounded bg-slate-200 mb-4" />
      <div className="h-4 w-28 rounded bg-slate-200 mb-6" />
      <div className="flex justify-between items-center">
        <div className="h-8 w-20 rounded bg-slate-200" />
        <div className="h-10 w-24 rounded-full bg-slate-200" />
      </div>
    </div>
  );
}

// Map specialty to color
function getSpecialtyColor(specialty: string) {
  const map: Record<string, string> = {
    "Pediatrics": "bg-blue-100 text-blue-700",
    "General Physician": "bg-slate-100 text-slate-700",
    "Emergency Medicine": "bg-red-100 text-red-700",
    "Gynecology": "bg-pink-100 text-pink-700",
    "Orthopedics": "bg-orange-100 text-orange-700",
    "Cardiology": "bg-rose-100 text-rose-700",
    "Dermatology": "bg-purple-100 text-purple-700",
    "Radiology": "bg-yellow-100 text-yellow-700"
  };
  return map[specialty] || "bg-indigo-100 text-indigo-700";
}

// Fetch jobs from the database
async function getJobs(searchParams: { [key: string]: string | string[] | undefined }) {
  const service = createSupabaseServiceClient();
  if (!service) return { jobs: [], error: "Supabase service not configured" };

  let query = service
    .from("jobs")
    .select("*, clinic:clinics(*)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (searchParams.role && searchParams.role !== "all") {
    query = query.eq("professional_type", searchParams.role as string);
  }

  if (searchParams.specialty && searchParams.specialty !== "all") {
    query = query.eq("specialty", searchParams.specialty as string);
  }
  
  if (searchParams.jobType && searchParams.jobType !== "all") {
    query = query.eq("job_type", searchParams.jobType as string);
  }

  const { data, error } = await query;

  if (error) {
    return { jobs: [], error: error.message };
  }

  let jobs = data ?? [];

  // Sort
  const sort = searchParams.sort as string || "newest";
  if (sort === "salary") {
    jobs = jobs.sort((a, b) => b.salary_max - a.salary_max);
  } else {
    // Newest created (already default from DB)
    jobs = jobs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  return { jobs, error: null };
}

export default async function PublicJobsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const { jobs, error } = await getJobs(searchParams);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-[#1E40AF]/20 pb-24">
      <LandingNavbar forceDark={true} />

      {/* PAGE HEADER */}
      <div className="bg-[#EFF6FF] pt-32 pb-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="text-sm font-medium text-[#1E40AF] mb-4">
            <Link href="/" className="hover:underline">Home</Link> <span className="mx-2">&gt;</span> Browse Jobs
          </div>
          <h1 className="text-4xl font-bold text-[#0F172A] mb-4">Healthcare Jobs in Hyderabad</h1>
          <p className="text-lg text-slate-600 max-w-2xl mb-8">
            Browse permanent and part-time healthcare positions from verified clinics. Free to apply.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full text-sm font-semibold text-[#0F172A] shadow-sm">
              <span className="text-emerald-500 font-bold">✓</span>
              Free job posting for clinics
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full text-sm font-semibold text-[#0F172A] shadow-sm">
              <span className="text-emerald-500 font-bold">₹</span>
              Free to apply
            </div>
          </div>
        </div>
      </div>

      {/* FILTERS AND GRID */}
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
        <JobFilters />

        {error ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-red-300 bg-red-50 text-center">
            <AlertCircle className="h-10 w-10 text-red-400 mb-4" />
            <p className="font-bold text-red-700">Unable to load jobs</p>
            <p className="text-sm text-red-500 mt-1">{error}</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white text-center px-4">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <Briefcase className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-[#0F172A]">No positions available right now</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-md">
              New jobs are posted regularly.
            </p>
            <Link href="/sign-up" className="mt-6 rounded-full bg-white border border-[#E2E8F0] px-6 py-2.5 text-sm font-bold text-[#0F172A] shadow-sm hover:bg-slate-50 transition-all">
              Are you a clinic? Post a job free
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job: any) => {
              const roleConfig = professionalRoleConfig[job.professional_type as keyof typeof professionalRoleConfig];
              const specialtyColor = getSpecialtyColor(job.specialty);
              
              const isFullTime = job.job_type === "full_time";

              return (
                <div key={job.id} className="group rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg flex flex-col">
                  <div className="mb-4 flex items-start justify-between">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${specialtyColor}`}>
                      {job.specialty}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isFullTime ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                      {isFullTime ? "Full Time" : "Part Time"}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-[#0F172A] font-semibold">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      {job.location_display_name || job.clinic?.location_area || "Hyderabad"} Area
                    </div>
                  </div>

                  <div className="mb-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Briefcase className="h-4 w-4 text-slate-400" />
                      Min {job.experience_min} years experience
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="font-bold text-[#10B981]">₹{job.salaryMin?.toLocaleString("en-IN") ?? "0"} - ₹{job.salaryMax?.toLocaleString("en-IN") ?? "0"} / month</span>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-sm text-slate-600 line-clamp-2">{job.description}</p>
                    <span className="text-xs font-medium text-[#1E40AF] hover:underline cursor-pointer">Read more</span>
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                    <div className="flex flex-col">
                      <span className={`text-xs font-bold uppercase tracking-widest text-${roleConfig?.color}-600`}>
                        {roleConfig?.label || "Professional"}
                      </span>
                      {job.is_free_posting && (
                        <span className="text-xs font-bold text-amber-500">Free Posting</span>
                      )}
                    </div>
                    
                    {/* The Apply Modal wrapper */}
                    <a href={`#apply-modal-${job.id}`} className="rounded-xl bg-[#1E40AF] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1D4ED8]">
                      Apply
                    </a>
                  </div>
                  
                  {/* CSS-Only Apply Modal */}
                  <div id={`apply-modal-${job.id}`} className="fixed inset-0 z-[100] hidden items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm target:flex">
                    <a href="#!" className="absolute inset-0 cursor-default" />
                    <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl p-8 text-center animate-in fade-in zoom-in duration-200">
                      <a href="#!" className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all">
                        ✕
                      </a>
                      
                      <h3 className="text-2xl font-black text-[#0F172A] mb-2 mt-4">
                        Sign up to apply for this position
                      </h3>
                      <p className="text-sm text-slate-600 mb-8 font-medium">
                        Join Medrova for free to see full clinic details and contact information.
                      </p>
                      
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-8 text-left">
                        <div className="font-semibold text-[#0F172A] mb-1">{job.specialty} {roleConfig?.label} ({isFullTime ? 'Full Time' : 'Part Time'})</div>
                        <div className="text-sm text-slate-600 flex flex-col gap-1">
                          <div className="flex justify-between items-center">
                            <span>{job.location_display_name || job.clinic?.location_area} Area</span>
                            <span className="font-bold text-[#10B981]">₹{job.salaryMin?.toLocaleString("en-IN") ?? "0"} - ₹{job.salaryMax?.toLocaleString("en-IN") ?? "0"}/mo</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Link
                          href="/sign-up"
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E40AF] py-3.5 text-base font-bold text-white shadow-lg transition-all hover:bg-[#1D4ED8]"
                        >
                          Create Free Account
                        </Link>
                        <Link href="/sign-in" className="block text-sm font-semibold text-slate-500 hover:text-[#1E40AF]">
                          Already have an account? Sign in
                        </Link>
                      </div>
                      
                      <div className="mt-8 text-xs text-slate-400">
                        Joining is free. Doctors, nurses and technicians always pay nothing.
                      </div>
                    </div>
                  </div>
                  
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
