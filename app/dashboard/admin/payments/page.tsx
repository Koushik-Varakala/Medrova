"use client";

import { useEffect, useState, useRef } from "react";
import { IndianRupee, Landmark, WalletCards, TrendingUp, AlertTriangle } from "lucide-react";
import { AdminPaymentLog } from "@/components/admin/AdminPaymentLog";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { adminNavigation } from "@/lib/constants";
import { formatCurrencyInr, getStringValue, getNumberValue } from "@/lib/utils";
import type { ClinicPayment, DoctorPayment } from "@/types";
import { motion, useInView, useAnimation } from "framer-motion";
import { cn } from "@/lib/utils";

// Custom CountUp Component
function CountUp({ value }: { value: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const end = value;
    if (start === end) return;
    const duration = 1000;
    let startTime: number | null = null;
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      // ease out expo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easeProgress * (end - start) + start));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, isInView]);

  return <span ref={ref}>{formatCurrencyInr(count)}</span>;
}

export default function AdminPaymentsPage() {
  const [clinicPayments, setClinicPayments] = useState<ClinicPayment[]>([]);
  const [doctorPayments, setDoctorPayments] = useState<DoctorPayment[]>([]);
  const [summary, setSummary] = useState({ totalRevenue: 0, totalPayouts: 0, platformFeesRetained: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      const res = await fetch("/api/admin/payments");
      const json = (await res.json()) as {
        clinicPayments?: Record<string, unknown>[];
        doctorPayouts?: Record<string, unknown>[];
        summary?: { totalRevenue: number; totalPayouts: number; platformFeesRetained: number };
      };

      const mappedClinicPayments: ClinicPayment[] = (json.clinicPayments ?? []).map((p) => ({
        id: getStringValue(p, "id"),
        clinicId: getStringValue(p, "clinic_id"),
        shiftId: getStringValue(p, "shift_id"),
        amount: getNumberValue(p, "amount"),
        razorpayId: getStringValue(p, "razorpay_id"),
        status: getStringValue(p, "status") as ClinicPayment["status"],
        createdAt: getStringValue(p, "created_at"),
      }));

      const mappedDoctorPayments: DoctorPayment[] = (json.doctorPayouts ?? []).map((p) => ({
        id: getStringValue(p, "id"),
        doctorId: getStringValue(p, "doctor_id"),
        shiftId: getStringValue(p, "shift_id"),
        amount: getNumberValue(p, "amount"),
        upiId: getStringValue(p, "upi_id"),
        status: getStringValue(p, "status") as DoctorPayment["status"],
        paidAt: getStringValue(p, "paid_at") || undefined,
        createdAt: getStringValue(p, "created_at"),
      }));

      if (!isMounted) return;
      setClinicPayments(mappedClinicPayments);
      setDoctorPayments(mappedDoctorPayments);
      if (json.summary) setSummary(json.summary);
      setIsLoading(false);
    }
    load();
    return () => { isMounted = false; };
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const isBug = summary.platformFeesRetained < 0;

  return (
    <DashboardShell items={adminNavigation}>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#0F172A]">Payment Logs</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Full transaction log, doctor payouts, and platform fee retention.
          </p>
        </div>
      </div>
      
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map(i => <div key={i} className="h-40 rounded-2xl bg-slate-200 animate-pulse border border-slate-300" />)}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-96 rounded-2xl bg-slate-200 animate-pulse border border-slate-300" />
            <div className="h-96 rounded-2xl bg-slate-200 animate-pulse border border-slate-300" />
          </div>
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          {/* REVENUE SUMMARY */}
          <section className="grid gap-4 md:grid-cols-3">
            {/* TOTAL REVENUE */}
            <motion.div 
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              className="relative overflow-hidden rounded-2xl bg-[#0F172A] p-6 shadow-lg border border-[#1e293b]"
            >
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <IndianRupee className="w-32 h-32 text-white" />
              </div>
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Revenue</p>
                  <div className="flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md text-[10px] font-bold uppercase">
                    <TrendingUp className="w-3 h-3" /> Up
                  </div>
                </div>
                <p className="mt-auto text-4xl font-black tracking-tight text-white">
                  <CountUp value={summary.totalRevenue} />
                </p>
              </div>
            </motion.div>

            {/* TOTAL PAYOUTS */}
            <motion.div 
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              className="relative overflow-hidden rounded-2xl bg-[#1E40AF] p-6 shadow-lg border border-blue-800"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                <WalletCards className="w-32 h-32 text-white" />
              </div>
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-200">Total Payouts</p>
                </div>
                <p className="mt-auto text-4xl font-black tracking-tight text-white">
                  <CountUp value={summary.totalPayouts} />
                </p>
              </div>
            </motion.div>

            {/* FEES RETAINED */}
            <motion.div 
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              className={cn(
                "relative overflow-hidden rounded-2xl p-6 shadow-lg border",
                isBug ? "bg-red-600 border-red-700" : "bg-emerald-500 border-emerald-600"
              )}
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                <Landmark className="w-32 h-32 text-white" />
              </div>
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <p className={cn("text-xs font-bold uppercase tracking-widest", isBug ? "text-red-200" : "text-emerald-100")}>Fees Retained</p>
                </div>
                <div className="mt-auto">
                  <p className="text-4xl font-black tracking-tight text-white">
                    <CountUp value={summary.platformFeesRetained} />
                  </p>
                  {isBug && (
                    <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-red-100 bg-red-900/40 p-2 rounded-lg">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-300" />
                      Payouts exceed revenue — check payment data!
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </section>

          <AdminPaymentLog clinicPayments={clinicPayments} doctorPayments={doctorPayments} />
        </motion.div>
      )}
    </DashboardShell>
  );
}
