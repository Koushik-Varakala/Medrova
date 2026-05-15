"use client";

import { useEffect, useState, useMemo } from "react";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { adminNavigation } from "@/lib/constants";
import { getBooleanValue, getStringValue, getNumberValue, formatCurrencyInr, formatTime, formatDate } from "@/lib/utils";
import type { Shift, Clinic } from "@/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Calendar, Clock, Zap, Stethoscope, Building2 } from "lucide-react";

type TabType = "all" | "active" | "pending_payment" | "confirmed" | "completed" | "cancelled";

export default function AdminShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("all");

  useEffect(() => {
    let isMounted = true;
    async function load() {
      const res = await fetch("/api/shifts");
      const json = (await res.json()) as { shifts?: Record<string, unknown>[] };
      
      const mapped: Shift[] = (json.shifts ?? []).map((s) => {
        const rawClinic = s["clinic"];
        const c = Array.isArray(rawClinic) ? rawClinic[0] : rawClinic;
        const clinicObj = c ? {
          name: getStringValue(c, "name"),
          contactPerson: getStringValue(c, "contact_person"),
          contactPhone: getStringValue(c, "contact_phone"),
          address: getStringValue(c, "address"),
          area: getStringValue(c, "area")
        } : undefined;

        return {
          id: getStringValue(s, "id"), 
          clinicId: getStringValue(s, "clinic_id"),
          specialty: getStringValue(s, "specialty"), 
          date: getStringValue(s, "date"),
          startTime: getStringValue(s, "start_time"), 
          endTime: getStringValue(s, "end_time"),
          pay: getNumberValue(s, "pay"), 
          area: getStringValue(s, "area"),
          notes: getStringValue(s, "notes") || undefined,
          isUrgent: getBooleanValue(s, "is_urgent"),
          status: getStringValue(s, "status") as Shift["status"],
          createdAt: getStringValue(s, "created_at"),
          clinic: clinicObj as unknown as Clinic
        };
      });

      if (!isMounted) return;
      setShifts(mapped);
      setIsLoading(false);
    }
    load();
    return () => { isMounted = false; };
  }, []);

  const filteredShifts = useMemo(() => {
    return shifts.filter(shift => {
      const clinicName = shift.clinic?.name || "";
      const matchesSearch = clinicName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            shift.specialty.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === "all" || shift.status === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [shifts, searchQuery, activeTab]);

  const counts = useMemo(() => ({
    all: shifts.length,
    active: shifts.filter(s => s.status === "active").length,
    pending_payment: shifts.filter(s => s.status === "pending_payment").length,
    confirmed: shifts.filter(s => s.status === "confirmed").length,
    completed: shifts.filter(s => s.status === "completed").length,
    cancelled: shifts.filter(s => s.status === "cancelled").length,
  }), [shifts]);

  const statusColors: Record<string, string> = {
    pending_payment: "bg-amber-100 text-amber-700 border-amber-200",
    active: "bg-blue-100 text-blue-700 border-blue-200",
    confirmed: "bg-purple-100 text-purple-700 border-purple-200",
    completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    cancelled: "bg-slate-100 text-slate-700 border-slate-200"
  };

  return (
    <DashboardShell items={adminNavigation}>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-[#0F172A]">All Shifts</h1>
            {!isLoading && (
              <span className="flex h-7 items-center justify-center rounded-full bg-[#1E40AF]/10 px-3 text-xs font-bold text-[#1E40AF]">
                {shifts.length} Total
              </span>
            )}
          </div>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Monitor all marketplace shifts, urgencies, and statuses.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* FILTER BAR */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1 overflow-x-auto p-1 scrollbar-hide">
            {(["all", "active", "pending_payment", "confirmed", "completed", "cancelled"] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all capitalize whitespace-nowrap",
                  activeTab === tab 
                    ? "bg-[#1E40AF] text-white shadow-md shadow-blue-600/20" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                {tab.replace("_", " ")}
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-black",
                  activeTab === tab ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                )}>
                  {counts[tab]}
                </span>
              </button>
            ))}
          </div>
          
          <div className="relative p-1 sm:w-72 shrink-0">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search clinic or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border-none bg-slate-100 py-2.5 pl-10 pr-4 text-sm font-medium text-[#0F172A] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#1E40AF]/20 focus:border-[#1E40AF] border border-transparent"
            />
          </div>
        </div>

        {/* SHIFT CARDS */}
        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-32 rounded-xl bg-slate-200 animate-pulse border border-slate-300" />)}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredShifts.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center"
              >
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50">
                  <Calendar className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-[#0F172A]">No shifts found</h3>
                <p className="mt-2 text-sm font-medium text-slate-500 max-w-[250px]">
                  No shifts match the current filters.
                </p>
              </motion.div>
            ) : (
              <div className="grid gap-4">
                {filteredShifts.map((shift, i) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    key={shift.id}
                    className="group relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 flex flex-col md:flex-row gap-6 md:items-center"
                  >
                    {/* LEFT - Specialty */}
                    <div className="flex flex-col items-start md:w-1/4 shrink-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-100 flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5" />
                          {shift.specialty}
                        </span>
                        {shift.isUrgent && (
                          <span className="flex items-center gap-1 rounded-md bg-red-100 px-2 py-1 text-xs font-bold text-red-700 border border-red-200">
                            <Zap className="h-3 w-3 fill-red-500" />
                            URGENT
                          </span>
                        )}
                      </div>
                    </div>

                    {/* MIDDLE - Details */}
                    <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                      <h3 className="text-lg font-black text-[#0F172A] flex items-center gap-2">
                        {shift.clinic?.name || "Unknown Clinic"}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-500">
                        <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> {shift.area || shift.clinic?.area || "Unknown Area"}</div>
                        <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-400" /> {formatDate(shift.date)}</div>
                        <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400" /> {formatTime(shift.startTime)} - {formatTime(shift.endTime)}</div>
                      </div>
                    </div>

                    {/* RIGHT - Pay & Status */}
                    <div className="flex md:flex-col items-end justify-between md:justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 md:w-48 shrink-0">
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Shift Pay</p>
                        <p className="text-2xl font-black text-emerald-600">{formatCurrencyInr(shift.pay)}</p>
                      </div>
                      <div className={cn(
                        "rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider mt-2",
                        statusColors[shift.status] || "bg-slate-100 text-slate-700 border-slate-200"
                      )}>
                        {shift.status.replace("_", " ")}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        )}
      </div>
    </DashboardShell>
  );
}
