"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface LogoutButtonProps {
  /** "sidebar" renders a full-width text+icon row. "tab" renders a compact icon+label tab. */
  variant?: "sidebar" | "tab";
}

export function LogoutButton({ variant = "sidebar" }: LogoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
      router.push("/sign-in");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  if (variant === "tab") {
    return (
      <button
        className={cn(
          "flex min-w-20 flex-1 flex-col items-center justify-center gap-1 px-2 text-xs font-medium",
          isLoading ? "text-[#94A3B8]" : "text-[#EF4444]"
        )}
        disabled={isLoading}
        onClick={handleLogout}
        type="button"
      >
        <LogOut className="h-5 w-5" />
        <span className="truncate">{isLoading ? "…" : "Logout"}</span>
      </button>
    );
  }

  return (
    <button
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition",
        isLoading
          ? "cursor-not-allowed text-[#94A3B8]"
          : "text-[#EF4444] hover:bg-[#EF4444]/10"
      )}
      disabled={isLoading}
      onClick={handleLogout}
      type="button"
    >
      <LogOut className="h-4 w-4 shrink-0" />
      {isLoading ? "Signing out…" : "Log out"}
    </button>
  );
}
