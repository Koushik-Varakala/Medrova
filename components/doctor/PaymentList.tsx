"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView, animate } from "framer-motion";
import { 
  IndianRupee, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  Wallet,
  Building2,
  CalendarDays
} from "lucide-react";
import type { DoctorPayment } from "@/types";
import { formatCurrencyInr } from "@/lib/utils";
import { cn } from "@/lib/utils";

// Component for animating numbers
function AnimatedCounter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView && ref.current) {
      const controls = animate(0, value, {
        duration: 2,
        ease: "easeOut",
        onUpdate(v) {
          if (ref.current) {
            // Format as currency but without the symbol (we put the symbol outside)
            ref.current.textContent = Math.round(v).toLocaleString("en-IN");
          }
        }
      });
      return () => controls.stop();
    }
  }, [inView, value]);

  return <span ref={ref}>0</span>;
}

interface PaymentListProps {
  payments: (DoctorPayment & { clinicName?: string })[];
}

export function PaymentList({ payments }: PaymentListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalEarned = payments.reduce((sum, p) => sum + p.amount, 0);
  const completedPayments = payments.filter((p) => p.status === "completed").length;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E2E8F0] bg-white py-16 text-center shadow-sm">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
          <Wallet className="h-10 w-10" />
        </div>
        <h3 className="text-xl font-bold text-[#0F172A]">No payouts yet</h3>
        <p className="mt-2 max-w-sm text-sm text-[#64748B]">
          Complete shifts to receive payments. Your earnings will appear here once processed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* EARNINGS SUMMARY CARD */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-[#0F172A] p-6 text-white shadow-lg sm:p-8"
      >
        <div className="absolute -right-10 -top-24 h-64 w-64 rounded-full bg-white opacity-5 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-10 h-40 w-40 rounded-full bg-emerald-500 opacity-20 blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400">Total Lifetime Earnings</p>
            <h2 className="mt-1 flex items-baseline text-4xl font-bold tracking-tight">
              <span className="mr-1 text-2xl text-emerald-400">₹</span>
              <AnimatedCounter value={totalEarned} />
            </h2>
          </div>
          
          <div className="flex gap-6 rounded-xl bg-white/10 p-4 backdrop-blur-sm sm:gap-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Shifts Completed</p>
              <p className="mt-1 text-2xl font-bold">{payments.length}</p>
            </div>
            <div className="h-full w-px bg-white/20"></div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Payouts Received</p>
              <p className="mt-1 text-2xl font-bold">{completedPayments}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* PAYMENT CARDS */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        <h2 className="text-lg font-bold tracking-tight text-[#0F172A]">Transaction History</h2>
        
        {payments.map((payment) => {
          const isCompleted = payment.status === "completed";
          
          // Format date like "11 May 2026, 6:17 PM"
          const dateToUse = payment.paidAt || payment.createdAt;
          const formattedDate = new Date(dateToUse).toLocaleDateString("en-GB", {
            day: "numeric", month: "short", year: "numeric",
            hour: "numeric", minute: "2-digit"
          });

          return (
            <motion.article 
              variants={item}
              key={payment.id} 
              className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
                  isCompleted ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                )}>
                  {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                </div>
                
                <div className="flex flex-col gap-1">
                  <h3 className="text-base font-bold text-[#0F172A]">
                    Locum Shift • {new Date(payment.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </h3>
                  
                  {payment.clinicName && (
                    <div className="flex items-center gap-1.5 text-sm text-[#64748B]">
                      <Building2 className="h-3.5 w-3.5" />
                      {payment.clinicName}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1.5 text-sm text-[#64748B]">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formattedDate}
                  </div>
                  
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                      UPI
                    </span>
                    <span className="text-xs font-medium text-slate-500">{payment.upiId}</span>
                    <button
                      onClick={() => copyToClipboard(payment.upiId, payment.id)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      title="Copy UPI ID"
                    >
                      {copiedId === payment.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-row items-center justify-between border-t border-[#E2E8F0] pt-4 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                <div className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider",
                  isCompleted ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                )}>
                  {isCompleted ? "Paid" : "Pending"}
                </div>
                
                <div className="text-xl font-bold tracking-tight text-emerald-600 sm:mt-3 text-right">
                  {formatCurrencyInr(payment.amount)}
                </div>
              </div>
            </motion.article>
          );
        })}
      </motion.div>
    </div>
  );
}
