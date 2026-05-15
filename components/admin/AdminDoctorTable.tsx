"use client";

import { useState, useMemo } from "react";
import { 
  CheckCircle, 
  XCircle, 
  Search, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  ExternalLink,
  X,
  UserRound,
  Loader2,
  Stethoscope,
  Heart,
  FlaskConical,
  Trash2
} from "lucide-react";
import type { VerificationStatus, ProfessionalRole } from "@/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

function RejectModal({ 
  isOpen, onClose, onConfirm, isProcessing 
}: { 
  isOpen: boolean; onClose: () => void; onConfirm: (note: string) => void; isProcessing: boolean;
}) {
  const [note, setNote] = useState("");
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#0F172A]">Reject Professional</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-6 bg-slate-50">
          <label className="block text-sm font-bold text-slate-700 mb-2">Reason for rejection (optional)</label>
          <textarea
            value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Blurry documents, missing registration..."
            className="w-full h-32 rounded-xl border border-slate-300 p-3 text-sm text-[#0F172A] outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20 resize-none bg-white"
          />
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
          <button onClick={() => onConfirm(note || "Documents need review.")} disabled={isProcessing} className="px-6 py-2 rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-700 transition-colors flex items-center gap-2 shadow-md shadow-red-600/20 disabled:opacity-70">
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Confirm Rejection
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// Update local type to handle the merged fields from the API
export interface ProfessionalApiRow {
  id: string;
  user_id: string;
  role: ProfessionalRole;
  name: string;
  phone: string;
  email: string;
  specialty: string;
  experience: number;
  registration_number: string;
  city: string;
  area: string;
  verification_status: VerificationStatus;
  verification_note: string | null;
  primary_cert_url: string | null;
  degree_cert_url: string | null;
  gov_id_url: string | null;
  created_at: string;
  _sourceTable: "doctors" | "professionals";
}

interface AdminProfessionalTableProps {
  professionals: ProfessionalApiRow[];
}

type TabType = "all" | "doctors" | "nurses" | "technicians" | "pending" | "verified" | "rejected";

export function AdminProfessionalTable({ professionals: initialData }: AdminProfessionalTableProps) {
  const [professionals, setProfessionals] = useState<ProfessionalApiRow[]>(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("all");
  
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [successFlash, setSuccessFlash] = useState<string | null>(null);

  const filteredProfessionals = useMemo(() => {
    return professionals.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.specialty.toLowerCase().includes(searchQuery.toLowerCase());
      let matchesTab = true;
      if (activeTab === "pending" || activeTab === "verified" || activeTab === "rejected") {
        matchesTab = p.verification_status === activeTab;
      } else if (activeTab === "doctors") matchesTab = p.role === "doctor";
      else if (activeTab === "nurses") matchesTab = p.role === "nurse";
      else if (activeTab === "technicians") matchesTab = p.role === "technician";
      
      return matchesSearch && matchesTab;
    });
  }, [professionals, searchQuery, activeTab]);

  const counts = useMemo(() => ({
    all: professionals.length,
    doctors: professionals.filter(p => p.role === "doctor").length,
    nurses: professionals.filter(p => p.role === "nurse").length,
    technicians: professionals.filter(p => p.role === "technician").length,
    pending: professionals.filter(p => p.verification_status === "pending").length,
    verified: professionals.filter(p => p.verification_status === "verified").length,
    rejected: professionals.filter(p => p.verification_status === "rejected").length,
  }), [professionals]);

  async function deleteProfessional(profId: string) {
    setLoadingId(profId);
    try {
      const res = await fetch(`/api/admin/users/${profId}/delete`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Failed to delete.");
        return;
      }
      setProfessionals(prev => prev.filter(p => p.id !== profId));
      setDeleteConfirmId(null);
    } catch {
      alert("An unexpected error occurred.");
    } finally {
      setLoadingId(null);
    }
  }

  async function verifyProfessional(profId: string, status: VerificationStatus, note?: string) {
    setLoadingId(profId);
    const prof = professionals.find(p => p.id === profId);
    if (!prof) return;

    try {
      const response = await fetch(`/api/admin/doctors/${profId}/verify?table=${prof._sourceTable}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          note: note || (status === "verified" ? "Approved by Medrova admin." : "Documents need review.")
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({})) as { error?: string };
        alert(errData.error ?? `Failed to update status (${response.status}). Please try again.`);
        return;
      }

      setProfessionals((prev) =>
        prev.map((p) =>
          p.id === profId ? { ...p, verification_status: status, verification_note: note || null } : p
        )
      );

      setRejectModalId(null);
      
      if (status === "verified") {
        setSuccessFlash(profId);
        setTimeout(() => setSuccessFlash(null), 2000);
      }
    } catch {
      alert("Network error. Please check your connection and try again.");
    } finally {
      setLoadingId(null);
    }
  }

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").substring(0,2).toUpperCase();

  const getRoleColors = (role: string) => {
    if (role === "doctor") return { bg: "bg-blue-600 to-blue-800", text: "text-blue-700", badgeBg: "bg-blue-50 border-blue-100", icon: <Stethoscope className="w-3.5 h-3.5" /> };
    if (role === "nurse") return { bg: "bg-emerald-500 to-emerald-700", text: "text-emerald-700", badgeBg: "bg-emerald-50 border-emerald-100", icon: <Heart className="w-3.5 h-3.5" /> };
    return { bg: "bg-purple-500 to-purple-700", text: "text-purple-700", badgeBg: "bg-purple-50 border-purple-100", icon: <FlaskConical className="w-3.5 h-3.5" /> };
  };

  return (
    <div className="space-y-6">
      {/* FILTER BAR */}
      <div className="flex flex-col gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1 overflow-x-auto p-1 scrollbar-hide">
          {(["all", "doctors", "nurses", "technicians", "pending", "verified", "rejected"] as TabType[]).map((tab) => (
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
        
        <div className="relative p-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search professionals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border-none bg-slate-100 py-2.5 pl-10 pr-4 text-sm font-medium text-[#0F172A] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#1E40AF]/20 focus:border-[#1E40AF] border border-transparent"
          />
        </div>
      </div>

      {/* DOCTOR CARDS */}
      <AnimatePresence mode="popLayout">
        {filteredProfessionals.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
            className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center"
          >
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50">
              <UserRound className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-[#0F172A]">No professionals found</h3>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {filteredProfessionals.map((prof, i) => {
              const isPending = prof.verification_status === "pending";
              const isVerified = prof.verification_status === "verified";
              const isRejected = prof.verification_status === "rejected";
              const isProcessing = loadingId === prof.id;
              const isSuccess = successFlash === prof.id;
              const colors = getRoleColors(prof.role);

              return (
                <motion.div
                  layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3, delay: i * 0.05 }}
                  key={prof.id}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition-all hover:shadow-md flex flex-col xl:flex-row gap-6",
                    isSuccess ? "border-emerald-400 bg-emerald-50/50" : "border-[#E2E8F0]"
                  )}
                >
                  <div className="flex gap-4 xl:w-1/3 shrink-0">
                    <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-black text-white shadow-inner", colors.bg)}>
                      {getInitials(prof.name)}
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-[#0F172A] flex items-center gap-2">
                        {prof.name}
                      </h2>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className={cn("flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold border uppercase tracking-wider", colors.badgeBg, colors.text)}>
                          {colors.icon} {prof.role}
                        </span>
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 border border-slate-200">
                          {prof.specialty}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-slate-500">
                        <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {prof.area}</div>
                        <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {prof.experience} yrs exp</div>
                      </div>
                    </div>
                  </div>

                  <div className="xl:flex-1 flex flex-col justify-center border-t border-b xl:border-t-0 xl:border-b-0 xl:border-x border-slate-100 py-4 xl:py-0 xl:px-6">
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldCheck className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-bold text-slate-700 tracking-wider font-mono">{prof.registration_number || "N/A"}</span>
                    </div>
                    <div>
                      {isPending && (
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span></span>
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
                          {prof.verification_note && (
                            <p className="mt-1 text-xs font-medium text-red-500 bg-red-50 p-2 rounded-lg border border-red-100">{prof.verification_note}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row xl:flex-col gap-6 xl:w-1/3 shrink-0">
                    <div className="flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Documents</p>
                      <div className="flex gap-2">
                        <DocButton href={prof.primary_cert_url || undefined} label="Primary" />
                        <DocButton href={prof.degree_cert_url || undefined} label="Degree" />
                        <DocButton href={prof.gov_id_url || undefined} label="Gov ID" />
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-end">
                      {isPending && (
                        <div className="flex gap-2 w-full">
                          <button onClick={() => verifyProfessional(prof.id, "verified")} disabled={isProcessing} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#10B981] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600 transition-all disabled:opacity-70">
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Approve
                          </button>
                          <button onClick={() => setRejectModalId(prof.id)} disabled={isProcessing} className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 hover:border-red-300 transition-all disabled:opacity-70">
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => setDeleteConfirmId(prof.id)}
                        disabled={isProcessing}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all disabled:opacity-70"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete Account
                      </button>
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
          <RejectModal isOpen={true} isProcessing={loadingId === rejectModalId} onClose={() => setRejectModalId(null)} onConfirm={(note) => verifyProfessional(rejectModalId, "rejected", note)} />
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteConfirmId && (() => {
          const prof = professionals.find(p => p.id === deleteConfirmId);
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-[#0F172A]">Delete Account</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Permanently delete <strong>{prof?.name}</strong>? This removes their auth account, profile, and all associated data. This cannot be undone.
                </p>
                <div className="mt-6 flex gap-3">
                  <button onClick={() => setDeleteConfirmId(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteProfessional(deleteConfirmId)}
                    disabled={loadingId === deleteConfirmId}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-70"
                  >
                    {loadingId === deleteConfirmId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Delete Permanently
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
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
    <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition-all hover:bg-blue-100 hover:border-blue-300 shadow-sm">
      <ExternalLink className="h-3 w-3" /> {label}
    </a>
  );
}
