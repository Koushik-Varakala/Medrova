"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, animate, useInView, AnimatePresence } from "framer-motion";
import {
  Menu, X, CheckCircle2, Star, Quote, Shield, ShieldCheck, Clock, IndianRupee,
  Activity, Users, Building, Building2, Wallet, MapPin, ChevronRight, LogOut, User as UserIcon,
  Stethoscope, AlertTriangle, XCircle, Zap, Lock
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createSupabaseBrowserClient } from "@/lib/supabase";

import { LiveShiftsPreview } from "@/components/landing/LiveShiftsPreview";

function AnimatedCounter({ from = 0, to, prefix = "", suffix = "" }: { from?: number, to: number, prefix?: string, suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView && ref.current) {
      const controls = animate(from, to, {
        duration: 2,
        ease: "easeOut",
        onUpdate(value) {
          if (ref.current) {
            ref.current.textContent = `${prefix}${Math.round(value)}${suffix}`;
          }
        }
      });
      return () => controls.stop();
    }
  }, [inView, from, to, prefix, suffix]);

  return <span ref={ref}>{prefix}{from}{suffix}</span>;
}

function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ email?: string, role?: string } | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${scrolled ? "bg-white/40 backdrop-blur-lg shadow-sm border-b border-white/20" : "bg-transparent"
        }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Medrova Logo"
            width={160}
            height={50}
            className={`object-contain transition-all duration-300 hover:scale-105 ${!scrolled ? "brightness-0 invert drop-shadow-lg" : ""}`}
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${scrolled ? "text-[#0F172A] hover:text-[#1E40AF]" : "text-white/90 hover:text-white"
                  }`}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1E40AF]/10 text-[#1E40AF] backdrop-blur-md">
                  <UserIcon className="h-4 w-4" />
                </div>
                Signed In
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
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
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Activity className="h-4 w-4" />
                        Dashboard
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
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
              <button
                onClick={() => document.getElementById('live-jobs')?.scrollIntoView({ behavior: 'smooth' })}
                className={`px-4 py-2 text-sm font-medium transition-colors ${scrolled ? "text-[#0F172A] hover:text-[#1E40AF]" : "text-white/90 hover:text-white"
                  }`}
              >
                Browse Jobs
              </button>
              <Link
                href="/sign-in"
                className={`px-4 py-2 text-sm font-medium transition-colors ${scrolled ? "text-[#0F172A] hover:text-[#1E40AF]" : "text-white/90 hover:text-white"
                  }`}
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="rounded-full bg-[#1E40AF] px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-[#1D4ED8] hover:shadow-xl hover:-translate-y-0.5"
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
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      document.getElementById('live-jobs')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-[#0F172A] font-medium p-2 text-left"
                  >
                    Browse Jobs
                  </button>
                  <Link href="/sign-in" className="text-[#0F172A] font-medium p-2" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className="rounded-lg bg-[#1E40AF] p-3 text-center font-medium text-white"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"doctors" | "clinics">("doctors");
  const { scrollYProgress } = useScroll();
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -150]);

  const headlineWords = "Healthcare Staffing, Finally Done Right.".split(" ");

  const steps = {
    doctors: [
      { title: "Create Your Profile", desc: "Sign up free. Upload your MCI certificate, degree, and government ID. Nurses upload nursing council registration. Technicians upload relevant certifications." },
      { title: "Get Verified", desc: "Our team manually reviews every credential before you can apply to shifts or jobs. This verification is what makes clinics trust you instantly." },
      { title: "Browse Shifts and Jobs", desc: "See locum shifts sorted by distance, pay, and urgency. Apply in one tap. Browse permanent job postings from verified clinics." },
      { title: "Work and Get Paid", desc: "Complete the shift. Receive your full payment directly to your UPI ID within 24 hours. No chasing. No waiting. Guaranteed." }
    ],
    clinics: [
      { title: "Register Your Clinic", desc: "Create a clinic account and upload your registration certificate. Free to register, free to post permanent jobs." },
      { title: "Post a Shift or Job", desc: "For permanent jobs: post free, receive applications, hire off-platform. For locum shifts: set the specialty, date, time, and pay." },
      { title: "Pay Upfront, Secure the Shift", desc: "When you confirm a professional, pay the shift fee via Razorpay. Funds are held in escrow. The professional has a 100% guarantee before they show up." },
      { title: "Mark Complete, Trigger Payout", desc: "After the shift, mark it complete on your dashboard. Medrova releases payment to the professional within 24 hours. You retain the invoice." }
    ]
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans selection:bg-[#1E40AF]/20">
      <LandingNavbar />

      {/* HERO SECTION */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0 bg-black">
          {/* Desktop Video */}
          <video
            autoPlay
            muted
            loop
            playsInline
            className="hidden md:block h-full w-full object-cover opacity-80"
            poster=""
          >
            <source src="/hero.mp4" type="video/mp4" />
          </video>
          {/* Mobile Video */}
          <video
            autoPlay
            muted
            loop
            playsInline
            className="block md:hidden h-full w-full object-cover opacity-80"
            poster=""
          >
            <source src="/hero_m.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-[#0F172A]/60" />
        </div>

        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-20 md:px-6 lg:grid-cols-2 lg:gap-8 w-full">
          <div className="flex flex-col justify-center max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-md w-fit"
            >
              <MapPin className="h-4 w-4 text-blue-400" />
              Now Live in Hyderabad · India&apos;s First Verified Locum Marketplace
            </motion.div>

            <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-white md:text-6xl lg:text-7xl">
              {headlineWords.map((word, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="inline-block mr-3"
                >
                  {word}
                </motion.span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mb-10 text-lg leading-relaxed text-slate-300 md:text-xl"
            >
              Medrova connects verified doctors, nurses, and technicians with Hyderabad clinics for locum shifts and permanent jobs. Clinics pay upfront. Professionals get paid in 24 hours. Guaranteed.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8, type: "spring", stiffness: 100 }}
              className="flex flex-col gap-4 sm:flex-row"
            >
              <Link
                href="/sign-up"
                className="group relative flex items-center justify-center gap-2 rounded-full bg-[#1E40AF] px-8 py-4 text-base font-semibold text-white shadow-[0_0_20px_rgba(30,64,175,0.4)] transition-all hover:bg-[#1D4ED8] hover:shadow-[0_0_30px_rgba(30,64,175,0.6)] hover:-translate-y-1 text-center"
              >
                Join as a Doctor / Nurse / Technician
              </Link>
              <Link
                href="/sign-up"
                className="flex items-center justify-center gap-2 rounded-full border-2 border-white/30 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/50 text-center"
              >
                Register Your Clinic
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.2 }}
              className="mt-12 flex flex-wrap gap-6 text-sm font-medium text-slate-300"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" /> MCI & NNC Verified Professionals Only
              </div>
              <div className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-emerald-400" /> Upfront Escrow Payment for Every Shift
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-400" /> Guaranteed 24hr UPI Payout
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-400" /> Launching in Hyderabad
              </div>
            </motion.div>
          </div>

          <div className="hidden lg:relative lg:block">
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute right-0 top-32 w-80 rounded-2xl border border-white/10 bg-[#0F172A]/40 p-5 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <div className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">Shift Confirmed</p>
                  <p className="text-sm text-slate-300">Pediatric Clinic, Kukatpally</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute right-20 top-72 w-80 rounded-2xl border border-white/10 bg-[#0F172A]/40 p-5 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                  <div className="h-3 w-3 rounded-full bg-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">Payout Sent</p>
                  <p className="text-sm text-slate-300">₹4,500 to UPI in 18hrs</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* LIVE SHIFTS PREVIEW */}
      <section id="live-jobs" className="bg-slate-50 py-24 relative overflow-hidden scroll-mt-20">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
        <div className="relative mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-12 text-center max-w-2xl mx-auto">
            <span className="mb-4 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#1E40AF]">Live Opportunities</span>
            <h2 className="text-3xl font-bold tracking-tight text-[#0F172A] md:text-5xl mb-4">Real Shifts. Real Pay.</h2>
            <p className="text-lg text-slate-600">
              Browse live locum shifts and permanent jobs currently available in Hyderabad. Create an account to see clinic details and apply instantly.
            </p>
          </div>

          <LiveShiftsPreview />
        </div>
      </section>

      {/* THE PROBLEM */}
      <section className="bg-[#0F172A] py-24 border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-16 text-center">
            <span className="mb-4 inline-block rounded-full bg-slate-800 px-3 py-1 text-xs font-bold uppercase tracking-widest text-slate-300">The Problem</span>
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">Healthcare staffing in India is broken.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm"
            >
              <AlertTriangle className="mb-6 h-10 w-10 text-amber-400" />
              <h3 className="mb-3 text-xl font-bold text-white">No Credential Trust</h3>
              <p className="text-slate-400 leading-relaxed">Clinics have no quick way to verify a locum doctor&apos;s MCI registration or a nurse&apos;s certification before they walk through the door.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm"
            >
              <XCircle className="mb-6 h-10 w-10 text-red-400" />
              <h3 className="mb-3 text-xl font-bold text-white">Payment Insecurity</h3>
              <p className="text-slate-400 leading-relaxed">Professionals complete 12-hour emergency shifts and then spend weeks chasing payment. Ghosting and delays are the norm.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm"
            >
              <Clock className="mb-6 h-10 w-10 text-slate-400" />
              <h3 className="mb-3 text-xl font-bold text-white">Zero Speed</h3>
              <p className="text-slate-400 leading-relaxed">Clinics facing a last-minute gap rely on WhatsApp forwards and phone calls. By the time someone shows up, the damage is done.</p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-16 text-center"
          >
            <p className="text-xl font-bold text-white">Medrova fixes all three. Structurally, not just operationally.</p>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F0F5FF] to-white py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#0F172A] md:text-5xl">How Medrova Works</h2>
            <p className="mt-4 text-lg text-[#64748B]">Simple, transparent, and built for speed.</p>
          </div>

          <div className="mx-auto max-w-3xl">
            <div className="mb-12 flex rounded-xl bg-white p-1 shadow-sm border border-slate-200 relative z-10">
              <button
                onClick={() => setActiveTab("doctors")}
                className={`flex-1 rounded-lg py-3 text-sm font-semibold transition-all ${activeTab === "doctors" ? "bg-[#1E40AF] text-white shadow-md" : "text-slate-600 hover:text-[#0F172A]"
                  }`}
              >
                For Professionals
              </button>
              <button
                onClick={() => setActiveTab("clinics")}
                className={`flex-1 rounded-lg py-3 text-sm font-semibold transition-all ${activeTab === "clinics" ? "bg-[#1E40AF] text-white shadow-md" : "text-slate-600 hover:text-[#0F172A]"
                  }`}
              >
                For Clinics
              </button>
            </div>

            <div className="relative ml-4 md:ml-8">
              <motion.div
                initial={{ height: 0 }}
                whileInView={{ height: "100%" }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="absolute left-[23px] top-4 bottom-4 w-0.5 border-l-2 border-dashed border-[#1E40AF]/30 z-0"
              />

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-12"
                >
                  {steps[activeTab].map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.2 }}
                      className="relative flex items-start pl-20"
                    >
                      <div className="absolute left-0 top-0 z-10 flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-[#1E40AF] text-lg font-bold text-white shadow-md">
                        {i + 1}
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md w-full">
                        <h3 className="text-xl font-semibold text-[#0F172A] mb-2">{step.title}</h3>
                        <p className="text-slate-600 leading-relaxed">{step.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* WHY MEDROVA */}
      <section className="bg-gradient-to-br from-[#F8FAFC] via-white to-[#EFF6FF] py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-16 text-center">
            <span className="mb-4 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#1E40AF]">Why Medrova</span>
            <h2 className="text-3xl font-bold tracking-tight text-[#0F172A] md:text-5xl">This is not just a job board.</h2>
            <p className="mt-4 text-lg text-[#64748B]">Medrova is trust infrastructure for healthcare staffing.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Strict Credential Verification", desc: "Every doctor, nurse, and technician is manually verified by our team — MCI numbers, nursing council registrations, degrees, and government IDs. If documents change, verification resets automatically.", icon: ShieldCheck, color: "text-blue-600" },
              { title: "Escrow Payment Model", desc: "Clinics pay the full shift amount upfront via Razorpay before a shift goes live. The money is secured before the professional walks in the door. No more payment risk.", icon: Lock, color: "text-emerald-600" },
              { title: "24-Hour Guaranteed Payout", desc: "Once a clinic marks a shift complete, Medrova initiates the UPI transfer within 24 hours. No delays, no negotiations, no exceptions.", icon: Zap, color: "text-amber-500" },
              { title: "Transparent and Fair Pricing", desc: "Professionals always join and use Medrova for free. Clinics pay a flat 10% platform fee on locum shifts only. Permanent job posting is always free.", icon: IndianRupee, color: "text-purple-600" },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -8, scale: 1.02 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl hover:border-blue-100 relative z-10 flex flex-col"
              >
                <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-slate-50 transition-colors group-hover:bg-slate-100 ${feature.color}`}>
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-[#0F172A]">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm flex-1">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* EARLY ACCESS */}
      <section className="overflow-hidden bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-16 text-center">
            <span className="mb-4 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#1E40AF]">Now Live in Hyderabad</span>
            <h2 className="text-3xl font-bold tracking-tight text-[#0F172A] md:text-5xl">Be Among the First on Medrova.</h2>
            <p className="mt-4 text-lg text-[#64748B]">We just launched. Join early and help shape India&apos;s most trusted healthcare staffing platform.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* For Doctors */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border-2 border-blue-100 bg-blue-50 p-8 shadow-sm flex flex-col hover:border-blue-200 transition-colors"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#1E40AF] shadow-sm">
                <Stethoscope className="h-8 w-8" />
              </div>
              <h3 className="mb-3 text-2xl font-bold text-[#0F172A]">I&apos;m a Doctor, Nurse, or Technician</h3>
              <p className="mb-6 text-slate-600 leading-relaxed">Join free. Browse verified locum shifts and permanent jobs across Hyderabad. Get paid within 24 hours of every shift you complete.</p>

              <ul className="mb-8 space-y-3 text-sm text-slate-600 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#1E40AF]" /> Free to join, always</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#1E40AF]" /> MCI / NNC verified badge on your profile</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#1E40AF]" /> 24hr guaranteed UPI payout</li>
              </ul>

              <Link
                href="/sign-up"
                className="mt-auto block w-full text-center rounded-full bg-[#1E40AF] px-8 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#1D4ED8] hover:-translate-y-0.5"
              >
                Create Your Profile
              </Link>
            </motion.div>

            {/* For Clinics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-2xl border-2 border-slate-200 bg-white p-8 shadow-sm flex flex-col hover:border-slate-300 transition-colors"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <Building2 className="h-8 w-8" />
              </div>
              <h3 className="mb-3 text-2xl font-bold text-[#0F172A]">I Run a Clinic or Hospital</h3>
              <p className="mb-6 text-slate-600 leading-relaxed">Register free. Post permanent jobs at no cost. For locum shifts, pay upfront and get a verified professional within hours.</p>

              <ul className="mb-8 space-y-3 text-sm text-slate-600 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-slate-400" /> Free permanent job posting</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-slate-400" /> Manually verified professionals only</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-slate-400" /> Pay only for locum shifts, 10% flat fee</li>
              </ul>

              <Link
                href="/sign-up"
                className="mt-auto block w-full text-center rounded-full border-2 border-slate-200 bg-white px-8 py-3.5 text-sm font-bold text-[#0F172A] transition-all hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5"
              >
                Register Your Clinic
              </Link>
            </motion.div>
          </div>

          <div className="mt-12 text-center border-t border-slate-100 pt-8">
            <p className="text-sm font-medium text-slate-500">No subscription · No hidden fees · Doctors, nurses, and technicians always free</p>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1E40AF] to-[#1D4ED8] py-24">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent bg-[length:20px_20px]" />

        <motion.div className="relative mx-auto max-w-4xl px-4 text-center md:px-6">
          <motion.h2
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="mb-6 text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl"
          >
            Ready to fix healthcare staffing in Hyderabad?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mb-10 text-xl text-blue-100 max-w-2xl mx-auto"
          >
            Join the platform that guarantees credential trust, upfront payment, and 24-hour payouts.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link
              href="/sign-up"
              className="w-full sm:w-auto rounded-full bg-white px-8 py-4 text-base font-bold text-[#1E40AF] shadow-lg transition-transform hover:scale-105"
            >
              Join as a Professional
            </Link>
            <Link
              href="/sign-up"
              className="w-full sm:w-auto rounded-full border-2 border-white/30 px-8 py-4 text-base font-bold text-white transition-colors hover:bg-white/10"
            >
              Register Your Clinic
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white pt-16 pb-8 border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid gap-12 md:grid-cols-3 mb-12"
          >
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <Image
                  src="/logo.png"
                  alt="Medrova Logo"
                  width={120}
                  height={40}
                  className="object-contain"
                />
              </Link>
              <p className="text-slate-500 leading-relaxed max-w-xs">
                India&apos;s verified healthcare staffing marketplace. Launching in Hyderabad.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-[#0F172A] mb-4">Quick Links</h3>
              <ul className="space-y-3">
                <li><Link href="/sign-up" className="text-slate-500 hover:text-[#1E40AF] transition-colors">Join as Doctor</Link></li>
                <li><Link href="/sign-up" className="text-slate-500 hover:text-[#1E40AF] transition-colors">Hire for Clinic</Link></li>
                <li><Link href="/sign-in" className="text-slate-500 hover:text-[#1E40AF] transition-colors">Login</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-[#0F172A] mb-4">Contact</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-slate-500">
                  <MapPin className="h-4 w-4" /> Hyderabad, Telangana, India
                </li>
                <li className="text-slate-500">hello@medrova.in</li>
                <li className="text-slate-500">+91 77990 01102</li>
              </ul>
            </div>
          </motion.div>

          <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col gap-1 text-center md:text-left">
              <p className="text-slate-400 text-sm">© {new Date().getFullYear()} Medrova. All rights reserved.</p>
              <p className="text-slate-400 text-xs">Operated by <strong className="text-slate-500">Varakala Koushik Kumar</strong> · Sole Proprietor · Hyderabad, Telangana, India</p>
            </div>
            <div className="flex flex-col gap-1 text-center md:text-right">
              <p className="text-slate-400 text-sm font-medium">Made with ❤️ in Hyderabad</p>
              <p className="text-slate-400 text-xs">For support: koushik@medrova.in · +91 77990 01102</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
