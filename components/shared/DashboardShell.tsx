"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LogOut, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase";

export interface DashboardItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface DashboardShellProps {
  children: React.ReactNode;
  items: DashboardItem[];
  userProfile?: {
    name: string;
    verificationStatus: string;
  };
}

export function DashboardShell({ children, items, userProfile }: DashboardShellProps) {
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const supabase = createSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    window.location.href = "/sign-in";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden w-[260px] flex-col border-r border-[#E2E8F0] bg-white lg:flex">
        <div className="flex h-20 items-center px-6">
          <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
            <Image
              src="/logo.png"
              alt="Medrova Logo"
              width={140}
              height={45}
              className="object-contain"
              priority
            />
            {pathname.startsWith("/dashboard/admin") && (
              <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black tracking-wider text-red-600 border border-red-200 uppercase">Admin</span>
            )}
          </Link>
        </div>

        <nav className="flex-1 space-y-1.5 px-3 py-4">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebarActiveIndicator"
                    className="absolute left-0 h-full w-1 rounded-r-full bg-blue-600"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {userProfile && (
          <div className="px-4 pb-4 mt-auto">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-700">
                {getInitials(userProfile.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900" title={userProfile.name}>
                  {userProfile.name}
                </p>
                {userProfile.verificationStatus === "verified" ? (
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Verified
                  </p>
                ) : (
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span> Pending
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-slate-200 p-4">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 transition-all hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            <LogOut className="h-5 w-5" />
            {isLoggingOut ? "Logging out..." : "Log out"}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 pb-20 lg:pb-0">
        <div className="mx-auto max-w-[1200px] p-4 md:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </div>
      </main>

      {/* MOBILE BOTTOM TAB BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-[68px] items-center justify-around border-t border-slate-200 bg-white/90 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)] backdrop-blur-xl lg:hidden">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200",
                isActive ? "text-blue-700" : "text-slate-500 hover:text-slate-800"
              )}
            >
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="mobileTabIndicator"
                    className="absolute top-0 h-1 w-10 rounded-b-full bg-blue-600"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </AnimatePresence>
              <Icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110 text-blue-600")} />
              <span className={cn("text-[10px] font-bold", isActive ? "text-blue-700" : "font-semibold")}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
