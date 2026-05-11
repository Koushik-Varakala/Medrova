"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarPlus, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { hyderabadAreas, specialties } from "@/lib/constants";

const postShiftSchema = z.object({
  specialty: z.string().min(1, "Select a specialty"),
  date: z.string().min(1, "Select a date"),
  startTime: z.string().min(1, "Select start time"),
  endTime: z.string().min(1, "Select end time"),
  pay: z.coerce.number().min(1000, "Enter shift pay"),
  area: z.string().min(1, "Select an area"),
  notes: z.string().optional(),
  isUrgent: z.boolean()
});

type PostShiftValues = z.infer<typeof postShiftSchema>;

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: () => void;
  theme: {
    color: string;
  };
}

interface RazorpayInstance {
  open: () => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

export function PostShiftForm() {
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<PostShiftValues>({
    resolver: zodResolver(postShiftSchema),
    defaultValues: {
      isUrgent: false
    }
  });

  async function loadRazorpayCheckout() {
    if (window.Razorpay) {
      return true;
    }

    return new Promise<boolean>((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async function onSubmit(values: PostShiftValues) {
    setNotice("");
    setFormError("");
    setIsSubmitting(true);

    try {
      const shiftResponse = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });

      const shiftResult = (await shiftResponse.json()) as { id?: string; error?: string };

      if (!shiftResponse.ok || !shiftResult.id) {
        setFormError(shiftResult.error ?? "Unable to create shift.");
        return;
      }

      const orderResponse = await fetch("/api/payments/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shiftId: shiftResult.id })
      });

      const orderResult = (await orderResponse.json()) as {
        orderId?: string;
        amount?: number;
        currency?: string;
        error?: string;
      };

      if (!orderResponse.ok || !orderResult.orderId || !orderResult.amount) {
        setFormError(orderResult.error ?? "Unable to create Razorpay order.");
        return;
      }

      const checkoutLoaded = await loadRazorpayCheckout();
      const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      if (!checkoutLoaded || !window.Razorpay || !key) {
        setNotice("Shift saved as pending payment. Complete Razorpay setup to activate checkout.");
        return;
      }

      const shiftIdForPayment = shiftResult.id;

      const checkout = new window.Razorpay({
        key,
        amount: orderResult.amount,
        currency: orderResult.currency ?? "INR",
        name: "Medrova",
        description: "Locum shift payment",
        order_id: orderResult.orderId,
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          // Activate shift directly after payment success (test mode — no webhook needed)
          await fetch(`/api/shifts/${shiftIdForPayment}/activate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
            })
          });
          setNotice("✅ Payment successful! Your shift is now live and visible to doctors.");
        },
        modal: {
          ondismiss: () => {
            setNotice("Payment cancelled. Your shift is saved as draft — you can pay later from My Shifts.");
          }
        },
        theme: {
          color: "#1E40AF"
        }
      });

      checkout.open();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5 rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <Select label="Specialty" options={specialties} registration={register("specialty")} error={errors.specialty?.message} />
        <Select label="Area" options={hyderabadAreas} registration={register("area")} error={errors.area?.message} />
        <Input label="Date" type="date" registration={register("date")} error={errors.date?.message} />
        <Input label="Start time" type="time" registration={register("startTime")} error={errors.startTime?.message} />
        <Input label="End time" type="time" registration={register("endTime")} error={errors.endTime?.message} />
        <div>
          <Input label="Pay (to Doctor)" type="number" registration={register("pay")} error={errors.pay?.message} />
          <p className="mt-1 text-xs text-[#64748B]">* A 10% Medrova platform fee will be added at checkout.</p>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-[#0F172A]">Notes</label>
        <textarea
          className="mt-2 min-h-28 w-full rounded-lg border border-[#E2E8F0] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
          {...register("notes")}
        />
      </div>
      <label className="flex items-center gap-3 rounded-lg border border-[#E2E8F0] p-4">
        <input className="h-4 w-4 accent-[#1E40AF]" type="checkbox" {...register("isUrgent")} />
        <span className="text-sm font-medium text-[#0F172A]">Mark as urgent</span>
      </label>
      {formError ? (
        <p className="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#B91C1C]">
          {formError}
        </p>
      ) : null}
      {notice ? (
        <p className="rounded-lg border border-[#10B981]/30 bg-[#10B981]/10 px-4 py-3 text-sm text-[#047857]">
          {notice}
        </p>
      ) : null}
      <button
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1E40AF] px-4 py-2 font-medium text-white hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
        Save and pay
      </button>
    </form>
  );
}

interface FieldProps {
  label: string;
  error?: string;
  registration: ReturnType<typeof registerPlaceholder>;
  type?: string;
}

function registerPlaceholder() {
  return {};
}

function Input({ label, error, registration, type = "text" }: FieldProps) {
  return (
    <div>
      <label className="text-sm font-medium text-[#0F172A]">{label}</label>
      <input
        className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
        type={type}
        {...registration}
      />
      {error ? <p className="mt-1 text-sm text-[#EF4444]">{error}</p> : null}
    </div>
  );
}

function Select({ label, error, registration, options }: FieldProps & { options: string[] }) {
  return (
    <div>
      <label className="text-sm font-medium text-[#0F172A]">{label}</label>
      <select
        className="mt-2 w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
        {...registration}
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error ? <p className="mt-1 text-sm text-[#EF4444]">{error}</p> : null}
    </div>
  );
}
