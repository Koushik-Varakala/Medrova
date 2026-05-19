import { createSupabaseServiceClient } from "@/lib/supabase-server";
import { Analytics } from "@vercel/analytics/next"

export default async function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return <>{children}</>;
  }

  // Fetch active jobs/shifts to generate JSON-LD Structured Data
  const { data: shifts } = await supabase
    .from('shifts')
    .select('id, specialty, pay, area, date')
    .eq('status', 'active')
    .limit(10);

  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, specialty, salary_min, salary_max, location_display_name')
    .eq('status', 'active')
    .limit(10);

  // Map to Google's JobPosting Schema
  const jsonLd = [
    ...(shifts || []).map(s => ({
      "@context": "https://schema.org/",
      "@type": "JobPosting",
      "title": `${s.specialty} Locum Shift`,
      "description": `Looking for a ${s.specialty} for a locum shift in ${s.area}. Guaranteed upfront payment via Medrova.`,
      "datePosted": s.date || new Date().toISOString().split('T')[0],
      "employmentType": "TEMPORARY",
      "hiringOrganization": {
        "@type": "Organization",
        "name": "Medrova Verified Clinic",
        "sameAs": "https://medrova.in"
      },
      "jobLocation": {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": s.area,
          "addressRegion": "Telangana",
          "addressCountry": "IN"
        }
      },
      "baseSalary": {
        "@type": "MonetaryAmount",
        "currency": "INR",
        "value": {
          "@type": "QuantitativeValue",
          "value": s.pay,
          "unitText": "SHIFT"
        }
      }
    })),
    ...(jobs || []).map(j => ({
      "@context": "https://schema.org/",
      "@type": "JobPosting",
      "title": `Permanent ${j.specialty} Role`,
      "description": `Looking for a permanent ${j.specialty} in ${j.location_display_name}. Apply via Medrova.`,
      "datePosted": new Date().toISOString().split('T')[0],
      "employmentType": "FULL_TIME",
      "hiringOrganization": {
        "@type": "Organization",
        "name": "Medrova Verified Clinic",
        "sameAs": "https://medrova.in"
      },
      "jobLocation": {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": j.location_display_name,
          "addressRegion": "Telangana",
          "addressCountry": "IN"
        }
      },
      "baseSalary": {
        "@type": "MonetaryAmount",
        "currency": "INR",
        "value": {
          "@type": "QuantitativeValue",
          "minValue": j.salary_min,
          "maxValue": j.salary_max,
          "unitText": "MONTH"
        }
      }
    }))
  ];

  return (
    <>
      {/* Inject Google for Jobs Structured Data */}
      {jsonLd.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
