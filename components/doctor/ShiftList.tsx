import type { Shift } from "@/types";
import { ShiftCard } from "@/components/shared/ShiftCard";

interface ShiftListProps {
  shifts: Shift[];
  canApply: boolean;
  onApply?: (shiftId: string) => void;
}

export function ShiftList({ shifts, canApply, onApply }: ShiftListProps) {
  return (
    <div className="space-y-4">
      {shifts.map((shift) => (
        <ShiftCard
          actionLabel={canApply ? "Apply" : undefined}
          key={shift.id}
          onAction={onApply ? () => onApply(shift.id) : undefined}
          shift={shift}
        />
      ))}
    </div>
  );
}
