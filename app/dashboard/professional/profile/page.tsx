"use client";

import { useEffect, useState } from "react";
import { Loader2, User, Phone, MapPin, Mail, ShieldCheck, FileText, CheckCircle2, XCircle, Settings, Clock, Edit } from "lucide-react";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { professionalNavigation, professionalRoleConfig } from "@/lib/constants";
import type { HealthcareProfessional, LocationResult } from "@/types";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import LocationPicker from "@/components/shared/LocationPicker";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export default function ProfessionalProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<HealthcareProfessional | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [locationNotice, setLocationNotice] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadProfile() {
      try {
        const response = await fetch("/api/professional/profile");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error ?? "Failed to load profile.");
        }

        if (!isMounted) return;
        setProfile(result.profile);
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : "An error occurred.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadProfile();
    return () => { isMounted = false; };
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    const supabase = createSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push("/sign-in");
  };

  async function handleLocationChange(location: LocationResult | null) {
    if (!location) return;
    setIsSavingLocation(true);
    setLocationNotice("");

    try {
      const response = await fetch("/api/professional/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: location.city ?? profile?.city ?? "Hyderabad",
          area: location.area ?? profile?.area ?? location.displayName,
          latitude: location.lat,
          longitude: location.lng,
          locationDisplayName: location.displayName
        })
      });
      const result = (await response.json()) as {
        profile?: HealthcareProfessional;
        error?: string;
      };

      if (!response.ok || !result.profile) {
        setLocationNotice(result.error ?? "Unable to update location.");
        return;
      }

      setProfile(result.profile);
      setLocationNotice("Location updated.");
    } finally {
      setIsSavingLocation(false);
    }
  }

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

  return (
    <DashboardShell 
      items={professionalNavigation}
      userProfile={profile ? { name: profile.name, verificationStatus: profile.verificationStatus } : undefined}
    >
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#0F172A]">My Profile</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Manage your personal details and verification documents.
          </p>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-3">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex flex-1 sm:flex-none justify-center items-center gap-2 rounded-xl bg-[#1E40AF] px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#1D4ED8]"
          >
            <Edit className="h-4 w-4" />
            Edit Profile
          </button>
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="flex flex-1 sm:flex-none justify-center items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50"
          >
            {isSigningOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
            Sign Out
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#1E40AF]" />
        </div>
      ) : error || !profile ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
          {error || "Profile not found."}
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column: Personal Info & Status */}
          <div className="space-y-8 lg:col-span-1 min-w-0">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
              <div className="relative px-6 pb-6 text-center">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-slate-100 text-3xl font-black text-slate-400 shadow-sm">
                  {getInitials(profile.name)}
                </div>
                <div className="pt-16">
                  <h2 className="text-xl font-black text-[#0F172A]">{profile.name}</h2>
                  <p className="mt-1 text-sm font-bold text-blue-600 uppercase tracking-widest">{professionalRoleConfig[profile.role].label}</p>
                  
                  <div className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {profile.registrationNumber}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-400">Verification Status</h3>
              {profile.verificationStatus === "verified" ? (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                  <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-500" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold truncate">Verified Professional</p>
                    <p className="text-xs font-medium text-emerald-600 mt-0.5 break-words">Your documents are approved.</p>
                  </div>
                </div>
              ) : profile.verificationStatus === "pending" ? (
                <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
                  <Clock className="h-8 w-8 shrink-0 text-amber-500" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold truncate">Pending Review</p>
                    <p className="text-xs font-medium text-amber-600 mt-0.5 break-words">We are reviewing your documents.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
                  <XCircle className="h-8 w-8 shrink-0 text-red-500" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold truncate">Verification Rejected</p>
                    <p className="text-xs font-medium text-red-600 mt-0.5 break-words">{profile.verificationNote || "Please re-upload your documents."}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Details & Documents */}
          <div className="space-y-8 lg:col-span-2 min-w-0">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="flex items-center gap-2 text-lg font-bold text-[#0F172A]">
                  <User className="h-5 w-5 text-slate-400" /> Personal Details
                </h3>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Email</p>
                  <p className="flex items-center gap-2 font-medium text-slate-900 min-w-0" title={profile.email}><Mail className="w-4 h-4 shrink-0 text-slate-400"/><span className="truncate min-w-0 flex-1">{profile.email}</span></p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Phone</p>
                  <p className="flex items-center gap-2 font-medium text-slate-900 min-w-0"><Phone className="w-4 h-4 shrink-0 text-slate-400"/><span className="truncate min-w-0 flex-1">{profile.phone}</span></p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Location</p>
                  <p className="flex items-center gap-2 font-medium text-slate-900 min-w-0"><MapPin className="w-4 h-4 shrink-0 text-slate-400"/><span className="truncate min-w-0 flex-1">{profile.area}, {profile.city}</span></p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">UPI ID</p>
                  <p className="font-medium text-slate-900 font-mono truncate min-w-0">{profile.upiId}</p>
                </div>
              </div>
              <div className="mt-6 border-t border-slate-100 pt-6">
                <LocationPicker
                  label={isSavingLocation ? "Updating location..." : "Update location"}
                  value={
                    profile.latitude && profile.longitude
                      ? {
                          displayName: profile.locationDisplayName ?? `${profile.area}, ${profile.city}`,
                          lat: profile.latitude,
                          lng: profile.longitude,
                          area: profile.area,
                          city: profile.city
                        }
                      : null
                  }
                  onChange={handleLocationChange}
                />
                {locationNotice && (
                  <p className="mt-2 text-xs font-semibold text-slate-500">{locationNotice}</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="flex items-center gap-2 text-lg font-bold text-[#0F172A]">
                  <FileText className="h-5 w-5 text-slate-400" /> Professional Details
                </h3>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Specialty</p>
                  <p className="font-medium text-slate-900 truncate min-w-0">{profile.specialty}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Experience</p>
                  <p className="font-medium text-slate-900 truncate min-w-0">{profile.experience} years</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Employment</p>
                  <p className="font-medium text-slate-900 truncate min-w-0">{profile.employmentStatus}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Shift Preference</p>
                  <p className="font-medium text-slate-900 capitalize truncate min-w-0">{profile.shiftPreference}</p>
                </div>
              </div>

              <div className="mt-8 border-t border-slate-100 pt-6">
                <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-400">Uploaded Documents</h4>
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { label: "Primary Certificate", url: profile.primaryCertUrl },
                    { label: "Degree Certificate", url: profile.degreeCertUrl },
                    { label: "Government ID", url: profile.govIdUrl },
                  ].map((doc, i) => (
                    doc.url ? (
                      <a
                        key={i}
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-col items-center justify-center gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 transition-all hover:border-blue-300 hover:bg-blue-50"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <span className="text-center text-xs font-bold text-slate-700">{doc.label}</span>
                      </a>
                    ) : (
                      <div
                        key={i}
                        className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 cursor-not-allowed opacity-50"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                          <FileText className="h-5 w-5 text-slate-400" />
                        </div>
                        <span className="text-center text-xs font-bold text-slate-500">{doc.label}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && profile && (
        <EditProfileModal 
          profile={profile} 
          onClose={() => setIsEditModalOpen(false)} 
          onSave={(updated) => {
            setProfile(updated);
            setIsEditModalOpen(false);
          }} 
        />
      )}
    </DashboardShell>
  );
}

const editSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone is required"),
  experience: z.coerce.number().min(0),
  expectedPay: z.coerce.number().min(500),
  upiId: z.string().min(3, "UPI ID is required")
});

