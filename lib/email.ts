/**
 * lib/email.ts
 * Medrova email utility — sends via Resend REST API (no SDK package required).
 * Add RESEND_API_KEY to .env.local and Vercel to enable.
 */

const LOGO_URL = "https://medrova.vercel.app/logo.png";
const FROM_EMAIL = `Medrova <${process.env.RESEND_FROM_EMAIL ?? "notifications@medrova.in"}>`;

// ─────────────────────────────────────────────────────────
// Shared Design Tokens
// ─────────────────────────────────────────────────────────
const COLORS = {
  navy: "#0F172A",
  blue: "#1E40AF",
  blueLight: "#DBEAFE",
  emerald: "#059669",
  emeraldLight: "#ECFDF5",
  amber: "#D97706",
  amberLight: "#FFFBEB",
  slate100: "#F1F5F9",
  slate500: "#64748B",
  slate700: "#334155",
  white: "#FFFFFF",
};

// ─────────────────────────────────────────────────────────
// Base Email Layout
// ─────────────────────────────────────────────────────────
function wrapInLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Medrova</title>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.slate100};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.slate100};padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- HEADER -->
          <tr>
            <td style="background-color:${COLORS.navy};border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
              <img src="${LOGO_URL}" alt="Medrova" height="44" style="display:block;margin:0 auto;filter:brightness(0) invert(1);" />
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background-color:${COLORS.white};padding:40px 40px 32px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;">
              ${content}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:${COLORS.navy};border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#94A3B8;">
                © 2025 Medrova · India&apos;s Healthcare Staffing Platform
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:#64748B;">
                You are receiving this email because you have an account on Medrova.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────
// Helper Components
// ─────────────────────────────────────────────────────────
function badge(text: string, color: string, bg: string): string {
  return `<span style="display:inline-block;background-color:${bg};color:${color};font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:4px 10px;border-radius:999px;">${text}</span>`;
}

function ctaButton(text: string, href: string): string {
  return `<div style="text-align:center;margin:32px 0;">
    <a href="${href}" style="display:inline-block;background-color:${COLORS.blue};color:${COLORS.white};font-weight:700;font-size:15px;text-decoration:none;padding:14px 36px;border-radius:12px;">
      ${text}
    </a>
  </div>`;
}

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #F1F5F9;">
      <span style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${COLORS.slate500};">${label}</span>
      <br/>
      <span style="font-size:15px;font-weight:600;color:${COLORS.navy};margin-top:4px;display:block;">${value}</span>
    </td>
  </tr>`;
}

function infoCard(rows: Array<[string, string]>): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.slate100};border-radius:12px;padding:8px 20px;margin:24px 0;">
    ${rows.map(([l, v]) => infoRow(l, v)).join("")}
  </table>`;
}

function alertBox(text: string, color: string, bg: string): string {
  return `<div style="background:${bg};border-left:4px solid ${color};border-radius:8px;padding:14px 16px;margin:24px 0;font-size:14px;color:${color};font-weight:600;">
    ${text}
  </div>`;
}

// ─────────────────────────────────────────────────────────
// Email Templates
// ─────────────────────────────────────────────────────────

export function shiftLiveEmailHtml(opts: {
  clinicName: string;
  specialty: string;
  date: string;
  time: string;
  location: string;
  pay: number;
  dashboardUrl?: string;
}): string {
  const content = `
    <p style="margin:0 0 8px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${COLORS.blue};">Shift Posted</p>
    <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:${COLORS.navy};">Your shift is now live! 🚀</h1>
    <p style="font-size:15px;color:${COLORS.slate700};line-height:1.6;">Hi ${opts.clinicName}, your locum shift has been posted and is now visible to verified <strong>${opts.specialty}</strong> professionals on Medrova.</p>
    ${infoCard([
      ["Specialty", opts.specialty],
      ["Date", opts.date],
      ["Time", opts.time],
      ["Location", opts.location],
      ["Professional Payout", `₹${opts.pay.toLocaleString("en-IN")}`],
    ])}
    ${alertBox("Funds are held securely in escrow. The professional is paid only after you mark the shift as complete.", COLORS.emerald, COLORS.emeraldLight)}
    ${ctaButton("View My Shifts", opts.dashboardUrl ?? "https://medrova.vercel.app/dashboard/clinic")}
  `;
  return wrapInLayout(content);
}

