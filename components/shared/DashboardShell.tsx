"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-[#1E40AF]">Medrova</span>
            <Activity className="h-5 w-5 text-[#1E40AF]" />
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-4">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#1E40AF] text-white"
                    : "text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-[#64748B]")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {userProfile && (
          <div className="mb-4 mt-auto px-4">
            <div className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1E40AF]/10 text-sm font-bold text-[#1E40AF]">
                {getInitials(userProfile.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[#0F172A]">Dr. {userProfile.name}</p>
                {userProfile.verificationStatus === "verified" ? (
                  <p className="flex items-center gap-1 text-xs font-medium text-[#10B981]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]"></span> Verified
                  </p>
                ) : (
                  <p className="flex items-center gap-1 text-xs font-medium text-[#F59E0B]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]"></span> Pending
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-[#E2E8F0] p-4">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#64748B] transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
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
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-[60px] items-center justify-around border-t border-[#E2E8F0] bg-white pb-safe lg:hidden">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                isActive ? "text-[#1E40AF]" : "text-[#64748B]"
              )}
            >
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="mobileTabIndicator"
                    className="absolute top-0 h-0.5 w-8 rounded-b-full bg-[#1E40AF]"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </AnimatePresence>
              <Icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
