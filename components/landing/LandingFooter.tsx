"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="bg-white pt-16 pb-8 border-t border-slate-200">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid gap-12 md:grid-cols-3 mb-12"
        >
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image
                src="/logo.png"
                alt="Medrova Logo"
                width={120}
                height={40}
                className="object-contain"
              />
            </Link>
            <p className="text-slate-500 leading-relaxed max-w-xs">
              India&apos;s verified healthcare staffing marketplace. Launching in Hyderabad.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[#0F172A] mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li><Link href="/shifts" className="text-slate-500 hover:text-[#1E40AF] transition-colors">Browse Shifts</Link></li>
              <li><Link href="/jobs" className="text-slate-500 hover:text-[#1E40AF] transition-colors">Browse Jobs</Link></li>
              <li><Link href="/sign-up" className="text-slate-500 hover:text-[#1E40AF] transition-colors">Join as Professional</Link></li>
              <li><Link href="/sign-up" className="text-slate-500 hover:text-[#1E40AF] transition-colors">Register Your Clinic</Link></li>
              <li><Link href="/sign-in" className="text-slate-500 hover:text-[#1E40AF] transition-colors">Sign In</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-[#0F172A] mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-slate-500">
                <MapPin className="h-4 w-4" /> Hyderabad, Telangana, India
              </li>
              <li className="text-slate-500">hello@medrova.in</li>
              <li className="text-slate-500">+91 77990 01102</li>
            </ul>
          </div>
        </motion.div>

        <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col gap-1 text-center md:text-left">
            <p className="text-slate-400 text-sm">© {new Date().getFullYear()} Medrova. All rights reserved.</p>
            <p className="text-slate-400 text-xs">Operated by <strong className="text-slate-500">Varakala Koushik Kumar</strong> · Sole Proprietor · Hyderabad, Telangana, India</p>
          </div>
          <div className="flex flex-col gap-1 text-center md:text-right">
            <p className="text-slate-400 text-sm font-medium">Made with ❤️ in Hyderabad</p>
            <p className="text-slate-400 text-xs">For support: koushik@medrova.in · +91 77990 01102</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
