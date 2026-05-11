import type {
  ApplicationStatus,
  PaymentStatus,
  ShiftStatus,
  VerificationStatus
} from "@/types";
import { cn } from "@/lib/utils";

type Status = ApplicationStatus | PaymentStatus | ShiftStatus | VerificationStatus | "active" | "closed";

interface StatusBadgeProps {
  status: Status;
}

const greenStatuses: Status[] = ["verified", "confirmed", "completed", "active"];
const amberStatuses: Status[] = ["pending", "pending_payment", "applied"];
const redStatuses: Status[] = ["rejected", "failed", "cancelled", "closed"];

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-medium capitalize",
        greenStatuses.includes(status) && "bg-[#10B981]/10 text-[#047857]",
        amberStatuses.includes(status) && "bg-[#F59E0B]/10 text-[#B45309]",
        redStatuses.includes(status) && "bg-[#EF4444]/10 text-[#B91C1C]",
        status === "pending_payment" && "normal-case"
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}
