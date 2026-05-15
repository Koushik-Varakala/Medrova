"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CalendarCheck, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  X,
  Search,
  Loader2
} from "lucide-react";
import { hyderabadAreas, specialties } from "@/lib/constants";
import type { Doctor, Shift } from "@/types";
import { formatCurrencyInr } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface DoctorShiftBrowserProps {
  doctor: Doctor;
  shifts: Shift[];
}

export function DoctorShiftBrowser({ doctor, shifts }: DoctorShiftBrowserProps) {
  const [specialty, setSpecialty] = useState("");
  const [area, setArea] = useState("");
  const [date, setDate] = useState("");
  const [minimumPay, setMinimumPay] = useState("");
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [appliedShifts, setAppliedShifts] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<{ type: "success" | "error", msg: string } | null>(null);

  const filteredShifts = useMemo(() => {
    return shifts.filter((shift) => {
      // Don't show shifts we just applied to in this session
      if (appliedShifts.has(shift.id)) return false;

      const matchesSpecialty = specialty ? shift.specialty === specialty : true;
      const matchesArea = area ? shift.area === area : true;
      const matchesDate = date ? shift.date === date : true;
      const matchesPay = minimumPay ? shift.pay >= Number(minimumPay) : true;
      const matchesStatus = shift.status === "active";

      return matchesStatus && matchesSpecialty && matchesArea && matchesDate && matchesPay;
    });
  }, [area, date, minimumPay, shifts, specialty, appliedShifts]);

  async function applyToShift(shiftId: string) {
    setNotice(null);
    setApplyingTo(shiftId);
    
    try {
      const response = await fetch(`/api/shifts/${shiftId}/apply`, { method: "POST" });
      
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        setNotice({ type: "error", msg: result.error ?? "Unable to apply for this shift." });
        return;
      }

      // Success
      setAppliedShifts(prev => new Set(prev).add(shiftId));
      setNotice({ type: "success", msg: "Application submitted successfully." });
    } catch (e) {
      setNotice({ type: "error", msg: "A network error occurred." });
    } finally {
      setApplyingTo(null);
    }
  }

  const clearFilters = () => {
    setSpecialty("");
    setArea("");
    setDate("");
    setMinimumPay("");
  };

  const hasActiveFilters = specialty || area || date || minimumPay;

  return (
    <div className="space-y-6">
      {/* Header handled by parent, but we add the live indicator here */}
      <div className="flex items-center gap-2">
        <div className="relative flex h-3 w-3 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
        </div>
        <p className="text-sm font-medium text-emerald-600">
          {filteredShifts.length} {filteredShifts.length === 1 ? 'shift' : 'shifts'} available
        </p>
      </div>

      {doctor.verificationStatus !== "verified" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm">
          Applications unlock after Medrova verifies your profile. You can browse available shifts in the meantime.
        </div>
      )}

      {notice && (
        <div className={cn(
          "rounded-xl border p-4 text-sm font-medium shadow-sm flex items-center justify-between",
          notice.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
        )}>
          {notice.msg}
          <button onClick={() => setNotice(null)} className="opacity-50 hover:opacity-100"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* FILTER BAR */}
      <div className="sticky top-0 z-20 -mx-4 overflow-hidden bg-white/80 px-4 pb-4 pt-2 backdrop-blur-md sm:mx-0 sm:rounded-2xl sm:border sm:border-[#E2E8F0] sm:p-4 sm:shadow-sm">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:pb-0">
          <SelectFilter label="Specialty" onChange={setSpecialty} options={specialties} value={specialty} />
          <SelectFilter label="Area" onChange={setArea} options={hyderabadAreas} value={area} />
          
          <div className="w-full">
            <label className="mb-1.5 hidden text-xs font-bold uppercase tracking-wider text-[#64748B] sm:block">Date</label>
            <input
              className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm font-medium text-[#0F172A] outline-none transition-all focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20"
              onChange={(e) => setDate(e.target.value)}
              type="date"
              value={date}
            />
          </div>
          
          <div className="w-full">
            <label className="mb-1.5 hidden text-xs font-bold uppercase tracking-wider text-[#64748B] sm:block">Min Pay</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm font-medium text-slate-400">₹</span>
              <input
                className="w-full rounded-xl border border-[#E2E8F0] bg-white pl-7 pr-3 py-2.5 text-sm font-medium text-[#0F172A] outline-none transition-all focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20"
                onChange={(e) => setMinimumPay(e.target.value)}
                placeholder="2000"
                type="number"
                value={minimumPay}
              />
            </div>
          </div>
        </div>

        {/* ACTIVE FILTERS PILLS */}
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: "auto", opacity: 1, marginTop: 16 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              className="flex flex-wrap items-center gap-2 overflow-hidden"
            >
              {specialty && <FilterPill label={specialty} onRemove={() => setSpecialty("")} />}
              {area && <FilterPill label={area} onRemove={() => setArea("")} />}
              {date && <FilterPill label={new Date(date).toLocaleDateString()} onRemove={() => setDate("")} />}
              {minimumPay && <FilterPill label={`₹${minimumPay}+`} onRemove={() => setMinimumPay("")} />}
              
              <button 
                onClick={clearFilters}
                className="ml-2 text-xs font-semibold text-[#1E40AF] hover:underline"
              >
                Clear all
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SHIFT CARDS GRID */}
      {filteredShifts.length > 0 ? (
        <motion.div 
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.05 } }
          }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence>
            {filteredShifts.map((shift) => (
              <ShiftGridCard
                key={shift.id}
                shift={shift}
                canApply={doctor.verificationStatus === "verified"}
                isApplying={applyingTo === shift.id}
                onApply={() => applyToShift(shift.id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E2E8F0] bg-white py-16 text-center shadow-sm"
        >
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-400">
            <Search className="h-10 w-10" />
          </div>
          <h3 className="text-xl font-bold text-[#0F172A]">No shifts match your filters</h3>
          <p className="mt-2 max-w-md text-sm text-[#64748B]">
            Try adjusting your filters, clearing them, or checking back later as clinics post new shifts.
          </p>
          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              className="mt-6 rounded-xl bg-[#1E40AF] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1D4ED8]"
            >
              Clear all filters
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ----- COMPONENTS -----

function SelectFilter({ label, onChange, options, value }: { label: string; options: string[]; value: string; onChange: (v: string) => void; }) {
  return (
    <div className="w-full">
      <label className="mb-1.5 hidden text-xs font-bold uppercase tracking-wider text-[#64748B] sm:block">{label}</label>
      <select
        className="w-full appearance-none rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm font-medium text-[#0F172A] outline-none transition-all focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20"
        onChange={(e) => onChange(e.target.value)}
        value={value}
      >
        <option value="">All {label}s</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="flex items-center gap-1.5 rounded-full bg-[#1E40AF]/10 px-3 py-1 text-xs font-semibold text-[#1E40AF]"
    >
      {label}
      <button onClick={onRemove} className="rounded-full p-0.5 hover:bg-[#1E40AF]/20">
        <X className="h-3 w-3" />
      </button>
    </motion.div>
  );
}

function ShiftGridCard({ shift, canApply, isApplying, onApply }: { shift: Shift; canApply: boolean; isApplying: boolean; onApply: () => void }) {
  // Pastel colors for specialties
  const specialtyColors: Record<string, string> = {
    "General Medicine": "bg-blue-100 text-blue-700 border-l-blue-500",
    "Pediatrics": "bg-pink-100 text-pink-700 border-l-pink-500",
    "Orthopedics": "bg-emerald-100 text-emerald-700 border-l-emerald-500",
    "Gynecology": "bg-purple-100 text-purple-700 border-l-purple-500",
    "Dermatology": "bg-amber-100 text-amber-700 border-l-amber-500",
  };
  
  const defaultColor = "bg-slate-100 text-slate-700 border-l-slate-500";
  const colorClass = specialtyColors[shift.specialty] || defaultColor;

  const formattedDate = new Date(shift.date).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric"
  });

  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#E2E8F0] border-l-4 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md",
        colorClass.split(" ")[2]
      )}
    >
      {shift.isUrgent && (
        <div className="absolute left-0 right-0 top-0 bg-red-500 px-3 py-1 text-center text-[10px] font-bold tracking-wider text-white">
          ⚡ URGENT COVER NEEDED
        </div>
      )}

      <div className={cn("mb-4 flex flex-col items-start gap-1", shift.isUrgent && "mt-4")}>
        <h3 className="line-clamp-1 text-lg font-bold text-[#0F172A]" title={shift.clinic?.name}>
          {shift.clinic?.name || "Clinic"}
        </h3>
        <div className="flex items-center gap-1.5 text-sm font-medium text-[#64748B]">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="line-clamp-1">{shift.clinic?.area || shift.area}</span>
        </div>
      </div>

      <div className="mb-6 space-y-3">
        <span className={cn("inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold", colorClass.split(" ")[0], colorClass.split(" ")[1])}>
          {shift.specialty}
        </span>
        <div className="flex items-center gap-4 text-sm font-medium text-[#0F172A]">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-[#64748B]" />
            {formattedDate}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-[#64748B]" />
            {shift.startTime} - {shift.endTime}
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-end justify-between border-t border-[#E2E8F0] pt-4">
        <div>
          <p className="text-xs font-medium text-[#64748B]">Pay</p>
          <p className="text-xl font-bold tracking-tight text-emerald-600">
            {formatCurrencyInr(shift.pay)}
          </p>
        </div>
        
        {canApply && (
          <button
            onClick={onApply}
            disabled={isApplying}
            className="flex h-10 w-24 items-center justify-center rounded-xl bg-[#1E40AF] text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1D4ED8] disabled:opacity-70"
          >
            {isApplying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export function ShiftSkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex h-[220px] animate-pulse flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <div className="space-y-3">
            <div className="h-6 w-3/4 rounded-md bg-slate-200"></div>
            <div className="h-4 w-1/2 rounded-md bg-slate-200"></div>
          </div>
          <div className="space-y-3">
            <div className="h-5 w-1/3 rounded-md bg-slate-200"></div>
            <div className="flex gap-4">
              <div className="h-4 w-20 rounded-md bg-slate-200"></div>
              <div className="h-4 w-20 rounded-md bg-slate-200"></div>
            </div>
          </div>
          <div className="flex items-end justify-between border-t border-slate-100 pt-4">
            <div className="h-8 w-24 rounded-md bg-slate-200"></div>
            <div className="h-10 w-24 rounded-xl bg-slate-200"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
