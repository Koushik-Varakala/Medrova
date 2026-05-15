"use client";

import { Check, X, MapPin, Calendar, Clock, Loader2, Zap } from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Application, Shift } from "@/types";
import { ApplicantCard } from "@/components/clinic/ApplicantCard";
import { cn, formatCurrencyInr, formatDate, formatTime } from "@/lib/utils";

interface ClinicShiftManagerProps {
  shifts: Shift[];
  applications: Application[];
}

type TabType = "all" | "active" | "pending_payment" | "confirmed" | "completed";

export function ClinicShiftManager({ shifts, applications }: ClinicShiftManagerProps) {
  const [localShifts, setLocalShifts] = useState<Shift[]>(shifts);
  const [localApps, setLocalApps] = useState<Application[]>(applications);
  
  // Update local state when props change
  useMemo(() => {
    setLocalShifts(shifts);
    setLocalApps(applications);
  }, [shifts, applications]);

  const [selectedShiftId, setSelectedShiftId] = useState(localShifts[0]?.id ?? "");
  const [notice, setNotice] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("all");

  const filteredShifts = useMemo(() => {
    if (activeTab === "all") return localShifts;
    return localShifts.filter(s => s.status === activeTab);
  }, [localShifts, activeTab]);

  const selectedShift = localShifts.find((shift) => shift.id === selectedShiftId) || filteredShifts[0];
  const shiftApplications = localApps.filter((application) => application.shiftId === selectedShift?.id);

  // Auto-select first shift if current selected is filtered out
  if (selectedShift && selectedShift.id !== selectedShiftId) {
    setSelectedShiftId(selectedShift.id);
  }

  async function confirmApplicant(applicationId: string) {
    if (!selectedShift) return;
    
    setIsProcessing(true);
    setNotice("");
    
    try {
      const response = await fetch(`/api/shifts/${selectedShift.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId })
      });

      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        setNotice(result.error ?? "Unable to confirm applicant.");
        return;
      }

      // Optimistic update
      setLocalApps(prev => prev.map(app => app.id === applicationId ? { ...app, status: "confirmed" } : app));
      setLocalShifts(prev => prev.map(s => s.id === selectedShift.id ? { ...s, status: "confirmed" } : s));

      setNotice("✅ Applicant confirmed! Contact details are now unlocked.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function completeShift(applicationId: string) {
    if (!selectedShift) return;
    
    setIsProcessing(true);
    setNotice("Processing shift completion and triggering payout...");
    
    try {
      const response = await fetch(`/api/shifts/${selectedShift.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId })
      });
      
      if (!response.ok) {
        setNotice("Failed to complete shift and trigger payout.");
        return;
      }
      
      // Optimistic update
      setLocalApps(prev => prev.map(app => app.id === applicationId ? { ...app, status: "completed" } : app));
      setLocalShifts(prev => prev.map(s => s.id === selectedShift.id ? { ...s, status: "completed" } : s));

      setNotice("✅ Shift marked as completed! Payment transfer to the doctor has been initiated.");
    } finally {
      setIsProcessing(false);
    }
  }

  const tabs: { label: string; value: TabType }[] = [
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Pending Payment", value: "pending_payment" },
    { label: "Confirmed", value: "confirmed" },
    { label: "Completed", value: "completed" },
  ];

  return (
    <div className="space-y-6">
      {/* TABS */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all",
              activeTab === tab.value 
                ? "bg-[#0F172A] text-white shadow-md" 
                : "bg-white text-[#64748B] hover:bg-slate-100 hover:text-[#0F172A] border border-[#E2E8F0]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-start">
        {/* LEFT COLUMN - SHIFT LIST */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredShifts.map((shift, index) => {
              const isSelected = shift.id === selectedShift?.id;
              
              const statusColors: Record<string, string> = {
                pending_payment: "bg-amber-100 text-amber-700 border-amber-200",
                active: "bg-blue-100 text-blue-700 border-blue-200",
                confirmed: "bg-purple-100 text-purple-700 border-purple-200",
                completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
                cancelled: "bg-red-100 text-red-700 border-red-200"
              };

              return (
                <motion.button
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 24 }}
                  key={shift.id}
                  onClick={() => setSelectedShiftId(shift.id)}
                  className={cn(
                    "block w-full text-left rounded-2xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md",
                    isSelected ? "border-[#1E40AF] ring-1 ring-[#1E40AF] bg-blue-50/50" : "border-[#E2E8F0]"
                  )}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                        {shift.specialty}
                      </span>
                      {shift.isUrgent && (
                        <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700">
                          <Zap className="h-3 w-3 fill-red-500" />
                          URGENT
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-3 sm:flex sm:gap-6">
                    <div className="flex items-center gap-2 text-sm font-medium text-[#0F172A]">
                      <Calendar className="h-4 w-4 text-[#64748B]" />
                      {formatDate(shift.date)}
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-[#0F172A]">
                      <Clock className="h-4 w-4 text-[#64748B]" />
                      {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                    </div>
                  </div>

                  <div className="flex items-end justify-between border-t border-[#E2E8F0] pt-4">
                    <div>
                      <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1">Pay</p>
                      <p className="text-xl font-bold text-emerald-600">{formatCurrencyInr(shift.pay)}</p>
                    </div>
                    <div className={cn(
                      "rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider",
                      statusColors[shift.status] || "bg-slate-100 text-slate-700 border-slate-200"
                    )}>
                      {shift.status.replace("_", " ")}
                    </div>
                  </div>

                  {/* MOBILE INLINE APPLICANTS PANEL */}
                  {isSelected && (
                    <div className="mt-4 border-t border-blue-100 pt-4 lg:hidden">
                      <ApplicantsPanel 
                        applications={shiftApplications} 
                        selectedShift={selectedShift}
                        notice={notice}
                        isProcessing={isProcessing}
                        confirmApplicant={confirmApplicant}
                        completeShift={completeShift}
                        setNotice={setNotice}
                      />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </AnimatePresence>

          {filteredShifts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#E2E8F0] bg-white p-8 text-center">
              <p className="text-[#64748B]">No shifts found in this category.</p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN - APPLICANTS PANEL (DESKTOP) */}
        <div className="hidden lg:block sticky top-6 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <ApplicantsPanel 
            applications={shiftApplications} 
            selectedShift={selectedShift}
            notice={notice}
            isProcessing={isProcessing}
            confirmApplicant={confirmApplicant}
            completeShift={completeShift}
            setNotice={setNotice}
          />
        </div>
      </div>
    </div>
  );
}

// Sub-component for applicants panel
function ApplicantsPanel({ 
  applications, 
  selectedShift, 
  notice, 
  isProcessing, 
  confirmApplicant, 
  completeShift, 
  setNotice 
}: { 
  applications: Application[], 
  selectedShift: Shift | undefined,
  notice: string,
  isProcessing: boolean,
  confirmApplicant: (id: string) => void,
  completeShift: (id: string) => void,
  setNotice: (n: string) => void
}) {
  return (
    <>
      <div className="mb-6 flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
        <h2 className="text-xl font-bold text-[#0F172A]">Applicants</h2>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
          {applications.length}
        </span>
      </div>

      {notice && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-6 overflow-hidden rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm font-medium text-blue-900 shadow-sm"
        >
          {notice}
        </motion.div>
      )}

      <div className="space-y-4">
        {applications.length > 0 ? (
          applications.map((application) => (
            <div key={application.id} className="relative">
              <ApplicantCard 
                application={application} 
                isShiftConfirmed={selectedShift?.status === "confirmed" || selectedShift?.status === "completed"}
              />
              
              {/* Action Buttons Below Card */}
              {application.status === "applied" && selectedShift?.status === "active" && (
                <div className="mt-3 flex gap-3">
                  <button
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1E40AF] py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#1D4ED8]"
                    onClick={(e) => { e.stopPropagation(); confirmApplicant(application.id); }}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Confirm Doctor
                  </button>
                  <button
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white py-2.5 text-sm font-bold text-[#0F172A] hover:bg-slate-50"
                    onClick={(e) => { e.stopPropagation(); setNotice("Applicant rejected locally. (UI simulated)"); }}
                    disabled={isProcessing}
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              )}

              {application.status === "confirmed" && selectedShift?.status === "confirmed" && (
                <div className="mt-4">
                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#10B981] py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[#059669]"
                    onClick={(e) => { e.stopPropagation(); completeShift(application.id); }}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                    Mark Completed & Transfer Payment
                  </button>
                </div>
              )}

              {application.status === "completed" && selectedShift?.status === "completed" && (
                <div className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-100 py-3 text-sm font-bold text-emerald-700 border border-emerald-200">
                  <Check className="h-5 w-5" />
                  Shift Completed & Paid
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
              <Users className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-[#0F172A]">No applicants yet</h3>
            <p className="mt-1 max-w-[250px] text-sm text-[#64748B]">
              {selectedShift?.status === "active" 
                ? "This shift is live and visible to doctors. Check back soon!" 
                : "This shift is not active yet."}
            </p>
          </div>
        )}
      </div>
    </>
  );
}

// Simple internal icon since Users isn't imported from lucide-react at top, let's fix that
function Users(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
