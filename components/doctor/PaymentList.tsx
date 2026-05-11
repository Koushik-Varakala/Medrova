import type { DoctorPayment } from "@/types";
import { formatCurrencyInr } from "@/lib/utils";

interface PaymentListProps {
  payments: DoctorPayment[];
}

export function PaymentList({ payments }: PaymentListProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-[#F8FAFC] text-[#64748B]">
            <tr>
              <th className="px-4 py-3 font-medium">Shift</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">UPI</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td className="px-4 py-3 text-[#0F172A]">{payment.shiftId}</td>
                <td className="px-4 py-3 text-[#0F172A]">
                  {formatCurrencyInr(payment.amount)}
                </td>
                <td className="px-4 py-3 text-[#64748B]">{payment.upiId}</td>
                <td className="px-4 py-3 text-[#64748B]">{payment.status}</td>
                <td className="px-4 py-3 text-[#64748B]">{payment.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
