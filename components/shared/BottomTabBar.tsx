"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/shared/LogoutButton";

export interface BottomTabItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface BottomTabBarProps {
  items: BottomTabItem[];
}

export function BottomTabBar({ items }: BottomTabBarProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E2E8F0] bg-white lg:hidden">
      <div className="flex min-h-16 overflow-x-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              className={cn(
                "flex min-w-20 flex-1 flex-col items-center justify-center gap-1 px-2 text-xs font-medium text-[#64748B]",
                isActive && "text-[#1E40AF]"
              )}
              href={item.href}
              key={item.href}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
        <LogoutButton variant="tab" />
      </div>
    </nav>
  );
}
