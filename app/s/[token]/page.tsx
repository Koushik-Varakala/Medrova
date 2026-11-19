"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import Link from "next/link";
import {
  Building2,
  Calendar,
  Clock,
  MapPin,
  Stethoscope,
  Phone,
  Mail,
  IndianRupee,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Unlock,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Award,
  Users,
  MessageSquare
} from "lucide-react";

interface MagicShiftPageProps {
  params: {
    token: string;
  };
}

interface Applicant {
  applicationId: string;
  sourceTable: "applications" | "professional_applications";
  id: string;
  name: string;
  role: string;
  specialty: string;
  experience: number;
  city: string;
  area: string;
  verificationStatus: string;
  isUnlocked: boolean;
  phone: string;
  email: string;
  appliedAt: string;
}

interface ShiftData {
  id: string;
  specialty: string;
  date: string;
  start_time: string;
  end_time: string;
  pay: number;
  area: string;
  notes?: string;
  status: string;
  magic_token: string;
  magic_contact_phone?: string;
  magic_contact_name?: string;
  confirmed_doctor_id?: string;
}

interface ClinicData {
  id: string;
  name: string;
  phone: string;
  contact_person: string;
  contact_phone: string;
  credits: number;
  is_claimed: boolean;
}

export default function MagicShiftPage({ params }: MagicShiftPageProps) {
  const [shift, setShift] = useState<ShiftData | null>(null);
  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [nearbyMatches, setNearbyMatches] = useState<unknown[]>([]);
  const [otherShifts, setOtherShifts] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [unlockModal, setUnlockModal] = useState<Applicant | null>(null);
  const [unlockedSuccess, setUnlockedSuccess] = useState<string | null>(null);

  const fetchShiftData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/magic/${params.token}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Shift not found or expired.");
        return;
      }

      setShift(data.shift);
      setClinic(data.clinic);
      setApplicants(data.applicants || []);
      setNearbyMatches(data.nearbyMatches || []);
      setOtherShifts(data.otherShifts || []);
    } catch {
      setError("Network error while loading shift.");
    } finally {
      setLoading(false);
    }
  }, [params.token]);

  useEffect(() => {
    fetchShiftData();
  }, [fetchShiftData]);

  const handleUnlockDoctor = async (applicant: Applicant) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/magic/${params.token}/unlock`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            applicationId: applicant.applicationId,
            sourceTable: applicant.sourceTable
          })
        });

        const data = await res.json();
        if (res.status === 402) {
          // Insufficient credits
          alert("Insufficient credits! Please top up your hospital credit wallet.");
          return;
        }

        if (!res.ok || !data.success) {
          alert(data.message || "Failed to unlock contact.");
          return;
        }

        setUnlockedSuccess(applicant.name);
        await fetchShiftData();
      } catch {
        alert("Failed to process unlock request.");
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Loading verified shift portal...</p>
        </div>
      </div>
    );
  }

  if (error || !shift) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Shift Link Unavailable</h2>
          <p className="text-xs text-slate-500">{error || "This shift has expired or the link is invalid."}</p>
          <Link
            href="/quick-post"
            className="inline-block w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
          >
            Post a New Shift
          </Link>
        </div>
      </div>
    );
  }

  const creditsAvailable = clinic?.credits ?? 0;
  const isPendingReview = shift.status === "pending_review";
  const isConfirmed = shift.status === "confirmed";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      {/* Top Mobile Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-blue-600 tracking-tight">Medrova</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
              Hospital Portal
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Credit Wallet Pill */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                creditsAvailable > 0
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              <span>💳</span>
              <span>{creditsAvailable} {creditsAvailable === 1 ? "Credit" : "Credits"}</span>
            </div>

            <button
              onClick={fetchShiftData}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              title="Refresh applicants"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Verification Status Banner if Still in Review */}
        {isPendingReview && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900">
              <span className="font-bold block text-sm mb-0.5">Verification in Progress</span>
              Our compliance team is currently verifying this hospital post. 
              Once verified, registered doctors in Hyderabad will be notified instantly!
            </div>
          </div>
        )}

        {/* Success Alert */}
        {unlockedSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-900 font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              Doctor Contact Unlocked: {unlockedSuccess}
            </div>
            <button
              onClick={() => setUnlockedSuccess(null)}
              className="text-xs text-emerald-700 hover:underline font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Hospital & Shift Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  {clinic?.name || "Hospital Requirement"}
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                  Verified Post
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {shift.area}, Hyderabad
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Offer Compensation</span>
                <span className="text-lg font-extrabold text-slate-900">
                  ₹{shift.pay.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 block font-medium">Specialty Required</span>
              <span className="font-bold text-blue-700 flex items-center gap-1 mt-0.5">
                <Stethoscope className="w-3.5 h-3.5" /> {shift.specialty}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 block font-medium">Duty Timing</span>
              <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> {shift.start_time} – {shift.end_time}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
              <span className="text-slate-400 block font-medium">Shift Date</span>
              <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> {new Date(shift.date).toLocaleDateString("en-IN", { month: "short", day: "numeric", weekday: "short" })}
              </span>
            </div>
          </div>

          {shift.notes && (
            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="font-semibold text-slate-700">Hospital Note:</span> {shift.notes}
            </p>
          )}
        </div>

        {/* 15-Minute Replacement Guarantee Badge */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-900 block mb-0.5">
              15-Minute Practitioner Guarantee
            </span>
            If an unlocked doctor fails to confirm within 15 minutes, your unlock credit is automatically restored to your hospital balance.
          </div>
        </div>

        {/* Section: Applicant Doctors */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Interested &amp; Available Doctors ({applicants.length})
            </h2>
            <span className="text-xs text-slate-500">Pre-screened &amp; Verified</span>
          </div>

          {applicants.length === 0 ? (
            /* 0 Applicants State: Show Nearby Verified Supply */
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 text-center space-y-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Alerting Verified {shift.specialty} Doctors...
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  We are notifying verified practitioners in Hyderabad. Doctors typically respond within 5 to 15 minutes.
                </p>
              </div>

              {/* Instant Match Preview */}
              {nearbyMatches.length > 0 && (
                <div className="pt-4 border-t border-slate-100 text-left space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">
                    ⚡ Verified Doctors Matching Your Requirement Nearby:
                  </span>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {nearbyMatches.map((doc: any, i) => (
                      <div
                        key={i}
                        className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900 block">{doc.name}</span>
                          <span className="text-slate-500">
                            {doc.specialty} • {doc.experience} yrs exp • {doc.area}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          TSMC/APMC ✅
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* List of Real Applicants */
            <div className="space-y-3">
              {applicants.map((applicant) => (
                <div
                  key={applicant.id}
                  className={`bg-white rounded-2xl border p-5 shadow-sm transition-all space-y-3 ${
                    applicant.isUnlocked
                      ? "border-emerald-300 ring-1 ring-emerald-200 bg-emerald-50/10"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-base">
                        {applicant.name.replace("Dr. ", "").charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">{applicant.name}</h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Council Verified
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {applicant.specialty} • {applicant.experience} {applicant.experience === 1 ? "year" : "years"} clinical experience
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Applied</span>
                      <span className="text-xs font-semibold text-slate-700">
                        {new Date(applicant.appliedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  {/* Verification Badges */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl flex-wrap">
                    <span className="flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> State Council License Checked
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Degree Authenticated
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Aadhaar/PAN Matched
                    </span>
                  </div>

                  {/* Contact Info or Unlock Action */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
                    {applicant.isUnlocked ? (
                      /* Unlocked Contact Details */
                      <div className="flex items-center gap-4 text-xs flex-wrap">
                        <a
                          href={`tel:${applicant.phone}`}
                          className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-100/70 hover:bg-emerald-200 px-3 py-1.5 rounded-xl transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" /> Call {applicant.phone}
                        </a>
                        <a
                          href={`https://wa.me/${applicant.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl hover:bg-emerald-100"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp Doctor
                        </a>
                      </div>
                    ) : (
                      /* Masked Contact & Unlock Button */
                      <>
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Phone: {applicant.phone}</span>
                        </div>

                        <button
                          disabled={isPending}
                          onClick={() => handleUnlockDoctor(applicant)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all ${
                            creditsAvailable > 0
                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                              : "bg-amber-600 hover:bg-amber-700 text-white"
                          }`}
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          {creditsAvailable > 0
                            ? "Unlock Contact (Use 1 Free Credit)"
                            : "Unlock Contact (₹750 / 1 Credit)"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Other Shifts by this Hospital Drawer */}
        {otherShifts.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Other Shifts Posted by Your Hospital ({otherShifts.length})
            </h3>
            <div className="divide-y divide-slate-100">
              {otherShifts.map((s: any) => (
                <div key={s.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{s.specialty} Duty</span>
                    <span className="text-slate-400 block text-[11px]">
                      {s.date} • {s.start_time} – {s.end_time}
                    </span>
                  </div>
                  <Link
                    href={`/s/${s.magic_token}`}
                    className="text-blue-600 hover:underline font-semibold text-xs"
                  >
                    View Shift &rarr;
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Desktop Claim Banner */}
        <div className="bg-slate-900 text-white p-6 rounded-xl text-center space-y-2">
          <h4 className="text-sm font-semibold">Managing multiple rosters for {clinic?.name || "your hospital"}?</h4>
          <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
            Claim your permanent facility dashboard to manage shifts, view GST tax invoices, and maintain preferred doctor rosters.
          </p>
          <div className="pt-2">
            <Link
              href="/sign-up?role=clinic"
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Claim Permanent Hospital Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
