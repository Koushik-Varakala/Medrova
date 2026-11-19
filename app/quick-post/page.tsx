"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { 
  Building2, 
  Clock, 
  MapPin, 
  Stethoscope, 
  Phone, 
  IndianRupee, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle,
  ArrowRight,
  Send,
  Copy,
  Check,
  Calendar,
  FileText
} from "lucide-react";
import { parseWhatsAppMessage, type ParsedWhatsAppShift } from "@/lib/whatsapp-parser";
import { specialties } from "@/lib/constants";

const SAMPLE_1 = "Requirement of Full Time Paediatric Registrar at Ankura Hospital For Women's & Children Kompally branch Interested pls contact HR-8977524832";
const SAMPLE_2 = "peadiatrician required for regular afternoon shift from 3pm to 9pm at Krishna children hospital lakdikapul Hyderabad. afternoon shift doctors can also do extra night duties. Call Dr Mohammad Amjadullah 9885068907";

export default function QuickPostPage() {
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState<ParsedWhatsAppShift | null>(null);
  const [isPending, startTransition] = useTransition();
  const [submitSuccess, setSubmitSuccess] = useState<{
    magicToken: string;
    hospitalName: string;
    phone: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleTextChange = (text: string) => {
    setRawText(text);
    setErrorMessage("");
    if (text.trim().length > 10) {
      const result = parseWhatsAppMessage(text);
      setParsed(result);
    } else {
      setParsed(null);
    }
  };

  const handleFieldChange = (field: keyof ParsedWhatsAppShift, value: unknown) => {
    if (!parsed) return;
    setParsed({ ...parsed, [field]: value });
  };

  const handleSubmit = async () => {
    if (!parsed) return;
    if (!parsed.hospitalName || parsed.hospitalName.trim().length < 2) {
      setErrorMessage("Please specify the hospital or facility name.");
      return;
    }
    if (!parsed.contactPhone || parsed.contactPhone.replace(/\D/g, "").length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number for dispatching candidate updates.");
      return;
    }

    setErrorMessage("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/public/quick-post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hospitalName: parsed.hospitalName,
            area: parsed.area,
            specialty: parsed.specialty,
            subSpecialtyOrRole: parsed.subSpecialtyOrRole,
            date: parsed.date,
            startTime: parsed.startTime,
            endTime: parsed.endTime,
            displayTime: parsed.displayTime,
            pay: parsed.pay,
            contactPhone: parsed.contactPhone,
            contactName: parsed.contactName,
            contactEmail: parsed.contactEmail,
            notes: parsed.notes,
            rawText: parsed.rawText
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          setErrorMessage(data.error || data.message || "Failed to submit requirement.");
          return;
        }

        setSubmitSuccess({
          magicToken: data.magicToken,
          hospitalName: parsed.hospitalName,
          phone: parsed.contactPhone
        });
      } catch {
        setErrorMessage("Network connection error. Please try again.");
      }
    });
  };

  const handleCopyLink = () => {
    if (!submitSuccess) return;
    const url = `${window.location.origin}/s/${submitSuccess.magicToken}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans antialiased">
      {/* Clean Top Navigation Bar */}
      <header className="border-b border-slate-200/80 bg-white sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold tracking-tight text-slate-900 hover:opacity-90">
              Medrova
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Shift Dispatch
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs sm:text-sm">
            <span className="text-slate-400 hidden sm:inline">Hospital Administration</span>
            <Link 
              href="/sign-in"
              className="text-slate-600 hover:text-slate-900 font-medium px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {submitSuccess ? (
          /* Sleek Minimalist Confirmation */
          <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 shadow-sm text-center">
            <div className="w-12 h-12 bg-slate-100 text-slate-900 rounded-full flex items-center justify-center mx-auto mb-5 border border-slate-200">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
              Requirement Received
            </h1>
            <p className="text-slate-600 text-sm max-w-md mx-auto mb-6 leading-relaxed">
              Your requirement for <strong className="text-slate-900">{submitSuccess.hospitalName}</strong> is undergoing routine verification. We will dispatch applicant alerts to:
            </p>

            <div className="inline-flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 text-slate-800 font-mono text-sm font-semibold mb-8">
              <Phone className="w-4 h-4 text-slate-400" />
              +91 {submitSuccess.phone}
            </div>

            {/* Magic Link Share Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left max-w-lg mx-auto mb-8 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold uppercase tracking-wider text-slate-600">Your Private Dashboard Link</span>
                <span className="text-emerald-700 font-medium">Passwordless Access</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={typeof window !== "undefined" ? `${window.location.origin}/s/${submitSuccess.magicToken}` : `/s/${submitSuccess.magicToken}`}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 select-all outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="shrink-0 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" /> Copy
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Bookmark or save this URL. You can view matching doctors, check their verification credentials, and manage applications anytime.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={`/s/${submitSuccess.magicToken}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors"
              >
                Open Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => {
                  setSubmitSuccess(null);
                  setRawText("");
                  setParsed(null);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Post Another Requirement
              </button>
            </div>
          </div>
        ) : (
          /* Main Submission Form */
          <div className="space-y-6">
            {/* Page Header */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Post a Shift Requirement
              </h1>
              <p className="text-slate-500 text-sm mt-1.5">
                Paste an existing duty message or fill in the details below. We connect you with verified medical professionals in Hyderabad.
              </p>
            </div>

            {/* Input Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              {/* Raw Input Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="requirement-input" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-500" /> Duty Requirement Details
                  </label>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Quick samples:</span>
                    <button
                      type="button"
                      onClick={() => handleTextChange(SAMPLE_2)}
                      className="text-slate-600 hover:text-slate-900 font-medium underline"
                    >
                      Lakdikapul
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => handleTextChange(SAMPLE_1)}
                      className="text-slate-600 hover:text-slate-900 font-medium underline"
                    >
                      Kompally
                    </button>
                  </div>
                </div>

                <textarea
                  id="requirement-input"
                  rows={4}
                  value={rawText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="Paste duty message here (e.g. Pediatrician needed for afternoon duty 3pm to 9pm at Krishna Children Hospital Lakdikapul. Contact 9885068907)..."
                  className="w-full rounded-lg border border-slate-200 p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 outline-none transition-all resize-y leading-relaxed bg-slate-50/50"
                />
              </div>

              {/* Structured Fields Section */}
              {parsed && (
                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Structured Information
                      </h2>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Extracted from your input. Review and edit any field before submitting.
                      </p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    {/* Facility Name */}
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">
                        Hospital / Facility Name <span className="text-slate-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={parsed.hospitalName}
                        placeholder="e.g. Sunshine Hospital"
                        onChange={(e) => handleFieldChange("hospitalName", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-slate-400 outline-none font-medium"
                      />
                    </div>

                    {/* Area */}
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">
                        Locality / Area
                      </label>
                      <input
                        type="text"
                        value={parsed.area}
                        placeholder="e.g. Gachibowli, Lakdikapul"
                        onChange={(e) => handleFieldChange("area", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-slate-400 outline-none"
                      />
                    </div>

                    {/* Specialty */}
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">
                        Specialty
                      </label>
                      <select
                        value={parsed.specialty}
                        onChange={(e) => handleFieldChange("specialty", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-slate-400 outline-none"
                      >
                        {specialties.map((spec) => (
                          <option key={spec} value={spec}>
                            {spec}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Shift Timings */}
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">
                        Shift Timings ({parsed.displayTime || "Custom"})
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="time"
                          value={parsed.startTime}
                          onChange={(e) => handleFieldChange("startTime", e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 outline-none focus:border-slate-400"
                        />
                        <input
                          type="time"
                          value={parsed.endTime}
                          onChange={(e) => handleFieldChange("endTime", e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 outline-none focus:border-slate-400"
                        />
                      </div>
                    </div>

                    {/* Pay Offer */}
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">
                        Pay per Shift (₹)
                      </label>
                      <div className="relative">
                        <IndianRupee className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="number"
                          value={parsed.pay || ""}
                          placeholder="e.g. 4000"
                          onChange={(e) => handleFieldChange("pay", parseInt(e.target.value, 10) || 0)}
                          className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm font-semibold text-slate-900 focus:border-slate-400 outline-none"
                        />
                      </div>
                    </div>

                    {/* Contact Phone */}
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">
                        Contact Mobile (for Dashboard Link) <span className="text-slate-400">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs font-mono text-slate-400">+91</span>
                        <input
                          type="tel"
                          maxLength={10}
                          value={parsed.contactPhone}
                          placeholder="9876543210"
                          onChange={(e) => handleFieldChange("contactPhone", e.target.value.replace(/\D/g, ""))}
                          className="w-full bg-white border border-slate-200 rounded-lg pl-11 pr-3 py-2 text-sm font-mono font-medium text-slate-900 focus:border-slate-400 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Privacy note */}
                  <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                    Your phone number is kept confidential and only used to send applicant notifications.
                  </p>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={!parsed || isPending}
                  onClick={handleSubmit}
                  className={`w-full py-3 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-colors ${
                    !parsed || isPending
                      ? "bg-slate-300 cursor-not-allowed"
                      : "bg-slate-900 hover:bg-slate-800 active:scale-[0.99]"
                  }`}
                >
                  {isPending ? (
                    "Submitting..."
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" /> Submit Requirement for Verification
                    </>
                  )}
                </button>
              </div>

              {/* Minimal Trust Features */}
              <div className="border-t border-slate-100 pt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Verified Medical Professionals
                </span>
                <span className="text-slate-300">•</span>
                <span>Direct WhatsApp Updates</span>
                <span className="text-slate-300">•</span>
                <span>No Advance Payment</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