export function newApplicantEmailHtml(opts: {
  clinicName: string;
  professionalName: string;
  specialty: string;
  experience: number;
  shiftDate: string;
  dashboardUrl?: string;
}): string {
  const content = `
    <p style="margin:0 0 8px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${COLORS.blue};">New Application</p>
    <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:${COLORS.navy};">New applicant for your shift!</h1>
    <p style="font-size:15px;color:${COLORS.slate700};line-height:1.6;">Hi ${opts.clinicName}, a verified professional has applied for your <strong>${opts.specialty}</strong> shift on <strong>${opts.shiftDate}</strong>.</p>
    ${infoCard([
      ["Applicant", opts.professionalName],
      ["Specialty", opts.specialty],
      ["Experience", `${opts.experience} years`],
      ["Verification", "✓ Medrova Verified — ID & License Checked"],
    ])}
    ${ctaButton("Review Applicant", opts.dashboardUrl ?? "https://medrova.vercel.app/dashboard/clinic")}
  `;
  return wrapInLayout(content);
}

export function shiftConfirmedEmailHtml(opts: {
  professionalName: string;
  clinicName: string;
  specialty: string;
  date: string;
  time: string;
  location: string;
  pay: number;
  role?: string;
  dashboardUrl?: string;
}): string {
  const content = `
    ${badge("Confirmed", COLORS.emerald, COLORS.emeraldLight)}
    <h1 style="margin:16px 0;font-size:26px;font-weight:800;color:${COLORS.navy};">You&apos;re confirmed for a shift! 🎉</h1>
    <p style="font-size:15px;color:${COLORS.slate700};line-height:1.6;">Hi ${opts.professionalName}, great news! <strong>${opts.clinicName}</strong> has confirmed your application. Please show up on time and be prepared.</p>
    ${infoCard([
      ["Clinic", opts.clinicName],
      ["Specialty", opts.specialty],
      ["Date", opts.date],
      ["Time", opts.time],
      ["Location", opts.location],
      ["Your Payout", `₹${opts.pay.toLocaleString("en-IN")} (within 24 hours of completion)`],
    ])}
    ${alertBox("Payment is guaranteed and held in escrow by Medrova. You will receive it within 24 hours after the clinic marks the shift as complete.", COLORS.blue, COLORS.blueLight)}
    ${ctaButton("View My Shifts", opts.dashboardUrl ?? "https://medrova.vercel.app/dashboard/professional")}
  `;
  return wrapInLayout(content);
}

export function paymentDispatchedEmailHtml(opts: {
  professionalName: string;
  clinicName: string;
  amount: number;
  upiId: string;
  shiftDate: string;
  specialty: string;
}): string {
  const content = `
    ${badge("Payment Initiated", COLORS.emerald, COLORS.emeraldLight)}
    <h1 style="margin:16px 0;font-size:26px;font-weight:800;color:${COLORS.navy};">Your payment is on the way! 💸</h1>
    <p style="font-size:15px;color:${COLORS.slate700};line-height:1.6;">Hi ${opts.professionalName}, the shift at <strong>${opts.clinicName}</strong> has been marked complete. Your payment is being processed now.</p>
    ${infoCard([
      ["Clinic", opts.clinicName],
      ["Shift Date", opts.shiftDate],
      ["Specialty", opts.specialty],
      ["Amount", `₹${opts.amount.toLocaleString("en-IN")}`],
      ["UPI ID", opts.upiId],
      ["Expected By", "Within 24 hours"],
    ])}
    ${alertBox("If you do not receive payment within 24 hours, please contact support@medrova.in with your shift details.", COLORS.amber, COLORS.amberLight)}
    ${ctaButton("View Payment History", "https://medrova.vercel.app/dashboard/professional/payments")}
  `;
  return wrapInLayout(content);
}

