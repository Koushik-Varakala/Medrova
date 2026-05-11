import type { VerificationStatus } from "@/types";
import { StatusBadge } from "@/components/shared/StatusBadge";

interface VerificationBadgeProps {
  status: VerificationStatus;
}

export function VerificationBadge({ status }: VerificationBadgeProps) {
  return <StatusBadge status={status} />;
}
