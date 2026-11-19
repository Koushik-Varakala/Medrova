"use client";

import { useEffect, useState, useMemo, useTransition } from "react";
import Link from "next/link";
import {
  Building2,
  Clock,
  MapPin,
  Phone,
  Copy,
  ExternalLink,
  MessageSquare,
  Search,
  RefreshCw,
  Plus,
  ChevronDown,
  ChevronUp,
  Check,
  FileText,
  Trash2,
  Archive,
  XCircle,
  Zap
} from "lucide-react";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { adminNavigation } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { parseWhatsAppMessage, type ParsedWhatsAppShift } from "@/lib/whatsapp-parser";

interface QuickPostItem {
  id: string;
  specialty: string;
  date: string;
  start_time: string;
  end_time: string;
  pay: number;
  area: string;
  notes?: string;
  status: string;
  magic_token?: string;
  magic_contact_phone?: string;
  magic_contact_name?: string;
  is_whatsapp_source?: boolean;
  raw_whatsapp_text?: string;
  created_at: string;
  clinic?: {
    id: string;
    name: string;
    phone: string;
    contact_person: string;
    contact_phone: string;
    credits: number;
    is_claimed: boolean;
  };
}

type FilterTab = "all" | "pending_review" | "active" | "expired" | "cancelled" | "deleted";

/**
 * Check if a shift is expired based on its date and end_time.
 * A shift is expired if `date + end_time` is in the past.
 */
function isShiftExpired(post: QuickPostItem): boolean {
  if (!post.date) return false;
  try {
    const endTimeStr = post.end_time || "23:59";
    const shiftEnd = new Date(`${post.date}T${endTimeStr}`);
    return shiftEnd.getTime() < Date.now();
  } catch {
    return false;
  }
}

/**
 * Compute the effective display status:
 * - If the shift status is "active" but the shift time has passed → show as "expired"
 * - Otherwise show the real DB status
 */
function getEffectiveStatus(post: QuickPostItem): string {
  if (post.status === "active" && isShiftExpired(post)) {
    return "expired";
  }
  return post.status;
}

