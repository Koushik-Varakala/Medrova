import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  sendEmail,
  clinicOnboardingConfirmationEmailHtml,
  adminNewClinicAlertEmailHtml,
} from "@/lib/email";

const schema = z.object({
  clinicName: z.string(),
  clinicType: z.string(),
  contactPerson: z.string(),
  contactPhone: z.string(),
  area: z.string(),
  specialties: z.array(z.string()),
  clinicEmail: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const values = schema.parse(body);

    const adminEmail = process.env.ADMIN_EMAIL ?? "koushik@medrova.in";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://medrova.in";

    // Fire both emails in parallel — never block the user
    await Promise.allSettled([
      // 1. Confirmation to clinic
      sendEmail({
        to: values.clinicEmail,
        subject: `We've received your registration, ${values.clinicName} — Medrova`,
        html: clinicOnboardingConfirmationEmailHtml({
          clinicName: values.clinicName,
          contactPerson: values.contactPerson,
        }),
      }),
      // 2. Alert to admin
      sendEmail({
        to: adminEmail,
        subject: `[Action Required] New Clinic Registration: ${values.clinicName}`,
        html: adminNewClinicAlertEmailHtml({
          clinicName: values.clinicName,
          clinicType: values.clinicType,
          contactPerson: values.contactPerson,
          contactPhone: values.contactPhone,
          area: values.area,
          specialties: values.specialties,
          adminDashboardUrl: `${appUrl}/dashboard/admin/clinics`,
        }),
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[notify-registration]", err);
    // Return success anyway — don't fail onboarding because email failed
    return NextResponse.json({ ok: true });
  }
}
