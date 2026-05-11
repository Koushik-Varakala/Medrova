import Link from "next/link";
import { ClinicOnboardingForm } from "@/components/onboarding/ClinicOnboardingForm";

export default function ClinicOnboardingPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        <Link className="text-xl font-semibold text-[#1E40AF]" href="/">
          Medrova
        </Link>
        <div className="mt-8">
          <h1 className="text-3xl font-semibold tracking-normal text-[#0F172A]">
            Clinic onboarding
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#64748B]">
            Submit your clinic details so Medrova can verify your hiring account.
          </p>
        </div>
        <div className="mt-8">
          <ClinicOnboardingForm />
        </div>
      </div>
    </main>
  );
}