export default function AdminQuickPostsPage() {
  const [posts, setPosts] = useState<QuickPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedRawIds, setExpandedRawIds] = useState<Record<string, boolean>>({});

  // Direct ingestion drawer
  const [showDirectPaste, setShowDirectPaste] = useState(false);
  const [adminRawText, setAdminRawText] = useState("");
  const [adminParsed, setAdminParsed] = useState<ParsedWhatsAppShift | null>(null);
  const [adminSubmitError, setAdminSubmitError] = useState("");

  const fetchQuickPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/quick-posts");
      const data = await res.json();
      if (data.success && data.quickPosts) {
        setPosts(data.quickPosts);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuickPosts();
  }, []);

  // --- Admin Direct Paste Handlers ---
  const handleAdminPasteChange = (text: string) => {
    setAdminRawText(text);
    setAdminSubmitError("");
    if (text.trim().length > 10) {
      setAdminParsed(parseWhatsAppMessage(text));
    } else {
      setAdminParsed(null);
    }
  };

  const handleAdminDirectSubmit = async () => {
    if (!adminParsed) return;
    startTransition(async () => {
      try {
        const res = await fetch("/api/public/quick-post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hospitalName: adminParsed.hospitalName,
            area: adminParsed.area,
            specialty: adminParsed.specialty,
            date: adminParsed.date,
            startTime: adminParsed.startTime,
            endTime: adminParsed.endTime,
            displayTime: adminParsed.displayTime,
            pay: adminParsed.pay,
            contactPhone: adminParsed.contactPhone,
            contactName: adminParsed.contactName,
            contactEmail: adminParsed.contactEmail,
            notes: adminParsed.notes,
            rawText: adminParsed.rawText
          })
        });

        const data = await res.json();
        if (data.success) {
          setShowDirectPaste(false);
          setAdminRawText("");
          setAdminParsed(null);
          await fetchQuickPosts();
        } else {
          setAdminSubmitError(data.error || "Failed to create requirement.");
        }
      } catch {
        setAdminSubmitError("Network connection error.");
      }
    });
  };

  // --- Post Actions ---
  const handleApprove = async (id: string) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/quick-posts/${id}/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({})
        });
        const data = await res.json();
        if (data.success) await fetchQuickPosts();
      } catch {
        // Fallback
      }
    });
  };

  const handleReject = async (id: string) => {
    if (!confirm("Cancel this requirement? It will be moved to the Cancelled tab.")) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/quick-posts/${id}/reject`, { method: "POST" });
        const data = await res.json();
        if (data.success) await fetchQuickPosts();
      } catch {
        // Fallback
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this shift? It will be hidden from all views.")) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/quick-posts/${id}/delete`, { method: "POST" });
        const data = await res.json();
        if (data.success) await fetchQuickPosts();
      } catch {
        // Fallback
      }
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const toggleRawText = (id: string) => {
    setExpandedRawIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // --- Derived Data ---
  const counts = useMemo(() => {
    let pending = 0, active = 0, expired = 0, cancelled = 0, deleted = 0;
    posts.forEach((p) => {
      const eff = getEffectiveStatus(p);
      if (eff === "pending_review") pending++;
      else if (eff === "active") active++;
      else if (eff === "expired") expired++;
      else if (eff === "cancelled") cancelled++;
      else if (eff === "deleted") deleted++;
    });
    return { all: posts.length, pending_review: pending, active, expired, cancelled, deleted };
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const eff = getEffectiveStatus(p);
      // Filter by tab
      if (filter !== "all" && eff !== filter) return false;
      // Filter deleted from "all" unless explicitly on "deleted" tab
      if (filter === "all" && eff === "deleted") return false;
      // Search
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const hosp = p.clinic?.name?.toLowerCase() || "";
      const spec = p.specialty?.toLowerCase() || "";
      const phone = p.magic_contact_phone || "";
      const area = p.area?.toLowerCase() || "";
      return hosp.includes(q) || spec.includes(q) || phone.includes(q) || area.includes(q);
    });
  }, [posts, filter, searchQuery]);

  // --- Tab Config ---
  const tabs: { key: FilterTab; label: string; dotColor?: string }[] = [
    { key: "all", label: `All (${counts.all - counts.deleted})` },
    { key: "pending_review", label: `Pending (${counts.pending_review})`, dotColor: "bg-amber-500" },
    { key: "active", label: `Active (${counts.active})`, dotColor: "bg-emerald-500" },
    { key: "expired", label: `Expired (${counts.expired})`, dotColor: "bg-slate-400" },
    { key: "cancelled", label: `Cancelled (${counts.cancelled})` },
    { key: "deleted", label: `Deleted (${counts.deleted})` },
  ];

  return (
    <DashboardShell items={adminNavigation}>
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-[#0F172A]">Quick Posts</h1>
            {counts.pending_review > 0 && (
              <span className="flex h-7 items-center justify-center rounded-full bg-amber-100 px-3 text-xs font-bold text-amber-800 border border-amber-200">
                {counts.pending_review} Pending
              </span>
            )}
          </div>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Review and publish shift requirements submitted via WhatsApp or direct entry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDirectPaste(!showDirectPaste)}
            className={cn(
              "inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm",
              showDirectPaste
                ? "bg-slate-200 text-slate-700"
                : "bg-[#1E40AF] text-white hover:bg-[#1D4ED8] shadow-blue-600/20"
            )}
          >
            <Plus className="w-4 h-4" />
            {showDirectPaste ? "Close" : "New Entry"}
          </button>
          <button
            onClick={fetchQuickPosts}
            className="p-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Direct Ingestion Card */}
      <AnimatePresence>
        {showDirectPaste && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h2 className="text-sm font-bold text-[#0F172A]">Direct Shift Ingestion</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Paste a WhatsApp requirement message below to parse into structured fields.
                </p>
              </div>

              <textarea
                rows={3}
                value={adminRawText}
                onChange={(e) => handleAdminPasteChange(e.target.value)}
                placeholder="e.g. Pediatrician required for afternoon duty 3pm to 9pm at Krishna Children Hospital Lakdikapul Hyderabad. Call Dr Amjadullah 9885068907..."
                className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 focus:border-[#1E40AF] focus:ring-2 focus:ring-blue-100 outline-none resize-y font-mono bg-slate-50/50"
              />

              {adminParsed && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Facility</span>
                    <span className="font-bold text-slate-800">{adminParsed.hospitalName || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Specialty / Area</span>
                    <span className="font-bold text-slate-800">{adminParsed.specialty} ({adminParsed.area || "—"})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Timing / Pay</span>
                    <span className="font-bold text-slate-800">
                      {adminParsed.displayTime} • ₹{adminParsed.pay}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Contact Mobile</span>
                    <span className="font-mono font-bold text-slate-900">+91 {adminParsed.contactPhone || "—"}</span>
                  </div>
                </div>
              )}

              {adminSubmitError && (
                <p className="text-xs text-red-600 font-semibold">{adminSubmitError}</p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => {
                    setShowDirectPaste(false);
                    setAdminRawText("");
                    setAdminParsed(null);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  disabled={!adminParsed || isPending}
                  onClick={handleAdminDirectSubmit}
                  className="px-5 py-2 bg-[#1E40AF] text-white text-xs font-bold rounded-xl hover:bg-[#1D4ED8] disabled:bg-slate-300 transition-colors shadow-sm"
                >
                  {isPending ? "Creating..." : "Save to Queue"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {/* Filter Tabs & Search */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1 overflow-x-auto p-1 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all whitespace-nowrap",
                  filter === tab.key
                    ? "bg-[#1E40AF] text-white shadow-md shadow-blue-600/20"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                {tab.dotColor && (
                  <span className={cn("w-2 h-2 rounded-full", tab.dotColor)} />
                )}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search facility, phone, specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1E40AF] focus:bg-white outline-none transition-all"
            />
          </div>
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-36 rounded-2xl bg-slate-200 animate-pulse border border-slate-300" />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Requirements Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {filter === "pending_review"
                ? "There are no submissions awaiting review."
                : filter === "expired"
                ? "No shifts have expired yet."
                : "No entries match your search."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => {
              const effectiveStatus = getEffectiveStatus(post);
              const isPendingReview = effectiveStatus === "pending_review";
              const isActive = effectiveStatus === "active";
              const isExpired = effectiveStatus === "expired";
              const isDeleted = effectiveStatus === "deleted";
              const appUrl = typeof window !== "undefined" ? window.location.origin : "https://medrova.in";
              const magicLink = `${appUrl}/s/${post.magic_token}`;
              const whatsAppReply = `Hi ${post.magic_contact_name || "Doctor"}, your requirement for ${post.specialty} at ${post.clinic?.name || post.area} is now verified and live on Medrova. Verified doctors are viewing it. Track applicants here: ${magicLink}`;
              const isRawExpanded = !!expandedRawIds[post.id];

              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "bg-white rounded-2xl border p-5 sm:p-6 shadow-sm transition-all space-y-4",
                    isPendingReview
                      ? "border-amber-300 ring-1 ring-amber-200"
                      : isExpired
                      ? "border-slate-300 opacity-75"
                      : isDeleted
                      ? "border-red-200 opacity-60"
                      : "border-slate-200"
                  )}
                >
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-base">
                        {post.clinic?.name || "Healthcare Facility"}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                        {post.specialty}
                      </span>
                      {post.area && (
                        <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" /> {post.area}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Status Badge */}
                      {isPendingReview && (
                        <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Review
                        </span>
                      )}
                      {isActive && (
                        <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                        </span>
                      )}
                      {isExpired && (
                        <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full flex items-center gap-1">
                          <Archive className="w-3.5 h-3.5 text-slate-400" /> Expired
                        </span>
                      )}
                      {effectiveStatus === "cancelled" && (
                        <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full">
                          Cancelled
                        </span>
                      )}
                      {isDeleted && (
                        <span className="text-xs font-bold px-2.5 py-1 bg-red-100 text-red-600 rounded-full">
                          Deleted
                        </span>
                      )}

                      {/* Delete Button — always visible for non-deleted */}
                      {!isDeleted && (
                        <button
                          disabled={isPending}
                          onClick={() => handleDelete(post.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete this shift"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400 block font-medium">Shift Timing</span>
                      <span className="font-semibold text-slate-800">
                        {post.start_time} – {post.end_time}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Shift Pay</span>
                      <span className="font-bold text-slate-900">
                        ₹{post.pay ? post.pay.toLocaleString("en-IN") : "Negotiable"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Contact Person</span>
                      <span className="font-semibold text-slate-800">
                        {post.magic_contact_name || post.clinic?.contact_person || "HR / Admin"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Phone Number</span>
                      <span className="font-mono font-bold text-slate-900">
                        +91 {post.magic_contact_phone || post.clinic?.contact_phone || "—"}
                      </span>
                    </div>
                  </div>

                  {/* Raw Text Accordion */}
                  {post.raw_whatsapp_text && (
                    <div>
                      <button
                        type="button"
                        onClick={() => toggleRawText(post.id)}
                        className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
                      >
                        {isRawExpanded ? (
                          <><ChevronUp className="w-3 h-3" /> Hide source text</>
                        ) : (
                          <><ChevronDown className="w-3 h-3" /> View source text</>
                        )}
                      </button>

                      <AnimatePresence>
                        {isRawExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-2 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 font-mono whitespace-pre-wrap leading-relaxed">
                              {post.raw_whatsapp_text}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Actions Row */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400">
                      {isExpired
                        ? `Expired — Shift ended ${post.date}`
                        : `Received ${new Date(post.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}`}
                    </span>

                    <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
                      {/* Active shift tools */}
                      {(isActive || isExpired) && post.magic_token && (
                        <>
                          <Link
                            href={`/s/${post.magic_token}`}
                            target="_blank"
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-200"
                          >
                            View Page <ExternalLink className="w-3 h-3" />
                          </Link>

                          <button
                            onClick={() => copyToClipboard(magicLink, `link-${post.id}`)}
                            className="text-xs font-semibold text-slate-700 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1"
                          >
                            {copiedId === `link-${post.id}` ? (
                              <><Check className="w-3 h-3 text-emerald-600" /> Copied</>
                            ) : (
                              <><Copy className="w-3 h-3 text-slate-500" /> Copy Link</>
                            )}
                          </button>

                          <button
                            onClick={() => copyToClipboard(whatsAppReply, `wa-${post.id}`)}
                            className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1"
                          >
                            {copiedId === `wa-${post.id}` ? (
                              <><Check className="w-3 h-3 text-emerald-600" /> Copied</>
                            ) : (
                              <><MessageSquare className="w-3 h-3 text-emerald-600" /> WhatsApp Reply</>
                            )}
                          </button>
                        </>
                      )}

                      {/* Pending Review Actions */}
                      {isPendingReview && (
                        <>
                          <button
                            disabled={isPending}
                            onClick={() => handleReject(post.id)}
                            className="px-3 py-1.5 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                          <button
                            disabled={isPending}
                            onClick={() => handleApprove(post.id)}
                            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                          >
                            Approve &amp; Publish
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
