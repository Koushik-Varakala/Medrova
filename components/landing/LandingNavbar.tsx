"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, Activity, LogOut, User as UserIcon, CalendarCheck, BriefcaseMedical, Building2, User
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createSupabaseBrowserClient } from "@/lib/supabase";

export function LandingNavbar({ forceDark = false }: { forceDark?: boolean } = {}) {
  const [scrolled, setScrolled] = useState(forceDark);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ email?: string, role?: string } | null>(null);
  
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [profDropdown, setProfDropdown] = useState(false);
  const [clinicDropdown, setClinicDropdown] = useState(false);

  useEffect(() => {
    if (forceDark) return;
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [forceDark]);

  useEffect(() => {
    async function checkUser() {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: roleRow } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .maybeSingle();

        const role = roleRow?.role ?? session.user.user_metadata?.role;
        setUser({ email: session.user.email, role: role ?? "unknown" });
      }
    }
    checkUser();
  }, []);

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    window.location.reload();
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.nav-dropdown-trigger')) {
        setProfDropdown(false);
        setClinicDropdown(false);
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const navLinkClass = `flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
    scrolled 
      ? "text-[#0F172A] hover:text-[#1E40AF] hover:bg-blue-50" 
      : "text-white/90 hover:text-white hover:bg-white/10"
  }`;

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        scrolled ? "bg-white/40 backdrop-blur-lg shadow-sm border-b border-white/20" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Medrova Logo"
            width={160}
            height={50}
            className={`object-contain transition-all duration-300 hover:scale-105 ${!scrolled && !forceDark ? "brightness-0 invert drop-shadow-lg" : ""}`}
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-2 lg:gap-4">
          {user ? (
            <div className="relative nav-dropdown-trigger">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                  scrolled ? "text-[#0F172A] hover:text-[#1E40AF] hover:bg-blue-50" : "text-white/90 hover:text-white hover:bg-white/10"
                }`}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1E40AF]/10 text-[#1E40AF] backdrop-blur-md">
                  <UserIcon className="h-4 w-4" />
                </div>
                Signed In
              </button>

              <AnimatePresence>
                {userDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
                  >
                    <div className="border-b border-gray-100 px-4 py-3">
                      <p className="truncate text-sm font-medium text-gray-900">{user.email}</p>
                    </div>
                    <div className="p-2">
                      <Link
                        href={
                          user.role === "clinic" ? "/dashboard/clinic" :
                            user.role === "admin" ? "/dashboard/admin" :
                              user.role === "doctor" ? "/dashboard/doctor" :
                                (user.role === "nurse" || user.role === "technician") ? "/dashboard/professional" :
                                  "/sign-up"
                        }
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Activity className="h-4 w-4" />
                        Dashboard
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              {/* For Professionals Dropdown */}
              <div 
                className="relative nav-dropdown-trigger"
                onMouseEnter={() => setProfDropdown(true)}
                onMouseLeave={() => setProfDropdown(false)}
              >
                <button
                  onClick={() => setProfDropdown(!profDropdown)}
                  className={navLinkClass}
                >
                  For Professionals
                </button>
                <AnimatePresence>
                  {profDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
                    >
                      <div className="p-2">
                        <Link href="/shifts" className="flex items-start gap-3 rounded-lg px-3 py-3 hover:bg-blue-50 transition-colors">
                          <CalendarCheck className="h-5 w-5 text-[#1E40AF] mt-0.5" />
                          <div>
                            <div className="text-sm font-bold text-[#0F172A]">Browse Shifts</div>
                            <div className="text-xs text-slate-500">Find locum shifts in your area</div>
                          </div>
                        </Link>
                        <Link href="/jobs" className="flex items-start gap-3 rounded-lg px-3 py-3 hover:bg-blue-50 transition-colors">
                          <BriefcaseMedical className="h-5 w-5 text-[#1E40AF] mt-0.5" />
                          <div>
                            <div className="text-sm font-bold text-[#0F172A]">Browse Jobs</div>
                            <div className="text-xs text-slate-500">Find permanent roles</div>
                          </div>
                        </Link>
                        <button 
                          onClick={() => {
                            setProfDropdown(false);
                            if (window.location.pathname === '/') {
                              document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                            } else {
                              window.location.href = '/#how-it-works';
                            }
                          }}
                          className="flex w-full items-start gap-3 rounded-lg px-3 py-3 hover:bg-slate-50 transition-colors text-left"
                        >
                          <Activity className="h-5 w-5 text-slate-400 mt-0.5" />
                          <div>
                            <div className="text-sm font-bold text-[#0F172A]">How It Works</div>
                            <div className="text-xs text-slate-500">See the verification process</div>
                          </div>
                        </button>
                        <Link href="/sign-up" className="flex items-start gap-3 rounded-lg px-3 py-3 hover:bg-emerald-50 transition-colors">
                          <User className="h-5 w-5 text-emerald-600 mt-0.5" />
                          <div>
                            <div className="text-sm font-bold text-emerald-700">Join Free</div>
                            <div className="text-xs text-emerald-600/70">Create your verified profile</div>
                          </div>
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* For Clinics Dropdown */}
              <div 
                className="relative nav-dropdown-trigger"
                onMouseEnter={() => setClinicDropdown(true)}
                onMouseLeave={() => setClinicDropdown(false)}
              >
                <button
                  onClick={() => setClinicDropdown(!clinicDropdown)}
                  className={navLinkClass}
                >
                  For Clinics
                </button>
                <AnimatePresence>
                  {clinicDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
                    >
                      <div className="p-2">
                        <Link href="/sign-up" className="flex items-start gap-3 rounded-lg px-3 py-3 hover:bg-blue-50 transition-colors">
                          <CalendarCheck className="h-5 w-5 text-[#1E40AF] mt-0.5" />
                          <div>
                            <div className="text-sm font-bold text-[#0F172A]">Post a Shift</div>
                            <div className="text-xs text-slate-500">Hire for short-term gaps</div>
                          </div>
                        </Link>
                        <Link href="/sign-up" className="flex items-start gap-3 rounded-lg px-3 py-3 hover:bg-blue-50 transition-colors">
                          <BriefcaseMedical className="h-5 w-5 text-[#1E40AF] mt-0.5" />
                          <div>
                            <div className="text-sm font-bold text-[#0F172A]">Post a Job Free</div>
                            <div className="text-xs text-slate-500">Hire for permanent roles</div>
                          </div>
                        </Link>
                        <button 
                          onClick={() => {
                            setClinicDropdown(false);
                            if (window.location.pathname === '/') {
                              document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                            } else {
                              window.location.href = '/#how-it-works';
                            }
                          }}
                          className="flex w-full items-start gap-3 rounded-lg px-3 py-3 hover:bg-slate-50 transition-colors text-left"
                        >
                          <Activity className="h-5 w-5 text-slate-400 mt-0.5" />
                          <div>
                            <div className="text-sm font-bold text-[#0F172A]">How It Works</div>
                            <div className="text-xs text-slate-500">See our escrow model</div>
                          </div>
                        </button>
                        <Link href="/sign-up" className="flex items-start gap-3 rounded-lg px-3 py-3 hover:bg-emerald-50 transition-colors">
                          <Building2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                          <div>
                            <div className="text-sm font-bold text-emerald-700">Register Clinic</div>
                            <div className="text-xs text-emerald-600/70">Create a clinic account</div>
                          </div>
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="w-px h-6 bg-white/20 mx-1 hidden lg:block" />

              <Link href="/sign-in" className={navLinkClass}>
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="rounded-full bg-[#1E40AF] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-[#1D4ED8] hover:shadow-xl hover:-translate-y-0.5"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Nav Toggle */}
        <button
          className={`md:hidden p-2 ${scrolled ? "text-[#0F172A]" : "text-white"}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden bg-white border-b border-gray-200"
          >
            <div className="flex flex-col px-4 py-6 gap-4">
              {user ? (
                <>
                  <div className="border-b border-gray-100 pb-4">
                    <p className="text-sm font-medium text-gray-500">Signed in as</p>
                    <p className="truncate text-sm font-bold text-gray-900">{user.email}</p>
                  </div>
                  <Link
                    href={
                      user.role === "clinic" ? "/dashboard/clinic" :
                        user.role === "admin" ? "/dashboard/admin" :
                          user.role === "doctor" ? "/dashboard/doctor" :
                            (user.role === "nurse" || user.role === "technician") ? "/dashboard/professional" :
                              "/sign-up"
                    }
                    className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 font-medium text-gray-900"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Activity className="h-5 w-5 text-[#1E40AF]" />
                    Go to Dashboard
                  </Link>
                  <button
                    onClick={() => { setMobileMenuOpen(false); handleSignOut(); }}
                    className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 font-medium text-red-600"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <div className="border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">For Professionals</h4>
                    <Link href="/shifts" className="block text-[#0F172A] font-medium p-2 hover:bg-slate-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                      Browse Shifts
                    </Link>
                    <Link href="/jobs" className="block text-[#0F172A] font-medium p-2 hover:bg-slate-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                      Browse Jobs
                    </Link>
                  </div>

                  <div className="border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">For Clinics</h4>
                    <Link href="/sign-up" className="block text-[#0F172A] font-medium p-2 hover:bg-slate-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                      Post a Shift
                    </Link>
                    <Link href="/sign-up" className="block text-[#0F172A] font-medium p-2 hover:bg-slate-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                      Post a Job Free
                    </Link>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <Link href="/sign-in" className="text-center rounded-lg border border-slate-200 p-3 font-medium text-[#0F172A]" onClick={() => setMobileMenuOpen(false)}>
                      Sign In
                    </Link>
                    <Link
                      href="/sign-up"
                      className="rounded-lg bg-[#1E40AF] p-3 text-center font-bold text-white"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Get Started
                    </Link>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
