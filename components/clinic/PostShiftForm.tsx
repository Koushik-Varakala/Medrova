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
  Zap,
  Users,
  ShieldCheck,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { hyderabadAreas, professionalRoleConfig } from "@/lib/constants";
import { cn, formatCurrencyInr } from "@/lib/utils";
import type { ProfessionalRole, LocationResult } from "@/types";
import LocationPicker from "@/components/shared/LocationPicker";

const postShiftSchema = z.object({
  professionalType: z.enum(["doctor", "nurse", "technician"]),
  specialty: z.string().min(1, "Select a specialty"),
  date: z.string().min(1, "Select a date"),
  startTime: z.string().min(1, "Select start time"),
  endTime: z.string().min(1, "Select end time"),
  pay: z.coerce.number().min(1000, "Enter shift pay"),
  area: z.string().optional(),
  locationDisplayName: z.string().min(1, "Please select the shift location"),
  locationLat: z.number().optional(),
  locationLng: z.number().optional(),
  notes: z.string().optional(),
  isUrgent: z.boolean()
});

type PostShiftValues = z.infer<typeof postShiftSchema>;

// ── Cashfree JS SDK types ──────────────────────────────
declare global {
  interface Window {
    Cashfree?: (config: { mode: "sandbox" | "production" }) => {
      checkout: (opts: { paymentSessionId: string; redirectTarget: "_modal" | "_blank" | "_self" }) => Promise<{
        error?: { message: string };
        redirect?: boolean;
        paymentDetails?: { paymentMessage: string };
      }>;
    };
  }
}

