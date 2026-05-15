"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/shared/LogoutButton";

export interface SidebarItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface SidebarProps {
  items: SidebarItem[];
}

export function Sidebar({ items }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-64 flex-col border-r border-[#E2E8F0] bg-white p-6 lg:flex">
      <Link href="/" className="flex items-center transition-transform hover:scale-105">
        <Image
          src="/logo.png"
          alt="Medrova Logo"
          width={120}
          height={38}
          className="object-contain"
          priority
        />
      </Link>
      <nav className="mt-8 flex-1 space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-[#64748B]",
                isActive && "bg-[#1E40AF] text-white",
                !isActive && "hover:bg-[#F8FAFC] hover:text-[#1E40AF]"
              )}
              href={item.href}
              key={item.href}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-4 border-t border-[#E2E8F0] pt-4">
        <LogoutButton variant="sidebar" />
      </div>
    </aside>
  );
}
