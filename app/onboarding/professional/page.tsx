import { redirect } from "next/navigation";
import { ProfessionalOnboardingForm } from "@/components/onboarding/ProfessionalOnboardingForm";
import type { ProfessionalRole } from "@/types";

interface PageProps {
  searchParams: Promise<{ role?: string }>;
}

const validRoles: ProfessionalRole[] = ["doctor", "nurse", "technician"];

export default async function ProfessionalOnboardingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const role = params.role as ProfessionalRole | undefined;

  if (!role || !validRoles.includes(role)) {
    redirect("/sign-up");
  }

  return <ProfessionalOnboardingForm role={role} />;
}
