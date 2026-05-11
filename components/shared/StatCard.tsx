import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  caption?: string;
}

export function StatCard({ icon: Icon, label, value, caption }: StatCardProps) {
  return (
    <section className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#64748B]">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-[#0F172A]">{value}</p>
          {caption ? <p className="mt-1 text-xs text-[#64748B]">{caption}</p> : null}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1E40AF]/10 text-[#1E40AF]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </section>
  );
}
