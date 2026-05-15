import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | React.ReactNode;
  caption?: string;
  iconColor?: string;
  iconBg?: string;
  borderColor?: string;
  bgClass?: string;
  textColorClass?: string;
  valueColorClass?: string;
  labelColorClass?: string;
}

export function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  caption,
  iconColor = "text-[#1E40AF]",
  iconBg = "bg-[#1E40AF]/10",
  borderColor = "border-[#E2E8F0]",
  bgClass = "bg-white",
  textColorClass = "text-[#0F172A]",
  valueColorClass = "text-[#0F172A]",
  labelColorClass = "text-[#64748B]"
}: StatCardProps) {
  return (
    <motion.section 
      variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        "rounded-xl border p-6 shadow-sm transition-shadow hover:shadow-md relative overflow-hidden",
        borderColor, bgClass
      )}
    >
      <div className="flex items-start justify-between gap-4 relative z-10">
        <div>
          <p className={cn("text-xs font-bold uppercase tracking-wider", labelColorClass)}>{label}</p>
          <div className={cn("mt-2 text-3xl font-black tracking-tight", valueColorClass)}>{value}</div>
          {caption ? <p className={cn("mt-1 text-xs font-semibold", textColorClass, "opacity-80")}>{caption}</p> : null}
        </div>
        <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full", iconBg, iconColor)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </motion.section>
  );
}
