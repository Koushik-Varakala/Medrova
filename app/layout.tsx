import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://medrova.in"),
  title: {
    default: "Medrova | Verified Healthcare Staffing in Hyderabad",
    template: "%s | Medrova",
  },
  description: "India's first verified healthcare staffing marketplace. Medrova connects clinics with verified doctors, nurses, and technicians for locum shifts and permanent jobs in Hyderabad.",
  keywords: ["healthcare staffing", "locum doctor", "nurse jobs hyderabad", "clinic staffing", "medical jobs", "Medrova"],
  authors: [{ name: "Medrova" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://medrova.in",
    siteName: "Medrova",
    title: "Medrova | Healthcare Staffing Done Right",
    description: "Book verified doctors, nurses, and technicians for your clinic instantly. Guaranteed upfront payments and 24-hour payouts.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Medrova - Healthcare Staffing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Medrova | Verified Healthcare Staffing",
    description: "India's first verified healthcare staffing marketplace in Hyderabad.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
