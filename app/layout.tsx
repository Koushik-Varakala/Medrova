import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Medrova",
  description: "Doctor recruitment and locum shift marketplace for Hyderabad, India."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
