"use client";

import { useState, useMemo } from "react";
import { 
  CheckCircle, 
  XCircle, 
  Search, 
  MapPin, 
  Phone,
  Building2,
  ExternalLink,
  X,
  Loader2
} from "lucide-react";
import type { Clinic, VerificationStatus } from "@/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

function RejectModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isProcessing 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: (note: string) => void;
  isProcessing: boolean;
}) {
  const [note, setNote] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#0F172A]">Reject Clinic</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-6 bg-slate-50">
          <label className="block text-sm font-bold text-slate-700 mb-2">Reason for rejection (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Invalid registration document, unverifiable address..."
            className="w-full h-32 rounded-xl border border-slate-300 p-3 text-sm text-[#0F172A] outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20 resize-none bg-white"
          />
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => onConfirm(note || "Registration needs review.")}
            disabled={isProcessing}
            className="px-6 py-2 rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-700 transition-colors flex items-center gap-2 shadow-md shadow-red-600/20 disabled:opacity-70"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Confirm Rejection
          </button>
        </div>
      </motion.div>
    </div>
  );
}

interface AdminClinicTableProps {
  clinics: Clinic[];
}

type TabType = "all" | "pending" | "verified" | "rejected";

export function AdminClinicTable({ clinics: initialClinics }: AdminClinicTableProps) {
  const [clinics, setClinics] = useState<Clinic[]>(initialClinics);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("all");
  
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [successFlash, setSuccessFlash] = useState<string | null>(null);

  const filteredClinics = useMemo(() => {
    return clinics.filter(clinic => {
      const matchesSearch = clinic.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === "all" || clinic.verificationStatus === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [clinics, searchQuery, activeTab]);

  const counts = useMemo(() => ({
    all: clinics.length,
    pending: clinics.filter(c => c.verificationStatus === "pending").length,
    verified: clinics.filter(c => c.verificationStatus === "verified").length,
    rejected: clinics.filter(c => c.verificationStatus === "rejected").length,
  }), [clinics]);

  async function verifyClinic(clinicId: string, status: VerificationStatus, note?: string) {
    setLoadingId(clinicId);

    try {
      const response = await fetch(`/api/admin/clinics/${clinicId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          note: note || (status === "verified" ? "Approved by Medrova admin." : "Registration needs review.")
        })
      });

      if (!response.ok) throw new Error();

      setClinics((prev) =>
        prev.map((c) =>
          c.id === clinicId ? { ...c, verificationStatus: status, verificationNote: note } : c
        )
      );

      setRejectModalId(null);
      
      if (status === "verified") {
        setSuccessFlash(clinicId);
        setTimeout(() => setSuccessFlash(null), 2000);
      }
    } catch (e) {
      alert("Unable to update clinic status. Please try again.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* FILTER BAR */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1 overflow-x-auto p-1 scrollbar-hide">
          {(["all", "pending", "verified", "rejected"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all capitalize",
                activeTab === tab 
                  ? "bg-[#1E40AF] text-white shadow-md shadow-blue-600/20" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              {tab}
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
            placeholder="Search clinics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border-none bg-slate-100 py-2.5 pl-10 pr-4 text-sm font-medium text-[#0F172A] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#1E40AF]/20 focus:border-[#1E40AF] border border-transparent"
          />
        </div>
      </div>

      {/* CLINIC CARDS */}
      <AnimatePresence mode="popLayout">
        {filteredClinics.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center"
          >
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50">
              <Building2 className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-[#0F172A]">No clinics found</h3>
            <p className="mt-2 text-sm font-medium text-slate-500 max-w-[250px]">
              We couldn&apos;t find any clinics matching your current filters.
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {filteredClinics.map((clinic, i) => {
              const isPending = clinic.verificationStatus === "pending";
              const isVerified = clinic.verificationStatus === "verified";
              const isRejected = clinic.verificationStatus === "rejected";
              const isProcessing = loadingId === clinic.id;
              const isSuccess = successFlash === clinic.id;

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  key={clinic.id}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition-all hover:shadow-md flex flex-col xl:flex-row gap-6",
                    isSuccess ? "border-emerald-400 bg-emerald-50/50" : "border-[#E2E8F0]"
                  )}
                >
                  {/* LEFT - Profile */}
                  <div className="flex gap-4 xl:w-1/3 shrink-0">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 shadow-inner">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-[#0F172A]">{clinic.name}</h2>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-purple-50 px-2 py-1 text-xs font-bold text-purple-700 border border-purple-100 uppercase tracking-wider">
                          {clinic.type}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-slate-500">
                        <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {clinic.area}</div>
                        <div className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {clinic.contactPhone}</div>
                      </div>
                    </div>
                  </div>

                  {/* CENTER - Status */}
                  <div className="xl:flex-1 flex flex-col justify-center border-t border-b xl:border-t-0 xl:border-b-0 xl:border-x border-slate-100 py-4 xl:py-0 xl:px-6">
                    <div>
                      {isPending && (
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                          </span>
                          <span className="text-sm font-bold text-amber-600">Pending Verification</span>
                        </div>
                      )}
                      {isVerified && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <span className="text-sm font-bold text-emerald-600">Verified</span>
                        </div>
                      )}
                      {isRejected && (
                        <div>
                          <div className="flex items-center gap-2 text-red-600">
                            <XCircle className="w-4 h-4" />
                            <span className="text-sm font-bold">Rejected</span>
                          </div>
                          {clinic.verificationNote && (
                            <p className="mt-1 text-xs font-medium text-red-500 bg-red-50 p-2 rounded-lg border border-red-100">{clinic.verificationNote}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT - Documents & Actions */}
                  <div className="flex flex-col sm:flex-row xl:flex-col gap-6 xl:w-1/3 shrink-0">
                    <div className="flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Documents</p>
                      <div className="flex gap-2">
                        <DocButton href={clinic.regCertUrl} label="Registration" />
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-end">
                      {isPending && (
                        <div className="flex gap-2 w-full">
                          <button
                            onClick={() => verifyClinic(clinic.id, "verified")}
                            disabled={isProcessing}
                            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#10B981] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600 transition-all disabled:opacity-70"
                          >
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectModalId(clinic.id)}
                            disabled={isProcessing}
                            className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 hover:border-red-300 transition-all disabled:opacity-70"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {rejectModalId && (
          <RejectModal
            isOpen={true}
            isProcessing={loadingId === rejectModalId}
            onClose={() => setRejectModalId(null)}
            onConfirm={(note) => verifyClinic(rejectModalId, "rejected", note)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function DocButton({ href, label }: { href?: string; label: string }) {
  if (!href) {
    return (
      <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-400 cursor-not-allowed">
        <X className="h-3 w-3" /> {label}
      </div>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 transition-all hover:bg-purple-100 hover:border-purple-300 shadow-sm"
    >
      <ExternalLink className="h-3 w-3" /> {label}
    </a>
  );
}
