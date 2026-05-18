import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { ShiftFilters } from "@/components/public/ShiftFilters";
import { Calendar, Clock, MapPin, Zap, AlertCircle } from "lucide-react";
import Link from "next/link";
import { professionalRoleConfig } from "@/lib/constants";
import { createSupabaseServiceClient } from "@/lib/supabase-server";

// Skeleton for loading states
function ShiftCardSkeleton() {
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

// Fetch shifts from the database
async function getShifts(searchParams: { [key: string]: string | string[] | undefined }) {
  const service = createSupabaseServiceClient();
  if (!service) return { shifts: [], error: "Supabase service not configured" };

  let query = service
    .from("shifts")
    .select("*, clinic:clinics(*)")
    .eq("status", "active")
    .order("date", { ascending: true });

  if (searchParams.role && searchParams.role !== "all") {
    query = query.eq("professional_type", searchParams.role as string);
  }

  if (searchParams.specialty && searchParams.specialty !== "all") {
    query = query.eq("specialty", searchParams.specialty as string);
  }

  if (searchParams.area && searchParams.area !== "all") {
    query = query.eq("clinics.location_area", searchParams.area as string);
  }

  const { data, error } = await query;

  if (error) {
    return { shifts: [], error: error.message };
  }

  let shifts = data ?? [];

  // Filter out shifts where the clinic area doesn't match (due to Supabase joined filtering semantics)
  if (searchParams.area && searchParams.area !== "all") {
    shifts = shifts.filter((s) => s.clinic && s.clinic.location_area === searchParams.area);
  }

  // Sort
  const sort = searchParams.sort as string || "newest";
  if (sort === "pay") {
    shifts = shifts.sort((a, b) => b.pay_amount - a.pay_amount);
  } else if (sort === "urgent") {
    shifts = shifts.sort((a, b) => (b.is_urgent ? 1 : 0) - (a.is_urgent ? 1 : 0));
  } else {
    // Newest created
    shifts = shifts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  return { shifts, error: null };
}

export default async function PublicShiftsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const { shifts, error } = await getShifts(searchParams);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-[#1E40AF]/20 pb-24">
      <LandingNavbar forceDark={true} />

      {/* PAGE HEADER */}
      <div className="bg-[#EFF6FF] pt-32 pb-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="text-sm font-medium text-[#1E40AF] mb-4">
            <Link href="/" className="hover:underline">Home</Link> <span className="mx-2">&gt;</span> Browse Shifts
          </div>
          <h1 className="text-4xl font-bold text-[#0F172A] mb-4">Locum Shifts in Hyderabad</h1>
          <p className="text-lg text-slate-600 max-w-2xl mb-8">
            Browse verified locum shifts currently available. Create a free account to apply instantly.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full text-sm font-semibold text-[#0F172A] shadow-sm">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Updated in real-time
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full text-sm font-semibold text-[#0F172A] shadow-sm">
              <span className="text-emerald-500 font-bold">₹</span>
              Free to apply as a professional
            </div>
          </div>
        </div>
      </div>

      {/* FILTERS AND GRID */}
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
        <ShiftFilters />

        {error ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-red-300 bg-red-50 text-center">
            <AlertCircle className="h-10 w-10 text-red-400 mb-4" />
            <p className="font-bold text-red-700">Unable to load shifts</p>
            <p className="text-sm text-red-500 mt-1">{error}</p>
          </div>
        ) : shifts.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white text-center px-4">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <Calendar className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-[#0F172A]">No shifts available right now</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-md">
              Check back soon — clinics post new shifts daily.
            </p>
            <Link href="/sign-up" className="mt-6 rounded-full bg-[#1E40AF] px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#1D4ED8] transition-all">
              Get notified when new shifts are posted
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shifts.map((shift: any) => {
              const roleConfig = professionalRoleConfig[shift.professional_type as keyof typeof professionalRoleConfig];
              const specialtyColor = getSpecialtyColor(shift.specialty);
              
              // Duration calculation
              const [startH, startM] = shift.start_time.split(':');
              const [endH, endM] = shift.end_time.split(':');
              const start = new Date(0, 0, 0, parseInt(startH), parseInt(startM));
              const end = new Date(0, 0, 0, parseInt(endH), parseInt(endM));
              let diff = (end.getTime() - start.getTime()) / 1000 / 60 / 60;
              if (diff < 0) diff += 24; // Handle overnight shifts

              return (
                <div key={shift.id} className="group rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg flex flex-col">
                  <div className="mb-4 flex items-start justify-between">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${specialtyColor}`}>
                      {shift.specialty}
                    </span>
                    {shift.is_urgent && (
                      <span className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                        <Zap className="h-3 w-3" fill="currentColor" /> Urgent
                      </span>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-[#0F172A] font-semibold">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      {shift.clinic?.location_area || "Hyderabad"} Area
                    </div>
                  </div>

                  <div className="mb-6 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      {new Date(shift.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="h-4 w-4 text-slate-400" />
                      {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)} ({diff} hours)
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                    <div className="flex flex-col">
                      <span className={`text-xs font-bold uppercase tracking-widest text-${roleConfig?.color}-600`}>
                        {roleConfig?.label || "Professional"}
                      </span>
                      <span className="text-xl font-bold text-[#10B981]">
                        ₹{shift.pay?.toLocaleString("en-IN") ?? "0"}
                      </span>
                    </div>
                    
                    {/* The Apply Modal wrapper */}
                    <a href="#apply-modal" className="rounded-xl bg-[#1E40AF] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1D4ED8]">
                      Apply
                    </a>
                  </div>
                  
                  {/* CSS-Only Apply Modal */}
                  <div id="apply-modal" className="fixed inset-0 z-[100] hidden items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm target:flex">
                    <a href="#!" className="absolute inset-0 cursor-default" />
                    <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl p-8 text-center animate-in fade-in zoom-in duration-200">
                      <a href="#!" className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all">
                        ✕
                      </a>
                      
                      <h3 className="text-2xl font-black text-[#0F172A] mb-2 mt-4">
                        Sign up to apply for this shift
                      </h3>
                      <p className="text-sm text-slate-600 mb-8 font-medium">
                        Join Medrova for free to see full clinic details, location, and apply instantly.
                      </p>
                      
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-8 text-left">
                        <div className="font-semibold text-[#0F172A] mb-1">{shift.specialty} {roleConfig?.label}</div>
                        <div className="text-sm text-slate-600 flex items-center justify-between">
                          <span>{shift.clinic?.location_area} Area</span>
                          <span className="font-bold text-[#10B981]">₹{shift.pay?.toLocaleString("en-IN") ?? "0"}</span>
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
