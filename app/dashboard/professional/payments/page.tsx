"use client";

import { useEffect, useState } from "react";
import { Loader2, IndianRupee, CheckCircle2, Clock, Building2, Calendar } from "lucide-react";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { professionalNavigation } from "@/lib/constants";
import type { ProfessionalPayout, HealthcareProfessional } from "@/types";
import { formatCurrencyInr, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";

export default function ProfessionalPaymentsPage() {
  const [payouts, setPayouts] = useState<ProfessionalPayout[]>([]);
  const [profile, setProfile] = useState<HealthcareProfessional | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [profRes, payoutsRes] = await Promise.all([
          fetch("/api/professional/profile"),
          fetch("/api/professional/payouts")
        ]);
        const profResult = await profRes.json();
        const payoutsResult = await payoutsRes.json();
        if (!profRes.ok) throw new Error(profResult.error ?? "Failed to load profile.");
        if (!payoutsRes.ok) throw new Error(payoutsResult.error ?? "Failed to load payouts.");
        if (!isMounted) return;
        setProfile(profResult.profile);
        setPayouts(payoutsResult.payouts ?? []);
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : "An error occurred.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  const totalEarned = payouts.filter(p => p.status === "completed").reduce((s, p) => s + p.amount, 0);
  const pendingAmount = payouts.filter(p => p.status === "pending").reduce((s, p) => s + p.amount, 0);

  return (
    <DashboardShell
      items={professionalNavigation}
      userProfile={profile ? { name: profile.name, verificationStatus: profile.verificationStatus } : undefined}
    >
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#0F172A]">Payments</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">Track your shift earnings and payout status.</p>
        </div>
        {profile && (
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Payout Method</span>
            <span className="mt-1 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-700">
              UPI: {profile.upiId}
            </span>
          </div>
        )}
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500">Total Earned</p>
              <p className="text-3xl font-black text-[#0F172A]">{formatCurrencyInr(totalEarned)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500">Pending Processing</p>
              <p className="text-3xl font-black text-[#0F172A]">{formatCurrencyInr(pendingAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      <h2 className="mb-4 text-xl font-bold text-[#0F172A]">Transaction History</h2>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#1E40AF]" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">{error}</div>
      ) : payouts.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
            <IndianRupee className="h-8 w-8 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No payouts yet</h3>
          <p className="mt-2 max-w-sm text-sm text-slate-500">Complete shifts to start earning. Payouts are processed automatically via UPI.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {payouts.map((payout) => {
            const s = payout.shift;
            return (
              <article key={payout.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Amount</p>
                    <p className="mt-1 text-3xl font-black text-[#0F172A]">{formatCurrencyInr(payout.amount)}</p>
                  </div>
                  <StatusBadge status={payout.status} />
                </div>

                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  {s ? (
                    <div>
                      <p className="font-bold text-[#0F172A]">{s.specialty}</p>
                      <div className="mt-2 grid gap-2 text-xs font-medium text-slate-500">
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(s.date)}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{s.startTime} - {s.endTime}</span>
                        <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{s.clinic?.name ?? "Unknown clinic"}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="italic text-slate-400">Shift deleted</span>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Requested {formatDate(payout.createdAt)}</span>
                  {payout.status === "completed" && payout.paidAt && (
                    <span>Paid {formatDate(payout.paidAt)}</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
