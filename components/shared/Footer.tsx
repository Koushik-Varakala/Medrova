import Link from "next/link";

const footerLinks = [
  { href: "/sign-up", label: "Get Started" },
  { href: "/sign-in", label: "Sign In" },
  { href: "/dashboard/doctor", label: "Doctors" },
  { href: "/dashboard/clinic", label: "Clinics" }
];

export function Footer() {
  return (
    <footer className="border-t border-[#E2E8F0] bg-white">
      <div className="mx-auto grid max-w-7xl gap-6 p-4 md:grid-cols-[1fr_auto] md:p-6">
        <div>
          <p className="text-lg font-semibold text-[#1E40AF]">Medrova</p>
          <p className="mt-2 max-w-md text-sm text-[#64748B]">
            Doctor recruitment and locum shift marketplace for Hyderabad.
          </p>
          <a
            className="mt-3 inline-flex text-sm font-medium text-[#1E40AF]"
            href="mailto:hello@medrova.in"
          >
            hello@medrova.in
          </a>
        </div>
        <div className="flex flex-wrap gap-4 md:items-start">
          {footerLinks.map((link) => (
            <Link
              className="text-sm font-medium text-[#64748B] hover:text-[#1E40AF]"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
