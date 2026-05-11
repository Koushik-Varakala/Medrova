import type { ClinicPayment, DoctorPayment } from "@/types";
import { formatCurrencyInr } from "@/lib/utils";

interface AdminPaymentLogProps {
  clinicPayments: ClinicPayment[];
  doctorPayments: DoctorPayment[];
}

export function AdminPaymentLog({
  clinicPayments,
  doctorPayments
}: AdminPaymentLogProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <PaymentPanel
        rows={clinicPayments.map((payment) => ({
          id: payment.id,
          label: payment.razorpayId,
          amount: payment.amount,
          status: payment.status
        }))}
        title="Clinic payments"
      />
      <PaymentPanel
        rows={doctorPayments.map((payment) => ({
          id: payment.id,
          label: payment.upiId,
          amount: payment.amount,
          status: payment.status
        }))}
        title="Doctor payouts"
      />
    </div>
  );
}

interface PaymentPanelProps {
  title: string;
  rows: Array<{
    id: string;
    label: string;
    amount: number;
    status: string;
  }>;
}

function PaymentPanel({ title, rows }: PaymentPanelProps) {
  return (
    <section className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-[#0F172A]">{title}</h2>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div
            className="flex items-center justify-between gap-4 border-b border-[#E2E8F0] pb-3 last:border-b-0 last:pb-0"
            key={row.id}
          >
            <div>
              <p className="text-sm font-medium text-[#0F172A]">{row.label}</p>
              <p className="text-xs text-[#64748B]">{row.status}</p>
            </div>
            <p className="text-sm font-semibold text-[#0F172A]">
              {formatCurrencyInr(row.amount)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
