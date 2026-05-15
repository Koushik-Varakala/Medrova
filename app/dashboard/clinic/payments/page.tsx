"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { clinicNavigation } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { formatCurrencyInr, formatDate, getStringValue, getNumberValue, cn } from "@/lib/utils";
import type { ClinicPayment } from "@/types";
import { motion } from "framer-motion";
import { Copy, Wallet, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";

export default function ClinicPaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<ClinicPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/sign-in"); return; }

      const { data: clinicRow } = await supabase
        .from("clinics").select("id").eq("user_id", user.id).maybeSingle();
      if (!clinicRow) { router.push("/onboarding/clinic"); return; }

      const clinicId = (clinicRow as { id: string }).id;

      const { data: rows } = await supabase
        .from("clinic_payments")
        .select("*")
        .eq("clinic_id", clinicId)
        .order("created_at", { ascending: false });

      const mapped: ClinicPayment[] = (rows ?? []).map((r: Record<string, unknown>) => ({
        id: getStringValue(r, "id"),
        clinicId: getStringValue(r, "clinic_id"),
        shiftId: getStringValue(r, "shift_id"),
        amount: getNumberValue(r, "amount"),
        razorpayId: getStringValue(r, "razorpay_id"),
        status: getStringValue(r, "status") as ClinicPayment["status"],
        createdAt: getStringValue(r, "created_at"),
      }));

      if (!isMounted) return;
      setPayments(mapped);
      setIsLoading(false);
    }
    load();
    return () => { isMounted = false; };
  }, [router]);

  const totalSpent = payments.reduce((acc, p) => acc + p.amount, 0);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <DashboardShell items={clinicNavigation}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F172A]">Payments</h1>
          <p className="mt-2 text-sm leading-6 text-[#64748B]">Manage your staffing spend and Razorpay transactions.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="h-40 w-full animate-pulse rounded-3xl bg-slate-200"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => <div key={i} className="h-32 w-full animate-pulse rounded-2xl bg-slate-200"></div>)}
          </div>
        </div>
      ) : payments.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed border-[#E2E8F0] bg-white p-8 text-center shadow-sm"
        >
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 shadow-inner">
            <Wallet className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold text-[#0F172A]">No payments yet</h2>
          <p className="mt-2 max-w-md text-[#64748B]">
            You haven&apos;t processed any payments. Post a shift to get started.
          </p>
          <Link 
            href="/dashboard/clinic/post-shift" 
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E40AF] px-6 py-3 font-semibold text-white shadow-md transition-all hover:bg-[#1D4ED8] hover:shadow-lg"
          >
            Post a shift
          </Link>
        </motion.div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          {/* SUMMARY CARD */}
          <motion.div variants={item} className="relative overflow-hidden rounded-3xl bg-[#0F172A] p-8 text-white shadow-lg">
            <div className="absolute -right-10 -top-24 h-64 w-64 rounded-full bg-blue-500 opacity-20 blur-3xl"></div>
            <div className="absolute -bottom-24 -left-10 h-40 w-40 rounded-full bg-emerald-500 opacity-20 blur-2xl"></div>
            
            <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-wider text-slate-400">Total Spent on Staffing</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-white">
                    <CountUp value={totalSpent} />
                  </span>
                </div>
              </div>
              <div className="flex gap-6 border-t border-slate-700 pt-6 md:border-0 md:pt-0">
                <div>
                  <p className="text-2xl font-bold text-white"><CountUp value={payments.length} /></p>
                  <p className="text-sm text-slate-400">Shifts Funded</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white"><CountUp value={payments.filter(p => p.status === "completed").length} /></p>
                  <p className="text-sm text-slate-400">Doctors Hired</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* PAYMENT CARDS */}
          <motion.div variants={item}>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-[#0F172A]">Transaction History</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {payments.map((p) => (
                <div 
                  key={p.id} 
                  className="group relative flex flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md"
                >
                  <div>
                    <div className="mb-4 flex items-start justify-between">
                      <div className={cn(
                        "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider",
                        p.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {p.status === "completed" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        {p.status}
                      </div>
                      <span className="text-sm font-medium text-[#64748B]">
                        {formatDate(p.createdAt)}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[#0F172A]">Locum Shift Payment</h3>
                    <div className="mt-4 flex items-baseline gap-1 border-b border-[#E2E8F0] pb-4">
                      <span className="text-2xl font-bold text-emerald-600">{formatCurrencyInr(p.amount)}</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Razorpay Order ID</p>
                    <div className="mt-1 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                      <code className="text-xs font-bold text-slate-700 truncate">{p.razorpayId}</code>
                      <button 
                        onClick={() => copyToClipboard(p.razorpayId, p.id)}
                        className="ml-2 rounded-md bg-white p-1.5 text-slate-400 shadow-sm transition hover:text-emerald-600"
                        title="Copy ID"
                      >
                        {copiedId === p.id ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </DashboardShell>
  );
}

// ----- SUBCOMPONENTS -----

function CountUp({ value }: { value: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;

    let totalDuration = 1000;
    let incrementTime = (totalDuration / end) * 2;
    if (incrementTime < 10) incrementTime = 10; // Cap at 10ms for smooth animation

    const timer = setInterval(() => {
      start += Math.ceil(end / 20);
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value]);

  return <>{count.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</>;
}
