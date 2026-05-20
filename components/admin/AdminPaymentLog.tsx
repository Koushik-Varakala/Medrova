import type { ClinicPayment, DoctorPayment } from "@/types";
import { formatCurrencyInr } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Stethoscope,
  Copy,
  CheckCircle2,
  Clock,
  Check,
  FileQuestion,
  Search,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Phone,
  Mail,
  User,
  Calendar,
  MapPin,
  XCircle,
  Award
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AdminPaymentLogProps {
  clinicPayments: ClinicPayment[];
  doctorPayments: DoctorPayment[];
  onPayoutStatusUpdate?: (payoutId: string, status: "completed" | "failed" | "pending", paidAt?: string) => void;
}

export function AdminPaymentLog({ clinicPayments, doctorPayments, onPayoutStatusUpdate }: AdminPaymentLogProps) {
  // Tabs & search state
  const [payoutFilter, setPayoutFilter] = useState<"all" | "pending" | "completed" | "failed">("all");
  const [clinicFilter, setClinicFilter] = useState<"all" | "completed" | "pending">("all");
  const [payoutSearch, setPayoutSearch] = useState("");
  const [clinicSearch, setClinicSearch] = useState("");
  
  // Accordion state to track expanded item IDs
  const [expandedPayouts, setExpandedPayouts] = useState<Record<string, boolean>>({});
  const [expandedClinics, setExpandedClinics] = useState<Record<string, boolean>>({});

  const togglePayoutExpand = (id: string) => {
    setExpandedPayouts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleClinicExpand = (id: string) => {
    setExpandedClinics((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Action states
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState<Record<string, string>>({});

  const handleUpdatePayoutStatus = async (payout: DoctorPayment, status: "completed" | "failed") => {
    const payoutId = payout.id;
    setActionLoading((prev) => ({ ...prev, [payoutId]: true }));
    setActionError((prev) => ({ ...prev, [payoutId]: "" }));

    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payoutId,
          type: payout.isProfessional ? "professional" : "doctor",
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to update payout status");
      }

      if (onPayoutStatusUpdate) {
        onPayoutStatusUpdate(payoutId, status, data.payout?.paid_at);
      }
    } catch (err: any) {
      setActionError((prev) => ({ ...prev, [payoutId]: err.message ?? "Server error" }));
    } finally {
      setActionLoading((prev) => ({ ...prev, [payoutId]: false }));
    }
  };

  // Payout filter logic
  const filteredPayouts = doctorPayments.filter((p) => {
    const statusMatches = payoutFilter === "all" || p.status === payoutFilter;
    
    // Search by name, specialty, UPI ID, or shift specialty
    const name = p.professional?.name ?? p.doctor?.name ?? "Unknown";
    const specialty = p.professional?.specialty ?? p.doctor?.specialty ?? "";
    const searchString = `${name} ${specialty} ${p.upiId} ${p.shift?.specialty ?? ""}`.toLowerCase();
    const searchMatches = searchString.includes(payoutSearch.toLowerCase());

    return statusMatches && searchMatches;
  });

  // Clinic filter logic
  const filteredClinics = clinicPayments.filter((p) => {
    const statusMatches = clinicFilter === "all" || p.status === clinicFilter;

    // Search by clinic name or razorpay ID
    const clinicName = p.clinic?.name ?? "Unknown";
    const searchString = `${clinicName} ${p.razorpayId} ${p.shift?.specialty ?? ""}`.toLowerCase();
    const searchMatches = searchString.includes(clinicSearch.toLowerCase());

    return statusMatches && searchMatches;
  });

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* LEFT - CLINIC PAYMENTS */}
      <section className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="border-b border-slate-100 bg-slate-50 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                <Building2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#0F172A]">Clinic Payments (Escrow)</h2>
                <p className="text-xs text-slate-500">Funds paid by clinics for booked shifts</p>
              </div>
            </div>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-xs font-black text-purple-700">
              {filteredClinics.length}
            </span>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search clinic or order..."
                value={clinicSearch}
                onChange={(e) => setClinicSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            </div>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
              {(["all", "completed", "pending"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setClinicFilter(tab)}
                  className={cn(
                    "px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all",
                    clinicFilter === tab ? "bg-white text-purple-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-6 bg-white overflow-y-auto max-h-[600px] space-y-4">
          <AnimatePresence>
            {filteredClinics.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center h-full opacity-60">
                <FileQuestion className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-sm font-semibold text-slate-500">No clinic payments found</p>
              </div>
            ) : (
              filteredClinics.map((payment, i) => {
                const isExpanded = expandedClinics[payment.id];
                const clinicName = payment.clinic?.name ?? "Unknown Clinic";
                const contactPerson = payment.clinic?.contactPerson ?? "Not Specified";
                const phone = payment.clinic?.contactPhone ?? payment.clinic?.phone ?? "Not Specified";
                
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.4) }}
                    key={payment.id}
                    className={cn(
                      "rounded-xl border bg-white shadow-sm hover:shadow-md transition-all relative overflow-hidden",
                      isExpanded ? "border-purple-300 ring-1 ring-purple-100" : "border-slate-100"
                    )}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500" />
                    
                    {/* Header Row */}
                    <div 
                      onClick={() => toggleClinicExpand(payment.id)}
                      className="p-4 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-[#0F172A] truncate">
                          {clinicName}
                        </h4>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-slate-500 text-xs font-medium">
                          <span>{payment.shift?.specialty ?? "Locum"} Shift</span>
                          <span>•</span>
                          <span>{payment.shift?.date ? new Date(payment.shift.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "No Date"}</span>
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0 flex flex-col items-end">
                        <p className="text-base font-black text-[#0F172A]">
                          {formatCurrencyInr(payment.amount)}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                            payment.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          )}>
                            {payment.status === "completed" ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                            {payment.status}
                          </span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Details Section */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-600 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Clinic Contacts</p>
                            <p className="font-bold text-slate-700 mt-1 flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" /> {contactPerson}
                            </p>
                            <p className="text-slate-500 mt-0.5 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" /> {phone}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Shift details</p>
                            {payment.shift ? (
                              <>
                                <p className="font-bold text-slate-700 mt-1 flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-400" /> {payment.shift.specialty} Locum
                                </p>
                                <p className="text-slate-500 mt-0.5 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" /> {payment.shift.startTime} - {payment.shift.endTime}
                                </p>
                                {payment.shift.area && (
                                  <p className="text-slate-500 mt-0.5 flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-slate-400" /> {payment.shift.area}
                                  </p>
                                )}
                              </>
                            ) : (
                              <p className="text-slate-500 mt-1">Shift details missing</p>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                          <div className="flex gap-4">
                            <div>
                              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Professional Pay</span>
                              <span className="font-bold text-slate-700">{formatCurrencyInr(payment.shift?.pay ?? 0)}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Platform Fee (20%)</span>
                              <span className="font-bold text-slate-700">{formatCurrencyInr(Math.round((payment.shift?.pay ?? 0) * 0.2))}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-slate-400 select-all bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              Order ID: {payment.razorpayId || payment.id}
                            </span>
                            <CopyButton text={payment.razorpayId || payment.id} />
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* RIGHT - DOCTOR & PROFESSIONAL PAYOUTS */}
      <section className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="border-b border-slate-100 bg-slate-50 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                <Stethoscope className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#0F172A]">Professional Payouts</h2>
                <p className="text-xs text-slate-500">Transfers due to doctors and healthcare workers</p>
              </div>
            </div>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-black text-blue-700">
              {filteredPayouts.length}
            </span>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search professional name, UPI ID..."
                value={payoutSearch}
                onChange={(e) => setPayoutSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
            </div>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
              {(["all", "pending", "completed", "failed"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setPayoutFilter(tab)}
                  className={cn(
                    "px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all",
                    payoutFilter === tab ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  {tab === "pending" ? "To Pay ⚠️" : tab}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-6 bg-white overflow-y-auto max-h-[600px] space-y-4">
          <AnimatePresence>
            {filteredPayouts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center h-full opacity-60">
                <FileQuestion className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-sm font-semibold text-slate-500">No payouts found matching criteria</p>
              </div>
            ) : (
              filteredPayouts.map((payment, i) => {
                const isExpanded = expandedPayouts[payment.id];
                
                // Extract profile info based on whether it is new unified professional or legacy doctor
                const name = payment.professional?.name ?? payment.doctor?.name ?? "Unknown Professional";
                const phone = payment.professional?.phone ?? payment.doctor?.phone ?? "Not Specified";
                const email = payment.professional?.email ?? payment.doctor?.email ?? "Not Specified";
                const role = payment.professional?.role ?? "doctor";
                const specialty = payment.professional?.specialty ?? payment.doctor?.specialty ?? "General";
                
                const isPending = payment.status === "pending" || (payment.status as string) === "manual_pending";
                const isLoader = actionLoading[payment.id];
                const isErr = actionError[payment.id];

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.4) }}
                    key={payment.id}
                    className={cn(
                      "rounded-xl border bg-white shadow-sm hover:shadow-md transition-all relative overflow-hidden",
                      isExpanded ? "border-blue-300 ring-1 ring-blue-500/10" : "border-slate-100"
                    )}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                    
                    {/* Header Row */}
                    <div 
                      onClick={() => togglePayoutExpand(payment.id)}
                      className="p-4 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[#0F172A] truncate">
                            {name}
                          </h4>
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                            role === "doctor" ? "bg-sky-100 text-sky-700" : role === "nurse" ? "bg-teal-100 text-teal-700" : "bg-purple-100 text-purple-700"
                          )}>
                            {role}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-500 mt-1 select-all font-mono">
                          UPI ID: {payment.upiId}
                        </p>
                      </div>
                      
                      <div className="text-right shrink-0 flex flex-col items-end">
                        <p className="text-base font-black text-emerald-600">
                          {formatCurrencyInr(payment.amount)}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                            payment.status === "completed" ? "bg-emerald-100 text-emerald-700" : isPending ? "bg-amber-100 text-amber-700 border border-amber-300" : "bg-red-100 text-red-700"
                          )}>
                            {payment.status === "completed" ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                            {isPending ? "TO PAY" : payment.status}
                          </span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Details Section */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-600 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          {/* Professional Contacts */}
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Professional Contacts</p>
                            <p className="font-bold text-slate-700 mt-1 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {name}
                            </p>
                            <p className="text-slate-500 mt-0.5 flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <a href={`tel:${phone}`} className="hover:underline">{phone}</a>
                            </p>
                            <p className="text-slate-500 mt-0.5 flex items-center gap-1.5 truncate">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <a href={`mailto:${email}`} className="hover:underline">{email}</a>
                            </p>
                            <p className="text-slate-400 text-[10px] font-medium mt-1 uppercase tracking-wider">
                              Specialty: {specialty}
                            </p>
                          </div>
                          
                          {/* Booked Clinic Details */}
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Shift details</p>
                            {payment.shift ? (
                              <>
                                <p className="font-bold text-slate-700 mt-1 flex items-center gap-1.5">
                                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {payment.shift.clinic?.name ?? "Unknown Clinic"}
                                </p>
                                <p className="text-slate-500 mt-0.5 flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {new Date(payment.shift.date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                                </p>
                                <p className="text-slate-500 mt-0.5 flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {payment.shift.startTime} - {payment.shift.endTime}
                                </p>
                                {payment.shift.area && (
                                  <p className="text-slate-500 mt-0.5 flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {payment.shift.area}
                                  </p>
                                )}
                              </>
                            ) : (
                              <p className="text-slate-500 mt-1">Shift details missing</p>
                            )}
                          </div>
                        </div>

                        {/* Transaction history metadata */}
                        <div className="pt-3 border-t border-slate-100 flex flex-wrap justify-between items-center gap-2">
                          <div>
                            <span className="text-[9px] font-semibold text-slate-400 uppercase block">Created at</span>
                            <span className="font-medium text-slate-600">{new Date(payment.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          {payment.paidAt && (
                            <div>
                              <span className="text-[9px] font-semibold text-slate-400 uppercase block">Dispatched at</span>
                              <span className="font-medium text-emerald-600">{new Date(payment.paidAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-[9px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              ID: {payment.id}
                            </span>
                            <CopyButton text={payment.upiId} label="Copy UPI" />
                          </div>
                        </div>

                        {/* ACTION BUTTONS (Only show for pending/manual_pending statuses) */}
                        {isPending && (
                          <div className="pt-3 border-t border-slate-200/60 bg-blue-50/50 -mx-4 -mb-4 p-4 flex flex-col gap-2 rounded-b-xl">
                            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-[11px] text-amber-800 p-2.5 rounded-lg font-medium leading-relaxed shadow-sm">
                              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>
                                Please transfer <strong className="text-base font-black text-emerald-700">₹{payment.amount.toLocaleString("en-IN")}</strong> to UPI ID <strong className="text-base font-black text-blue-800">{payment.upiId}</strong> via GPay/PhonePe first, then confirm here.
                              </span>
                            </div>

                            {isErr && (
                              <p className="text-xs text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg font-medium">
                                ❌ {isErr}
                              </p>
                            )}

                            <div className="flex gap-2 justify-end mt-1">
                              <button
                                disabled={isLoader}
                                onClick={() => handleUpdatePayoutStatus(payment, "failed")}
                                className="px-3 py-2 bg-white hover:bg-red-50 text-red-600 font-bold border border-red-200 rounded-lg text-xs transition-colors shrink-0 disabled:opacity-50"
                              >
                                Mark Failed
                              </button>
                              <button
                                disabled={isLoader}
                                onClick={() => handleUpdatePayoutStatus(payment, "completed")}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                              >
                                {isLoader ? (
                                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                                I Have Paid (Confirm)
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 hover:text-slate-800 transition-colors border border-slate-200 shrink-0"
      title={`Copy: ${text}`}
    >
      {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
      <span>{copied ? "Copied" : label || "Copy"}</span>
    </button>
  );
}
