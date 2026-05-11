import type { Shift } from "@/types";
import { formatCurrencyInr, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";

interface ShiftCardProps {
  shift: Shift;
  actionLabel?: string;
  onAction?: () => void;
}

export function ShiftCard({ shift, actionLabel, onAction }: ShiftCardProps) {
  return (
    <article className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-[#0F172A]">
              {shift.specialty}
            </h3>
            {shift.isUrgent ? (
              <span className="rounded-full bg-[#EF4444]/10 px-3 py-1 text-xs font-medium text-[#B91C1C]">
                Urgent
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-[#64748B]">
            {shift.clinic?.name ?? "Clinic"} · {shift.area}
          </p>
          <p className="mt-3 text-sm text-[#0F172A]">
            {formatDate(shift.date)} · {shift.startTime} - {shift.endTime}
          </p>
          <div className="mt-3">
            <StatusBadge status={shift.status} />
          </div>
        </div>
        <div className="sm:text-right">
          <p className="text-xl font-semibold text-[#0F172A]">
            {formatCurrencyInr(shift.pay)}
          </p>
          <p className="text-sm text-[#64748B]">per shift</p>
        </div>
      </div>
      {actionLabel ? (
        <button
          className="mt-5 rounded-lg bg-[#1E40AF] px-4 py-2 text-sm font-medium text-white hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onAction}
          type="button"
        >
          {actionLabel}
        </button>
      ) : null}
    </article>
  );
}