type EditValues = z.infer<typeof editSchema>;

import { Upload } from "lucide-react";

function EditProfileModal({ profile, onClose, onSave }: { profile: HealthcareProfessional, onClose: () => void, onSave: (p: HealthcareProfessional) => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const [primaryCertFile, setPrimaryCertFile] = useState<File | null>(null);
  const [degreeCertFile, setDegreeCertFile] = useState<File | null>(null);
  const [govIdFile, setGovIdFile] = useState<File | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: profile.name,
      phone: profile.phone,
      experience: profile.experience,
      expectedPay: profile.expectedPay,
      upiId: profile.upiId
    }
  });

  async function onSubmit(values: EditValues) {
    setIsSubmitting(true);
    setError("");
    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) throw new Error("Supabase is not configured.");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Session expired.");

      async function uploadFile(file: File, path: string): Promise<string | null> {
        const { data, error } = await supabase!.storage.from("documents").upload(path, file, { upsert: true });
        if (error) return null;
        const { data: urlData } = supabase!.storage.from("documents").getPublicUrl(data.path);
        return urlData.publicUrl;
      }

      const [primaryCertUrl, degreeCertUrl, govIdUrl] = await Promise.all([
        primaryCertFile ? uploadFile(primaryCertFile, `${user.id}/primary_cert`) : Promise.resolve(null),
        degreeCertFile ? uploadFile(degreeCertFile, `${user.id}/degree_cert`) : Promise.resolve(null),
        govIdFile ? uploadFile(govIdFile, `${user.id}/gov_id`) : Promise.resolve(null),
      ]);

      const payload: any = { ...values };
      if (primaryCertUrl) payload.primaryCertUrl = primaryCertUrl;
      if (degreeCertUrl) payload.degreeCertUrl = degreeCertUrl;
      if (govIdUrl) payload.govIdUrl = govIdUrl;
      
      if (primaryCertUrl || degreeCertUrl || govIdUrl) {
        payload.verificationStatus = "pending";
      }

      const response = await fetch("/api/professional/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Failed to update profile");
      onSave(result.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating profile");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="m-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Edit Profile</h2>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100"><XCircle className="h-5 w-5" /></button>
        </div>
        {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">Name</label>
            <input {...register("name")} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500" />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">Phone</label>
            <input {...register("phone")} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500" />
            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">Experience (Yrs)</label>
              <input type="number" {...register("experience")} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">Expected Pay</label>
              <input type="number" {...register("expectedPay")} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">UPI ID</label>
            <input {...register("upiId")} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500" />
            {errors.upiId && <p className="mt-1 text-xs text-red-500">{errors.upiId.message}</p>}
          </div>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <h3 className="mb-4 text-sm font-bold text-slate-900">Update Documents</h3>
            <p className="mb-4 text-xs text-slate-500">Uploading new documents will reset your verification status to pending.</p>
            <div className="space-y-4">
              {[
                { label: "Primary Certificate", setter: setPrimaryCertFile, file: primaryCertFile },
                { label: "Degree Certificate", setter: setDegreeCertFile, file: degreeCertFile },
                { label: "Government ID", setter: setGovIdFile, file: govIdFile },
              ].map(({ label, setter, file }) => (
                <div key={label}>
                  <label className="mb-1 block text-xs font-bold text-slate-700">{label}</label>
                  <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 transition hover:border-blue-400 hover:bg-blue-50/30">
                    <span className="text-xs text-slate-600 truncate mr-2">{file ? file.name : "Select new file..."}</span>
                    <Upload className="h-4 w-4 shrink-0 text-slate-400" />
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setter(e.target.files?.[0] ?? null)} />
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex flex-1 items-center justify-center rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-70">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
