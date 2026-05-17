"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, IndianRupee, Clock, Briefcase, Zap, Calendar, Lock, X, Loader2, Filter, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type Opportunity = {
  id: string;
  type: 'shift' | 'job';
  role: string;
  specialty: string;
  payMin: number;
  payMax: number;
  location: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  isUrgent: boolean;
  createdAt: string;
};

export function LiveShiftsPreview() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Filters
  const [activeRole, setActiveRole] = useState<string>("all");
  const [activeType, setActiveType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal State
  const [selectedItem, setSelectedItem] = useState<Opportunity | null>(null);

  useEffect(() => {
    async function fetchOpportunities() {
      try {
        const res = await fetch('/api/public/opportunities');
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setOpportunities(data.opportunities || []);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchOpportunities();
  }, []);

  const filteredData = useMemo(() => {
    return opportunities.filter(item => {
      const matchRole = activeRole === "all" || item.role === activeRole;
      const matchType = activeType === "all" || item.type === activeType;
      const matchSearch = 
        item.specialty.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchRole && matchType && matchSearch;
    });
  }, [opportunities, activeRole, activeType, searchQuery]);

  const formatPay = (min: number, max: number) => {
    if (min === max) return `₹${min.toLocaleString()}`;
    return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`;
  };

  return (
    <div className="w-full relative">
      {/* FILTER BAR */}
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-4 lg:flex-row lg:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide bg-slate-100 p-1 rounded-xl">
            {["all", "doctor", "nurse", "technician"].map((role) => (
              <button
                key={role}
                onClick={() => setActiveRole(role)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all whitespace-nowrap",
                  activeRole === role ? "bg-white text-[#1E40AF] shadow-sm" : "text-slate-600 hover:text-slate-900"
                )}
              >
                {role === "all" ? "All Roles" : role + "s"}
              </button>
            ))}
          </div>

          <div className="h-8 w-px bg-slate-200 hidden lg:block mx-2" />

          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide bg-slate-100 p-1 rounded-xl">
            {["all", "shift", "job"].map((type) => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all whitespace-nowrap",
                  activeType === type ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                )}
              >
                {type === "all" ? "All Types" : type === "shift" ? "Locum Shifts" : "Permanent Jobs"}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by specialty or area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      {/* GRID */}
      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/50">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
          <p className="text-sm font-medium text-slate-500">Loading live opportunities...</p>
        </div>
      ) : error ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-red-300 bg-red-50 text-center">
          <ShieldAlert className="h-10 w-10 text-red-400 mb-4" />
          <p className="font-bold text-red-700">Unable to load shifts</p>
          <p className="text-sm text-red-500 mt-1">Please try refreshing the page.</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white text-center px-4">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <Search className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-[#0F172A]">No opportunities found</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md">
            There are currently no open positions matching your filters. Try adjusting your search or sign up to get notified when new shifts are posted.
          </p>
          <Link href="/sign-up" className="mt-6 rounded-full bg-[#1E40AF] px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#1D4ED8] transition-all">
            Get SMS Alerts
          </Link>
        </div>
      ) : (
        <motion.div layout className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filteredData.slice(0, 9).map((item, i) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-xl transition-all duration-300 flex flex-col relative"
              >
                {/* Hot Badge */}
                {item.isUrgent && (
                  <div className="absolute top-4 right-4 z-10 flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-red-600 shadow-sm border border-red-200">
                    <Zap className="h-3 w-3" fill="currentColor" /> Urgent Fill
                  </div>
                )}
                
                {item.type === 'job' && (
                  <div className="absolute top-4 right-4 z-10 flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-purple-700 shadow-sm border border-purple-200">
                    <Briefcase className="h-3 w-3" /> Permanent
                  </div>
                )}

                <div className="p-6 pb-5 flex-1">
                  <div className="mb-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{item.role}</p>
                    <h3 className="text-xl font-bold text-[#0F172A] line-clamp-1 group-hover:text-[#1E40AF] transition-colors">{item.specialty} {item.type === 'shift' ? 'Locum Shift' : 'Role'}</h3>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2.5 text-sm font-semibold text-emerald-600 bg-emerald-50 w-fit px-2.5 py-1 rounded-md border border-emerald-100">
                      <IndianRupee className="h-4 w-4" />
                      {formatPay(item.payMin, item.payMax)} {item.type === 'job' ? '/ month' : 'total payout'}
                    </div>

                    <div className="flex items-center gap-2.5 text-sm font-medium text-slate-600">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      {item.location} <span className="text-slate-400 text-xs">(Exact address hidden)</span>
                    </div>

                    {item.type === 'shift' && (
                      <div className="flex items-center gap-2.5 text-sm font-medium text-slate-600">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {item.date ? new Date(item.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Flexible'}
                        {item.startTime && <span className="text-slate-400 bg-slate-100 px-1.5 rounded text-xs ml-1">{item.startTime} - {item.endTime}</span>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Gate Footer */}
                <div className="border-t border-slate-100 bg-slate-50 p-4 relative overflow-hidden group-hover:bg-[#1E40AF] transition-colors duration-300">
                  <div className="flex items-center justify-between z-10 relative">
                    <span className="text-sm font-semibold text-slate-500 group-hover:text-blue-100 flex items-center gap-2">
                      <Lock className="h-4 w-4" /> Clinic Details Hidden
                    </span>
                    <span className="text-sm font-bold text-[#1E40AF] group-hover:text-white flex items-center gap-1">
                      Unlock <span className="hidden sm:inline">to Apply</span> &rarr;
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* UNLOCK MODAL */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setSelectedItem(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              {/* Blurred map background */}
              <div className="absolute top-0 left-0 right-0 h-40 bg-slate-100 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80')] bg-cover bg-center opacity-30 blur-sm scale-110" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white" />
              </div>

              <div className="relative pt-24 pb-8 px-8 text-center">
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-white/50 hover:bg-white text-slate-600 backdrop-blur-md transition-all shadow-sm"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E40AF] to-blue-600 text-white shadow-lg shadow-blue-900/20 border-4 border-white">
                  <Lock className="h-7 w-7" />
                </div>
                
                <h3 className="text-2xl font-black text-[#0F172A] mb-2">
                  Unlock this {selectedItem.type === 'shift' ? 'Locum Shift' : 'Permanent Job'}
                </h3>
                
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 text-left">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
                    <span className="text-sm font-semibold text-slate-500">Expected Payout</span>
                    <span className="text-lg font-black text-emerald-600 flex items-center">
                      <IndianRupee className="h-4 w-4" /> {formatPay(selectedItem.payMin, selectedItem.payMax)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-sm font-semibold text-slate-500">Location Area</span>
                    <span className="text-sm font-bold text-slate-900">{selectedItem.location}</span>
                  </div>
                  <div className="flex items-center justify-between opacity-50 blur-[2px] select-none pointer-events-none mt-2">
                    <span className="text-sm font-semibold text-slate-500">Clinic Name</span>
                    <span className="text-sm font-bold text-slate-900">Apollo Hospitals</span>
                  </div>
                </div>

                <p className="text-sm text-slate-600 mb-8 font-medium">
                  Create a free professional account to see the exact clinic details, full schedule, and apply instantly.
                </p>

                <Link
                  href="/sign-up"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E40AF] py-3.5 text-base font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-[#1D4ED8] hover:-translate-y-0.5"
                >
                  Create Free Account to Apply
                </Link>
                <div className="mt-4">
                  <Link href="/sign-in" className="text-sm font-semibold text-slate-500 hover:text-[#1E40AF]">
                    Already have an account? Sign in
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
