"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { 
  CalendarPlus, 
  Loader2, 
  Calendar, 
  MapPin, 
  Clock, 
  IndianRupee, 
  FileText,
  AlertCircle,
  CheckCircle2,
  Zap
} from "lucide-react";
import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { hyderabadAreas, specialties } from "@/lib/constants";
import { cn, formatCurrencyInr } from "@/lib/utils";

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
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  theme: {
    color: string;
  };
  modal?: {
    ondismiss?: () => void;
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
  const [duration, setDuration] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors }
  } = useForm<PostShiftValues>({
    resolver: zodResolver(postShiftSchema),
    defaultValues: {
      isUrgent: false,
      notes: ""
    }
  });

  // Watch values for live calculations
  const payValue = useWatch({ control, name: "pay" }) || 0;
  const isUrgent = useWatch({ control, name: "isUrgent" });
  const notesValue = useWatch({ control, name: "notes" }) || "";
  const startTime = useWatch({ control, name: "startTime" });
  const endTime = useWatch({ control, name: "endTime" });

  // Calculate duration
  useEffect(() => {
    if (startTime && endTime) {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      if (end < start) {
        end.setDate(end.getDate() + 1); // handle overnight shifts
      }
      const diffHrs = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      setDuration(`${diffHrs.toFixed(1)} hours`);
    } else {
      setDuration(null);
    }
  }, [startTime, endTime]);

  const platformFee = Math.round(Number(payValue) * 0.10);
  const totalPayable = Number(payValue) + platformFee;

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
        handler: async (response) => {
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
    <form className="mx-auto max-w-3xl space-y-8 pb-24" onSubmit={handleSubmit(onSubmit)}>
      
      {/* SHIFT DETAILS */}
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Calendar className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-[#0F172A]">Shift Details</h3>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Select 
            label="Specialty Needed" 
            options={specialties} 
            registration={register("specialty")} 
            error={errors.specialty?.message} 
            icon={<div className="h-2 w-2 rounded-full bg-blue-500"></div>}
          />
          <Select 
            label="Clinic Area" 
            options={hyderabadAreas} 
            registration={register("area")} 
            error={errors.area?.message} 
            icon={<MapPin className="h-4 w-4 text-slate-400" />}
          />
          <Input 
            label="Shift Date" 
            type="date" 
            registration={register("date")} 
            error={errors.date?.message} 
            icon={<Calendar className="h-4 w-4 text-slate-400" />}
          />
          <div className="col-span-1 sm:col-span-2">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Input 
                  label="Start Time" 
                  type="time" 
                  registration={register("startTime")} 
                  error={errors.startTime?.message} 
                  icon={<Clock className="h-4 w-4 text-slate-400" />}
                />
              </div>
              <div className="flex-1">
                <Input 
                  label="End Time" 
                  type="time" 
                  registration={register("endTime")} 
                  error={errors.endTime?.message} 
                  icon={<Clock className="h-4 w-4 text-slate-400" />}
                />
              </div>
              {duration && (
                <div className="flex h-[46px] items-center justify-center rounded-xl bg-slate-100 px-6 font-bold text-slate-600 sm:w-32 sm:mb-0 mb-4">
                  {duration}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* COMPENSATION */}
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <IndianRupee className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-[#0F172A]">Compensation</h3>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-[#0F172A]">Pay (to Doctor)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">₹</span>
              <input
                className={cn(
                  "w-full rounded-xl border px-10 py-4 text-xl font-bold text-[#0F172A] outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
                  errors.pay ? "border-red-500" : "border-[#E2E8F0]"
                )}
                type="number"
                placeholder="e.g. 5000"
                {...register("pay")}
              />
            </div>
            {errors.pay && <p className="mt-1 text-sm font-medium text-red-500">{errors.pay.message}</p>}
          </div>

          <div className="flex flex-col justify-center rounded-xl bg-slate-50 p-5">
            <div className="flex items-center justify-between text-sm font-medium text-slate-600">
              <span>Doctor receives:</span>
              <span className="font-bold text-slate-900">{formatCurrencyInr(Number(payValue) || 0)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm font-medium text-slate-600">
              <span>Platform fee (10%):</span>
              <span className="font-bold text-slate-900">{formatCurrencyInr(platformFee)}</span>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 text-lg font-bold text-[#0F172A]">
              <span>Total you pay:</span>
              <span className="text-emerald-600">{formatCurrencyInr(totalPayable)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
          <p className="text-sm font-medium text-emerald-900">
            Doctor guaranteed payment within 24 hours of shift completion.
          </p>
        </div>
      </section>

      {/* ADDITIONAL DETAILS */}
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <FileText className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-[#0F172A]">Additional Details</h3>
        </div>

        <div className="space-y-8">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-bold text-[#0F172A]">Notes / Instructions</label>
              <span className="text-xs font-medium text-slate-400">{notesValue.length}/500</span>
            </div>
            <textarea
              className="min-h-[120px] w-full rounded-xl border border-[#E2E8F0] p-4 text-sm font-medium text-[#0F172A] outline-none transition-all focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20"
              placeholder="Any specific requirements or instructions for the doctor?"
              maxLength={500}
              {...register("notes")}
            />
          </div>

          <div className={cn(
            "rounded-xl border p-5 transition-all",
            isUrgent ? "border-red-200 bg-red-50" : "border-[#E2E8F0] bg-white"
          )}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="flex items-center gap-2 font-bold text-[#0F172A]">
                  <Zap className={cn("h-5 w-5", isUrgent ? "fill-red-500 text-red-500" : "text-slate-400")} />
                  Urgent Requirement
                </h4>
                <p className="mt-1 max-w-sm text-sm text-[#64748B]">
                  Toggle this if you need someone urgently.
                </p>
              </div>
              
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" className="peer sr-only" {...register("isUrgent")} />
                <div className="peer h-7 w-14 rounded-full bg-slate-200 after:absolute after:left-[4px] after:top-[4px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-red-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300"></div>
              </label>
            </div>
            
            {isUrgent && (
              <p className="mt-4 text-sm font-bold text-red-600 animate-in fade-in slide-in-from-top-2">
                ⚡ This shift will be marked urgent and highlighted to doctors.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* MESSAGES */}
      {formError ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 shadow-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <p>{formError}</p>
        </div>
      ) : null}
      
      {notice ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 shadow-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
          <p>{notice}</p>
        </div>
      ) : null}

      {/* SUBMIT BUTTON */}
      <div className="sticky bottom-0 z-10 -mx-4 border-t border-[#E2E8F0] bg-white/90 p-4 backdrop-blur-md sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <button
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E40AF] px-8 py-4 text-lg font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-1 hover:bg-[#1D4ED8] hover:shadow-xl hover:shadow-blue-900/30 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <CalendarPlus className="h-6 w-6" />
          )}
          {isSubmitting ? "Processing..." : `Save & Pay ${formatCurrencyInr(totalPayable)}`}
        </button>
      </div>
    </form>
  );
}

// ----- SUBCOMPONENTS -----

interface FieldProps {
  label: string;
  error?: string;
  registration: ReturnType<typeof registerPlaceholder>;
  type?: string;
  icon?: React.ReactNode;
}

function registerPlaceholder() {
  return {};
}

function Input({ label, error, registration, type = "text", icon }: FieldProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-[#0F172A]">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            {icon}
          </div>
        )}
        <input
          className={cn(
            "w-full rounded-xl border px-4 py-3 text-sm font-medium text-[#0F172A] outline-none transition-all focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20",
            icon && "pl-10",
            error ? "border-red-500" : "border-[#E2E8F0]"
          )}
          type={type}
          {...registration}
        />
      </div>
      {error && <p className="mt-1 text-sm font-medium text-red-500">{error}</p>}
    </div>
  );
}

function Select({ label, error, registration, options, icon }: FieldProps & { options: string[] }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-[#0F172A]">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            {icon}
          </div>
        )}
        <select
          className={cn(
            "w-full appearance-none rounded-xl border bg-white px-4 py-3 text-sm font-medium text-[#0F172A] outline-none transition-all focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20",
            icon && "pl-10",
            error ? "border-red-500" : "border-[#E2E8F0]"
          )}
          {...registration}
        >
          <option value="" disabled>Select {label.toLowerCase()}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="mt-1 text-sm font-medium text-red-500">{error}</p>}
    </div>
  );
}
