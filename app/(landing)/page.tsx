"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, animate, useInView, AnimatePresence } from "framer-motion";
import {
  Menu, X, CheckCircle2, Star, Quote, Shield, Clock, IndianRupee,
  Activity, Users, Building, Wallet, MapPin, ChevronRight, LogOut, User as UserIcon
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createSupabaseBrowserClient } from "@/lib/supabase";

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
        const [{ data: doctor }, { data: clinic }] = await Promise.all([
          supabase.from("doctors").select("id").eq("user_id", session.user.id).maybeSingle(),
          supabase.from("clinics").select("id").eq("user_id", session.user.id).maybeSingle()
        ]);

        let role = "onboarding";
        if (doctor) role = "doctor";
        else if (clinic) role = "clinic";

        setUser({ email: session.user.email, role });
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
            className={`object-contain transition-all duration-300 hover:scale-105 ${!scrolled ? "drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]" : ""}`}
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
                        href={user.role === "doctor" ? "/dashboard/doctor" : user.role === "clinic" ? "/dashboard/clinic" : "/onboarding/doctor"}
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
                    href={user.role === "doctor" ? "/dashboard/doctor" : user.role === "clinic" ? "/dashboard/clinic" : "/onboarding/doctor"}
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

  const headlineWords = "India's Trusted Doctor Recruitment Platform".split(" ");

  const steps = {
    doctors: [
      { title: "Create Profile", desc: "Upload your MCI certificate and verification details in minutes." },
      { title: "Browse Shifts", desc: "Find locum shifts in your city that perfectly fit your schedule." },
      { title: "Work & Get Paid", desc: "Complete your shift and receive guaranteed payout within 24 hours." }
    ],
    clinics: [
      { title: "Post a Shift", desc: "Specify date, time, specialty, and base pay. We add a transparent 10% fee." },
      { title: "Review Applicants", desc: "Verified doctors apply instantly. Choose the best fit for your clinic." },
      { title: "Confirm & Complete", desc: "Confirm the shift, and mark it complete once done. We handle the payout." }
    ]
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans selection:bg-[#1E40AF]/20">
      <LandingNavbar />

      {/* HERO SECTION */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0 bg-black">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover opacity-80"
            poster="https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1800&q=80"
          >
            <source src="https://www.pexels.com/video/doctors-looking-at-xray-results-4586955/" type="video/mp4" />
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
              Built for Hyderabad Healthcare
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
              Connecting verified locum doctors with top clinics. Fill shifts in hours, work when you want, and experience seamless 24-hour payouts.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8, type: "spring", stiffness: 100 }}
              className="flex flex-col gap-4 sm:flex-row"
            >
              <Link
                href="/sign-up"
                className="group relative flex items-center justify-center gap-2 rounded-full bg-[#1E40AF] px-8 py-4 text-base font-semibold text-white shadow-[0_0_20px_rgba(30,64,175,0.4)] transition-all hover:bg-[#1D4ED8] hover:shadow-[0_0_30px_rgba(30,64,175,0.6)] hover:-translate-y-1"
              >
                Join as a Doctor
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/sign-up"
                className="flex items-center justify-center gap-2 rounded-full border-2 border-white/30 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/50"
              >
                Hire for your Clinic
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.2 }}
              className="mt-12 flex flex-wrap gap-6 text-sm font-medium text-slate-300"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" /> 500+ Verified Doctors
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" /> 50+ Partner Clinics
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" /> 24hr Guaranteed Payout
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
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-white">Dr. Priya Sharma</p>
                  <p className="text-sm text-slate-300">Shift Confirmed ✓</p>
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
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-white">Pediatric Clinic, Kukatpally</p>
                  <p className="text-sm text-slate-300">Shift Filled in 2hrs</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="bg-[#0F172A] py-12 border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { label: "Verified Doctors", value: 500, suffix: "+" },
              { label: "Partner Clinics", value: 50, suffix: "+" },
              { label: "Paid Out", value: 10, prefix: "₹", suffix: "L+" },
              { label: "Payout Time", value: 24, suffix: "hr" }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-4xl md:text-5xl font-bold text-white mb-2">
                  <AnimatedCounter from={0} to={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </p>
                <p className="text-sm md:text-base font-medium text-slate-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
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
                For Doctors
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
            <h2 className="text-3xl font-bold tracking-tight text-[#0F172A] md:text-5xl">Why Choose Us</h2>
            <p className="mt-4 text-lg text-[#64748B]">The modern standard for locum recruitment.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Verified Network", desc: "Every doctor and clinic is manually verified by our team.", icon: Shield },
              { title: "Fast Payments", desc: "Guaranteed payouts within 24 hours of shift completion.", icon: Wallet },
              { title: "Flexible Schedule", desc: "Choose exactly when and where you want to work.", icon: Clock },
              { title: "Transparent Pricing", desc: "No hidden fees. Flat 10% platform fee for clinics.", icon: IndianRupee },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -8, scale: 1.02 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl hover:border-blue-100 relative z-10"
              >
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-[#1E40AF] transition-colors group-hover:bg-[#1E40AF] group-hover:text-white">
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-[#0F172A]">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="overflow-hidden bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#0F172A] md:text-5xl">Trusted by Peers</h2>
          </div>

          <div className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-8 md:grid md:grid-cols-3 md:overflow-visible px-4 md:px-0 scrollbar-hide">
            {[
              { quote: "Medrova changed how I find weekend shifts. The 24hr payout is completely real.", name: "Dr. Anil Reddy", role: "General Physician" },
              { quote: "We filled an emergency pediatric shift in just 2 hours. Incredible platform for clinics.", name: "Dr. Sunita Patel", role: "Pediatrician" },
              { quote: "The verification process ensures we only get top-tier locum doctors. Highly recommend.", name: "Dr. Ravi Kumar", role: "Orthopedic Surgeon" },
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                className="relative min-w-[300px] snap-center rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm"
              >
                <Quote className="absolute right-6 top-6 h-16 w-16 text-slate-200 opacity-50" />
                <div className="mb-6 flex gap-1">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-5 w-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mb-8 text-lg font-medium leading-relaxed text-[#0F172A] relative z-10">
                  &quot;{testimonial.quote}&quot;
                </p>
                <div>
                  <p className="font-bold text-[#1E40AF]">{testimonial.name}</p>
                  <p className="text-sm font-medium text-slate-500">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
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
            className="mb-8 text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl"
          >
            Ready to simplify your healthcare staffing?
          </motion.h2>

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
              Get Started Now
            </Link>
            <Link
              href="/sign-in"
              className="w-full sm:w-auto rounded-full border-2 border-white/30 px-8 py-4 text-base font-bold text-white transition-colors hover:bg-white/10"
            >
              Sign In to Dashboard
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
                India&apos;s trusted locum recruitment marketplace. Building the future of healthcare staffing in Hyderabad.
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
                <li className="text-slate-500">support@medrova.com</li>
                <li className="text-slate-500">+91 77990 01102</li>
              </ul>
            </div>
          </motion.div>

          <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-sm">© {new Date().getFullYear()} Medrova. All rights reserved.</p>
            <p className="text-slate-400 text-sm font-medium">Made with ❤️ in Hyderabad</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