export function verificationApprovedEmailHtml(opts: {
  professionalName: string;
  role: string;
  dashboardUrl?: string;
}): string {
  const content = `
    ${badge("Account Verified", COLORS.emerald, COLORS.emeraldLight)}
    <h1 style="margin:16px 0;font-size:26px;font-weight:800;color:${COLORS.navy};">You&apos;re verified on Medrova! ✅</h1>
    <p style="font-size:15px;color:${COLORS.slate700};line-height:1.6;">Hi ${opts.professionalName}, our team has verified your credentials and you are now a <strong>Verified ${opts.role}</strong> on Medrova. You can now browse and apply for shifts.</p>
    <div style="background:${COLORS.emeraldLight};border-radius:12px;padding:20px 24px;margin:24px 0;text-align:center;">
      <p style="margin:0;font-size:15px;font-weight:700;color:${COLORS.emerald};">🛡️ Medrova Verified Badge</p>
      <p style="margin:8px 0 0;font-size:13px;color:#065F46;">Your profile is now trusted by clinics across India.</p>
    </div>
    <p style="font-size:14px;color:${COLORS.slate700};"><strong>What&apos;s next?</strong></p>
    <ul style="font-size:14px;color:${COLORS.slate700};line-height:2;">
      <li>Browse available shifts in your area</li>
      <li>Apply for shifts that match your specialty</li>
      <li>Get confirmed and get paid within 24 hours</li>
    </ul>
    ${ctaButton("Browse Available Shifts", opts.dashboardUrl ?? "https://medrova.vercel.app/dashboard/professional/shifts")}
  `;
  return wrapInLayout(content);
}

export function adminPayoutAlertEmailHtml(opts: {
  professionalName: string;
  upiId: string;
  amount: number;
  shiftId: string;
  clinicName: string;
  shiftDate: string;
  specialty: string;
}): string {
  const content = `
    ${badge("Action Required", COLORS.amber, COLORS.amberLight)}
    <h1 style="margin:16px 0;font-size:26px;font-weight:800;color:${COLORS.navy};">Manual Payout Required</h1>
    <p style="font-size:15px;color:${COLORS.slate700};line-height:1.6;">A shift has been completed and the professional needs to be paid. Please process this transfer manually via UPI.</p>
    ${infoCard([
      ["Shift ID", opts.shiftId],
      ["Professional", opts.professionalName],
      ["UPI ID", `<strong style="font-size:18px;color:${COLORS.navy};">${opts.upiId}</strong>`],
      ["Amount to Transfer", `<strong style="font-size:20px;color:${COLORS.emerald};">₹${opts.amount.toLocaleString("en-IN")}</strong>`],
      ["Clinic", opts.clinicName],
      ["Shift Date", opts.shiftDate],
      ["Specialty", opts.specialty],
    ])}
    ${alertBox("Open any UPI app (GPay, PhonePe, Paytm) and transfer ₹" + opts.amount.toLocaleString("en-IN") + " to " + opts.upiId + " immediately. Mark payout as complete in the admin dashboard after transfer.", COLORS.amber, COLORS.amberLight)}
    ${ctaButton("Go to Admin Dashboard", "https://medrova.vercel.app/dashboard/admin")}
  `;
  return wrapInLayout(content);
}

// ─────────────────────────────────────────────────────────
// Clinic Onboarding — Confirmation to Clinic
// ─────────────────────────────────────────────────────────
export function clinicOnboardingConfirmationEmailHtml(opts: {
  clinicName: string;
  contactPerson: string;
}): string {
  const content = `
    ${badge("Registration Received", COLORS.blue, COLORS.blueLight)}
    <h1 style="margin:16px 0;font-size:26px;font-weight:800;color:${COLORS.navy};">We've received your clinic registration 🏥</h1>
    <p style="font-size:15px;color:${COLORS.slate700};line-height:1.6;">Hi ${opts.contactPerson}, thank you for registering <strong>${opts.clinicName}</strong> on Medrova. Our team will review your documents and verify your clinic within <strong>24–48 hours</strong>.</p>
    ${infoCard([
      ["Clinic Name", opts.clinicName],
      ["Status", "Under Review"],
      ["Next Step", "Our team will email you once verified"],
    ])}
    ${alertBox("During verification, our team checks your clinic registration certificate. Make sure the uploaded document is clear and legible to avoid delays.", COLORS.amber, COLORS.amberLight)}
    <p style="font-size:14px;color:${COLORS.slate700};">If you have any questions, reply to this email or reach us at <a href="mailto:koushik@medrova.in" style="color:${COLORS.blue};">koushik@medrova.in</a>.</p>
  `;
  return wrapInLayout(content);
}

