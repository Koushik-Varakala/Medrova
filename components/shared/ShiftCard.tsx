import type { Shift } from "@/types";
import { formatCurrencyInr, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { MapPin } from "lucide-react";
import { calculateDistance } from "@/lib/location";

interface ShiftCardProps {
  shift: Shift;
  actionLabel?: string;
  onAction?: () => void;
  userLat?: number;
  userLng?: number;
  shiftLat?: number;
  shiftLng?: number;
}

export function ShiftCard({
  shift,
  actionLabel,
  onAction,
  userLat,
  userLng,
  shiftLat,
  shiftLng
}: ShiftCardProps) {
  let distanceText = "";
  if (userLat !== undefined && userLng !== undefined && shiftLat !== undefined && shiftLng !== undefined) {
    const dist = calculateDistance(userLat, userLng, shiftLat, shiftLng);
    distanceText = `${dist.toFixed(1)} km away`;
  }

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
          <div className="mt-2 text-sm text-[#64748B]">
            <p>{shift.clinic?.name ?? "Clinic"} · {shift.area}</p>
            {distanceText && (
              <p className="mt-1 flex items-center gap-1 text-[#1E40AF]">
                <MapPin className="h-3.5 w-3.5" />
                {distanceText}
              </p>
            )}
          </div>
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
