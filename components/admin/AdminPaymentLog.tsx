import type { ClinicPayment, DoctorPayment } from "@/types";
import { formatCurrencyInr } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Stethoscope, Copy, CheckCircle2, Clock, Check, FileQuestion } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AdminPaymentLogProps {
  clinicPayments: ClinicPayment[];
  doctorPayments: DoctorPayment[];
}

export function AdminPaymentLog({ clinicPayments, doctorPayments }: AdminPaymentLogProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* LEFT - CLINIC PAYMENTS */}
      <section className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="border-b border-slate-100 bg-slate-50 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
              <Building2 className="h-5 w-5 text-purple-600" />
            </div>
            <h2 className="text-lg font-bold text-[#0F172A]">Clinic Payments</h2>
          </div>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
            {clinicPayments.length}
          </span>
        </div>
        
        <div className="flex-1 p-6 bg-white overflow-y-auto max-h-[600px] space-y-4">
          <AnimatePresence>
            {clinicPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center h-full opacity-60">
                <FileQuestion className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-sm font-semibold text-slate-500">No clinic payments found</p>
              </div>
            ) : (
              clinicPayments.map((payment, i) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={payment.id}
                  className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500" />
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#0F172A] truncate mb-1">
                        Clinic Payment • {new Date(payment.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                      <CopyableText text={payment.razorpayId || payment.id} />
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-black text-[#0F172A]">
                        {formatCurrencyInr(payment.amount)}
                      </p>
                      <div className={cn(
                        "mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        payment.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {payment.status === "completed" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {payment.status}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* RIGHT - DOCTOR PAYOUTS */}
      <section className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="border-b border-slate-100 bg-slate-50 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <Stethoscope className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-[#0F172A]">Doctor Payouts</h2>
          </div>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
            {doctorPayments.length}
          </span>
        </div>
        
        <div className="flex-1 p-6 bg-white overflow-y-auto max-h-[600px] space-y-4">
          <AnimatePresence>
            {doctorPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center h-full opacity-60">
                <FileQuestion className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-sm font-semibold text-slate-500">No doctor payouts found</p>
              </div>
            ) : (
              doctorPayments.map((payment, i) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={payment.id}
                  className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#0F172A] truncate mb-1">
                        {payment.upiId}
                      </p>
                      <p className="text-xs font-medium text-slate-400 mb-2">
                        {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : new Date(payment.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                      <CopyableText text={payment.upiId} label="Copy UPI" />
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-black text-emerald-600">
                        {formatCurrencyInr(payment.amount)}
                      </p>
                      <div className={cn(
                        "mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        payment.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {payment.status === "completed" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {payment.status}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}

function CopyableText({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded bg-slate-100 px-2 py-1 text-[10px] font-mono text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
      title={text}
    >
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
      <span className="truncate max-w-[150px]">{label || text}</span>
    </button>
  );
}
