import Image from "next/image";
import Link from "next/link";

export function Navbar() {
  return (
    <header className="border-b border-[#E2E8F0] bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-4 md:p-6">
        <Link className="flex items-center" href="/">
          <Image
            src="/logo.png"
            alt="Medrova Logo"
            width={120}
            height={40}
            className="object-contain"
          />
        </Link>
        <div className="flex items-center gap-3">
          <Link
            className="rounded-lg px-4 py-2 text-sm font-medium text-[#0F172A] hover:text-[#1E40AF]"
            href="/sign-in"
          >
            Sign In
          </Link>
          <Link
            className="rounded-lg bg-[#1E40AF] px-4 py-2 text-sm font-medium text-white hover:bg-[#1D4ED8]"
            href="/sign-up"
          >
            Get Started
          </Link>
        </div>
      </nav>
    </header>
  );
}