// ─────────────────────────────────────────────────────────
// Clinic Onboarding — Alert to Admin
// ─────────────────────────────────────────────────────────
export function adminNewClinicAlertEmailHtml(opts: {
  clinicName: string;
  clinicType: string;
  contactPerson: string;
  contactPhone: string;
  area: string;
  specialties: string[];
  adminDashboardUrl?: string;
}): string {
  const content = `
    ${badge("New Registration", COLORS.amber, COLORS.amberLight)}
    <h1 style="margin:16px 0;font-size:26px;font-weight:800;color:${COLORS.navy};">New Clinic Registered — Action Required</h1>
    <p style="font-size:15px;color:${COLORS.slate700};line-height:1.6;">A new clinic has submitted their registration on Medrova. Please review their documents and verify or reject their profile.</p>
    ${infoCard([
      ["Clinic Name", opts.clinicName],
      ["Type", opts.clinicType],
      ["Contact Person", opts.contactPerson],
      ["Contact Phone", opts.contactPhone],
      ["Area", opts.area],
      ["Specialties Needed", opts.specialties.join(", ") || "—"],
    ])}
    ${ctaButton("Review in Admin Dashboard", opts.adminDashboardUrl ?? "https://medrova.in/dashboard/admin/clinics")}
  `;
  return wrapInLayout(content);
}

// ─────────────────────────────────────────────────────────
// Clinic Verification — Status Update to Clinic
// ─────────────────────────────────────────────────────────
export function clinicVerificationStatusEmailHtml(opts: {
  clinicName: string;
  contactPerson: string;
  status: "verified" | "rejected";
  note?: string;
  dashboardUrl?: string;
}): string {
  const isApproved = opts.status === "verified";
  const content = `
    ${isApproved
      ? badge("Verified ✓", COLORS.emerald, COLORS.emeraldLight)
      : badge("Requires Attention", COLORS.amber, COLORS.amberLight)
    }
    <h1 style="margin:16px 0;font-size:26px;font-weight:800;color:${COLORS.navy};">
      ${isApproved ? "Your clinic is now verified! 🎉" : "Your clinic verification needs attention"}
    </h1>
    <p style="font-size:15px;color:${COLORS.slate700};line-height:1.6;">Hi ${opts.contactPerson},</p>
    ${isApproved
      ? `<p style="font-size:15px;color:${COLORS.slate700};line-height:1.6;">Our team has reviewed and approved <strong>${opts.clinicName}</strong>. You can now post shifts and jobs and start hiring verified healthcare professionals through Medrova.</p>
         <ul style="font-size:14px;color:${COLORS.slate700};line-height:2;">
           <li>Post locum shifts and receive instant applications</li>
           <li>Post permanent job openings</li>
           <li>Browse and shortlist verified doctors, nurses &amp; technicians</li>
         </ul>`
      : `<p style="font-size:15px;color:${COLORS.slate700};line-height:1.6;">We were unable to verify <strong>${opts.clinicName}</strong> at this time. Please review the feedback below and resubmit your documents.</p>`
    }
    ${opts.note ? alertBox(`<strong>Note from our team:</strong> ${opts.note}`, isApproved ? COLORS.emerald : COLORS.amber, isApproved ? COLORS.emeraldLight : COLORS.amberLight) : ""}
    ${ctaButton(
      isApproved ? "Go to My Dashboard" : "Update My Profile",
      opts.dashboardUrl ?? (isApproved ? "https://medrova.in/dashboard/clinic" : "https://medrova.in/onboarding/clinic")
    )}
    <p style="font-size:13px;color:${COLORS.slate500};">Questions? Email us at <a href="mailto:koushik@medrova.in" style="color:${COLORS.blue};">koushik@medrova.in</a></p>
  `;
  return wrapInLayout(content);
}

// ─────────────────────────────────────────────────────────
// Core Send Function (uses Resend REST API)
// ─────────────────────────────────────────────────────────
interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Gracefully log in dev — don't crash the server
    console.warn("[email] RESEND_API_KEY not set. Email not sent to:", to, "|", subject);
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[email] Resend API error:", res.status, body);
    }
  } catch (err) {
    // Never crash the main request because an email failed
    console.error("[email] Failed to send email:", err);
  }
}