export function PostShiftForm() {
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duration, setDuration] = useState<string | null>(null);
  const [confirmedShift, setConfirmedShift] = useState<PostShiftValues | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors }
  } = useForm<PostShiftValues>({
    resolver: zodResolver(postShiftSchema),
    defaultValues: {
      professionalType: "doctor",
      isUrgent: false,
      notes: "",
      locationDisplayName: ""
    }
  });

  const [location, setLocation] = useState<LocationResult | null>(null);

  useEffect(() => {
    if (location) {
      setValue("locationDisplayName", location.displayName, { shouldValidate: true });
      setValue("area", location.area || location.city || "Unknown");
      setValue("locationLat", location.lat);
      setValue("locationLng", location.lng);
    }
  }, [location, setValue]);

  const payValue = useWatch({ control, name: "pay" }) || 0;
  const isUrgent = useWatch({ control, name: "isUrgent" });
  const notesValue = useWatch({ control, name: "notes" }) || "";
  const startTime = useWatch({ control, name: "startTime" });
  const endTime = useWatch({ control, name: "endTime" });
  const professionalType = useWatch({ control, name: "professionalType" });

  useEffect(() => {
    if (startTime && endTime) {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      if (end < start) end.setDate(end.getDate() + 1);
      const diffHrs = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      setDuration(`${diffHrs.toFixed(1)} hours`);
    } else {
      setDuration(null);
    }
  }, [startTime, endTime]);

  // Reset specialty when professional type changes
  useEffect(() => {
    setValue("specialty", "", { shouldValidate: false });
  }, [professionalType, setValue]);

  const platformFee = Math.round(Number(payValue) * 0.20);
  const totalPayable = Number(payValue) + platformFee;

  async function loadCashfreeSDK() {
    if (window.Cashfree) return true;
    return new Promise<boolean>((resolve) => {
      const script = document.createElement("script");
      script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
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
      // ── Step 1: Create the shift record ─────────────────
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

      // ── Step 2: Create a Cashfree payment order ──────────
      // Amount is computed SERVER-SIDE from the DB — never sent from client
      const orderResponse = await fetch("/api/payments/cashfree/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shiftId: shiftResult.id })
      });

      const orderResult = (await orderResponse.json()) as {
        paymentSessionId?: string;
        orderId?: string;
        amount?: number;
        error?: string;
      };

      if (!orderResponse.ok || !orderResult.paymentSessionId) {
        setFormError(orderResult.error ?? "Unable to create payment order.");
        return;
      }

      // ── Step 3: Load and open Cashfree checkout ──────────
      const sdkLoaded = await loadCashfreeSDK();
      const cfMode = process.env.NEXT_PUBLIC_CASHFREE_ENV === "production" ? "production" : "sandbox";

      if (!sdkLoaded || !window.Cashfree) {
        setNotice("Shift saved as pending payment. Please contact support to complete payment.");
        return;
      }

      const cashfree = window.Cashfree({ mode: cfMode });
      const shiftIdForPayment = shiftResult.id;

      const result = await cashfree.checkout({
        paymentSessionId: orderResult.paymentSessionId,
        redirectTarget: "_modal",
      });

      if (result.error) {
        setNotice(`Payment cancelled: ${result.error.message}`);
        return;
      }

      // ── Step 4: Activate shift (client-side backup) ──────
      // The Cashfree webhook is the primary activator — this is a backup
      // in case the webhook is delayed
      await fetch(`/api/shifts/${shiftIdForPayment}/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: orderResult.orderId ?? "cf_payment",
          orderId: orderResult.orderId ?? "",
        })
      });

      // ── Step 5: Show success confirmation screen ─────────
      setConfirmedShift(values);

    } finally {
      setIsSubmitting(false);
    }
  }

  const currentSpecialties = professionalType 
    ? professionalRoleConfig[professionalType].specialties 
    : [];

  // PAYMENT SUCCESS SCREEN
  if (confirmedShift) {
    const pay = Number(confirmedShift.pay);
    const platformFee = Math.round(pay * 0.20);
    return (
      <div className="mx-auto max-w-2xl py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Success Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 ring-8 ring-emerald-50">
            <CheckCircle2 className="h-14 w-14 text-emerald-500" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-black text-[#0F172A]">Shift Posted Successfully!</h1>
          <p className="mt-2 text-base font-medium text-slate-500">Your shift is now live and visible to verified {confirmedShift.professionalType}s.</p>
        </div>

        {/* Shift Summary Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          <div className="bg-[#0F172A] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <span className="text-sm font-bold text-white tracking-widest uppercase">Shift Confirmation</span>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" /> Live
            </span>
          </div>

          <div className="p-6 grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Professional Type</p>
              <p className="font-bold text-[#0F172A] capitalize flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" /> {confirmedShift.professionalType}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Specialty</p>
              <p className="font-bold text-[#0F172A]">{confirmedShift.specialty}</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Shift Date</p>
              <p className="font-bold text-[#0F172A] flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" /> {new Date(confirmedShift.date).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Time</p>
              <p className="font-bold text-[#0F172A] flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" /> {confirmedShift.startTime} – {confirmedShift.endTime}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Location</p>
              <p className="font-bold text-[#0F172A] flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-500" /> {confirmedShift.locationDisplayName}
              </p>
            </div>
            {confirmedShift.isUrgent && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <Zap className="h-5 w-5 text-amber-500" />
                <span className="font-bold text-amber-800">Marked as Urgent</span>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 grid sm:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Professional Earns</p>
              <p className="text-xl font-black text-emerald-600">₹{pay.toLocaleString("en-IN")}</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Platform Fee (20%)</p>
              <p className="text-xl font-black text-slate-700">₹{platformFee.toLocaleString("en-IN")}</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Total Paid</p>
              <p className="text-xl font-black text-[#1E40AF]">₹{(pay + platformFee).toLocaleString("en-IN")}</p>
            </div>
          </div>
        </div>

        {/* Guarantee Banner */}
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
          <p className="text-sm font-medium text-emerald-900">
            <strong>Payment Held in Escrow.</strong> The professional is paid within 24 hours after you mark the shift as complete. 100% refunded if no one shows up.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            onClick={() => setConfirmedShift(null)}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            Post Another Shift
          </button>
          <a
            href="/dashboard/clinic"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#1E40AF] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#1D4ED8] transition"
          >
            Go to My Shifts <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <form className="mx-auto max-w-3xl space-y-8 pb-24" onSubmit={handleSubmit(onSubmit)}>
      
      {/* PROFESSIONAL TYPE */}
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Users className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-[#0F172A]">Who do you need?</h3>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          {(["doctor", "nurse", "technician"] as ProfessionalRole[]).map((role) => (
            <label key={role} className="relative cursor-pointer">
              <input type="radio" value={role} className="peer sr-only" {...register("professionalType")} />
              <div className="rounded-xl border-2 border-slate-200 bg-white p-4 text-center font-bold text-slate-600 transition-all hover:border-blue-200 peer-checked:border-[#1E40AF] peer-checked:bg-blue-50 peer-checked:text-[#1E40AF]">
                {professionalRoleConfig[role].label}
              </div>
            </label>
          ))}
        </div>
      </section>

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
            options={currentSpecialties} 
            registration={register("specialty")} 
            error={errors.specialty?.message} 
            icon={<div className="h-2 w-2 rounded-full bg-blue-500"></div>}
          />
          <div className="flex flex-col gap-1.5">
            <LocationPicker 
              label="Shift Location" 
              value={location} 
              onChange={setLocation} 
            />
            {errors.locationDisplayName && <p className="text-xs font-medium text-red-500">{errors.locationDisplayName.message}</p>}
          </div>
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
                <div className="mb-4 flex h-[46px] items-center justify-center rounded-xl bg-slate-100 px-6 font-bold text-slate-600 sm:mb-0 sm:w-32">
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
            <label className="mb-2 block text-sm font-bold text-[#0F172A]">Pay (to Professional)</label>
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
              <span className="capitalize">{professionalType} receives:</span>
              <span className="font-bold text-slate-900">{formatCurrencyInr(Number(payValue) || 0)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm font-medium text-slate-600">
              <span>Platform fee (20%):</span>
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
            Professional guaranteed payment within 24 hours of shift completion.
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
              placeholder="Any specific requirements or instructions?"
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
              <p className="mt-4 animate-in fade-in slide-in-from-top-2 text-sm font-bold text-red-600">
                ⚡ This shift will be marked urgent and highlighted.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* MESSAGES */}
      {formError && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 shadow-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <p>{formError}</p>
        </div>
      )}
      
      {notice && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 shadow-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
          <p>{notice}</p>
        </div>
      )}

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

function registerPlaceholder() { return {}; }

function Input({ label, error, registration, type = "text", icon }: FieldProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-[#0F172A]">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2">{icon}</div>}
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
        {icon && <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">{icon}</div>}
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
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
      {error && <p className="mt-1 text-sm font-medium text-red-500">{error}</p>}
    </div>
  );
}
