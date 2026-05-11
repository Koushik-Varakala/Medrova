import Link from "next/link";
import { DoctorOnboardingForm } from "@/components/onboarding/DoctorOnboardingForm";

export default function DoctorOnboardingPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        <Link className="text-xl font-semibold text-[#1E40AF]" href="/">
          Medrova
        </Link>
        <div className="mt-8">
          <h1 className="text-3xl font-semibold tracking-normal text-[#0F172A]">
            Doctor onboarding
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#64748B]">
            Complete your profile so clinics can review verified credentials.
          </p>
        </div>
        <div className="mt-8">
          <DoctorOnboardingForm />
        </div>
      </div>
    </main>
  );
}
